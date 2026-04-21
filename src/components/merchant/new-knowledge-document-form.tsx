"use client";

import { startTransition, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type SourceType = "faq" | "pdf" | "url";

type CreateKnowledgeDocumentResponse = {
  data: {
    document: {
      id: string;
      title: string;
      sourceType: SourceType;
      processingStatus: string;
    };
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

type FormState = {
  sourceType: SourceType;
  title: string;
  rawText: string;
  sourceUrl: string;
};

const initialForm: FormState = {
  sourceType: "faq",
  title: "",
  rawText: "",
  sourceUrl: ""
};

export function NewKnowledgeDocumentForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function createDocument() {
    setIsSubmitting(true);

    try {
      const payload =
        form.sourceType === "url"
          ? {
              sourceType: form.sourceType,
              title: form.title,
              sourceUrl: form.sourceUrl
            }
          : {
              sourceType: form.sourceType,
              title: form.title,
              rawText: form.rawText
            };

      const response = await fetch("/api/knowledge/documents", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      });
      const json = (await response.json()) as CreateKnowledgeDocumentResponse;

      if (!response.ok || !json.data) {
        throw new Error(json.error?.message ?? "建立文件失敗");
      }

      setMessage(`文件「${json.data.document.title}」已建立並進入 ${json.data.document.processingStatus}`);
      router.push("/knowledge");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "建立文件失敗");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(() => {
      void createDocument();
    });
  }

  const isUrl = form.sourceType === "url";
  const isPdf = form.sourceType === "pdf";

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
      <div className="field">
        <label htmlFor="source-type">Source Type</label>
        <select
          id="source-type"
          value={form.sourceType}
          onChange={(event) => updateField("sourceType", event.target.value as SourceType)}
          disabled={isSubmitting}
        >
          <option value="faq">FAQ</option>
          <option value="pdf">PDF</option>
          <option value="url">URL</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          disabled={isSubmitting}
          placeholder={isUrl ? "門市資訊頁" : "常見問題"}
        />
      </div>
      {isUrl ? (
        <div className="field">
          <label htmlFor="source-url">URL</label>
          <input
            id="source-url"
            type="url"
            value={form.sourceUrl}
            onChange={(event) => updateField("sourceUrl", event.target.value)}
            disabled={isSubmitting}
            placeholder="https://example.com/store-info"
          />
        </div>
      ) : (
        <div className="field">
          <label htmlFor="content">{isPdf ? "PDF 說明 / 暫存內容" : "FAQ 內容"}</label>
          <textarea
            id="content"
            value={form.rawText}
            onChange={(event) => updateField("rawText", event.target.value)}
            disabled={isSubmitting}
            placeholder={
              isPdf
                ? "目前前端尚未支援真實檔案上傳，可先建立 placeholder 文件。"
                : "輸入 FAQ 內容"
            }
          />
        </div>
      )}
      {isPdf ? (
        <div className="panel card" style={{ color: "var(--muted)" }}>
          目前 PDF 仍是 placeholder 流程，這裡先建立文件紀錄，之後再接真實 upload / parse pipeline。
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button className="button button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Queuing..." : "Queue processing"}
        </button>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>
          建立後會回到文件列表
        </span>
      </div>
    </form>
  );
}
