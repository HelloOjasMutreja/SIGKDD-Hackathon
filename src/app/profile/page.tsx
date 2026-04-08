import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ParticipantShell } from "@/components/participant-shell";
import { TeamStatus } from "@/lib/domain";
import { getParticipantTeamState, requireParticipant } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formFieldClass, formSuccessClass, getFormErrorMessage, isValidPhoneNumber, normalizeFormValue, normalizePhoneNumber } from "@/lib/utils";

async function saveProfile(formData: FormData) {
  "use server";
  const user = await requireParticipant();
  const teamState = await getParticipantTeamState(user.id);

  if (teamState.teamStatus && teamState.teamStatus !== TeamStatus.DRAFT) {
    redirect("/profile?error=locked");
  }

  const fullName = normalizeFormValue(formData.get("fullName"));
  const phone = normalizePhoneNumber(formData.get("phone"));
  const college = normalizeFormValue(formData.get("college"));
  const graduationYear = normalizeFormValue(formData.get("graduationYear"));
  const department = normalizeFormValue(formData.get("department"));

  if (!fullName) {
    redirect("/profile?error=missing_full_name");
  }

  if (!phone) {
    redirect("/profile?error=missing_phone");
  }

  if (!isValidPhoneNumber(phone)) {
    redirect("/profile?error=invalid_phone");
  }

  if (!college) {
    redirect("/profile?error=missing_college");
  }

  if (!graduationYear) {
    redirect("/profile?error=missing_graduation_year");
  }

  if (!department) {
    redirect("/profile?error=missing_department");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName,
      phone,
    },
  });

  await prisma.participantProfile.update({
    where: { userId: user.id },
    data: {
      college,
      graduationYear: Number(graduationYear),
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
  const teamState = await getParticipantTeamState(user.id);
  const team = teamState.teamId
    ? await prisma.team.findUnique({ where: { id: teamState.teamId }, include: { leader: true } })
    : null;
  const isLocked = Boolean(team && team.status !== TeamStatus.DRAFT);
  const params = await searchParams;
  const error = String(params.error ?? "");
  const identity = {
    initials: user.fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase() ?? "")
      .join("") || "P",
    roleLabel: teamState.state === "approved" && team?.leaderId === user.id ? "Team Leader" : teamState.state === "approved" ? "Team Member" : teamState.state === "pending" ? "Join Pending" : "Participant",
    displayName: user.fullName,
  };

  const errorMessage = getFormErrorMessage(error, {
    locked: "Details locked after team confirmation.",
    missing_full_name: "Please enter your full name.",
    missing_phone: "Please enter your phone number.",
    invalid_phone: "Enter a valid 10 digit phone number.",
    missing_college: "Please enter your college or institution.",
    missing_graduation_year: "Please choose your graduation year.",
    missing_department: "Please enter your department.",
  });

  return (
    <ParticipantShell identity={identity}>
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Profile</h1>
          <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">{isLocked ? "Locked after confirmation" : "Editable while team is draft"}</span>
        </div>
        {String(params.saved ?? "") === "1" && <p className={formSuccessClass}>Profile saved.</p>}
        {error && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</p>}
        {isLocked && <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Details locked after team confirmation.</p>}

        <form action={saveProfile} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">
            <span>Full Name *</span>
            <input name="fullName" required defaultValue={user.fullName} disabled={isLocked} className={formFieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            <span>Email</span>
            <input defaultValue={user.email} disabled className={formFieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            <span>Phone *</span>
            <input name="phone" required inputMode="numeric" pattern="\\d{10}" maxLength={10} defaultValue={user.phone ?? ""} disabled={isLocked} placeholder="10 digit phone number" className={formFieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            <span>Graduation Year *</span>
            <select name="graduationYear" required defaultValue={user.participant?.graduationYear?.toString() ?? ""} disabled={isLocked} className={formFieldClass}>
              <option value="">Select year</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium md:col-span-2">
            <span>College *</span>
            <input name="college" required defaultValue={user.participant?.college ?? ""} disabled={isLocked} placeholder="College or institution" className={formFieldClass} />
          </label>
          <label className="grid gap-1 text-sm font-medium md:col-span-2">
            <span>Department *</span>
            <input name="department" required defaultValue={user.participant?.department ?? ""} disabled={isLocked} placeholder="Department or branch" className={formFieldClass} />
          </label>
          <div className="md:col-span-2">
            <FormSubmitButton pendingLabel="Saving..." disabled={isLocked} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
              Save Profile
            </FormSubmitButton>
          </div>
        </form>
      </section>
    </ParticipantShell>
  );
}