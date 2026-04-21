import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ENCRYPTION_VERSION = "v1";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function encryptSecret(plaintext: string, encryptionKey: string) {
  const key = decodeEncryptionKey(encryptionKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64")
  ].join(":");
}

export function decryptSecret(ciphertext: string, encryptionKey: string) {
  const [version, ivBase64, authTagBase64, payloadBase64] = ciphertext.split(":");

  if (version !== ENCRYPTION_VERSION || !ivBase64 || !authTagBase64 || !payloadBase64) {
    throw new Error("invalid encrypted payload");
  }

  const key = decodeEncryptionKey(encryptionKey);
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const payload = Buffer.from(payloadBase64, "base64");

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("invalid encrypted payload");
  }

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(payload), decipher.final()]).toString("utf8");
}

function decodeEncryptionKey(encryptionKey: string) {
  const key = Buffer.from(encryptionKey, "base64");

  if (key.length !== 32) {
    throw new Error("LINE_CONFIG_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }

  return key;
}
