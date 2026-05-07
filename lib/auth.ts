import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const AUTH_COOKIE = "mypets_session";
const maxAge = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  username: string;
  role: "USER" | "ADMIN";
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters in production");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.username !== "string" || (payload.role !== "USER" && payload.role !== "ADMIN")) {
      return null;
    }
    return { id: payload.sub, username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true }
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

export async function setAuthCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/"
  });
}

export async function clearAuthCookie() {
  (await cookies()).set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/"
  });
}

export function authErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") return "UNAUTHORIZED";
  if (error instanceof Error && error.message === "FORBIDDEN") return "FORBIDDEN";
  return null;
}
