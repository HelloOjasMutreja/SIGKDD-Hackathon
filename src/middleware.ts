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

  if (pathname === "/org" || pathname.startsWith("/org/")) {
    const suffix = pathname.slice("/org".length);
    return NextResponse.redirect(new URL(`/organizer${suffix}`, request.url));
  }

  const isOrganizerPath = pathname === "/organizer" || pathname.startsWith("/organizer/");
  const organizerInternalPath = isOrganizerPath ? `/org${pathname.slice("/organizer".length)}` : pathname;

  const participantSession = parseCookie<ParticipantSession>(request.cookies.get("participant_session")?.value);
  const organizerSession = parseCookie<OrganizerSession>(request.cookies.get("organizer_session")?.value);

  const participantProtected = ["/team-setup", "/dashboard", "/profile", "/team/"];
  const organizerProtected = ["/organizer/dashboard", "/organizer/teams", "/organizer/checkin", "/organizer/admin", "/organizer/pending"];

  const isParticipantProtected = participantProtected.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isOrganizerProtected = organizerProtected.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isOrganizerPath && participantSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isOrganizerPath && organizerSession && (pathname === "/login" || pathname === "/register" || pathname.startsWith("/team-") || pathname === "/dashboard" || pathname === "/profile" || pathname.startsWith("/team/"))) {
    if (organizerSession.approvalStatus === "APPROVED") {
      return NextResponse.redirect(new URL("/organizer/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/organizer/pending", request.url));
  }

  if (isParticipantProtected && !participantSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isOrganizerProtected && !organizerSession) {
    return NextResponse.redirect(new URL("/organizer/login", request.url));
  }

  if (organizerSession && organizerSession.approvalStatus !== "APPROVED" && isOrganizerPath && pathname !== "/organizer/pending" && pathname !== "/organizer/logout" && pathname !== "/organizer/login" && pathname !== "/organizer/register") {
    return NextResponse.redirect(new URL("/organizer/pending", request.url));
  }

  if (isOrganizerPath) {
    return NextResponse.rewrite(new URL(organizerInternalPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
