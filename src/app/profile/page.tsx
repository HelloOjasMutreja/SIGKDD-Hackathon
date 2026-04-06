import { redirect } from "next/navigation";
import { ParticipantShell } from "@/components/participant-shell";
import { prisma } from "@/lib/prisma";
import { requireParticipant } from "@/lib/guards";

async function saveProfile(formData: FormData) {
  "use server";
  const user = await requireParticipant();

  const phone = String(formData.get("phone") ?? "").trim();
  const college = String(formData.get("college") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();

  await prisma.user.update({
    where: { id: user.id },
    data: { phone },
  });

  await prisma.participantProfile.update({
    where: { userId: user.id },
    data: {
      college,
      department,
    },
  });

  redirect("/profile?saved=1");
}

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: SearchProps) {
  const user = await requireParticipant();
  const params = await searchParams;

  return (
    <ParticipantShell>
      <section className="card p-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        {String(params.saved ?? "") === "1" && <p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Profile saved.</p>}
        <form action={saveProfile} className="mt-4 grid gap-3 md:grid-cols-2">
          <input defaultValue={user.fullName} disabled className="rounded-xl border border-border bg-gray-100 px-3 py-2 text-sm" />
          <input defaultValue={user.email} disabled className="rounded-xl border border-border bg-gray-100 px-3 py-2 text-sm" />
          <input name="phone" defaultValue={user.phone ?? ""} placeholder="Phone" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input name="college" defaultValue={user.participant?.college ?? ""} placeholder="College" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input name="department" defaultValue={user.participant?.department ?? ""} placeholder="Department" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2" />
          <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white md:col-span-2">Save Profile</button>
        </form>
      </section>
    </ParticipantShell>
  );
}
