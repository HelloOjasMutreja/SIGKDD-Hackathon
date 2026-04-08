import { NextRequest, NextResponse } from "next/server";
import { TeamStatus, ScanEventType } from "@/lib/domain";
import { canUseOrganizerCapability } from "@/lib/org-access";
import { getOrganizerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function extractToken(payload: string) {
  const trimmed = payload.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as { token?: string };
    if (parsed && typeof parsed.token === "string" && parsed.token.trim()) {
      return parsed.token.trim();
    }
  } catch {
    // Ignore JSON parse failures and fall through to raw parsing.
  }

  const tokenMatch = trimmed.match(/\/verify\/([A-Za-z0-9_-]+)/);
  if (tokenMatch?.[1]) {
    return tokenMatch[1];
  }

  return trimmed;
}

export async function POST(request: NextRequest) {
  const session = await getOrganizerSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organizerProfile: true },
  });

  if (!actor || !actor.organizerProfile) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    payload?: string;
    mode?: string;
    mealSlot?: string;
  } | null;

  const payload = body?.payload ?? "";
  const mode = String(body?.mode ?? "CHECKIN").toUpperCase();
  const mealSlot = String(body?.mealSlot ?? "").trim().toUpperCase();
  const token = extractToken(payload);

  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { qrToken: token },
    include: {
      leader: true,
      track: true,
      members: { include: { user: true } },
    },
  });

  if (!team || team.status !== TeamStatus.APPROVED) {
    return NextResponse.json({ error: "team_not_eligible" }, { status: 400 });
  }

  if (mode === ScanEventType.MEAL && !canUseOrganizerCapability(actor.role, actor.organizerProfile.approvedRole, "meals:manage")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (mode === ScanEventType.CHECKIN && !canUseOrganizerCapability(actor.role, actor.organizerProfile.approvedRole, "checkins:manage")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (mode === ScanEventType.CHECKIN) {
    const existing = await prisma.checkin.findFirst({ where: { teamId: team.id } });
    if (existing) {
      return NextResponse.json({
        success: false,
        result: "duplicate_checkin",
        team: {
          id: team.id,
          name: team.name,
          status: team.status,
          checkInStatus: true,
          mealClaims: await prisma.scanEvent.count({ where: { teamId: team.id, eventType: ScanEventType.MEAL } }),
        },
      }, { status: 409 });
    }

    await prisma.checkin.create({
      data: {
        teamId: team.id,
        checkedInBy: actor.id,
      },
    });

    await prisma.scanEvent.create({
      data: {
        teamId: team.id,
        scannedBy: actor.id,
        eventType: ScanEventType.CHECKIN,
        mealSlot: "ARRIVAL",
        mealCount: 1,
        result: "CHECKED_IN",
        metadata: {
          mode,
          token,
          actorRole: actor.organizerProfile.approvedRole,
        },
      },
    });
  }

  if (mode === ScanEventType.MEAL) {
    if (!mealSlot) {
      return NextResponse.json({ error: "missing_meal_slot" }, { status: 400 });
    }

    const existingMeal = await prisma.scanEvent.findFirst({ where: { teamId: team.id, eventType: ScanEventType.MEAL, mealSlot } });
    if (existingMeal) {
      return NextResponse.json({
        success: false,
        result: "duplicate_meal_claim",
        team: {
          id: team.id,
          name: team.name,
          status: team.status,
          checkInStatus: Boolean(await prisma.checkin.findFirst({ where: { teamId: team.id } })),
          mealClaims: await prisma.scanEvent.count({ where: { teamId: team.id, eventType: ScanEventType.MEAL } }),
        },
      }, { status: 409 });
    }

    await prisma.scanEvent.create({
      data: {
        teamId: team.id,
        scannedBy: actor.id,
        eventType: ScanEventType.MEAL,
        mealSlot,
        mealCount: 1,
        result: "MEAL_RECORDED",
        metadata: {
          mode,
          token,
          actorRole: actor.organizerProfile.approvedRole,
        },
      },
    });
  }

  const checkInStatus = Boolean(await prisma.checkin.findFirst({ where: { teamId: team.id } }));
  const mealClaims = await prisma.scanEvent.count({ where: { teamId: team.id, eventType: ScanEventType.MEAL } });

  return NextResponse.json({
    success: true,
    result: mode === ScanEventType.MEAL ? "meal_recorded" : "checked_in",
    team: {
      id: team.id,
      name: team.name,
      status: team.status,
      checkInStatus,
      mealClaims,
      qrEligible: team.status === TeamStatus.APPROVED,
    },
  });
}
