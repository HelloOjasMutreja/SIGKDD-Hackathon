/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ModelName =
  | "user"
  | "participantProfile"
  | "organizerProfile"
  | "team"
  | "teamMember"
  | "track"
  | "checkin";

type QueryArgs = Record<string, any> | undefined;

const TABLES: Record<ModelName, string> = {
  user: "users",
  participantProfile: "participant_profiles",
  organizerProfile: "organizer_profiles",
  team: "teams",
  teamMember: "team_members",
  track: "tracks",
  checkin: "checkins",
};

const FIELD_MAP: Record<ModelName, Record<string, string>> = {
  user: {
    fullName: "full_name",
    passwordHash: "password_hash",
    createdAt: "created_at",
  },
  participantProfile: {
    userId: "user_id",
    registerNumber: "register_number",
    graduationYear: "graduation_year",
    intakePayload: "intake_payload",
  },
  organizerProfile: {
    userId: "user_id",
    requestedRole: "requested_role",
    approvedRole: "approved_role",
    rejectionReason: "rejection_reason",
    reasonForJoining: "reason_for_joining",
    approvedBy: "approved_by",
    approvedAt: "approved_at",
    createdAt: "created_at",
  },
  team: {
    leaderId: "leader_id",
    trackId: "track_id",
    projectName: "project_name",
    projectDescription: "project_description",
    techStack: "tech_stack",
    githubLink: "github_link",
    demoLink: "demo_link",
    ideaLink: "idea_link",
    intakePayload: "intake_payload",
    qrToken: "qr_token",
    qrCodeUrl: "qr_code_url",
    submittedAt: "submitted_at",
    createdAt: "created_at",
  },
  teamMember: {
    teamId: "team_id",
    userId: "user_id",
    requestedAt: "requested_at",
    respondedAt: "responded_at",
  },
  track: {
    isActive: "is_active",
    createdBy: "created_by",
    createdAt: "created_at",
  },
  checkin: {
    teamId: "team_id",
    checkedInBy: "checked_in_by",
    checkedInAt: "checked_in_at",
  },
};

function toDbField(model: ModelName, key: string): string {
  return FIELD_MAP[model][key] ?? key;
}

function fromDbField(model: ModelName, key: string): string {
  const entries = Object.entries(FIELD_MAP[model]);
  const found = entries.find(([, v]) => v === key);
  return found?.[0] ?? key;
}

function toDbObject(model: ModelName, input: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    out[toDbField(model, k)] = v;
  }
  return out;
}

function fromDbObject(model: ModelName, input: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    const camel = fromDbField(model, k);
    if (typeof v === "string" && /At$/.test(camel) && !Number.isNaN(Date.parse(v))) {
      out[camel] = new Date(v);
    } else {
      out[camel] = v;
    }
  }
  return out;
}

function applyWhere(query: any, model: ModelName, where?: Record<string, any>) {
  if (!where) {
    return query;
  }

  for (const [k, v] of Object.entries(where)) {
    if (k === "teamId_userId" && typeof v === "object") {
      query = query.eq("team_id", v.teamId).eq("user_id", v.userId);
      continue;
    }

    query = query.eq(toDbField(model, k), v);
  }

  return query;
}

async function findUnique(model: ModelName, where: Record<string, any>, include?: Record<string, any>) {
  let query = supabaseAdmin.from(TABLES[model]).select("*");
  query = applyWhere(query, model, where);
  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return includeRelations(model, fromDbObject(model, data), include);
}

async function findMany(model: ModelName, args?: Record<string, any>) {
  let query = supabaseAdmin.from(TABLES[model]).select("*");
  query = applyWhere(query, model, args?.where);

  if (args?.orderBy) {
    const [[orderKey, orderDirection]] = Object.entries(args.orderBy);
    query = query.order(toDbField(model, orderKey), { ascending: String(orderDirection).toLowerCase() !== "desc" });
  }

  if (typeof args?.take === "number") {
    query = query.limit(args.take);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).map((row) => fromDbObject(model, row));
  const include = args?.include;
  if (!include) {
    return rows;
  }

  return Promise.all(rows.map((row) => includeRelations(model, row, include)));
}

