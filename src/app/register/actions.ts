"use server";

import { redirect } from "next/navigation";
import { TeamMemberStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { setParticipantSession } from "@/lib/auth";
import { UserRole } from "@/lib/domain";
import { hashPassword } from "@/lib/security";
import { isValidEmail, isValidPhoneNumber, isValidUrl, normalizeEmail, normalizeFormValue, normalizePhoneNumber } from "@/lib/utils";

const REGISTER_REGEX = /^RA\d{13}$/;
const ALLOWED_YEARS = [2027, 2028, 2029] as const;

export async function registerParticipant(formData: FormData) {
  const fullName = normalizeFormValue(formData.get("fullName"));
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const registerNumber = normalizeFormValue(formData.get("registerNumber")).toUpperCase();
  const phone = normalizePhoneNumber(formData.get("phone"));
  const graduationYear = Number(normalizeFormValue(formData.get("graduationYear")));
  const college = normalizeFormValue(formData.get("college"));
  const department = normalizeFormValue(formData.get("department"));
  const inviteCode = normalizeFormValue(formData.get("invite")).toUpperCase();

  const city = normalizeFormValue(formData.get("city"));
  const gender = normalizeFormValue(formData.get("gender"));
  const codingExperience = normalizeFormValue(formData.get("codingExperience"));
  const domains = normalizeFormValue(formData.get("domains"));
  const githubUrl = normalizeFormValue(formData.get("githubUrl"));
  const linkedinUrl = normalizeFormValue(formData.get("linkedinUrl"));
  const hackathonExperience = normalizeFormValue(formData.get("hackathonExperience"));
  const tshirtSize = normalizeFormValue(formData.get("tshirtSize"));
  const dietaryRestrictions = String(formData.get("dietaryRestrictions") ?? "").trim();
  const expectations = normalizeFormValue(formData.get("expectations"));

  if (!fullName) redirect("/register?error=missing_full_name");
  if (!email) redirect("/register?error=missing_email");
  if (!isValidEmail(email)) redirect("/register?error=invalid_email");
  if (!password) redirect("/register?error=missing_password");
  if (!confirmPassword) redirect("/register?error=missing_confirm_password");
  if (!registerNumber) redirect("/register?error=missing_register_number");
  if (!phone) redirect("/register?error=missing_phone");
  if (!isValidPhoneNumber(phone)) redirect("/register?error=invalid_phone");
  if (!graduationYear) redirect("/register?error=missing_graduation_year");
  if (!city) redirect("/register?error=missing_city");
  if (!gender) redirect("/register?error=missing_gender");
  if (!college) redirect("/register?error=missing_college");
  if (!department) redirect("/register?error=missing_department");
  if (!codingExperience) redirect("/register?error=missing_coding_experience");
  if (!hackathonExperience) redirect("/register?error=missing_hackathon_experience");
  if (!domains) redirect("/register?error=missing_domains");
  if (!githubUrl) redirect("/register?error=missing_github_url");
  if (!linkedinUrl) redirect("/register?error=missing_linkedin_url");
  if (!tshirtSize) redirect("/register?error=missing_tshirt_size");
  if (!expectations) redirect("/register?error=missing_expectations");

  if (!REGISTER_REGEX.test(registerNumber)) {
    redirect("/register?error=register_number");
  }

  if (password !== confirmPassword) {
    redirect("/register?error=password_mismatch");
  }

  if (!ALLOWED_YEARS.includes(graduationYear as (typeof ALLOWED_YEARS)[number])) {
    redirect("/register?error=graduation_year");
  }

  if (!isValidUrl(githubUrl)) {
    redirect("/register?error=github_url");
  }

  if (!isValidUrl(linkedinUrl)) {
    redirect("/register?error=linkedin_url");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    await setParticipantSession({ userId: exists.id, role: UserRole.PARTICIPANT });

    if (inviteCode) {
      const invitedTeam = await prisma.team.findUnique({ where: { code: inviteCode } });
      if (invitedTeam) {
        await prisma.teamMember.upsert({
          where: {
            teamId_userId: {
              teamId: invitedTeam.id,
              userId: exists.id,
            },
          },
          update: { status: TeamMemberStatus.PENDING },
          create: {
            teamId: invitedTeam.id,
            userId: exists.id,
            status: TeamMemberStatus.PENDING,
          },
        });
        redirect(`/team-setup?status=pending&teamId=${invitedTeam.id}&invite=1`);
      }
    }

    redirect("/team-setup");
  }

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      phone,
      role: "PARTICIPANT",
      passwordHash: hashPassword(password),
      participant: {
        create: {
          registerNumber,
          graduationYear,
          college,
          department,
          intakePayload: {
            city,
            gender,
            codingExperience,
            domains,
            githubUrl,
            linkedinUrl,
            hackathonExperience,
            tshirtSize,
            dietaryRestrictions,
            expectations,
          },
        },
      },
    },
  });

  await setParticipantSession({ userId: user.id, role: UserRole.PARTICIPANT });

  if (inviteCode) {
    const invitedTeam = await prisma.team.findUnique({ where: { code: inviteCode } });
    if (invitedTeam) {
      await prisma.teamMember.upsert({
        where: {
          teamId_userId: {
            teamId: invitedTeam.id,
            userId: user.id,
          },
        },
        update: { status: TeamMemberStatus.PENDING },
        create: {
          teamId: invitedTeam.id,
          userId: user.id,
          status: TeamMemberStatus.PENDING,
        },
      });
      redirect(`/team-setup?status=pending&teamId=${invitedTeam.id}&invite=1`);
    }
  }

  redirect("/team-setup");
}
