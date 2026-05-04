import { createHash, randomBytes } from "node:crypto";

export function generatePasswordResetPlainToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

export function shouldReturnResetTokenInResponse(): boolean {
  return process.env.PASSWORD_RESET_RETURN_TOKEN === "true";
}
