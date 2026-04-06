import { revalidatePath } from "next/cache";
import { TeamInviteStatus, TeamMembershipStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrRedirect } from "@/lib/current-user";

async function createTeam(formData: FormData) {
  "use server";
  const user = await getCurrentUserOrRedirect();

  const existingMembership = await prisma.teamMember.findFirst({
    where: { userId: user.id, status: TeamMembershipStatus.ACTIVE },
  });

  if (existingMembership) {
    return;
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return;
  }

  await prisma.team.create({
    data: {
      name,
      captainId: user.id,
      members: {
        create: {
          userId: user.id,
          status: TeamMembershipStatus.ACTIVE,
        },
      },
    },
  });

  revalidatePath("/teams");
  revalidatePath("/tracks");
}

async function inviteMember(formData: FormData) {
  "use server";
  const user = await getCurrentUserOrRedirect();

  const teamId = String(formData.get("teamId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!teamId || !email || !fullName) {
    return;
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.captainId !== user.id) {
    return;
  }

  const invitedUser = await prisma.user.upsert({
    where: { email },
    update: { fullName },
    create: { fullName, email, role: "PARTICIPANT" },
  });

  await prisma.teamInvite.upsert({
    where: {
      teamId_userId: {
        teamId,
        userId: invitedUser.id,
      },
    },
    update: {
      status: TeamInviteStatus.PENDING,
      invitedById: user.id,
      respondedAt: null,
    },
    create: {
      teamId,
      userId: invitedUser.id,
      invitedById: user.id,
      status: TeamInviteStatus.PENDING,
    },
  });

  revalidatePath("/teams");
}

async function respondInvite(formData: FormData) {
  "use server";
  const user = await getCurrentUserOrRedirect();

  const inviteId = String(formData.get("inviteId") ?? "");
  const decision = String(formData.get("decision") ?? "decline");

  const invite = await prisma.teamInvite.findUnique({
    where: { id: inviteId },
    include: { team: true },
  });

  if (!invite || invite.userId !== user.id || invite.status !== TeamInviteStatus.PENDING) {
    return;
  }

  if (decision === "accept") {
    await prisma.$transaction([
      prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: TeamInviteStatus.ACCEPTED, respondedAt: new Date() },
      }),
      prisma.teamMember.upsert({
        where: {
          teamId_userId: {
            teamId: invite.teamId,
            userId: user.id,
          },
        },
        update: { status: TeamMembershipStatus.ACTIVE },
        create: {
          teamId: invite.teamId,
          userId: user.id,
          status: TeamMembershipStatus.ACTIVE,
        },
      }),
    ]);
  } else {
    await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: TeamInviteStatus.DECLINED, respondedAt: new Date() },
    });
  }

  revalidatePath("/teams");
  revalidatePath("/tracks");
}

export default async function TeamsPage() {
  const user = await getCurrentUserOrRedirect();

  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id, status: TeamMembershipStatus.ACTIVE },
    include: {
      team: {
        include: {
          members: { include: { user: true } },
          invites: { include: { user: true }, orderBy: { createdAt: "desc" } },
          track: true,
        },
      },
    },
  });

  const incomingInvites = await prisma.teamInvite.findMany({
    where: { userId: user.id, status: TeamInviteStatus.PENDING },
    include: { team: true },
    orderBy: { createdAt: "desc" },
  });

  const team = membership?.team;

  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <p className="mt-2 text-sm text-muted">Create a team, invite teammates, and manage invite decisions.</p>
      </div>

      {!team ? (
        <form action={createTeam} className="card grid gap-3 p-6 md:grid-cols-[1fr_auto]">
          <input name="name" required placeholder="Team name" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Create team</button>
        </form>
      ) : (
        <div className="card p-6">
          <h2 className="text-xl font-semibold">{team.name}</h2>
          <p className="mt-1 text-sm text-muted">Captain: {team.captainId === user.id ? "You" : "Another member"}</p>
          <p className="mt-1 text-sm text-muted">Track: {team.track?.name ?? "Not selected"}</p>

          <h3 className="mt-4 text-sm font-semibold">Members</h3>
          <ul className="mt-2 grid gap-2">
            {team.members.map((member) => (
              <li key={member.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                {member.user.fullName} ({member.user.email})
              </li>
            ))}
          </ul>

          {team.captainId === user.id && (
            <form action={inviteMember} className="mt-5 grid gap-3 md:grid-cols-3">
              <input type="hidden" name="teamId" value={team.id} />
              <input name="fullName" required placeholder="Invitee name" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
              <input name="email" type="email" required placeholder="Invitee email" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
              <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Send invite</button>
            </form>
          )}

          <h3 className="mt-5 text-sm font-semibold">Invites</h3>
          <ul className="mt-2 grid gap-2">
            {team.invites.length === 0 && <li className="text-sm text-muted">No invites sent yet.</li>}
            {team.invites.map((invite) => (
              <li key={invite.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                {invite.user.fullName} ({invite.user.email}) - {invite.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Incoming invites</h2>
        <div className="mt-3 grid gap-3">
          {incomingInvites.length === 0 && <p className="text-sm text-muted">No pending invites.</p>}
          {incomingInvites.map((invite) => (
            <form key={invite.id} action={respondInvite} className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
              <input type="hidden" name="inviteId" value={invite.id} />
              <p className="font-medium">{invite.team.name}</p>
              <div className="mt-2 flex gap-2">
                <button name="decision" value="accept" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">
                  Accept
                </button>
                <button name="decision" value="decline" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">
                  Decline
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>
    </section>
  );
}
