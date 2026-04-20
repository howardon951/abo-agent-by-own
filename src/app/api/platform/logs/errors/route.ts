import { ok } from "@/server/dto/api-response";

export async function GET() {
  return ok({
    items: [
      {
        time: "2026-04-01T13:02:00Z",
        tenant: "Abo Coffee",
        event: "message_job failed",
        detail: "LLM timeout"
      },
      {
        time: "2026-04-01T12:45:00Z",
        tenant: "Demo Salon",
        event: "document failed",
        detail: "PDF parse failed"
      }
    ]
  });
}
