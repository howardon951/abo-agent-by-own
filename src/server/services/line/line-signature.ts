import { createHmac, timingSafeEqual } from "node:crypto";

export function computeLineSignature(body: string, channelSecret: string) {
  return createHmac("sha256", channelSecret).update(body, "utf8").digest("base64");
}

export function verifyLineSignature(
  body: string,
  signature: string | null | undefined,
  channelSecret: string
) {
  if (!signature) {
    return false;
  }

  const expectedSignature = computeLineSignature(body, channelSecret);
  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
}
