import { mockDocuments } from "@/server/domain/mock-data";
import { logInfo } from "@/lib/utils/logger";

export async function listKnowledgeDocuments() {
  logInfo("knowledge documents listed", {
    count: mockDocuments.length
  });
  return { documents: [...mockDocuments] };
}

export async function createKnowledgeDocument(input: {
  sourceType: "faq" | "pdf" | "url";
  title: string;
  sourceUrl?: string;
  rawText?: string;
}) {
  const document = {
    id: `doc-${Date.now()}`,
    title: input.title,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl ?? null,
    rawText: input.rawText ?? null,
    processingStatus: "queued"
  };

  logInfo("knowledge document queued", {
    documentId: document.id,
    sourceType: document.sourceType,
    hasSourceUrl: Boolean(document.sourceUrl),
    hasRawText: Boolean(document.rawText)
  });

  return {
    document
  };
}

export async function deleteKnowledgeDocument(documentId: string) {
  logInfo("knowledge document deleted", {
    documentId
  });

  return {
    deleted: true,
    documentId
  };
}
