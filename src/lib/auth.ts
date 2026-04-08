import { cookies } from "next/headers";
import { ApprovalStatus, OrganizerApprovedRole, UserRole } from "@/lib/domain";

const PARTICIPANT_COOKIE = "participant_session";
const ORGANIZER_COOKIE = "organizer_session";

type ParticipantSession = {
  userId: string;
  role: UserRole;
  issuedAt: number;
  expiresAt: number;
};

type ParticipantSessionInput = {
  userId: string;
  role: UserRole;
};

type OrganizerSession = {
  userId: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  approvedRole: OrganizerApprovedRole | null;
  issuedAt: number;
  expiresAt: number;
};

type OrganizerSessionInput = {
  userId: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  approvedRole: OrganizerApprovedRole | null;
};

const SESSION_TTL_SECONDS = 60 * 60 * 24;

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function encode(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

function decode<T>(raw: string): T | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}

export async function setParticipantSession(session: ParticipantSessionInput): Promise<void> {
  const store = await cookies();
  const issuedAt = nowSeconds();
  const expiresAt = issuedAt + SESSION_TTL_SECONDS;
  store.set(PARTICIPANT_COOKIE, encode({ ...session, issuedAt, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  store.delete(ORGANIZER_COOKIE);
}

export async function setOrganizerSession(session: OrganizerSessionInput): Promise<void> {
  const store = await cookies();
  const issuedAt = nowSeconds();
  const expiresAt = issuedAt + SESSION_TTL_SECONDS;
  store.set(ORGANIZER_COOKIE, encode({ ...session, issuedAt, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  store.delete(PARTICIPANT_COOKIE);
}

export async function getParticipantSession(): Promise<ParticipantSession | null> {
  const store = await cookies();
  const raw = store.get(PARTICIPANT_COOKIE)?.value;
  if (!raw) {
    return null;
  }
  const session = decode<ParticipantSession>(raw);
  if (!session) {
    return null;
  }
  if (!session.expiresAt || session.expiresAt <= nowSeconds()) {
    store.delete(PARTICIPANT_COOKIE);
    return null;
  }
  return session;
}

export async function getOrganizerSession(): Promise<OrganizerSession | null> {
  const store = await cookies();
  const raw = store.get(ORGANIZER_COOKIE)?.value;
  if (!raw) {
    return null;
  }
  const session = decode<OrganizerSession>(raw);
  if (!session) {
    return null;
  }
  if (!session.expiresAt || session.expiresAt <= nowSeconds()) {
    store.delete(ORGANIZER_COOKIE);
    return null;
  }
  return session;
}

export async function clearSessions(): Promise<void> {
  const store = await cookies();
  store.delete(PARTICIPANT_COOKIE);
  store.delete(ORGANIZER_COOKIE);
}
