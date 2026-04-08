import { OrganizerApprovedRole, UserRole } from "@/lib/domain";
import { revalidatePath } from "next/cache";
import { OrganizerShell } from "@/components/organizer-shell";
import { requireApprovedOrganizer } from "@/lib/guards";
import { hasOrgRole } from "@/lib/org-access";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formErrorClass, formFieldClass, getFormErrorMessage, normalizeFormValue } from "@/lib/utils";

async function createTrack(formData: FormData) {
  "use server";
  const user = await requireApprovedOrganizer();

  if (!hasOrgRole(user.role, user.organizerProfile?.approvedRole ?? null, [UserRole.ADMIN, OrganizerApprovedRole.TECHNICAL_LEAD])) {
    return;
  }

  const name = normalizeFormValue(formData.get("name"));
  const description = normalizeFormValue(formData.get("description"));

  if (!name) {
    redirect("/organizer/admin/tracks?error=missing_name");
  }

  if (!description) {
    redirect("/organizer/admin/tracks?error=missing_description");
  }

  if (!name || !description) {
    redirect("/organizer/admin/tracks?error=missing_required");
  }

  await prisma.track.create({
    data: {
      name,
      description,
      createdBy: user.id,
    },
  });

  revalidatePath("/org/admin/tracks");
  revalidatePath("/organizer/admin/tracks");
}

async function toggleTrack(formData: FormData) {
  "use server";
  const user = await requireApprovedOrganizer();

  if (!hasOrgRole(user.role, user.organizerProfile?.approvedRole ?? null, [UserRole.ADMIN, OrganizerApprovedRole.TECHNICAL_LEAD])) {
    return;
  }

  const trackId = String(formData.get("trackId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "1";

  if (!trackId) {
    redirect("/organizer/admin/tracks?error=missing_track_id");
  }

  await prisma.track.update({
    where: { id: trackId },
    data: { isActive: !isActive },
  });

  revalidatePath("/org/admin/tracks");
  revalidatePath("/organizer/admin/tracks");
}

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrganizerTracksPage({ searchParams }: SearchProps) {
  const user = await requireApprovedOrganizer();
  const params = await searchParams;
  const error = String(params.error ?? "");

  if (!hasOrgRole(user.role, user.organizerProfile?.approvedRole ?? null, [UserRole.ADMIN, OrganizerApprovedRole.TECHNICAL_LEAD])) {
    return (
      <OrganizerShell>
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Track Management</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Only Admin and Technical Lead can manage tracks.</p>
        </section>
      </OrganizerShell>
    );
  }

  const tracks = await prisma.track.findMany({ orderBy: { createdAt: "desc" } });
  const errorMessage = getFormErrorMessage(error, {
    missing_name: "Please enter a track name.",
    missing_description: "Please enter a track description.",
    missing_required: "Please enter both a track name and a track description.",
    missing_track_id: "Track id is required.",
  });

  return (
    <OrganizerShell>
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Tracks</h1>
          {error && <p className={formErrorClass}>{errorMessage}</p>}
          <form action={createTrack} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-[#17324d]">
              <span>Track Name *</span>
              <input name="name" required placeholder="Enter track name" className={formFieldClass} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[#17324d]">
              <span>Track Description *</span>
              <input name="description" required placeholder="Enter track description" className={formFieldClass} />
            </label>
            <button className="rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white md:col-span-2">Create Track</button>
          </form>
        </div>

        <div className="grid gap-4">
          {tracks.map((track) => (
            <article key={track.id} className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
              <p className="font-semibold text-[#17324d]">{track.name}</p>
              <p className="mt-1 text-sm text-[#4f647b]">{track.description}</p>
              <p className="mt-2 text-sm">Active: {track.isActive ? "Yes" : "No"}</p>
              <form action={toggleTrack} className="mt-3">
                <input type="hidden" name="trackId" value={track.id} />
                <input type="hidden" name="isActive" value={track.isActive ? "1" : "0"} />
                <button className="rounded-lg border border-[#cdd8e5] px-3 py-1.5 text-xs font-semibold">{track.isActive ? "Deactivate" : "Activate"}</button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </OrganizerShell>
  );
}

