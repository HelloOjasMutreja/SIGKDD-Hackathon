import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "local-dev-service-role-key";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const TEST_PASSWORD = "Pass@1234";

const ORGANIZERS = [
  { email: "admin@test.dev", full_name: "System Admin", role: "ADMIN", requested_role: "CORE_ORGANIZER", approved_role: "CORE_ORGANIZER" },
  { email: "organizer@test.dev", full_name: "Core Organizer", role: "ORGANIZER", requested_role: "CORE_ORGANIZER", approved_role: "CORE_ORGANIZER" },
  { email: "reviewer@test.dev", full_name: "Team Reviewer", role: "ORGANIZER", requested_role: "REVIEWER", approved_role: "REVIEWER" },
  { email: "checkin@test.dev", full_name: "Checkin Manager", role: "ORGANIZER", requested_role: "CHECKIN_MANAGER", approved_role: "CHECKIN_MANAGER" },
];

const PARTICIPANTS = [
  { email: "leader1@test.dev", full_name: "Arjun Leader", register_number: "RA9000000000001", graduation_year: 2027, college: "SIGKDD Institute", department: "CSE" },
  { email: "member1@test.dev", full_name: "Priya Member", register_number: "RA9000000000002", graduation_year: 2027, college: "SIGKDD Institute", department: "CSE" },
  { email: "member2@test.dev", full_name: "Rahul Member", register_number: "RA9000000000003", graduation_year: 2028, college: "SIGKDD Institute", department: "AIML" },
  { email: "member3@test.dev", full_name: "Neha Member", register_number: "RA9000000000004", graduation_year: 2028, college: "SIGKDD Institute", department: "ECE" },
  { email: "leader2@test.dev", full_name: "Kiran Leader", register_number: "RA9000000000005", graduation_year: 2027, college: "Tech Valley", department: "IT" },
  { email: "member4@test.dev", full_name: "Aditi Member", register_number: "RA9000000000006", graduation_year: 2029, college: "Tech Valley", department: "CSE" },
  { email: "member5@test.dev", full_name: "Irfan Member", register_number: "RA9000000000007", graduation_year: 2028, college: "Tech Valley", department: "CSE" },
  { email: "leader3@test.dev", full_name: "Sana Leader", register_number: "RA9000000000008", graduation_year: 2027, college: "Metro University", department: "CSE" },
  { email: "member6@test.dev", full_name: "Dev Member", register_number: "RA9000000000009", graduation_year: 2028, college: "Metro University", department: "AIML" },
  { email: "user123@test.dev", full_name: "Test User 123", register_number: "RA9000000000010", graduation_year: 2029, college: "Metro University", department: "IT" },
];

function buildParticipantPayload(participant) {
  return {
    city: "Chennai",
    gender: "Prefer not to say",
    codingExperience: "Intermediate",
    domains: "AI, Web",
    githubUrl: `https://github.com/${participant.email.replace("@test.dev", "")}`,
    linkedinUrl: `https://linkedin.com/in/${participant.email.replace("@test.dev", "")}`,
    hackathonExperience: "1-2 hackathons",
    tshirtSize: "M",
    dietaryRestrictions: "",
    expectations: "Build a practical solution and test end-to-end flows.",
  };
}

async function upsertUser(row) {
  const { data: existing, error: findError } = await supabase.from("users").select("id").eq("email", row.email).maybeSingle();
  if (findError) throw findError;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("users")
      .update({
        full_name: row.full_name,
        phone: row.phone,
        password_hash: row.password_hash,
        role: row.role,
      })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }

  const { data, error } = await supabase.from("users").insert(row).select("id").single();
  if (error) throw error;
  return data.id;
}

