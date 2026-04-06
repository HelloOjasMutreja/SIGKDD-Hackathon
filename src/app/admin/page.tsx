import { revalidatePath } from "next/cache";
import { RegistrationStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrRedirect } from "@/lib/current-user";

async function updateRole(formData: FormData) {
  "use server";
  const user = await getCurrentUserOrRedirect();

  if (user.role !== Role.SUPER_ADMIN) {
    return;
  }

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? Role.PARTICIPANT) as Role;

  if (!userId) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/admin");
}

async function updateRegistrationStatus(formData: FormData) {
  "use server";
  const user = await getCurrentUserOrRedirect();

  if (user.role !== Role.SUPER_ADMIN && user.role !== Role.SUPPORT_STAFF) {
    return;
  }

  const profileId = String(formData.get("profileId") ?? "");
  const status = String(formData.get("status") ?? RegistrationStatus.DRAFT) as RegistrationStatus;

  if (!profileId) {
    return;
  }

  await prisma.participantProfile.update({
    where: { id: profileId },
    data: { registrationStatus: status },
  });

  revalidatePath("/admin");
}

export default async function AdminPage() {
  const user = await getCurrentUserOrRedirect();

  if (
    user.role !== Role.SUPER_ADMIN &&
    user.role !== Role.SUPPORT_STAFF &&
    user.role !== Role.TRACK_MANAGER
  ) {
    return (
      <section className="card p-6">
        <h1 className="text-2xl font-bold">Organizer Admin Workspace</h1>
        <p className="mt-2 text-sm text-muted">This page is for organizer roles only.</p>
      </section>
    );
  }

  const [users, profiles, teams, tracks, checkIns] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.participantProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.team.count(),
    prisma.track.count(),
    prisma.checkIn.count(),
  ]);

  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Organizer Admin Workspace</h1>
        <p className="mt-2 text-sm text-muted">Operational center for approvals, role assignments, and event metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <article className="card p-4"><p className="text-sm text-muted">Users</p><p className="text-2xl font-semibold">{users.length}</p></article>
        <article className="card p-4"><p className="text-sm text-muted">Profiles</p><p className="text-2xl font-semibold">{profiles.length}</p></article>
        <article className="card p-4"><p className="text-sm text-muted">Teams</p><p className="text-2xl font-semibold">{teams}</p></article>
        <article className="card p-4"><p className="text-sm text-muted">Check-ins</p><p className="text-2xl font-semibold">{checkIns}</p></article>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Participant approvals</h2>
        <div className="mt-3 grid gap-3">
          {profiles.map((profile) => (
            <form key={profile.id} action={updateRegistrationStatus} className="rounded-lg border border-border bg-surface-2 p-3 text-sm md:grid md:grid-cols-[1fr_auto_auto] md:items-center md:gap-3">
              <input type="hidden" name="profileId" value={profile.id} />
              <p>
                {profile.user.fullName} ({profile.user.email})
              </p>
              <select name="status" defaultValue={profile.registrationStatus} className="rounded-lg border border-border bg-white px-2 py-1">
                {Object.values(RegistrationStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">Update</button>
            </form>
          ))}
        </div>
      </div>

      {user.role === Role.SUPER_ADMIN && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Role assignment</h2>
          <div className="mt-3 grid gap-3">
            {users.map((candidate) => (
              <form key={candidate.id} action={updateRole} className="rounded-lg border border-border bg-surface-2 p-3 text-sm md:grid md:grid-cols-[1fr_auto_auto] md:items-center md:gap-3">
                <input type="hidden" name="userId" value={candidate.id} />
                <p>
                  {candidate.fullName} ({candidate.email})
                </p>
                <select name="role" defaultValue={candidate.role} className="rounded-lg border border-border bg-white px-2 py-1">
                  {Object.values(Role).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">Set role</button>
              </form>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Tracks configured</h2>
        <p className="mt-1 text-sm text-muted">{tracks} active tracks currently configured.</p>
      </div>
    </section>
  );
}
