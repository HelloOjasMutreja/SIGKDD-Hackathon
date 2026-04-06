import { requireOrganizer } from "@/lib/guards";

export default async function OrgPendingPage() {
  const user = await requireOrganizer();

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-8">
          <h1 className="text-2xl font-bold text-[#17324d]">Approval Pending</h1>
          <p className="mt-3 text-sm text-[#4f647b]">
            Your request to join as {user.organizerProfile?.requestedRole?.replaceAll("_", " ")} is under review.
          </p>
          <p className="mt-2 text-sm text-[#4f647b]">You will gain organizer dashboard access once an admin approves your request.</p>
        </section>
      </main>
    </div>
  );
}
