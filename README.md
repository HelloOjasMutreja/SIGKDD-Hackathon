# SIGKDD Hackathon Portal

This project is a Next.js frontend deployed on Vercel with Supabase as the backend.

## Stack

- Frontend: Next.js + TypeScript + Tailwind
- Backend: Supabase Postgres
- Auth/session handling: custom server-side session cookies
- Deployment target: Vercel

## Local Setup

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Supabase Schema

Apply [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor.

## Vercel Deployment

1. Import the GitHub repo into Vercel.
2. Set the same environment variables in the Vercel project settings.
3. Deploy with the default Next.js build command.

No custom build adapter is required for Vercel.

## Key Routes

Participant:
- `/`
- `/register`
- `/login`
- `/team-setup`
- `/team-setup/create`
- `/team-setup/join`
- `/team-setup/pending`
- `/team/[teamId]`
- `/dashboard`
- `/profile`
- `/logout`

Organizer:
- `/org/login`
- `/org/register`
- `/org/pending`
- `/org/dashboard`
- `/org/teams`
- `/org/checkin`
- `/org/admin/approvals`
- `/org/admin/tracks`
- `/org/logout`

Shared:
- `/verify/[token]`
- `/api/health`

## Notes

- Registration is a 4-step controlled form that preserves input state across steps.
- QR flow is paused for now; manual code-based check-in is used instead.
- The app is currently configured for Vercel-compatible deployment.
