# SIGKDD Hackathon Registration Portal

Working MVP for a full registration and event operations portal.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4
- Prisma ORM 7
- SQLite local bootstrap + PostgreSQL production target
- Redis (queue/cache), S3-compatible object storage, Resend email

## Architecture and stack decisions

- Architecture blueprint: docs/architecture.md
- Finalized stack: docs/tech-stack.md
- Local infra template: docker-compose.yml
- Environment template: .env.example

## Implemented and connected

- Email-based portal access session on home page
- Participant registration persistence and status tracking
- Team create/invite/accept-decline workflows
- Track creation and team track assignment with capacity guard
- Check-in operations with role guard and duplicate prevention
- Organizer admin workspace for role assignments and registration approvals
- Core Prisma schema for users, participant profiles, teams, invites, tracks, submissions, check-ins, and audit logs
- Health endpoint: /api/health

## Local setup

1. Install dependencies

```bash
npm install
```

2. Generate Prisma client

```bash
npm run prisma:generate
```

3. Apply migrations

```bash
npm run prisma:migrate -- --name init
```

4. Run the app

```bash
npm run dev
```

5. Open http://localhost:3000

## Useful commands

```bash
npm run lint
npm run db:studio
```

## How to use the app end-to-end

1. Open `/` and create a session using your name, email, and role.
2. Use `PARTICIPANT` role to complete `/register`.
3. Create team and invites in `/teams`.
4. Select or manage tracks in `/tracks`.
5. Switch to `SUPER_ADMIN` or `CHECKIN_STAFF` on `/` for `/check-in`.
6. Use `/admin` for approvals and role assignments.

## Local infrastructure (optional but recommended)

Start local supporting services:

```bash
docker compose up -d
```

Services included:
- PostgreSQL at localhost:5432
- Redis at localhost:6379
- Mailpit SMTP/UI at localhost:1025 and localhost:8025
- MinIO API/UI at localhost:9000 and localhost:9001

## Next implementation goals

1. Replace email-based session with secure password or OAuth auth
2. Add submission and judging workflow end-to-end
3. Add QR token generation and scanner camera integration
4. Add queue-driven notifications and reminders
5. Add Playwright end-to-end test coverage
