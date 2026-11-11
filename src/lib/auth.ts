import crypto from "crypto";
import { cookies } from "next/headers";
import { getUserById } from "./store";
import { SafeUser } from "./types";

const COOKIE_NAME = "clinicflow_session";
const SECRET = process.env.SESSION_SECRET || "clinicflow-super-secret-jwt-key-2026";

export function createSessionToken(userId: string): string {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });
  const base64 = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(base64)
    .digest("base64url");
  return `${base64}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  try {
    const [base64, sig] = token.split(".");
    if (!base64 || !sig) return null;
    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(base64)
      .digest("base64url");
    if (sig !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(base64, "base64url").toString("utf-8"));
    if (!data.userId || Date.now() > data.exp) return null;
    return data.userId;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = verifySessionToken(token);
  if (!userId) return null;
  return getUserById(userId);
}

export { COOKIE_NAME };
