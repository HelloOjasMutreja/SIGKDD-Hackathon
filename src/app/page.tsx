import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, RegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { clearSessionUser, getSessionUser, setSessionUser } from "@/lib/session";

async function enterPortal(formData: FormData) {
  "use server";

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const selectedRole = String(formData.get("role") ?? Role.PARTICIPANT) as Role;

  if (!fullName || !email) {
    return;
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { fullName, role: selectedRole },
    create: {
      fullName,
      email,
      role: selectedRole,
      profile:
        selectedRole === Role.PARTICIPANT
          ? {
              create: {
                registrationStatus: RegistrationStatus.DRAFT,
              },
            }
          : undefined,
    },
  });

  await setSessionUser({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });

  if (user.role === Role.PARTICIPANT) {
    await prisma.participantProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        registrationStatus: RegistrationStatus.DRAFT,
      },
    });
  }

  revalidatePath("/");
  redirect(user.role === Role.PARTICIPANT ? "/register" : "/admin");
}

async function signOut() {
  "use server";
  await clearSessionUser();
  revalidatePath("/");
  redirect("/");
}

export default async function Home() {
  const session = await getSessionUser();

  const [participantCount, teamCount, trackCount, checkedInCount] = await Promise.all([
    prisma.participantProfile.count(),
    prisma.team.count(),
    prisma.track.count(),
    prisma.checkIn.count(),
  ]);

  const stats = [
    { label: "Registered participants", value: participantCount },
    { label: "Teams formed", value: teamCount },
    { label: "Tracks configured", value: trackCount },
    { label: "Checked-in attendees", value: checkedInCount },
  ];

  return (
    <section className="space-y-8">
      <div className="card grid gap-6 p-8 md:grid-cols-2 md:items-end">
        <div>
          <p className="pill inline-block">Live platform</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">SIGKDD Hackathon Portal</h1>
          <p className="mt-3 max-w-xl text-muted">
            All modules are now connected to persistence. Use the access form to sign in as a participant
            or organizer role and start using the full workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <Link href="/register" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">
            Participant registration
          </Link>
          <Link href="/admin" className="rounded-full border border-border bg-surface-2 px-5 py-2.5 text-sm font-semibold">
            Admin workspace
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="card p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Portal Access</h2>
          <p className="mt-1 text-sm text-muted">Use email-based access to start testing every workflow.</p>
          <form action={enterPortal} className="mt-4 grid gap-3">
            <input
              name="fullName"
              required
              placeholder="Full name"
              className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
              defaultValue={session?.fullName}
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
              defaultValue={session?.email}
            />
            <select
              name="role"
              defaultValue={session?.role ?? Role.PARTICIPANT}
              className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
            >
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Enter portal</button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold">Current Session</h2>
          {session ? (
            <div className="mt-3 space-y-2 text-sm">
              <p>Name: {session.fullName}</p>
              <p>Email: {session.email}</p>
              <p>Role: {session.role}</p>
              <form action={signOut} className="pt-2">
                <button className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-semibold">Sign out</button>
              </form>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No active session. Create one using Portal Access.</p>
          )}
        </div>
      </section>
    </section>
  );
}
