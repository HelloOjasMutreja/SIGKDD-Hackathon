import { OrganizerShell } from "@/components/organizer-shell";
import { requireApprovedOrganizer } from "@/lib/guards";
import { canUseOrganizerCapability } from "@/lib/org-access";
import { QrScannerPanel } from "@/components/qr-scanner-panel";

export default async function OrganizerScannerPage() {
  const user = await requireApprovedOrganizer();
  const approvedRole = user.organizerProfile?.approvedRole ?? null;
  const allowed = canUseOrganizerCapability(user.role, approvedRole, "scanner:use");

  if (!allowed) {
    return (
      <OrganizerShell>
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">QR Scanner</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Access restricted to admin, core organizers, and check-in managers.</p>
        </section>
      </OrganizerShell>
    );
  }

  return (
    <OrganizerShell>
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">QR Scanner</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Scan team QR codes for event check-in or meal distribution.</p>
        </div>
        <QrScannerPanel />
      </section>
    </OrganizerShell>
  );
}
