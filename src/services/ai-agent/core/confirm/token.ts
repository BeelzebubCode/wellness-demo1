// src/services/aiAgent/core/confirm/token.ts
import crypto from "crypto";

const SECRET = process.env.AI_AGENT_SECRET || "dev_secret_change_me";

function b64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function unb64url(input: string) {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return Buffer.from(s + pad, "base64");
}

export type ConfirmPayloadBase = {
  v: number;
  exp: number; // ms epoch
  action: string; // "BOOK" | "CANCEL" | ...
  universityId: number;
  studentId: number;
};

export function signConfirmToken(payload: ConfirmPayloadBase & Record<string, any>) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac("sha256", SECRET).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyConfirmToken<T = any>(token: string): T | null {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;

  const expected = b64url(crypto.createHmac("sha256", SECRET).update(body).digest());
  if (expected !== sig) return null;

  try {
    return JSON.parse(unb64url(body).toString("utf8")) as T;
  } catch {
    return null;
  }
}
