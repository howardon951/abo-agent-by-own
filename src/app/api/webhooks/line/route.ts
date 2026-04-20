import { ok, fail } from "@/server/dto/api-response";
import { verifyLineSignature } from "@/server/services/line/line-signature";
import { enqueueMessageJob } from "@/server/services/jobs/enqueue";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineSignature(body, signature)) {
    return fail("LINE_SIGNATURE_INVALID", "invalid line signature", 401);
  }

  await enqueueMessageJob("msg-webhook-demo");
  return ok({ ok: true });
}
