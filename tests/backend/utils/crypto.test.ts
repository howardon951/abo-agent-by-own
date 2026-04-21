import test from "node:test";
import assert from "node:assert/strict";
import { decryptSecret, encryptSecret } from "@/lib/utils/crypto";

const encryptionKey = Buffer.alloc(32, 42).toString("base64");

test("round-trips encrypted secrets with aes-256-gcm", () => {
  const ciphertext = encryptSecret("super-secret-token", encryptionKey);

  assert.match(ciphertext, /^v1:/);
  assert.notEqual(ciphertext, "super-secret-token");
  assert.equal(decryptSecret(ciphertext, encryptionKey), "super-secret-token");
});

test("rejects malformed encryption keys", () => {
  assert.throws(() => encryptSecret("secret", "short-key"), {
    message: "LINE_CONFIG_ENCRYPTION_KEY must be a base64-encoded 32-byte key"
  });
});
