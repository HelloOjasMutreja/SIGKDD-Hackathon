import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

const SESSION_COOKIE = "portal_session";

type SessionPayload = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

function serialize(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

function deserialize(raw: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
    if (!parsed?.id || !parsed?.email || !parsed?.fullName || !parsed?.role) {
      return null;
    }
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (!cookie) {
    return null;
  }

  return deserialize(cookie);
}

export async function setSessionUser(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, serialize(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSessionUser(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
