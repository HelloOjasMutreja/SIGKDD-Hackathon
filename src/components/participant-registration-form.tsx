"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { cn, formFieldClass, formSelectClass, formTextareaClass, isValidEmail, isValidPhoneNumber, isValidUrl, normalizePhoneNumber } from "@/lib/utils";

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

type RegistrationErrors = Partial<Record<keyof RegistrationState, string>>;

const REGISTRATION_STEPS: Array<Array<keyof RegistrationState>> = [
  ["fullName", "email", "phone", "city", "password", "confirmPassword", "gender"],
  ["registerNumber", "graduationYear", "college", "department"],
  ["codingExperience", "hackathonExperience", "domains", "githubUrl", "linkedinUrl"],
  ["tshirtSize", "dietaryRestrictions", "expectations"],
];

function getFieldError(field: keyof RegistrationState, values: RegistrationState): string {
  const value = values[field].trim();

  switch (field) {
    case "fullName":
      return value ? "" : "Enter your full name.";
    case "email":
      if (!value) return "Enter your email address.";
      return isValidEmail(value) ? "" : "Enter a valid email address.";
    case "phone":
      if (!value) return "Enter your phone number.";
      return isValidPhoneNumber(normalizePhoneNumber(value)) ? "" : "Enter a valid 10 digit phone number";
    case "city":
      return value ? "" : "Enter your city.";
    case "password":
      return value ? "" : "Enter a password.";
    case "confirmPassword":
      if (!value) return "Confirm your password.";
      return value === values.password ? "" : "Passwords do not match.";
    case "gender":
      return value ? "" : "Select your gender.";
    case "registerNumber":
      return /^RA\d{13}$/.test(value.toUpperCase()) ? "" : "Enter a valid register number in the format RA + 13 digits.";
    case "graduationYear":
      return ["2027", "2028", "2029"].includes(value) ? "" : "Choose a valid graduation year.";
    case "college":
      return value ? "" : "Enter your college or institution.";
    case "department":
      return value ? "" : "Enter your department or branch.";
    case "codingExperience":
      return value ? "" : "Select your coding experience.";
    case "hackathonExperience":
      return value ? "" : "Select your hackathon experience.";
    case "domains":
      return value ? "" : "Enter your preferred domains.";
    case "githubUrl":
      if (!value) return "Enter your GitHub profile URL.";
      return isValidUrl(value) ? "" : "Enter a valid GitHub profile URL.";
    case "linkedinUrl":
      if (!value) return "Enter your LinkedIn profile URL.";
      return isValidUrl(value) ? "" : "Enter a valid LinkedIn profile URL.";
    case "tshirtSize":
      return value ? "" : "Select your T-shirt size.";
    case "expectations":
      return value ? "" : "Tell us what you want to build or learn.";
    default:
      return "";
  }
}

function validateStep(stepIndex: number, values: RegistrationState): RegistrationErrors {
  const errors: RegistrationErrors = {};

  for (const field of REGISTRATION_STEPS[stepIndex]) {
    const message = getFieldError(field, values);
    if (message) {
      errors[field] = message;
    }
  }

  return errors;
}

function validateAll(values: RegistrationState): RegistrationErrors {
  const errors: RegistrationErrors = {};

  for (const step of REGISTRATION_STEPS) {
    for (const field of step) {
      const message = getFieldError(field, values);
      if (message) {
        errors[field] = message;
      }
    }
  }

  return errors;
}

