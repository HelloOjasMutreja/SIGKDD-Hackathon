import { redirect } from "next/navigation";
import { OrganizerApprovedRole, UserRole } from "@/lib/domain";
import { OrganizerShell } from "@/components/organizer-shell";
import { requireApprovedOrganizer } from "@/lib/guards";
import { hasOrgRole } from "@/lib/org-access";
import { prisma } from "@/lib/prisma";
import { formErrorClass, formFieldClass, formSuccessClass, getFormErrorMessage, normalizeFormValue } from "@/lib/utils";

async function markCheckin(formData: FormData) {
  "use server";
  const user = await requireApprovedOrganizer();
  const approvedRole = user.organizerProfile?.approvedRole ?? null;

  const allowed = hasOrgRole(user.role, approvedRole, [UserRole.ADMIN, OrganizerApprovedRole.LOGISTICS, OrganizerApprovedRole.VOLUNTEER]);
  if (!allowed) {
    return;
  }

  const teamCode = normalizeFormValue(formData.get("teamCode")).toUpperCase();
  if (!teamCode) {
    redirect("/organizer/checkin?error=missing_team_code");
  }

  const team = await prisma.team.findFirst({ where: { code: teamCode } });
  if (!team) {
    redirect("/organizer/checkin?error=invalid_team_code");
  }

  const already = await prisma.checkin.findFirst({ where: { teamId: team.id } });
  if (already) {
    redirect("/organizer/checkin?error=already_checkedin");
  }

  await prisma.checkin.create({
    data: {
      teamId: team.id,
      checkedInBy: user.id,
    },
  });

  redirect(`/organizer/checkin?success=${team.name}`);
}

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrgCheckinPage({ searchParams }: SearchProps) {
  const user = await requireApprovedOrganizer();
  const approvedRole = user.organizerProfile?.approvedRole ?? null;

  const allowed = hasOrgRole(user.role, approvedRole, [UserRole.ADMIN, OrganizerApprovedRole.LOGISTICS, OrganizerApprovedRole.VOLUNTEER]);
  if (!allowed) {
    return (
      <OrganizerShell>
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Check-in</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Access restricted to Admin, Logistics, and Volunteer roles.</p>
        </section>
      </OrganizerShell>
    );
  }

  const params = await searchParams;
  const error = String(params.error ?? "");
  const success = String(params.success ?? "");
  const errorMessage = getFormErrorMessage(error, {
    missing_team_code: "Please enter a team code.",
    invalid_team_code: "Please enter a valid team code.",
    already_checkedin: "This team has already been checked in.",
  });

  const recent = await prisma.checkin.findMany({
    include: { team: true, actor: true },
    orderBy: { checkedInAt: "desc" },
    take: 25,
  });

  return (
    <OrganizerShell>
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Manual Check-in</h1>
          <p className="mt-1 text-sm text-[#4f647b]">Enter the 6-character team code to mark attendance.</p>
          {error && <p className={formErrorClass}>{errorMessage}</p>}
          {success && <p className={formSuccessClass}>Checked in team: {success}</p>}
          <form action={markCheckin} className="mt-4 flex gap-3">
            <label className="grid flex-1 gap-1 text-sm font-medium">
              <span>Team Code *</span>
              <input name="teamCode" required maxLength={6} placeholder="HX92KL" className={`${formFieldClass} uppercase`} />
            </label>
            <button className="rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white">Mark Checked-In</button>
          </form>
        </div>

        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#17324d]">Recent Check-ins</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#dde6f0]">
                  <th className="py-2">Team</th>
                  <th className="py-2">Checked In By</th>
                  <th className="py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id} className="border-b border-[#eef3f8]">
                    <td className="py-2">{item.team.name}</td>
                    <td className="py-2">{item.actor.fullName}</td>
                    <td className="py-2">{item.checkedInAt.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </OrganizerShell>
  );
}

