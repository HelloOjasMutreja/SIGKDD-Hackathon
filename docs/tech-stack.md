# Finalized Tech Stack

## Runtime and Application
- Framework: Next.js 16 (App Router)
- Language: TypeScript 5
- UI: React 19 + Tailwind CSS 4
- Form and validation: React Hook Form + Zod
- Auth: Auth.js (NextAuth v5) with Prisma adapter

## Data and Storage
- ORM: Prisma 7
- Primary DB (production): PostgreSQL 16
- Primary DB (local bootstrap, current state): SQLite
- Cache/queue broker: Redis 7
- Object storage: S3-compatible (AWS S3 or Cloudflare R2)

## Async and Integrations
- Queue engine: BullMQ
- Email: Resend (SMTP fallback for local/test)
- QR generation: qrcode library on server
- QR scanning in browser: html5-qrcode or zxing-js/browser

## Observability and Quality
- Logs: Pino + pino-pretty (dev)
- Error monitoring: Sentry
- Metrics/traces: OpenTelemetry
- Unit tests: Vitest + Testing Library
- End-to-end tests: Playwright
- Lint/format: ESLint + Prettier

## Infra and Delivery
- Local infra: Docker Compose
- CI/CD: GitHub Actions
- Deployment target: Vercel web tier + managed data services
- Secrets: provider-managed secret store

## Why This Stack

1. Next.js App Router gives fast UI iteration and first-class server rendering for dashboard-heavy workflows.
2. Prisma + PostgreSQL supports strong relational workflows required by teams, tracks, and check-in integrity.
3. Redis + BullMQ cleanly handles reminders and non-blocking background jobs.
4. S3-compatible storage keeps submission assets portable across cloud vendors.
5. Auth.js integrates cleanly with Next.js and Prisma for role-aware sessions.

## Locked Decisions

- Architecture style: modular monolith for V1
- API strategy: BFF with selected REST endpoints under app/api
- Primary ID strategy: CUID across domain entities
- Authorization model: role + permission checks at server boundary
- Audit model: append-only audit log for all privileged actions

## Planned Upgrades (Post-V1)

- Move check-in scanner to an installable PWA mode with partial offline support
- Add read replicas for analytics-heavy admin pages
- Introduce event partitioning for multi-event tenancy
