import { ApprovalStatus, OrganizerApprovedRole } from "@/lib/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrganizerShell } from "@/components/organizer-shell";
import { requireApprovedOrganizer } from "@/lib/guards";
import { canUseOrganizerCapability } from "@/lib/org-access";
import { prisma } from "@/lib/prisma";
import { formFieldClass, formSelectClass } from "@/lib/utils";

async function updateRole(formData: FormData) {
  "use server";
  const actor = await requireApprovedOrganizer();
  if (!canUseOrganizerCapability(actor.role, actor.organizerProfile?.approvedRole ?? null, "roles:manage")) {
    return;
  }

  const profileId = String(formData.get("profileId") ?? "").trim();
  const approvedRole = String(formData.get("approvedRole") ?? "").trim() as OrganizerApprovedRole;
  const status = String(formData.get("status") ?? ApprovalStatus.APPROVED).trim() as ApprovalStatus;

  if (!profileId) {
    redirect("/organizer/roles?error=missing_profile_id");
  }

  if (!approvedRole) {
    redirect("/organizer/roles?error=missing_role");
  }

  await prisma.organizerProfile.update({
    where: { id: profileId },
    data: {
      approvedRole,
      status,
      approvedBy: actor.id,
      approvedAt: status === ApprovalStatus.APPROVED ? new Date() : null,
    },
  });

  revalidatePath("/organizer/roles");
  revalidatePath("/organizer/admin/approvals");
}

export default async function OrganizerRolesPage() {
  const user = await requireApprovedOrganizer();
  const approvedRole = user.organizerProfile?.approvedRole ?? null;
  const allowed = canUseOrganizerCapability(user.role, approvedRole, "roles:manage");

  if (!allowed) {
    return (
      <OrganizerShell>
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Role Management</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Access restricted to admins.</p>
        </section>
      </OrganizerShell>
    );
  }

  const organizers = await prisma.organizerProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <OrganizerShell>
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Role Management</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Assign hackathon operational roles to organizer accounts.</p>
        </div>

        <div className="grid gap-4">
          {organizers.map((item: { id: string; status: string; approvedRole?: string | null; requestedRole: string; user: { fullName: string; email: string } }) => (
            <article key={item.id} className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#17324d]">{item.user.fullName}</h2>
                  <p className="text-sm text-[#4f647b]">{item.user.email}</p>
                  <p className="mt-1 text-xs text-[#4f647b]">Current: {item.status} / {item.approvedRole ?? item.requestedRole}</p>
                </div>
                <span className="rounded-full border border-[#cdd8e5] px-3 py-1 text-xs font-semibold text-[#17324d]">Organizer</span>
              </div>

              <form action={updateRole} className="mt-4 grid gap-3 md:grid-cols-3">
                <input type="hidden" name="profileId" value={item.id} />
                <label className="grid gap-1 text-sm font-medium text-[#17324d]">
                  <span>Role *</span>
                  <select name="approvedRole" defaultValue={(item.approvedRole ?? item.requestedRole) as string} className={formSelectClass}>
                    {Object.values(OrganizerApprovedRole).map((role) => (
                      <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-medium text-[#17324d]">
                  <span>Status *</span>
                  <select name="status" defaultValue={item.status} className={formSelectClass}>
                    {Object.values(ApprovalStatus).map((option) => (
                      <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </label>
                <button className="rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white md:mt-6">Update Role</button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </OrganizerShell>
  );
}
