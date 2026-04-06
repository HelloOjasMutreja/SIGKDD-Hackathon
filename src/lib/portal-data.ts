type NavItem = {
  label: string;
  href: string;
};

type CardItem = {
  title: string;
  description: string;
};

export const mainNav: NavItem[] = [
  { label: "Registration", href: "/register" },
  { label: "Teams", href: "/teams" },
  { label: "Tracks", href: "/tracks" },
  { label: "Check-In", href: "/check-in" },
  { label: "Admin", href: "/admin" },
];

export const quickStats = [
  { label: "Registered participants", value: "0" },
  { label: "Teams formed", value: "0" },
  { label: "Tracks configured", value: "0" },
  { label: "Checked-in", value: "0" },
];

export const setupChecklist: CardItem[] = [
  {
    title: "Database schema created",
    description:
      "Initial Prisma models for users, teams, tracks, submissions, check-ins, and audit logging are in place.",
  },
  {
    title: "Portal navigation scaffolded",
    description:
      "Primary route structure is available for registration, teams, tracks, check-in, and admin operations.",
  },
  {
    title: "Role model mapped",
    description:
      "Launch roles included: Super Admin, Check-in Staff, Track Manager, Mentor/Judge, Support Staff, and Participant.",
  },
  {
    title: "Next step",
    description:
      "Wire Prisma client, add auth provider, and replace mock cards with live data queries.",
  },
];

export const roleCards: CardItem[] = [
  {
    title: "Super Admin",
    description: "Manages global settings, access policies, and operational overrides.",
  },
  {
    title: "Check-in Staff",
    description: "Scans QR codes, performs manual badge lookup, and resolves duplicates.",
  },
  {
    title: "Track Manager",
    description: "Owns track setup, team assignments, and track-specific communications.",
  },
  {
    title: "Mentor / Judge",
    description: "Reviews assigned teams, scores submissions, and records feedback.",
  },
  {
    title: "Support Staff",
    description: "Accesses participant information for help desk and logistics support.",
  },
];
