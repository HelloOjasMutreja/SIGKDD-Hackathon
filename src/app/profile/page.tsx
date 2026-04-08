import { redirect } from "next/navigation";
import { ParticipantShell } from "@/components/participant-shell";
import { prisma } from "@/lib/prisma";
import { requireParticipant } from "@/lib/guards";
import { formFieldClass, formSuccessClass, normalizeFormValue } from "@/lib/utils";

async function saveProfile(formData: FormData) {
  "use server";
  const user = await requireParticipant();

  const phone = normalizeFormValue(formData.get("phone"));
  const college = normalizeFormValue(formData.get("college"));
  const department = normalizeFormValue(formData.get("department"));

  if (!phone) {
    redirect("/profile?error=missing_phone");
  }

  if (!college) {
    redirect("/profile?error=missing_college");
  }

  if (!department) {
    redirect("/profile?error=missing_department");
  }

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
  const error = String(params.error ?? "");

  return (
    <ParticipantShell>
      <section className="card p-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        {String(params.saved ?? "") === "1" && <p className={formSuccessClass}>Profile saved.</p>}
        {error === "missing_phone" && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Please enter your phone number.</p>}
        {error === "missing_college" && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Please enter your college or institution.</p>}
        {error === "missing_department" && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Please enter your department.</p>}
        <form action={saveProfile} className="mt-4 grid gap-3 md:grid-cols-2">
          <input defaultValue={user.fullName} disabled className={formFieldClass} />
          <input defaultValue={user.email} disabled className={formFieldClass} />
          <label className="grid gap-1 text-sm font-medium">
            <span>Phone *</span>
            <input name="phone" required defaultValue={user.phone ?? ""} placeholder="Phone number" className={formFieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            <span>College *</span>
            <input name="college" required defaultValue={user.participant?.college ?? ""} placeholder="College or institution" className={formFieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium md:col-span-2">
            <span>Department *</span>
            <input name="department" required defaultValue={user.participant?.department ?? ""} placeholder="Department or branch" className={formFieldClass} />
          </label>
          <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white md:col-span-2">Save Profile</button>
        </form>
      </section>
    </ParticipantShell>
  );
}
