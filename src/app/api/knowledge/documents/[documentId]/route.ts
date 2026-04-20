import { ok } from "@/server/dto/api-response";
import { deleteKnowledgeDocument } from "@/server/domain/knowledge/list-documents";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  return ok(await deleteKnowledgeDocument(documentId));
}
