import { mockDocuments } from "@/server/domain/mock-data";

export async function listKnowledgeDocuments() {
  return { documents: [...mockDocuments] };
}

export async function createKnowledgeDocument(input: {
  sourceType: "faq" | "pdf" | "url";
  title: string;
  sourceUrl?: string;
  rawText?: string;
}) {
  return {
    document: {
      id: `doc-${Date.now()}`,
      title: input.title,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl ?? null,
      rawText: input.rawText ?? null,
      processingStatus: "queued"
    }
  };
}

export async function deleteKnowledgeDocument(documentId: string) {
  return {
    deleted: true,
    documentId
  };
}
