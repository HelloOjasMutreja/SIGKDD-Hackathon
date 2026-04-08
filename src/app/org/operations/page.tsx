import { OrganizerShell } from "@/components/organizer-shell";
import { requireApprovedOrganizer } from "@/lib/guards";
import { canUseOrganizerCapability } from "@/lib/org-access";
import { prisma } from "@/lib/prisma";
import { ScanEventType } from "@/lib/domain";

export default async function OrganizerOperationsPage() {
  const user = await requireApprovedOrganizer();
  const approvedRole = user.organizerProfile?.approvedRole ?? null;
  const allowed = canUseOrganizerCapability(user.role, approvedRole, "scanner:use");

  if (!allowed) {
    return (
      <OrganizerShell>
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Operations</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Access restricted to operational organizer roles.</p>
        </section>
      </OrganizerShell>
    );
  }

  const [checkins, mealEvents] = await Promise.all([
    prisma.checkin.findMany({
      include: { team: true, actor: true },
      orderBy: { checkedInAt: "desc" },
      take: 25,
    }),
    prisma.scanEvent.findMany({
      where: { eventType: ScanEventType.MEAL },
      include: { team: true, actor: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  return (
    <OrganizerShell>
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Operations</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Attendance logs and meal distribution logs for the hackathon floor.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#17324d]">Attendance Logs</h2>
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
                  {checkins.map((item: { id: string; team: { name: string }; actor: { fullName: string }; checkedInAt: Date }) => (
                    <tr key={item.id} className="border-b border-[#eef3f8]">
                      <td className="py-2">{item.team.name}</td>
                      <td className="py-2">{item.actor.fullName}</td>
                      <td className="py-2">{item.checkedInAt.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#17324d]">Meal Distribution Logs</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#dde6f0]">
                    <th className="py-2">Team</th>
                    <th className="py-2">Meal Slot</th>
                    <th className="py-2">Claimed By</th>
                    <th className="py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {mealEvents.map((item: { id: string; team: { name: string }; mealSlot?: string | null; actor: { fullName: string }; createdAt: Date }) => (
                    <tr key={item.id} className="border-b border-[#eef3f8]">
                      <td className="py-2">{item.team.name}</td>
                      <td className="py-2">{item.mealSlot ?? "-"}</td>
                      <td className="py-2">{item.actor.fullName}</td>
                      <td className="py-2">{item.createdAt.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </OrganizerShell>
  );
}
