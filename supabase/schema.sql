create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  phone text,
  password_hash text not null,
  role text not null default 'PARTICIPANT',
  created_at timestamptz not null default now()
);

create table if not exists participant_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references users(id) on delete cascade,
  register_number text not null,
  graduation_year int not null,
  college text not null,
  department text not null,
  intake_payload jsonb
);

alter table participant_profiles
  drop constraint if exists participant_profiles_register_number_key;

create table if not exists organizer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references users(id) on delete cascade,
  requested_role text not null,
  approved_role text,
  status text not null default 'PENDING',
  rejection_reason text,
  reason_for_joining text not null,
  approved_by uuid references users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  is_active boolean not null default true,
  created_by uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  leader_id uuid not null references users(id) on delete restrict,
  track_id uuid references tracks(id) on delete set null,
  project_name text,
  project_description text,
  tech_stack text,
  github_link text,
  demo_link text,
  idea_link text,
  intake_payload jsonb,
  status text not null default 'DRAFT',
  review_score int,
  review_notes text,
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  notification_queued_at timestamptz,
  qr_generated_at timestamptz,
  qr_token text unique,
  qr_code_url text,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'PENDING',
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  unique(team_id, user_id)
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  checked_in_by uuid not null references users(id) on delete restrict,
  checked_in_at timestamptz not null default now()
);

create table if not exists scan_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  scanned_by uuid not null references users(id) on delete restrict,
  event_type text not null,
  meal_slot text,
  meal_count int not null default 1,
  result text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique(team_id, event_type, meal_slot)
);
