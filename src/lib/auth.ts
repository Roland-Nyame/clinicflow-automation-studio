import crypto from "crypto";
import { cookies } from "next/headers";
import { getUserById } from "./store";
import { SafeUser } from "./types";

const COOKIE_NAME = "clinicflow_session";
const SECRET = process.env.SESSION_SECRET || "clinicflow-super-secret-jwt-key-2026";

export function createSessionToken(userIdOrUser: string | SafeUser): string {
  const userId =
    typeof userIdOrUser === "string" ? userIdOrUser : userIdOrUser.id;
  const embeddedUser =
    typeof userIdOrUser === "object" ? userIdOrUser : undefined;

  const payload = JSON.stringify({
    userId,
    user: embeddedUser,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });
  const base64 = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(base64)
    .digest("base64url");
  return `${base64}.${sig}`;
}

export function verifySessionTokenPayload(token: string): {
  userId: string;
  user?: SafeUser;
} | null {
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
    return { userId: data.userId, user: data.user };
  } catch {
    return null;
  }
}

export function verifySessionToken(token: string): string | null {
  return verifySessionTokenPayload(token)?.userId || null;
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const decoded = verifySessionTokenPayload(token);
  if (!decoded) return null;
  return getUserById(decoded.userId) || decoded.user || null;
}

export { COOKIE_NAME };
