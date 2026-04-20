import { z } from "zod";
import { fail, ok } from "@/server/dto/api-response";
import {
  createKnowledgeDocument,
  listKnowledgeDocuments
} from "@/server/domain/knowledge/list-documents";

const schema = z.object({
  sourceType: z.enum(["faq", "pdf", "url"]),
  title: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  rawText: z.string().optional()
});

export async function GET() {
  return ok(await listKnowledgeDocuments());
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "invalid document payload");
  }

  return ok(await createKnowledgeDocument(parsed.data));
}
