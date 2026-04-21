import test from "node:test";
import assert from "node:assert/strict";
import {
  computeLineSignature,
  verifyLineSignature
} from "@/server/services/line/line-signature";

test("computes and verifies LINE signatures with HMAC-SHA256", () => {
  const body = JSON.stringify({
    events: [{ type: "message", text: "hello" }]
  });
  const secret = "line-secret";
  const signature = computeLineSignature(body, secret);

  assert.equal(typeof signature, "string");
  assert.equal(verifyLineSignature(body, signature, secret), true);
});

test("rejects missing or mismatched signatures", () => {
  assert.equal(verifyLineSignature("{}", null, "secret"), false);
  assert.equal(verifyLineSignature("{}", "invalid", "secret"), false);
});