export function ParticipantRegistrationForm({ invite, action }: ParticipantRegistrationFormProps) {
  const [step, setStep] = useState(0);
  const [formState, setFormState] = useState<RegistrationState>(INITIAL_STATE);
  const [errors, setErrors] = useState<RegistrationErrors>({});

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);
  const currentStepErrors = useMemo(() => validateStep(step, formState), [step, formState]);
  const canAdvance = Object.keys(currentStepErrors).length === 0;
  const canSubmit = Object.keys(validateAll(formState)).length === 0;

  useEffect(() => {
    setErrors(validateStep(step, formState));
  }, [step, formState]);

  function updateField(field: keyof RegistrationState, value: string) {
    const normalizedValue = field === "phone" ? value.replace(/\s+/g, "") : value;
    setFormState((current) => ({ ...current, [field]: normalizedValue }));
    setErrors((current) => {
      const next = { ...current };
      const preview = { ...formState, [field]: normalizedValue };
      const message = getFieldError(field, preview);
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  function goToNextStep() {
    const nextErrors = validateStep(step, formState);
    setErrors((current) => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length === 0) {
      setStep((current) => Math.min(STEPS.length - 1, current + 1));
    }
  }

  function goToPreviousStep() {
    setStep((current) => Math.max(0, current - 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (step < STEPS.length - 1) {
      event.preventDefault();
      goToNextStep();
      return;
    }

    const nextErrors = validateAll(formState);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  }

  function fieldClass(field: keyof RegistrationState, baseClass: string) {
    return cn(baseClass, errors[field] && "border-red-300 focus:border-red-500 focus:ring-red-200");
  }

  function renderFieldError(field: keyof RegistrationState) {
    return errors[field] ? <p className="text-xs text-red-700">{errors[field]}</p> : null;
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
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>Full Name *</span>
          <input name="fullName" required value={formState.fullName} onChange={(event) => updateField("fullName", event.target.value)} placeholder="Full Name *" className={fieldClass("fullName", formFieldClass)} />
          {renderFieldError("fullName")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>Email *</span>
          <input name="email" required type="email" value={formState.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email *" className={fieldClass("email", formFieldClass)} />
          {renderFieldError("email")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>Phone Number *</span>
          <input name="phone" required inputMode="numeric" pattern="\\d{10}" maxLength={10} value={formState.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="10 digit phone number" className={fieldClass("phone", formFieldClass)} />
          {renderFieldError("phone")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>City *</span>
          <input name="city" required value={formState.city} onChange={(event) => updateField("city", event.target.value)} placeholder="City *" className={fieldClass("city", formFieldClass)} />
          {renderFieldError("city")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>Password *</span>
          <input name="password" required type="password" value={formState.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Password *" className={fieldClass("password", formFieldClass)} />
          {renderFieldError("password")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>Confirm Password *</span>
          <input name="confirmPassword" required type="password" value={formState.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} placeholder="Confirm Password *" className={fieldClass("confirmPassword", formFieldClass)} />
          {renderFieldError("confirmPassword")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground md:col-span-2">
          <span>Gender *</span>
          <select name="gender" required value={formState.gender} onChange={(event) => updateField("gender", event.target.value)} className={fieldClass("gender", `${formSelectClass} md:col-span-2`)}>
            <option value="">Select gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
          {renderFieldError("gender")}
        </label>
      </section>

      <section hidden={step !== 1} className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>Register Number *</span>
          <input name="registerNumber" required value={formState.registerNumber} onChange={(event) => updateField("registerNumber", event.target.value.toUpperCase())} placeholder="RA + 13 digits" className={fieldClass("registerNumber", formFieldClass)} />
          {renderFieldError("registerNumber")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>Graduation Year *</span>
          <select name="graduationYear" required value={formState.graduationYear} onChange={(event) => updateField("graduationYear", event.target.value)} className={fieldClass("graduationYear", formSelectClass)}>
            <option value="">Select year</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
            <option value="2029">2029</option>
          </select>
          {renderFieldError("graduationYear")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground md:col-span-2">
          <span>College / Institution *</span>
          <input name="college" required value={formState.college} onChange={(event) => updateField("college", event.target.value)} placeholder="College / Institution *" className={fieldClass("college", `${formFieldClass} md:col-span-2`)} />
          {renderFieldError("college")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground md:col-span-2">
          <span>Department / Branch *</span>
          <input name="department" required value={formState.department} onChange={(event) => updateField("department", event.target.value)} placeholder="Department / Branch *" className={fieldClass("department", `${formFieldClass} md:col-span-2`)} />
          {renderFieldError("department")}
        </label>
      </section>

      <section hidden={step !== 2} className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>Coding Experience *</span>
          <select name="codingExperience" required value={formState.codingExperience} onChange={(event) => updateField("codingExperience", event.target.value)} className={fieldClass("codingExperience", formSelectClass)}>
            <option value="">Select experience</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          {renderFieldError("codingExperience")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>Hackathon Experience *</span>
          <select name="hackathonExperience" required value={formState.hackathonExperience} onChange={(event) => updateField("hackathonExperience", event.target.value)} className={fieldClass("hackathonExperience", formSelectClass)}>
            <option value="">Select experience</option>
            <option value="First time">First time</option>
            <option value="1-2 hackathons">1-2 hackathons</option>
            <option value="3+ hackathons">3+ hackathons</option>
          </select>
          {renderFieldError("hackathonExperience")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground md:col-span-2">
          <span>Preferred domains *</span>
          <input name="domains" required value={formState.domains} onChange={(event) => updateField("domains", event.target.value)} placeholder="AI, Web, Systems..." className={fieldClass("domains", `${formFieldClass} md:col-span-2`)} />
          {renderFieldError("domains")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>GitHub Profile URL *</span>
          <input name="githubUrl" required value={formState.githubUrl} onChange={(event) => updateField("githubUrl", event.target.value)} placeholder="https://github.com/your-name" className={fieldClass("githubUrl", formFieldClass)} />
          {renderFieldError("githubUrl")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>LinkedIn Profile URL *</span>
          <input name="linkedinUrl" required value={formState.linkedinUrl} onChange={(event) => updateField("linkedinUrl", event.target.value)} placeholder="https://linkedin.com/in/your-name" className={fieldClass("linkedinUrl", formFieldClass)} />
          {renderFieldError("linkedinUrl")}
        </label>
      </section>

      <section hidden={step !== 3} className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>T-shirt Size *</span>
          <select name="tshirtSize" required value={formState.tshirtSize} onChange={(event) => updateField("tshirtSize", event.target.value)} className={fieldClass("tshirtSize", formSelectClass)}>
            <option value="">Select size</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>
          {renderFieldError("tshirtSize")}
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground">
          <span>Dietary Restrictions</span>
          <input name="dietaryRestrictions" value={formState.dietaryRestrictions} onChange={(event) => updateField("dietaryRestrictions", event.target.value)} placeholder="Optional" className={formFieldClass} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-foreground md:col-span-2">
          <span>What do you want to build or learn? *</span>
          <textarea name="expectations" required value={formState.expectations} onChange={(event) => updateField("expectations", event.target.value)} rows={4} placeholder="Describe your goals for the hackathon" className={fieldClass("expectations", `${formTextareaClass} md:col-span-2`)} />
          {renderFieldError("expectations")}
        </label>
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
            disabled={!canAdvance}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next Step
          </button>
        ) : (
          <FormSubmitButton type="submit" disabled={!canSubmit} pendingLabel="Registering..." className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
            Register and continue
          </FormSubmitButton>
        )}
      </div>
    </form>
  );
}
