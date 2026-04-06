# Server Layer Blueprint

This folder enforces module-first backend organization for the portal.

## Folder roles

- modules: business workflows per domain (registration, teams, tracks, check-in, judging)
- repos: Prisma access abstractions and transactional helpers
- policies: RBAC and contextual authorization checks
- validation: Zod schemas for request and domain validation
- queues: async jobs (emails, reminders, exports)

## Rules

1. UI routes must call module services, not raw Prisma queries.
2. Authorization checks run before every state-changing operation.
3. Every privileged write emits an audit event.
4. Input validation happens at the edge and again at module boundary for critical actions.
