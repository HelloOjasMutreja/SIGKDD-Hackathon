import { cookies } from "next/headers";
import { ApprovalStatus, OrganizerApprovedRole, UserRole } from "@/lib/domain";

const PARTICIPANT_COOKIE = "participant_session";
const ORGANIZER_COOKIE = "organizer_session";

type ParticipantSession = {
  userId: string;
  role: UserRole;
};

type OrganizerSession = {
  userId: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  approvedRole: OrganizerApprovedRole | null;
};

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

export async function setParticipantSession(session: ParticipantSession): Promise<void> {
  const store = await cookies();
  store.set(PARTICIPANT_COOKIE, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  store.delete(ORGANIZER_COOKIE);
}

export async function setOrganizerSession(session: OrganizerSession): Promise<void> {
  const store = await cookies();
  store.set(ORGANIZER_COOKIE, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  store.delete(PARTICIPANT_COOKIE);
}

export async function getParticipantSession(): Promise<ParticipantSession | null> {
  const store = await cookies();
  const raw = store.get(PARTICIPANT_COOKIE)?.value;
  if (!raw) {
    return null;
  }
  return decode<ParticipantSession>(raw);
}

export async function getOrganizerSession(): Promise<OrganizerSession | null> {
  const store = await cookies();
  const raw = store.get(ORGANIZER_COOKIE)?.value;
  if (!raw) {
    return null;
  }
  return decode<OrganizerSession>(raw);
}

export async function clearSessions(): Promise<void> {
  const store = await cookies();
  store.delete(PARTICIPANT_COOKIE);
  store.delete(ORGANIZER_COOKIE);
}
