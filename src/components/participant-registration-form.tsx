"use client";

import { useMemo, useState } from "react";

type ParticipantRegistrationFormProps = {
  invite: string;
  action: (formData: FormData) => Promise<void>;
};

const STEPS = ["Account", "Academic", "Skills", "Final"] as const;

export function ParticipantRegistrationForm({ invite, action }: ParticipantRegistrationFormProps) {
  const [step, setStep] = useState(0);

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  return (
    <form action={action} className="mt-6 space-y-6">
      <div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm font-semibold">{STEPS[step]}</p>
      </div>

      {step === 0 && (
        <section className="grid gap-3 md:grid-cols-2">
          <input name="fullName" required placeholder="Full Name" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="Email" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input name="phone" required placeholder="Phone Number" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input name="city" required placeholder="City" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input name="password" type="password" required placeholder="Password" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input name="confirmPassword" type="password" required placeholder="Confirm Password" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <select name="gender" required className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2">
            <option value="">Gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </section>
      )}

      {step === 1 && (
        <section className="grid gap-3 md:grid-cols-2">
          <input name="registerNumber" required placeholder="Register Number (RA + 13 digits)" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <select name="graduationYear" required className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
            <option value="">Graduation Year</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
            <option value="2029">2029</option>
          </select>
          <input name="college" required placeholder="College / Institution" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2" />
          <input name="department" required placeholder="Department / Branch" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2" />
        </section>
      )}

      {step === 2 && (
        <section className="grid gap-3 md:grid-cols-2">
          <select name="codingExperience" required className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
            <option value="">Coding Experience</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <select name="hackathonExperience" required className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
            <option value="">Hackathon Experience</option>
            <option value="First time">First time</option>
            <option value="1-2 hackathons">1-2 hackathons</option>
            <option value="3+ hackathons">3+ hackathons</option>
          </select>
          <input name="domains" required placeholder="Preferred domains (AI, Web, Systems...)" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2" />
          <input name="githubUrl" placeholder="GitHub Profile URL" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input name="linkedinUrl" placeholder="LinkedIn Profile URL" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
        </section>
      )}

      {step === 3 && (
        <section className="grid gap-3 md:grid-cols-2">
          <select name="tshirtSize" required className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
            <option value="">T-shirt Size</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>
          <input name="dietaryRestrictions" placeholder="Dietary restrictions (optional)" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <textarea name="expectations" required rows={4} placeholder="What do you want to build or learn in this hackathon?" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2" />
          <input type="hidden" name="invite" value={invite} />
        </section>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Next Step
          </button>
        ) : (
          <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Register and continue</button>
        )}
      </div>
    </form>
  );
}
