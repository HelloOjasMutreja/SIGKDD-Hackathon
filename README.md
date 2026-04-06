# SIGKDD Hackathon Registration Portal

Initial implementation scaffold for a full registration and event operations portal.

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

## Implemented in this first slice

- Route scaffold for:
	- Registration
	- Team management
	- Track management
	- Check-in
	- Organizer admin
- Core Prisma schema for users, participant profiles, teams, invites, tracks, submissions, check-ins, and audit logs
- Role and permission utility skeleton
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

1. Add authentication and session management
2. Enforce RBAC in server actions and API routes
3. Replace mock dashboard values with live Prisma queries
4. Implement registration wizard persistence
5. Build QR generation and scanner flow for check-in