async function count(model: ModelName, args?: Record<string, any>) {
  let query = supabaseAdmin.from(TABLES[model]).select("id", { count: "exact", head: true });
  query = applyWhere(query, model, args?.where);
  const { count: c, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return c ?? 0;
}

async function create(model: ModelName, args: Record<string, any>) {
  const data = args.data ?? {};
  const include = args.include;

  const nestedParticipant = model === "user" ? data.participant?.create : null;
  const nestedOrganizer = model === "user" ? data.organizerProfile?.create : null;
  const nestedMembers = model === "team" ? data.members?.create : null;

  const cleanData = { ...data };
  delete cleanData.participant;
  delete cleanData.organizerProfile;
  delete cleanData.members;

  const { data: inserted, error } = await supabaseAdmin
    .from(TABLES[model])
    .insert(toDbObject(model, cleanData))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const createdRow = fromDbObject(model, inserted);

  if (model === "user" && nestedParticipant) {
    await supabaseAdmin.from(TABLES.participantProfile).insert(
      toDbObject("participantProfile", { ...nestedParticipant, userId: createdRow.id }),
    );
  }

  if (model === "user" && nestedOrganizer) {
    await supabaseAdmin.from(TABLES.organizerProfile).insert(
      toDbObject("organizerProfile", { ...nestedOrganizer, userId: createdRow.id }),
    );
  }

  if (model === "team" && nestedMembers) {
    await supabaseAdmin.from(TABLES.teamMember).insert(
      toDbObject("teamMember", { ...nestedMembers, teamId: createdRow.id }),
    );
  }

  return includeRelations(model, createdRow, include);
}

async function update(model: ModelName, args: Record<string, any>) {
  const existing = await findUnique(model, args.where ?? {});
  if (!existing) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from(TABLES[model])
    .update(toDbObject(model, args.data ?? {}))
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return includeRelations(model, fromDbObject(model, data), args.include);
}

async function upsert(model: ModelName, args: Record<string, any>) {
  const where = args.where ?? {};
  const found = await findUnique(model, where);
  if (found) {
    return update(model, { where: { id: found.id }, data: args.update ?? {}, include: args.include });
  }

  let createData = args.create ?? {};
  if (where.teamId_userId) {
    createData = {
      ...createData,
      teamId: where.teamId_userId.teamId,
      userId: where.teamId_userId.userId,
    };
  }

  return create(model, { data: createData, include: args.include });
}

async function remove(model: ModelName, args: Record<string, any>) {
  const found = await findUnique(model, args.where ?? {});
  if (!found) {
    return null;
  }

  const { error } = await supabaseAdmin.from(TABLES[model]).delete().eq("id", found.id);
  if (error) {
    throw new Error(error.message);
  }

  return found;
}

async function includeRelations(model: ModelName, row: any, include?: Record<string, any>) {
  if (!include || !row) {
    return row;
  }

  const out = { ...row };

  if (model === "user" && include.participant) {
    out.participant = await findUnique("participantProfile", { userId: row.id });
  }

  if (model === "user" && include.organizerProfile) {
    out.organizerProfile = await findUnique("organizerProfile", { userId: row.id });
  }

  if (model === "team" && include.leader) {
    out.leader = await findUnique("user", { id: row.leaderId });
  }

  if (model === "team" && include.track) {
    out.track = row.trackId ? await findUnique("track", { id: row.trackId }) : null;
  }

  if (model === "team" && include.members) {
    const conf = include.members;
    out.members = await findMany("teamMember", {
      where: { ...(conf.where ?? {}), teamId: row.id },
      orderBy: conf.orderBy,
      include: conf.include,
    });
  }

  if (model === "teamMember" && include.user) {
    out.user = await findUnique("user", { id: row.userId }, include.user.include);
  }

  if (model === "teamMember" && include.team) {
    out.team = await findUnique("team", { id: row.teamId });
  }

  if (model === "organizerProfile" && include.user) {
    out.user = await findUnique("user", { id: row.userId });
  }

  if (model === "checkin" && include.team) {
    out.team = await findUnique("team", { id: row.teamId });
  }

  if (model === "checkin" && include.actor) {
    out.actor = await findUnique("user", { id: row.checkedInBy });
  }

  if (model === "track" && include._count?.select?.teams) {
    out._count = { teams: await count("team", { where: { trackId: row.id } }) };
  }

  return out;
}

function modelProxy(model: ModelName) {
  return {
    count: (args?: QueryArgs) => count(model, args),
    findUnique: (args?: QueryArgs) => findUnique(model, args?.where ?? {}, args?.include),
    findFirst: async (args?: QueryArgs) => {
      const rows = await findMany(model, { ...args, take: 1 });
      return rows[0] ?? null;
    },
    findMany: (args?: QueryArgs) => findMany(model, args),
    create: (args?: QueryArgs) => create(model, args ?? {}),
    update: (args?: QueryArgs) => update(model, args ?? {}),
    upsert: (args?: QueryArgs) => upsert(model, args ?? {}),
    delete: (args?: QueryArgs) => remove(model, args ?? {}),
  };
}

export const prisma = {
  user: modelProxy("user"),
  participantProfile: modelProxy("participantProfile"),
  organizerProfile: modelProxy("organizerProfile"),
  team: modelProxy("team"),
  teamMember: modelProxy("teamMember"),
  track: modelProxy("track"),
  checkin: modelProxy("checkin"),
};
