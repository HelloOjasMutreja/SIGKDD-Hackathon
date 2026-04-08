"use server";

import { redirect } from "next/navigation";
import { TeamMemberStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { setParticipantSession } from "@/lib/auth";
import { hashPassword } from "@/lib/security";

const REGISTER_REGEX = /^RA\d{13}$/;
const ALLOWED_YEARS = [2027, 2028, 2029] as const;

export async function registerParticipant(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const registerNumber = String(formData.get("registerNumber") ?? "").trim().toUpperCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const graduationYear = Number(String(formData.get("graduationYear") ?? ""));
  const college = String(formData.get("college") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const inviteCode = String(formData.get("invite") ?? "").trim().toUpperCase();

  const city = String(formData.get("city") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const codingExperience = String(formData.get("codingExperience") ?? "").trim();
  const domains = String(formData.get("domains") ?? "").trim();
  const githubUrl = String(formData.get("githubUrl") ?? "").trim();
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim();
  const hackathonExperience = String(formData.get("hackathonExperience") ?? "").trim();
  const tshirtSize = String(formData.get("tshirtSize") ?? "").trim();
  const dietaryRestrictions = String(formData.get("dietaryRestrictions") ?? "").trim();
  const expectations = String(formData.get("expectations") ?? "").trim();

  if (!fullName || !email || !password || !registerNumber || !phone || !college || !department) {
    redirect("/register?error=missing");
  }

  if (password !== confirmPassword) {
    redirect("/register?error=password_mismatch");
  }

  if (!REGISTER_REGEX.test(registerNumber)) {
    redirect("/register?error=register_number");
  }

  if (!ALLOWED_YEARS.includes(graduationYear as (typeof ALLOWED_YEARS)[number])) {
    redirect("/register?error=graduation_year");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    redirect("/register?error=email_exists");
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

  await setParticipantSession({ userId: user.id, role: user.role });

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
      redirect(`/team-setup/pending?teamId=${invitedTeam.id}&invite=1`);
    }
  }

  redirect("/team-setup");
}
