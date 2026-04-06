import { revalidatePath } from "next/cache";
import { Role, TeamMembershipStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrRedirect } from "@/lib/current-user";

async function createTrack(formData: FormData) {
  "use server";
  const user = await getCurrentUserOrRedirect();

  if (user.role !== Role.SUPER_ADMIN && user.role !== Role.TRACK_MANAGER) {
    return;
  }

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const capacity = Number(String(formData.get("capacity") ?? "0"));

  if (!code || !name || !description || Number.isNaN(capacity) || capacity < 1) {
    return;
  }

  await prisma.track.create({
    data: { code, name, description, capacity },
  });

  revalidatePath("/tracks");
}

async function assignTrack(formData: FormData) {
  "use server";

  const user = await getCurrentUserOrRedirect();
  const trackId = String(formData.get("trackId") ?? "");

  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id, status: TeamMembershipStatus.ACTIVE },
    include: { team: true },
  });

  if (!membership || membership.team.captainId !== user.id || !trackId) {
    return;
  }

  const selectedTrack = await prisma.track.findUnique({
    where: { id: trackId },
    include: { _count: { select: { teams: true } } },
  });

  if (!selectedTrack) {
    return;
  }

  const isSameTrack = membership.team.trackId === selectedTrack.id;
  if (!isSameTrack && selectedTrack._count.teams >= selectedTrack.capacity) {
    return;
  }

  await prisma.team.update({
    where: { id: membership.teamId },
    data: { trackId },
  });

  revalidatePath("/tracks");
  revalidatePath("/teams");
}

export default async function TracksPage() {
  const user = await getCurrentUserOrRedirect();

  const [tracks, membership] = await Promise.all([
    prisma.track.findMany({ include: { _count: { select: { teams: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.teamMember.findFirst({
      where: { userId: user.id, status: TeamMembershipStatus.ACTIVE },
      include: { team: true },
    }),
  ]);

  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Tracks</h1>
        <p className="mt-2 text-sm text-muted">Manage tracks and assign teams to their competition domain.</p>
      </div>

      {(user.role === Role.SUPER_ADMIN || user.role === Role.TRACK_MANAGER) && (
        <form action={createTrack} className="card grid gap-3 p-6 md:grid-cols-2">
          <input name="code" required placeholder="Code (e.g., AI01)" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input name="name" required placeholder="Track name" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input name="description" required placeholder="Description" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2" />
          <input name="capacity" type="number" min={1} required placeholder="Capacity" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Create track</button>
        </form>
      )}

      {membership?.team.captainId === user.id && tracks.length > 0 && (
        <form action={assignTrack} className="card grid gap-3 p-6 md:grid-cols-[1fr_auto]">
          <select name="trackId" defaultValue={membership.team.trackId ?? ""} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
            <option value="" disabled>
              Select track for your team
            </option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name} ({track._count.teams}/{track.capacity})
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Save team track</button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {tracks.length === 0 && <p className="text-sm text-muted">No tracks created yet.</p>}
        {tracks.map((track) => (
          <article key={track.id} className="card p-5">
            <h2 className="text-lg font-semibold">{track.name}</h2>
            <p className="mt-1 text-xs text-muted">{track.code}</p>
            <p className="mt-3 text-sm text-muted">{track.description}</p>
            <p className="mt-3 text-sm">Teams assigned: <span className="pill">{track._count.teams}/{track.capacity}</span></p>
          </article>
        ))}
      </div>
    </section>
  );
}
