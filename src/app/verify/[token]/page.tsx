import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function VerifyTeamPage({ params }: PageProps) {
  const { token } = await params;

  const team = await prisma.team.findFirst({
    where: { qrToken: token },
    include: {
      leader: true,
      members: {
        where: { status: "APPROVED" },
        include: { user: { include: { participant: true } } },
      },
      track: true,
    },
  });

  if (!team) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Invalid QR Token</h1>
          <p className="mt-2 text-sm text-muted">This verification link is invalid or expired.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <section className="card p-6">
        <h1 className="text-2xl font-bold">Team Verification</h1>
        <p className="mt-2 text-sm text-muted">Verified team from QR token.</p>
        <div className="mt-4 grid gap-2 text-sm">
          <p><strong>Team:</strong> {team.name}</p>
          <p><strong>Leader:</strong> {team.leader.fullName}</p>
          <p><strong>Track:</strong> {team.track?.name ?? "Not selected"}</p>
          <p><strong>Status:</strong> {team.status}</p>
        </div>
        <h2 className="mt-5 text-lg font-semibold">Members</h2>
        <ul className="mt-2 grid gap-2">
          {team.members.map((m: any) => (
            <li key={m.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
              {m.user.fullName} - {m.user.participant?.registerNumber ?? "N/A"}
            </li>
          ))}
        </ul>
        <Link href="/org/checkin" className="mt-5 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">Go to Check-in</Link>
      </section>
    </main>
  );
}