async function upsertParticipantProfile(userId, participant) {
  const payload = {
    user_id: userId,
    register_number: participant.register_number,
    graduation_year: participant.graduation_year,
    college: participant.college,
    department: participant.department,
    intake_payload: buildParticipantPayload(participant),
  };

  const { data: existing, error: findError } = await supabase.from("participant_profiles").select("id").eq("user_id", userId).maybeSingle();
  if (findError) throw findError;

  if (existing?.id) {
    const { error } = await supabase.from("participant_profiles").update(payload).eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("participant_profiles").insert(payload);
  if (error) throw error;
}

async function upsertOrganizerProfile(userId, organizer, approvedBy) {
  const payload = {
    user_id: userId,
    requested_role: organizer.requested_role,
    approved_role: organizer.approved_role,
    status: "APPROVED",
    reason_for_joining: "Test account for workflow validation.",
    approved_by: approvedBy,
    approved_at: new Date().toISOString(),
    rejection_reason: null,
  };

  const { data: existing, error: findError } = await supabase.from("organizer_profiles").select("id").eq("user_id", userId).maybeSingle();
  if (findError) throw findError;

  if (existing?.id) {
    const { error } = await supabase.from("organizer_profiles").update(payload).eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("organizer_profiles").insert(payload);
  if (error) throw error;
}

async function ensureTrack(name, createdBy) {
  const { data: existing, error: findError } = await supabase.from("tracks").select("id").eq("name", name).maybeSingle();
  if (findError) throw findError;
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("tracks")
    .insert({
      name,
      description: `${name} track for end-to-end testing`,
      is_active: true,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertTeam(team) {
  const { data: existing, error: findError } = await supabase.from("teams").select("id").eq("code", team.code).maybeSingle();
  if (findError) throw findError;

  if (existing?.id) {
    const { data, error } = await supabase.from("teams").update(team).eq("id", existing.id).select("id").single();
    if (error) throw error;
    return data.id;
  }

  const { data, error } = await supabase.from("teams").insert(team).select("id").single();
  if (error) throw error;
  return data.id;
}

async function upsertMember(teamId, userId, status) {
  const { data: existing, error: findError } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();
  if (findError) throw findError;

  const payload = {
    team_id: teamId,
    user_id: userId,
    status,
    responded_at: status === "PENDING" ? null : new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase.from("team_members").update(payload).eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("team_members").insert(payload);
  if (error) throw error;
}

async function seed() {
  const userIds = new Map();
  const sharedPassword = hashPassword(TEST_PASSWORD);

  for (const participant of PARTICIPANTS) {
    const userId = await upsertUser({
      email: participant.email,
      full_name: participant.full_name,
      phone: "9876543210",
      password_hash: sharedPassword,
      role: "PARTICIPANT",
    });
    userIds.set(participant.email, userId);
    await upsertParticipantProfile(userId, participant);
  }

  let adminId = null;
  for (const organizer of ORGANIZERS) {
    const userId = await upsertUser({
      email: organizer.email,
      full_name: organizer.full_name,
      phone: "9123456789",
      password_hash: sharedPassword,
      role: organizer.role,
    });
    userIds.set(organizer.email, userId);
    if (organizer.email === "admin@test.dev") {
      adminId = userId;
    }
  }

  for (const organizer of ORGANIZERS) {
    const userId = userIds.get(organizer.email);
    await upsertOrganizerProfile(userId, organizer, adminId);
  }

  const aiTrackId = await ensureTrack("AI & Data", adminId);
  const webTrackId = await ensureTrack("Web Platforms", adminId);

  const draftTeamId = await upsertTeam({
    name: "Neural Navigators",
    code: "TST101",
    leader_id: userIds.get("leader1@test.dev"),
    track_id: aiTrackId,
    status: "DRAFT",
    github_link: null,
    project_description: null,
    demo_link: null,
    qr_token: null,
    qr_code_url: null,
    submitted_at: null,
  });

  await upsertMember(draftTeamId, userIds.get("leader1@test.dev"), "APPROVED");
  await upsertMember(draftTeamId, userIds.get("member1@test.dev"), "APPROVED");
  await upsertMember(draftTeamId, userIds.get("member2@test.dev"), "PENDING");

  const submittedTeamId = await upsertTeam({
    name: "Edge Executors",
    code: "TST202",
    leader_id: userIds.get("leader2@test.dev"),
    track_id: webTrackId,
    status: "SUBMITTED",
    github_link: "https://github.com/test-dev/edge-executors",
    project_description: "Submitted project package for evaluation.",
    demo_link: "https://edge-executors.test.dev",
    qr_token: null,
    qr_code_url: null,
    submitted_at: new Date().toISOString(),
  });

  await upsertMember(submittedTeamId, userIds.get("leader2@test.dev"), "APPROVED");
  await upsertMember(submittedTeamId, userIds.get("member4@test.dev"), "APPROVED");
  await upsertMember(submittedTeamId, userIds.get("member5@test.dev"), "APPROVED");

  const approvedTeamId = await upsertTeam({
    name: "Quantum Quorum",
    code: "TST303",
    leader_id: userIds.get("leader3@test.dev"),
    track_id: aiTrackId,
    status: "APPROVED",
    github_link: "https://github.com/test-dev/quantum-quorum",
    project_description: "Approved project package.",
    demo_link: "https://quantum-quorum.test.dev",
    qr_token: "TEST-QR-TOKEN-303",
    qr_code_url: null,
    submitted_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
    reviewed_by: userIds.get("reviewer@test.dev"),
    review_score: 91,
  });

  await upsertMember(approvedTeamId, userIds.get("leader3@test.dev"), "APPROVED");
  await upsertMember(approvedTeamId, userIds.get("member6@test.dev"), "APPROVED");
  await upsertMember(approvedTeamId, userIds.get("user123@test.dev"), "APPROVED");

  console.log("Test data seeded successfully.");
  console.log("Participants:", PARTICIPANTS.map((p) => p.email).join(", "));
  console.log("Organizers:", ORGANIZERS.map((o) => o.email).join(", "));
  console.log("Shared test password:", TEST_PASSWORD);
}

seed().catch((error) => {
  console.error("Failed to seed test data:", error.message ?? error);
  process.exit(1);
});
