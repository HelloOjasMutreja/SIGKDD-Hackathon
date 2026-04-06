import { revalidatePath } from "next/cache";
import { CheckInMethod, RegistrationStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrRedirect } from "@/lib/current-user";

async function checkInParticipant(formData: FormData) {
  "use server";

  const operator = await getCurrentUserOrRedirect();
  if (operator.role !== Role.SUPER_ADMIN && operator.role !== Role.CHECKIN_STAFF) {
    return;
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const method = String(formData.get("method") ?? "BADGE_LOOKUP") as CheckInMethod;
  const notes = String(formData.get("notes") ?? "").trim();

  const participant = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!participant || !participant.profile) {
    return;
  }

  if (
    participant.profile.registrationStatus !== RegistrationStatus.SUBMITTED &&
    participant.profile.registrationStatus !== RegistrationStatus.APPROVED
  ) {
    return;
  }

  const duplicate = await prisma.checkIn.findFirst({ where: { userId: participant.id } });
  if (duplicate) {
    return;
  }

  await prisma.checkIn.create({
    data: {
      userId: participant.id,
      method,
      notes: notes || null,
      scannedById: operator.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: operator.id,
      action: "CHECKIN_CREATE",
      entityType: "CheckIn",
      entityId: participant.id,
      payload: JSON.stringify({ email, method }),
    },
  });

  revalidatePath("/check-in");
  revalidatePath("/admin");
}

export default async function CheckInPage() {
  const user = await getCurrentUserOrRedirect();

  if (user.role !== Role.SUPER_ADMIN && user.role !== Role.CHECKIN_STAFF) {
    return (
      <section className="card p-6">
        <h1 className="text-2xl font-bold">Event Check-In</h1>
        <p className="mt-2 text-sm text-muted">Only Super Admin and Check-in Staff can access this page.</p>
      </section>
    );
  }

  const recent = await prisma.checkIn.findMany({
    include: { user: true },
    orderBy: { checkedInAt: "desc" },
    take: 20,
  });

  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Event Check-In</h1>
        <p className="mt-2 text-sm text-muted">Check in attendees using QR or manual badge lookup fallback.</p>
      </div>

      <form action={checkInParticipant} className="card grid gap-3 p-6 md:grid-cols-2">
        <input name="email" type="email" required placeholder="Participant email" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
        <select name="method" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
          <option value={CheckInMethod.QR}>QR</option>
          <option value={CheckInMethod.BADGE_LOOKUP}>BADGE_LOOKUP</option>
        </select>
        <input name="notes" placeholder="Notes (optional)" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2" />
        <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white md:col-span-2">Check in participant</button>
      </form>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Recent check-ins</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2">Participant</th>
                <th className="py-2">Email</th>
                <th className="py-2">Method</th>
                <th className="py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((item) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-2">{item.user.fullName}</td>
                  <td className="py-2">{item.user.email}</td>
                  <td className="py-2">{item.method}</td>
                  <td className="py-2">{item.checkedInAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
