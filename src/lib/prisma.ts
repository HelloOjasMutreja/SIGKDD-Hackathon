/* eslint-disable @typescript-eslint/no-explicit-any */

type QueryPayload = {
  model: string;
  action: string;
  args?: Record<string, unknown>;
};

const DJANGO_API_URL = process.env.DJANGO_API_URL ?? "http://127.0.0.1:8000";

function reviveDates<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => reviveDates(item)) as T;
  }

  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (typeof value === "string" && /At$/.test(key) && !Number.isNaN(Date.parse(value))) {
        out[key] = new Date(value);
      } else {
        out[key] = reviveDates(value);
      }
    }
    return out as T;
  }

  return input;
}

async function call<T>(payload: QueryPayload): Promise<T> {
  const response = await fetch(`${DJANGO_API_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const json = (await response.json()) as { data?: T; error?: string };

  if (!response.ok || json.error) {
    throw new Error(json.error ?? `Django query failed: ${response.status}`);
  }

  return reviveDates(json.data as T);
}

function modelProxy(model: string) {
  return {
    count: (args?: Record<string, unknown>) => call<number>({ model, action: "count", args }),
    findUnique: (args?: Record<string, unknown>) => call<any>({ model, action: "findUnique", args }),
    findFirst: (args?: Record<string, unknown>) => call<any>({ model, action: "findFirst", args }),
    findMany: (args?: Record<string, unknown>) => call<any[]>({ model, action: "findMany", args }),
    create: (args?: Record<string, unknown>) => call<any>({ model, action: "create", args }),
    update: (args?: Record<string, unknown>) => call<any>({ model, action: "update", args }),
    upsert: (args?: Record<string, unknown>) => call<any>({ model, action: "upsert", args }),
    delete: (args?: Record<string, unknown>) => call<any>({ model, action: "delete", args }),
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
