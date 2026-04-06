# SIGKDD Hackathon Registration Portal

Initial implementation scaffold for a full registration and event operations portal.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4
- Prisma ORM 7
- SQLite (local development)

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

## Next implementation goals

1. Add authentication and session management
2. Enforce RBAC in server actions and API routes
3. Replace mock dashboard values with live Prisma queries
4. Implement registration wizard persistence
5. Build QR generation and scanner flow for check-in
