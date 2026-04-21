"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";

type KnowledgeDocument = {
  id: string;
  title: string;
  sourceType: "faq" | "pdf" | "url";
  processingStatus: string;
  lastProcessedAt?: string | null;
};

type KnowledgeDocumentsResponse = {
  data: {
    documents: KnowledgeDocument[];
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

type DeleteKnowledgeDocumentResponse = {
  data: {
    deleted: boolean;
    documentId: string;
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

export function KnowledgeDocumentsManager() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDocuments() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/knowledge/documents", {
          credentials: "same-origin",
          cache: "no-store"
        });
        const json = (await response.json()) as KnowledgeDocumentsResponse;

        if (!response.ok || !json.data) {
          throw new Error(json.error?.message ?? "載入文件列表失敗");
        }

        if (!isMounted) {
          return;
        }

        setDocuments(json.data.documents);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "載入文件列表失敗");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDelete(documentId: string) {
    setDeletingId(documentId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/knowledge/documents/${documentId}`, {
        method: "DELETE",
        credentials: "same-origin"
      });
      const json = (await response.json()) as DeleteKnowledgeDocumentResponse;

      if (!response.ok || !json.data) {
        throw new Error(json.error?.message ?? "刪除文件失敗");
      }

      setDocuments((current) => current.filter((document) => document.id !== documentId));
      setMessage("文件已刪除");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "刪除文件失敗");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/knowledge/new" className="button button-primary">
          Add document
        </Link>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>
          目前可先建立 FAQ / URL / placeholder PDF 文件
        </span>
      </div>
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
      <div className="panel card" style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--muted)" }}>
                  正在載入文件列表...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--muted)" }}>
                  尚未建立任何文件。
                </td>
              </tr>
            ) : (
              documents.map((document) => {
                const isDeleting = deletingId === document.id;

                return (
                  <tr key={document.id}>
                    <td>{document.title}</td>
                    <td>{document.sourceType.toUpperCase()}</td>
                    <td>{document.processingStatus}</td>
                    <td>{formatDateTime(document.lastProcessedAt)}</td>
                    <td>
                      <button
                        className="button button-secondary"
                        type="button"
                        disabled={isDeleting}
                        onClick={() => {
                          startTransition(() => {
                            void handleDelete(document.id);
                          });
                        }}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("zh-TW", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
