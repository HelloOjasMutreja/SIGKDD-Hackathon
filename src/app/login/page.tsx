import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setParticipantSession } from "@/lib/auth";
import { getParticipantTeamState } from "@/lib/guards";
import { hashPassword } from "@/lib/security";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function participantLogin(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "PARTICIPANT" || user.passwordHash !== hashPassword(password)) {
    redirect("/login?error=invalid_credentials");
  }

  await setParticipantSession({ userId: user.id, role: user.role });

  const state = await getParticipantTeamState(user.id);
  if (state.state === "approved") {
    redirect("/dashboard");
  }
  if (state.state === "pending") {
    redirect("/team-setup/pending");
  }

  redirect("/team-setup");
}

export default async function LoginPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const error = String(params.error ?? "");

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-xl px-6 py-16">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Participant Login</h1>
          <p className="mt-1 text-sm text-muted">Login to continue your registration journey.</p>
          {error && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Invalid credentials.</p>}
          <form action={participantLogin} className="mt-5 grid gap-3">
            <input name="email" type="email" required placeholder="Email" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
            <input name="password" type="password" required placeholder="Password" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Login</button>
          </form>
          <p className="mt-4 text-sm text-muted">No account? <Link href="/register" className="text-accent">Register now</Link></p>
        </section>
      </main>
    </div>
  );
}
