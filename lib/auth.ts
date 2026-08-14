import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { adminHref } from "./admin-path";

const COOKIE_NAME = "session_token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  tenantId: string;
}

function getSessionSecret(): string {
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
}

function sign(payload: string): string {
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
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
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  if (
    receivedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig))
  )
    return null;

  return payload;
}

/**
 * Parsea el payload de la sesión.
 * Formato nuevo: "userId:tenantId"
 * Formato legacy (pre-multitenant): "userId" (sin tenantId)
 */
function parseSessionPayload(payload: string): SessionPayload {
  const parts = payload.split(":");
  if (parts.length === 2) {
    return { userId: parts[0], tenantId: parts[1] };
  }
  // Legacy: sin tenantId (solo funciona para el tenant por defecto en dev)
  return { userId: payload, tenantId: "" };
}

export async function createSession(userId: string, tenantId: string) {
  const payload = `${userId}:${tenantId}`;
  const token = sign(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Retorna la sesión actual {userId, tenantId} o null si no hay sesión válida.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verify(token);
  if (!payload) return null;

  const session = parseSessionPayload(payload);
  if (!session.userId) return null;

  return session;
}

/**
 * Retorna solo el userId (backward compat para código que no necesita tenantId).
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId || null;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Requiere autenticación y retorna la sesión completa {userId, tenantId}.
 * Redirige a login si no hay sesión.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect(adminHref("/login"));
  }
  return session;
}
