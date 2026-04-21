import { ok, fail } from "@/server/dto/api-response";
import {
  ingestLineWebhook,
  LineWebhookPayloadError,
  LineWebhookSignatureError
} from "@/server/domain/channel/ingest-line-webhook";
import { logError, logInfo } from "@/lib/utils/logger";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  logInfo("line webhook received", {
    hasSignature: Boolean(signature),
    bodyLength: body.length
  });

  try {
    const result = await ingestLineWebhook({
      body,
      signature
    });

    logInfo("line webhook ingested", result);
    return ok({ ok: true });
  } catch (error) {
    if (error instanceof LineWebhookSignatureError) {
      logError("line webhook rejected", {
        reason: "invalid_signature"
      });
      return fail("LINE_SIGNATURE_INVALID", error.message, 401);
    }

    if (error instanceof LineWebhookPayloadError) {
      logError("line webhook rejected", {
        reason: "invalid_payload"
      });
      return fail("VALIDATION_ERROR", error.message, 400);
    }

    throw error;
  }
}
