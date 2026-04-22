import { requireAdminClient } from "@/lib/supabase/admin";
import { lineConfigEncryptionKey } from "@/lib/env";
import { encryptSecret } from "@/lib/utils/crypto";

export type ConnectLineChannelInput = {
  tenantId: string;
  name: string;
  channelIdExternal?: string;
  channelSecret: string;
  channelAccessToken: string;
};

export type LineChannelConnection = {
  channel: {
    id: string;
    provider: "line";
    name: string;
    channelIdExternal: string | null;
    status: string;
    webhookUrl: string;
    webhookVerifiedAt: string | null;
  } | null;
};

type StoredChannel = {
  id: string;
  provider: "line";
  name: string;
  status: string;
};

type StoredLineConfig = {
  channelIdExternal: string | null;
  webhookUrl: string | null;
  webhookVerifiedAt: string | null;
};

export type LineChannelRepository = {
  findPrimaryLineChannel(tenantId: string): Promise<StoredChannel | null>;
  getLineChannelConfig(channelId: string): Promise<StoredLineConfig | null>;
  createPrimaryLineChannel(input: { tenantId: string; name: string }): Promise<StoredChannel>;
  updatePrimaryLineChannel(input: { channelId: string; name: string }): Promise<StoredChannel>;
  upsertLineChannelConfig(input: {
    tenantId: string;
    channelId: string;
    channelIdExternal: string | null;
    channelSecretCiphertext: string;
    channelAccessTokenCiphertext: string;
    webhookUrl: string;
  }): Promise<StoredLineConfig>;
};

export async function getLineChannelConnection(
  tenantId: string,
  repository: LineChannelRepository = createSupabaseLineChannelRepository(),
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
): Promise<LineChannelConnection> {
  const channel = await repository.findPrimaryLineChannel(tenantId);

  if (!channel) {
    return { channel: null };
  }

  const config = await repository.getLineChannelConfig(channel.id);

  return {
    channel: {
      id: channel.id,
      provider: channel.provider,
      name: channel.name,
      channelIdExternal: config?.channelIdExternal ?? null,
      status: channel.status,
      webhookUrl: config?.webhookUrl ?? buildWebhookUrl(appUrl),
      webhookVerifiedAt: config?.webhookVerifiedAt ?? null
    }
  };
}

export async function connectLineChannel(
  input: ConnectLineChannelInput,
  repository: LineChannelRepository = createSupabaseLineChannelRepository(),
  encryptionKey = lineConfigEncryptionKey,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
): Promise<LineChannelConnection> {
  if (!encryptionKey) {
    throw new Error("LINE_CONFIG_ENCRYPTION_KEY is not configured");
  }

  const webhookUrl = buildWebhookUrl(appUrl);
  const existingChannel = await repository.findPrimaryLineChannel(input.tenantId);
  const channel = existingChannel
    ? await repository.updatePrimaryLineChannel({
        channelId: existingChannel.id,
        name: input.name
      })
    : await repository.createPrimaryLineChannel({
        tenantId: input.tenantId,
        name: input.name
      });

  const config = await repository.upsertLineChannelConfig({
    tenantId: input.tenantId,
    channelId: channel.id,
    channelIdExternal: input.channelIdExternal?.trim() || null,
    channelSecretCiphertext: encryptSecret(input.channelSecret, encryptionKey),
    channelAccessTokenCiphertext: encryptSecret(input.channelAccessToken, encryptionKey),
    webhookUrl
  });

  return {
    channel: {
      id: channel.id,
      provider: channel.provider,
      name: channel.name,
      channelIdExternal: config.channelIdExternal,
      status: channel.status,
      webhookUrl: config.webhookUrl ?? webhookUrl,
      webhookVerifiedAt: config.webhookVerifiedAt
    }
  };
}

export function createSupabaseLineChannelRepository(): LineChannelRepository {
  const admin = requireAdminClient();

  return {
    async findPrimaryLineChannel(tenantId) {
      const { data, error } = await admin
        .from("channels")
        .select("id, provider, name, status")
        .eq("tenant_id", tenantId)
        .eq("provider", "line")
        .eq("is_primary", true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as StoredChannel | null;
    },

    async getLineChannelConfig(channelId) {
      const { data, error } = await admin
        .from("line_channel_configs")
        .select("channel_id_external, webhook_url, webhook_verified_at")
        .eq("channel_id", channelId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        channelIdExternal: data.channel_id_external,
        webhookUrl: data.webhook_url,
        webhookVerifiedAt: data.webhook_verified_at
      };
    },

    async createPrimaryLineChannel(input) {
      const { data, error } = await admin
        .from("channels")
        .insert({
          tenant_id: input.tenantId,
          provider: "line",
          name: input.name,
          status: "connected",
          is_primary: true
        })
        .select("id, provider, name, status")
        .single();

      if (error) {
        throw error;
      }

      return data as StoredChannel;
    },

    async updatePrimaryLineChannel(input) {
      const { data, error } = await admin
        .from("channels")
        .update({
          name: input.name,
          status: "connected"
        })
        .eq("id", input.channelId)
        .select("id, provider, name, status")
        .single();

      if (error) {
        throw error;
      }

      return data as StoredChannel;
    },

    async upsertLineChannelConfig(input) {
      const { data, error } = await admin
        .from("line_channel_configs")
        .upsert(
          {
            channel_id: input.channelId,
            tenant_id: input.tenantId,
            channel_id_external: input.channelIdExternal,
            channel_secret_ciphertext: input.channelSecretCiphertext,
            channel_access_token_ciphertext: input.channelAccessTokenCiphertext,
            webhook_url: input.webhookUrl
          },
          {
            onConflict: "channel_id"
          }
        )
        .select("channel_id_external, webhook_url, webhook_verified_at")
        .single();

      if (error) {
        throw error;
      }

      return {
        channelIdExternal: data.channel_id_external,
        webhookUrl: data.webhook_url,
        webhookVerifiedAt: data.webhook_verified_at
      };
    }
  };
}

function buildWebhookUrl(appUrl: string) {
  return new URL("/api/webhooks/line", appUrl).toString();
}
