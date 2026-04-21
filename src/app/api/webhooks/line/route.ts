import { ok, fail } from "@/server/dto/api-response";
import { verifyLineSignature } from "@/server/services/line/line-signature";
import { enqueueMessageJob } from "@/server/services/jobs/enqueue";
import { logError, logInfo } from "@/lib/utils/logger";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  logInfo("line webhook received", {
    hasSignature: Boolean(signature),
    bodyLength: body.length
  });

  if (!verifyLineSignature(body, signature)) {
    logError("line webhook rejected", {
      reason: "invalid_signature"
    });
    return fail("LINE_SIGNATURE_INVALID", "invalid line signature", 401);
  }

  const job = await enqueueMessageJob("msg-webhook-demo");
  logInfo("line webhook enqueued message job", job);
  return ok({ ok: true });
}
