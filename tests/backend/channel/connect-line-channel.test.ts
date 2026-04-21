import test from "node:test";
import assert from "node:assert/strict";
import {
  connectLineChannel,
  getLineChannelConnection,
  type LineChannelRepository
} from "@/server/domain/channel/connect-line-channel";
import { decryptSecret } from "@/lib/utils/crypto";

const encryptionKey = Buffer.alloc(32, 7).toString("base64");

function createRepository(overrides: Partial<LineChannelRepository> = {}) {
  const calls: string[] = [];
  let storedChannel: {
    id: string;
    provider: "line";
    name: string;
    status: string;
  } | null = null;
  let storedConfig:
    | {
        channelIdExternal: string | null;
        channelSecretCiphertext?: string;
        channelAccessTokenCiphertext?: string;
        webhookUrl: string | null;
        webhookVerifiedAt: string | null;
      }
    | null = null;

  const repository: LineChannelRepository = {
    async findPrimaryLineChannel(tenantId) {
      calls.push(`findPrimaryLineChannel:${tenantId}`);
      return storedChannel;
    },
    async getLineChannelConfig(channelId) {
      calls.push(`getLineChannelConfig:${channelId}`);
      if (!storedConfig) {
        return null;
      }

      return {
        channelIdExternal: storedConfig.channelIdExternal,
        webhookUrl: storedConfig.webhookUrl,
        webhookVerifiedAt: storedConfig.webhookVerifiedAt
      };
    },
    async createPrimaryLineChannel(input) {
      calls.push(`createPrimaryLineChannel:${input.tenantId}:${input.name}`);
      storedChannel = {
        id: "channel-new",
        provider: "line",
        name: input.name,
        status: "connected"
      };
      return storedChannel;
    },
    async updatePrimaryLineChannel(input) {
      calls.push(`updatePrimaryLineChannel:${input.channelId}:${input.name}`);
      storedChannel = {
        id: input.channelId,
        provider: "line",
        name: input.name,
        status: "connected"
      };
      return storedChannel;
    },
    async upsertLineChannelConfig(input) {
      calls.push(`upsertLineChannelConfig:${input.channelId}`);
      storedConfig = {
        channelIdExternal: input.channelIdExternal,
        channelSecretCiphertext: input.channelSecretCiphertext,
        channelAccessTokenCiphertext: input.channelAccessTokenCiphertext,
        webhookUrl: input.webhookUrl,
        webhookVerifiedAt: null
      };

      return {
        channelIdExternal: storedConfig.channelIdExternal,
        webhookUrl: storedConfig.webhookUrl,
        webhookVerifiedAt: storedConfig.webhookVerifiedAt
      };
    },
    ...overrides
  };

  return {
    repository,
    calls,
    getStoredConfig: () => storedConfig
  };
}

test("creates the primary line channel and encrypts both secrets on first connect", async () => {
  const { repository, calls, getStoredConfig } = createRepository();

  const result = await connectLineChannel(
    {
      tenantId: "tenant-1",
      name: "Abo LINE OA",
      channelIdExternal: "2001234567",
      channelSecret: "line-secret",
      channelAccessToken: "line-access-token"
    },
    repository,
    encryptionKey,
    "https://abo.test"
  );

  assert.deepEqual(result, {
    channel: {
      id: "channel-new",
      provider: "line",
      name: "Abo LINE OA",
      channelIdExternal: "2001234567",
      status: "connected",
      webhookUrl: "https://abo.test/api/webhooks/line",
      webhookVerifiedAt: null
    }
  });

  assert.deepEqual(calls, [
    "findPrimaryLineChannel:tenant-1",
    "createPrimaryLineChannel:tenant-1:Abo LINE OA",
    "upsertLineChannelConfig:channel-new"
  ]);

  const storedConfig = getStoredConfig();
  assert.ok(storedConfig?.channelSecretCiphertext);
  assert.ok(storedConfig?.channelAccessTokenCiphertext);
  assert.notEqual(storedConfig?.channelSecretCiphertext, "line-secret");
  assert.notEqual(storedConfig?.channelAccessTokenCiphertext, "line-access-token");
  assert.equal(decryptSecret(storedConfig!.channelSecretCiphertext!, encryptionKey), "line-secret");
  assert.equal(
    decryptSecret(storedConfig!.channelAccessTokenCiphertext!, encryptionKey),
    "line-access-token"
  );
});

test("updates the existing primary line channel instead of creating a new one", async () => {
  const { repository, calls } = createRepository({
    async findPrimaryLineChannel(tenantId) {
      calls.push(`findPrimaryLineChannel:${tenantId}`);
      return {
        id: "channel-existing",
        provider: "line",
        name: "Old LINE OA",
        status: "disconnected"
      };
    }
  });

  const result = await connectLineChannel(
    {
      tenantId: "tenant-1",
      name: "Updated LINE OA",
      channelSecret: "next-secret",
      channelAccessToken: "next-token"
    },
    repository,
    encryptionKey,
    "https://abo.test"
  );

  assert.equal(result.channel?.id, "channel-existing");
  assert.equal(result.channel?.name, "Updated LINE OA");
  assert.deepEqual(calls, [
    "findPrimaryLineChannel:tenant-1",
    "updatePrimaryLineChannel:channel-existing:Updated LINE OA",
    "upsertLineChannelConfig:channel-existing"
  ]);
});

test("returns the safe current line channel connection without exposing secrets", async () => {
  const { repository, calls } = createRepository({
    async findPrimaryLineChannel(tenantId) {
      calls.push(`findPrimaryLineChannel:${tenantId}`);
      return {
        id: "channel-existing",
        provider: "line",
        name: "Abo LINE OA",
        status: "connected"
      };
    },
    async getLineChannelConfig(channelId) {
      calls.push(`getLineChannelConfig:${channelId}`);
      return {
        channelIdExternal: "2001234567",
        webhookUrl: "https://abo.test/api/webhooks/line",
        webhookVerifiedAt: "2026-04-21T02:00:00Z"
      };
    }
  });

  const result = await getLineChannelConnection("tenant-1", repository, "https://abo.test");

  assert.deepEqual(result, {
    channel: {
      id: "channel-existing",
      provider: "line",
      name: "Abo LINE OA",
      channelIdExternal: "2001234567",
      status: "connected",
      webhookUrl: "https://abo.test/api/webhooks/line",
      webhookVerifiedAt: "2026-04-21T02:00:00Z"
    }
  });
  assert.deepEqual(calls, [
    "findPrimaryLineChannel:tenant-1",
    "getLineChannelConfig:channel-existing"
  ]);
});
