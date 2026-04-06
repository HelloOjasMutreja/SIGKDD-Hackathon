import { revalidatePath } from "next/cache";
import { RegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrRedirect } from "@/lib/current-user";

async function saveRegistration(formData: FormData) {
  "use server";

  const user = await getCurrentUserOrRedirect();

  if (user.role !== "PARTICIPANT") {
    return;
  }

  const graduationYearValue = String(formData.get("graduationYear") ?? "").trim();
  const graduationYear = graduationYearValue ? Number(graduationYearValue) : null;

  await prisma.participantProfile.upsert({
    where: { userId: user.id },
    update: {
      phone: String(formData.get("phone") ?? "").trim() || null,
      institute: String(formData.get("institute") ?? "").trim() || null,
      graduationYear: graduationYear,
      city: String(formData.get("city") ?? "").trim() || null,
      country: String(formData.get("country") ?? "").trim() || null,
      emergencyContactName: String(formData.get("emergencyContactName") ?? "").trim() || null,
      emergencyContactPhone: String(formData.get("emergencyContactPhone") ?? "").trim() || null,
      consentDataUsage: formData.get("consentDataUsage") === "on",
      consentPhotography: formData.get("consentPhotography") === "on",
      consentCodeIpPolicy: formData.get("consentCodeIpPolicy") === "on",
      registrationStatus: RegistrationStatus.SUBMITTED,
    },
    create: {
      userId: user.id,
      phone: String(formData.get("phone") ?? "").trim() || null,
      institute: String(formData.get("institute") ?? "").trim() || null,
      graduationYear: graduationYear,
      city: String(formData.get("city") ?? "").trim() || null,
      country: String(formData.get("country") ?? "").trim() || null,
      emergencyContactName: String(formData.get("emergencyContactName") ?? "").trim() || null,
      emergencyContactPhone: String(formData.get("emergencyContactPhone") ?? "").trim() || null,
      consentDataUsage: formData.get("consentDataUsage") === "on",
      consentPhotography: formData.get("consentPhotography") === "on",
      consentCodeIpPolicy: formData.get("consentCodeIpPolicy") === "on",
      registrationStatus: RegistrationStatus.SUBMITTED,
    },
  });

  revalidatePath("/register");
  revalidatePath("/admin");
}

export default async function RegisterPage() {
  const user = await getCurrentUserOrRedirect();

  if (user.role !== "PARTICIPANT") {
    return (
      <section className="card p-6">
        <h1 className="text-2xl font-bold">Participant Registration</h1>
        <p className="mt-2 text-sm text-muted">This page is only for participant accounts. Switch role from the home page.</p>
      </section>
    );
  }

  const profile = await prisma.participantProfile.findUnique({ where: { userId: user.id } });

  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Participant Registration</h1>
        <p className="mt-2 text-sm text-muted">Complete this form to submit your registration profile.</p>
        <p className="mt-2 text-sm">Current status: <span className="pill">{profile?.registrationStatus ?? "DRAFT"}</span></p>
      </div>

      <form action={saveRegistration} className="card grid gap-4 p-6 md:grid-cols-2">
        <input name="phone" placeholder="Phone" defaultValue={profile?.phone ?? ""} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
        <input name="institute" placeholder="Institute" defaultValue={profile?.institute ?? ""} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
        <input name="graduationYear" type="number" placeholder="Graduation year" defaultValue={profile?.graduationYear ?? ""} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
        <input name="city" placeholder="City" defaultValue={profile?.city ?? ""} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
        <input name="country" placeholder="Country" defaultValue={profile?.country ?? ""} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
        <input name="emergencyContactName" placeholder="Emergency contact name" defaultValue={profile?.emergencyContactName ?? ""} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
        <input name="emergencyContactPhone" placeholder="Emergency contact phone" defaultValue={profile?.emergencyContactPhone ?? ""} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />

        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="consentDataUsage" defaultChecked={profile?.consentDataUsage ?? false} />
          I consent to data usage for event operations.
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="consentPhotography" defaultChecked={profile?.consentPhotography ?? false} />
          I consent to photography/video at the event.
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="consentCodeIpPolicy" defaultChecked={profile?.consentCodeIpPolicy ?? false} />
          I agree to hackathon code and IP policy.
        </label>

        <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white md:col-span-2">
          Save and submit registration
        </button>
      </form>
    </section>
  );
}
