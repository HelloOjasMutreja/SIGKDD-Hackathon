import { ApprovalStatus, OrganizerApprovedRole, UserRole } from "@/lib/domain";
import { revalidatePath } from "next/cache";
import { OrganizerShell } from "@/components/organizer-shell";
import { requireApprovedOrganizer } from "@/lib/guards";
import { hasOrgRole } from "@/lib/org-access";
import { prisma } from "@/lib/prisma";

async function approveOrganizer(formData: FormData) {
  "use server";
  const actor = await requireApprovedOrganizer();

  if (!hasOrgRole(actor.role, actor.organizerProfile?.approvedRole ?? null, [UserRole.ADMIN, OrganizerApprovedRole.CORE_ORGANIZER])) {
    return;
  }

  const profileId = String(formData.get("profileId") ?? "");
  const role = String(formData.get("role") ?? "CORE_ORGANIZER") as OrganizerApprovedRole;

  const target = await prisma.organizerProfile.findUnique({ where: { id: profileId } });
  if (!target) {
    return;
  }

  await prisma.organizerProfile.update({
    where: { id: profileId },
    data: {
      status: ApprovalStatus.APPROVED,
      approvedRole: role,
      approvedBy: actor.id,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  });

  await prisma.user.update({
    where: { id: target.userId },
    data: { role: "ORGANIZER" },
  });

  revalidatePath("/org/admin/approvals");
  revalidatePath("/organizer/admin/approvals");
}

async function rejectOrganizer(formData: FormData) {
  "use server";
  const actor = await requireApprovedOrganizer();

  if (!hasOrgRole(actor.role, actor.organizerProfile?.approvedRole ?? null, [UserRole.ADMIN, OrganizerApprovedRole.CORE_ORGANIZER])) {
    return;
  }

  const profileId = String(formData.get("profileId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  await prisma.organizerProfile.update({
    where: { id: profileId },
    data: {
      status: ApprovalStatus.REJECTED,
      rejectionReason: reason || null,
      approvedBy: actor.id,
      approvedAt: new Date(),
    },
  });

  revalidatePath("/org/admin/approvals");
  revalidatePath("/organizer/admin/approvals");
}

export default async function OrganizerApprovalsPage() {
  const user = await requireApprovedOrganizer();

  if (!hasOrgRole(user.role, user.organizerProfile?.approvedRole ?? null, [UserRole.ADMIN, OrganizerApprovedRole.CORE_ORGANIZER])) {
    return (
      <OrganizerShell>
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Organizer Approvals</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Only Admin and Core Organizer can access approvals.</p>
        </section>
      </OrganizerShell>
    );
  }

  const pending = await prisma.organizerProfile.findMany({
    where: { status: ApprovalStatus.PENDING },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <OrganizerShell>
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Organizer Approvals</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Approve or reject pending organizer requests.</p>
        </div>

        <div className="grid gap-4">
          {pending.length === 0 && <p className="rounded-2xl border border-[#cdd8e5] bg-white p-6 text-sm text-[#4f647b]">No pending requests.</p>}
          {pending.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
              <p className="font-semibold text-[#17324d]">{item.user.fullName} ({item.user.email})</p>
              <p className="mt-1 text-sm text-[#4f647b]">Requested Role: {item.requestedRole.replaceAll("_", " ")}</p>
              <p className="mt-1 text-sm text-[#4f647b]">Reason: {item.reasonForJoining}</p>

              <div className="mt-4 flex flex-wrap gap-3">
                <form action={approveOrganizer} className="flex gap-2">
                  <input type="hidden" name="profileId" value={item.id} />
                  <select name="role" defaultValue={item.requestedRole as unknown as OrganizerApprovedRole} className="rounded-lg border border-[#cdd8e5] px-2 py-1 text-sm">
                    {Object.values(OrganizerApprovedRole).map((role) => (
                      <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <button className="rounded-lg bg-[#17324d] px-3 py-1.5 text-xs font-semibold text-white">Approve</button>
                </form>

                <form action={rejectOrganizer} className="flex gap-2">
                  <input type="hidden" name="profileId" value={item.id} />
                  <input name="reason" placeholder="Optional rejection reason" className="rounded-lg border border-[#cdd8e5] px-2 py-1 text-sm" />
                  <button className="rounded-lg border border-[#cdd8e5] px-3 py-1.5 text-xs font-semibold">Reject</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>
    </OrganizerShell>
  );
}

