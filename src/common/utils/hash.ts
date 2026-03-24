import bcrypt from "bcrypt";
import crypto from "crypto";
import { env } from "../../config/env";

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, env.bcryptSaltRounds);
}

export async function comparePassword(
  plainText: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
