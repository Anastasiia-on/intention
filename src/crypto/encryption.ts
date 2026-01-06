/// <reference types="node" />
import { Buffer } from "node:buffer";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { config } from "../config";
import { EncryptedPayload } from "../types";

const key = Buffer.from(config.encryptionKey, "base64");
if (key.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be base64 for 32 bytes");
}

export function encryptText(plaintext: string): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  const ciphertext = Buffer.concat([
    Buffer.from(cipher.update(plaintext, "utf8")),
    Buffer.from(cipher.final()),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext_b64: ciphertext.toString("base64"),
    iv_b64: iv.toString("base64"),
    auth_tag_b64: authTag.toString("base64"),
  };
}

export function decryptText(payload: EncryptedPayload): string {
  const iv = Buffer.from(payload.iv_b64, "base64");
  const ciphertext = Buffer.from(payload.ciphertext_b64, "base64");
  const authTag = Buffer.from(payload.auth_tag_b64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    Buffer.from(decipher.update(ciphertext)),
    Buffer.from(decipher.final()),
  ]);
  return plaintext.toString("utf8");
}
