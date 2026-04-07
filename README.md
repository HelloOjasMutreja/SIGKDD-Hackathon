# SIGKDD Hackathon Portal

This project now runs on a clean split stack:
- Frontend: Next.js (existing UI)
- Backend: Django + SQLite (built-in Django storage and ORM)

Prisma, Docker, and related infra scaffolding were removed from runtime flow.

## Project Structure

- `src/` - Next.js participant + organizer frontend
- `backend/` - Django backend API and data models

## Backend (Django)

### Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend base URL (default): `http://127.0.0.1:8000`

### API Endpoints

- `GET /api/health`
- `POST /api/query`

The frontend uses `POST /api/query` as a typed model-action bridge (Prisma-like call shape, Django execution).

## Frontend (Next.js)

### Setup

```bash
npm install
npm run dev
```

Frontend base URL (default): `http://localhost:3000`

## Environment

Copy `.env.example` to `.env` and ensure:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
DJANGO_API_URL=http://127.0.0.1:8000
```

## Implemented Portals and Routes

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

- Team QR generation and verification remain intact.
- Role-based route gates remain server-side.
- The data layer has been shifted to Django backend calls via `src/lib/prisma.ts` adapter.
