import { createHash, randomBytes } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function makeTeamCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += chars[randomBytes(1)[0] % chars.length];
  }
  return out;
}

export function makeToken(size = 24): string {
  return randomBytes(size).toString("base64url");
}
