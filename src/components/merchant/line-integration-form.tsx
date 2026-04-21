"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";

type LineChannel = {
  id: string;
  provider: "line";
  name: string;
  channelIdExternal: string | null;
  status: string;
  webhookUrl: string;
  webhookVerifiedAt: string | null;
};

type LineChannelConnectionResponse = {
  data: {
    channel: LineChannel | null;
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

type LineFormState = {
  name: string;
  channelIdExternal: string;
  channelSecret: string;
  channelAccessToken: string;
};

const emptyForm: LineFormState = {
  name: "",
  channelIdExternal: "",
  channelSecret: "",
  channelAccessToken: ""
};

export function LineIntegrationForm() {
  const [form, setForm] = useState<LineFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [currentChannel, setCurrentChannel] = useState<LineChannel | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentChannel() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/line/connect", {
          credentials: "same-origin",
          cache: "no-store"
        });
        const json = (await response.json()) as LineChannelConnectionResponse;

        if (!response.ok || !json.data) {
          throw new Error(json.error?.message ?? "載入 LINE 設定失敗");
        }

        if (!isMounted) {
          return;
        }

        const channel = json.data.channel;

        setCurrentChannel(channel);
        setForm((current) => ({
          ...current,
          name: channel?.name ?? current.name,
          channelIdExternal: channel?.channelIdExternal ?? current.channelIdExternal
        }));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "載入 LINE 設定失敗");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCurrentChannel();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField<Key extends keyof LineFormState>(key: Key, value: LineFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function saveChannel() {
    setIsSaving(true);

    try {
      const response = await fetch("/api/line/connect", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(form)
      });
      const json = (await response.json()) as LineChannelConnectionResponse;

      if (!response.ok || !json.data) {
        throw new Error(json.error?.message ?? "儲存 LINE 設定失敗");
      }

      setCurrentChannel(json.data.channel);
      setForm((current) => ({
        ...current,
        channelSecret: "",
        channelAccessToken: ""
      }));
      setMessage("LINE OA 已綁定，敏感憑證已加密儲存");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "儲存 LINE 設定失敗");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(() => {
      void saveChannel();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel card stack">
      {currentChannel ? (
        <div
          className="panel card stack"
          style={{
            gap: 10,
            borderColor: "color-mix(in srgb, var(--success) 35%, var(--border))"
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <strong>Current Binding</strong>
            <span
              className="badge"
              style={{
                color: "var(--success)",
                borderColor: "color-mix(in srgb, var(--success) 35%, var(--border))"
              }}
            >
              {currentChannel.status}
            </span>
          </div>
          <div className="grid-2">
            <div className="stack" style={{ gap: 4 }}>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>Saved Channel Name</span>
              <span>{currentChannel.name}</span>
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>LINE Channel ID</span>
              <span>{currentChannel.channelIdExternal ?? "-"}</span>
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>Webhook URL</span>
              <span className="mono" style={{ wordBreak: "break-all" }}>
                {currentChannel.webhookUrl}
              </span>
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>Verification</span>
              <span>
                {currentChannel.webhookVerifiedAt
                  ? `verified at ${currentChannel.webhookVerifiedAt}`
                  : "not verified yet"}
              </span>
            </div>
          </div>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            Channel secret 與 access token 已加密儲存，不會回填到表單。
          </span>
          {currentChannel.webhookUrl.includes("localhost") ? (
            <div className="panel card" style={{ color: "var(--danger)" }}>
              目前 webhook URL 仍是 localhost，LINE 無法從外部驗證或送訊息進來。請把
              `NEXT_PUBLIC_APP_URL` 改成公開網址後重新儲存。
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <div className="panel card" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="panel card" style={{ color: "var(--success)" }}>
          {message}
        </div>
      ) : null}
      <div className="grid-2">
        <div className="field">
          <label htmlFor="channel-name">Channel Name</label>
          <input
            id="channel-name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            disabled={isLoading || isSaving}
            placeholder="Abo LINE OA"
          />
        </div>
        <div className="field">
          <label htmlFor="channel-id">LINE Channel ID</label>
          <input
            id="channel-id"
            value={form.channelIdExternal}
            onChange={(event) => updateField("channelIdExternal", event.target.value)}
            disabled={isLoading || isSaving}
            placeholder="2001234567"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="channel-secret">Channel Secret</label>
        <input
          id="channel-secret"
          value={form.channelSecret}
          onChange={(event) => updateField("channelSecret", event.target.value)}
          disabled={isLoading || isSaving}
          placeholder="LINE channel secret"
        />
      </div>
      <div className="field">
        <label htmlFor="channel-token">Channel Access Token</label>
        <textarea
          id="channel-token"
          value={form.channelAccessToken}
          onChange={(event) => updateField("channelAccessToken", event.target.value)}
          disabled={isLoading || isSaving}
          placeholder="LINE channel access token"
        />
      </div>
      <div className="panel card">
        <div className="stack" style={{ gap: 6 }}>
          <strong>Webhook URL</strong>
          <span className="mono">
            {currentChannel?.webhookUrl ?? "http://localhost:3000/api/webhooks/line"}
          </span>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>
            狀態: {currentChannel?.status ?? "disconnected"}
            {currentChannel?.webhookVerifiedAt
              ? ` / verified at ${currentChannel.webhookVerifiedAt}`
              : ""}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button className="button button-primary" type="submit" disabled={isLoading || isSaving}>
          {isSaving ? "Saving..." : "Save channel"}
        </button>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>
          Channel secret 與 access token 不會回傳到前端，更新時需重新輸入
        </span>
      </div>
    </form>
  );
}
