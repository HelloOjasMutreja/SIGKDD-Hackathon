import { NextRequest, NextResponse } from "next/server";

type OrganizerSession = {
  userId: string;
  role: "ORGANIZER" | "ADMIN";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
};

type ParticipantSession = {
  userId: string;
  role: "PARTICIPANT";
};

function parseCookie<T>(value?: string): T | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const participantSession = parseCookie<ParticipantSession>(request.cookies.get("participant_session")?.value);
  const organizerSession = parseCookie<OrganizerSession>(request.cookies.get("organizer_session")?.value);

  const participantProtected = ["/team-setup", "/dashboard", "/profile", "/team/"];
  const orgProtected = ["/org/dashboard", "/org/teams", "/org/checkin", "/org/admin", "/org/pending"];

  const isParticipantProtected = participantProtected.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isOrgProtected = orgProtected.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (pathname.startsWith("/org") && participantSession) {
    return NextResponse.redirect(new URL("/org/login", request.url));
  }

  if (!pathname.startsWith("/org") && organizerSession && (pathname === "/login" || pathname === "/register" || pathname.startsWith("/team-") || pathname === "/dashboard" || pathname === "/profile" || pathname.startsWith("/team/"))) {
    if (organizerSession.approvalStatus === "APPROVED") {
      return NextResponse.redirect(new URL("/org/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/org/pending", request.url));
  }

  if (isParticipantProtected && !participantSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isOrgProtected && !organizerSession) {
    return NextResponse.redirect(new URL("/org/login", request.url));
  }

  if (organizerSession && organizerSession.approvalStatus !== "APPROVED" && pathname.startsWith("/org/") && pathname !== "/org/pending" && pathname !== "/org/logout") {
    return NextResponse.redirect(new URL("/org/pending", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
