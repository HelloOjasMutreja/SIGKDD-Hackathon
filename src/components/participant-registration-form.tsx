"use client";

import { useMemo, useState, type FormEvent } from "react";
import { formFieldClass, formSelectClass, formTextareaClass } from "@/lib/utils";

type ParticipantRegistrationFormProps = {
  invite: string;
  action: (formData: FormData) => Promise<void>;
};

const STEPS = ["Account", "Academic", "Skills", "Final"] as const;

type RegistrationState = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  password: string;
  confirmPassword: string;
  gender: string;
  registerNumber: string;
  graduationYear: string;
  college: string;
  department: string;
  codingExperience: string;
  hackathonExperience: string;
  domains: string;
  githubUrl: string;
  linkedinUrl: string;
  tshirtSize: string;
  dietaryRestrictions: string;
  expectations: string;
};

const INITIAL_STATE: RegistrationState = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  password: "",
  confirmPassword: "",
  gender: "",
  registerNumber: "",
  graduationYear: "",
  college: "",
  department: "",
  codingExperience: "",
  hackathonExperience: "",
  domains: "",
  githubUrl: "",
  linkedinUrl: "",
  tshirtSize: "",
  dietaryRestrictions: "",
  expectations: "",
};

export function ParticipantRegistrationForm({ invite, action }: ParticipantRegistrationFormProps) {
  const [step, setStep] = useState(0);
  const [formState, setFormState] = useState<RegistrationState>(INITIAL_STATE);

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  function updateField(field: keyof RegistrationState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function goToNextStep() {
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  }

  function goToPreviousStep() {
    setStep((current) => Math.max(0, current - 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (step < STEPS.length - 1) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="mt-6 space-y-6">
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

      <section hidden={step !== 0} className="grid gap-3 md:grid-cols-2">
        <input name="fullName" required value={formState.fullName} onChange={(event) => updateField("fullName", event.target.value)} placeholder="Full Name *" className={formFieldClass} />
        <input name="email" required type="email" value={formState.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email *" className={formFieldClass} />
        <input name="phone" required value={formState.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Phone Number *" className={formFieldClass} />
        <input name="city" required value={formState.city} onChange={(event) => updateField("city", event.target.value)} placeholder="City *" className={formFieldClass} />
        <input name="password" required type="password" value={formState.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Password *" className={formFieldClass} />
        <input name="confirmPassword" required type="password" value={formState.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} placeholder="Confirm Password *" className={formFieldClass} />
        <select name="gender" required value={formState.gender} onChange={(event) => updateField("gender", event.target.value)} className={`${formSelectClass} md:col-span-2`}>
          <option value="">Gender *</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </section>

      <section hidden={step !== 1} className="grid gap-3 md:grid-cols-2">
        <input name="registerNumber" required value={formState.registerNumber} onChange={(event) => updateField("registerNumber", event.target.value)} placeholder="Register Number (RA + 13 digits) *" className={formFieldClass} />
        <select name="graduationYear" required value={formState.graduationYear} onChange={(event) => updateField("graduationYear", event.target.value)} className={formSelectClass}>
          <option value="">Graduation Year *</option>
          <option value="2027">2027</option>
          <option value="2028">2028</option>
          <option value="2029">2029</option>
        </select>
        <input name="college" required value={formState.college} onChange={(event) => updateField("college", event.target.value)} placeholder="College / Institution *" className={`${formFieldClass} md:col-span-2`} />
        <input name="department" required value={formState.department} onChange={(event) => updateField("department", event.target.value)} placeholder="Department / Branch *" className={`${formFieldClass} md:col-span-2`} />
      </section>

      <section hidden={step !== 2} className="grid gap-3 md:grid-cols-2">
        <select name="codingExperience" required value={formState.codingExperience} onChange={(event) => updateField("codingExperience", event.target.value)} className={formSelectClass}>
          <option value="">Coding Experience *</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <select name="hackathonExperience" required value={formState.hackathonExperience} onChange={(event) => updateField("hackathonExperience", event.target.value)} className={formSelectClass}>
          <option value="">Hackathon Experience *</option>
          <option value="First time">First time</option>
          <option value="1-2 hackathons">1-2 hackathons</option>
          <option value="3+ hackathons">3+ hackathons</option>
        </select>
        <input name="domains" required value={formState.domains} onChange={(event) => updateField("domains", event.target.value)} placeholder="Preferred domains (AI, Web, Systems...) *" className={`${formFieldClass} md:col-span-2`} />
        <input name="githubUrl" required value={formState.githubUrl} onChange={(event) => updateField("githubUrl", event.target.value)} placeholder="GitHub Profile URL *" className={formFieldClass} />
        <input name="linkedinUrl" required value={formState.linkedinUrl} onChange={(event) => updateField("linkedinUrl", event.target.value)} placeholder="LinkedIn Profile URL *" className={formFieldClass} />
      </section>

      <section hidden={step !== 3} className="grid gap-3 md:grid-cols-2">
        <select name="tshirtSize" required value={formState.tshirtSize} onChange={(event) => updateField("tshirtSize", event.target.value)} className={formSelectClass}>
          <option value="">T-shirt Size *</option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
        </select>
        <input name="dietaryRestrictions" value={formState.dietaryRestrictions} onChange={(event) => updateField("dietaryRestrictions", event.target.value)} placeholder="Dietary restrictions (optional)" className={formFieldClass} />
        <textarea name="expectations" required value={formState.expectations} onChange={(event) => updateField("expectations", event.target.value)} rows={4} placeholder="What do you want to build or learn in this hackathon? *" className={`${formTextareaClass} md:col-span-2`} />
        <input type="hidden" name="invite" value={invite} />
      </section>

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={goToPreviousStep}
          disabled={step === 0}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goToNextStep}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Next Step
          </button>
        ) : (
          <button type="submit" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Register and continue</button>
        )}
      </div>
    </form>
  );
}
