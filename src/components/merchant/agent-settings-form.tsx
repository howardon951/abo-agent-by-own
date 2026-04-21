"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";

type AgentResponse = {
  data: {
    agent: {
      id: string;
      name: string;
      brandName: string;
      brandTone: string | null;
      forbiddenTopics: string[];
      fallbackPolicy: string | null;
    };
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

type AgentFormState = {
  name: string;
  brandName: string;
  brandTone: string;
  forbiddenTopics: string;
  fallbackPolicy: string;
};

const emptyForm: AgentFormState = {
  name: "",
  brandName: "",
  brandTone: "",
  forbiddenTopics: "",
  fallbackPolicy: ""
};

export function AgentSettingsForm() {
  const [form, setForm] = useState<AgentFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAgent() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/agent", {
          credentials: "same-origin",
          cache: "no-store"
        });
        const json = (await response.json()) as AgentResponse;

        if (!response.ok || !json.data) {
          throw new Error(json.error?.message ?? "載入 Agent 設定失敗");
        }

        if (!isMounted) {
          return;
        }

        setForm({
          name: json.data.agent.name,
          brandName: json.data.agent.brandName,
          brandTone: json.data.agent.brandTone ?? "",
          forbiddenTopics: json.data.agent.forbiddenTopics.join(", "),
          fallbackPolicy: json.data.agent.fallbackPolicy ?? ""
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "載入 Agent 設定失敗");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAgent();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField<Key extends keyof AgentFormState>(key: Key, value: AgentFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function saveAgent() {
    setIsSaving(true);

    try {
      const response = await fetch("/api/agent", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: form.name,
          brandName: form.brandName,
          brandTone: form.brandTone,
          forbiddenTopics: splitTopics(form.forbiddenTopics),
          fallbackPolicy: form.fallbackPolicy
        })
      });
      const json = (await response.json()) as AgentResponse;

      if (!response.ok || !json.data) {
        throw new Error(json.error?.message ?? "更新 Agent 設定失敗");
      }

      setForm({
        name: json.data.agent.name,
        brandName: json.data.agent.brandName,
        brandTone: json.data.agent.brandTone ?? "",
        forbiddenTopics: json.data.agent.forbiddenTopics.join(", "),
        fallbackPolicy: json.data.agent.fallbackPolicy ?? ""
      });
      setMessage("Agent 設定已更新");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "更新 Agent 設定失敗");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(() => {
      void saveAgent();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel card stack">
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
          <label htmlFor="agent-name">Agent Name</label>
          <input
            id="agent-name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            disabled={isLoading || isSaving}
            placeholder={isLoading ? "載入中..." : "Main Agent"}
          />
        </div>
        <div className="field">
          <label htmlFor="brand-name">Brand Name</label>
          <input
            id="brand-name"
            value={form.brandName}
            onChange={(event) => updateField("brandName", event.target.value)}
            disabled={isLoading || isSaving}
            placeholder={isLoading ? "載入中..." : "Abo Coffee"}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="brand-tone">Brand Tone</label>
        <textarea
          id="brand-tone"
          value={form.brandTone}
          onChange={(event) => updateField("brandTone", event.target.value)}
          disabled={isLoading || isSaving}
          placeholder="親切、簡短、專業"
        />
      </div>
      <div className="field">
        <label htmlFor="forbidden-topics">Forbidden Topics</label>
        <textarea
          id="forbidden-topics"
          value={form.forbiddenTopics}
          onChange={(event) => updateField("forbiddenTopics", event.target.value)}
          disabled={isLoading || isSaving}
          placeholder="醫療建議, 法律意見"
        />
      </div>
      <div className="field">
        <label htmlFor="fallback">Fallback Policy</label>
        <textarea
          id="fallback"
          value={form.fallbackPolicy}
          onChange={(event) => updateField("fallbackPolicy", event.target.value)}
          disabled={isLoading || isSaving}
          placeholder="若資料不足，請保守回答並請用戶稍候，必要時轉真人。"
        />
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button className="button button-primary" type="submit" disabled={isLoading || isSaving}>
          {isSaving ? "Saving..." : "Save settings"}
        </button>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>
          {isLoading ? "正在讀取目前設定" : "直接寫入目前 active agent"}
        </span>
      </div>
    </form>
  );
}

function splitTopics(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
