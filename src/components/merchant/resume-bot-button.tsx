"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type ResumeConversationResponse = {
  data: {
    conversation: {
      id: string;
      status: string;
    };
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

export function ResumeBotButton({
  conversationId,
  status
}: {
  conversationId: string;
  status: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== "human_active") {
    return (
      <span style={{ color: "var(--muted)", fontSize: 14 }}>
        目前對話不是 `human_active`，無需 Resume AI。
      </span>
    );
  }

  async function resumeBot() {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/resume-bot`, {
        method: "POST",
        credentials: "same-origin"
      });
      const json = (await response.json()) as ResumeConversationResponse;

      if (!response.ok || !json.data) {
        throw new Error(json.error?.message ?? "Resume AI 失敗");
      }

      setMessage("AI 已恢復接手此對話");
      router.refresh();
    } catch (resumeError) {
      setError(resumeError instanceof Error ? resumeError.message : "Resume AI 失敗");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
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
      <button
        className="button button-primary"
        type="button"
        disabled={isSubmitting}
        onClick={() => {
          startTransition(() => {
            void resumeBot();
          });
        }}
      >
        {isSubmitting ? "Resuming..." : "Resume AI"}
      </button>
    </div>
  );
}
