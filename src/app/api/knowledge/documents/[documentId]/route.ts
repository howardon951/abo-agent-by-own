import { ok } from "@/server/dto/api-response";
import { deleteKnowledgeDocument } from "@/server/domain/knowledge/list-documents";
import { runTenantScopedRoute } from "@/server/http/tenant-route";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  return runTenantScopedRoute(async () => {
    const { documentId } = await params;
    return ok(await deleteKnowledgeDocument(documentId));
  });
}
