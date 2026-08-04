import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { prisma } from "./prisma";

const SESSION_SECRET = (() => {
  const raw = process.env.SESSION_SECRET;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET is required in production");
    }
    console.warn(
      "[SECURITY] SESSION_SECRET not set. Using dev fallback. Do NOT use in production."
    );
    return crypto
      .createHash("sha256")
      .update("wolfie-room-dev-fallback-not-for-prod")
      .digest("hex");
  }
  return crypto.createHash("sha256").update(raw).digest("hex");
})();

const COOKIE_NAME = "session_token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(payload: string): string {
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

function verify(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = token.slice(0, lastDot);
  const receivedSig = token.slice(lastDot + 1);

  const expectedSig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");

  if (
    receivedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig))
  )
    return null;

  return payload;
}

export async function createSession(userId: string) {
  const token = sign(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const userId = verify(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return userId;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAuth(): Promise<string> {
  const userId = await getSession();
  if (!userId) {
    redirect("/login");
  }
  return userId;
}
