# pioHub — Project Context for Claude Code

## What This Project Is
pioHub is a student project collaboration platform where students can post
project ideas, specify what roles they need, and other students can request
to join. Project owners approve or reject requests.

pioHub is a product under the parent company pioNox.

Docs map (in `docs/`): PRD.md (what pioHub is + product requirements) ·
USERJOURNEY.md (click-by-click user flows) · ARCHITECTURE.md (how it works,
plain English) · FOUNDATIONALPLAN.md (the stack decisions, layer by layer).

## Status
On hold since 2026-06-26: parked while its author works on other projects.
The code runs and is tested, but nothing new is being built.

## Tech Stack
The project was rebuilt off the old Manus AI environment onto an owned, scalable
stack (see docs/FOUNDATIONALPLAN.md). Code is split into two folders: `/frontend` and `/backend`.
- Frontend: React + TypeScript + Tailwind CSS v4 + shadcn/ui, built with Vite — hosted on **Vercel**
- Backend: Node.js + tRPC routers + Zod validation (CommonJS) — hosted on **Railway**
- Database: **PostgreSQL via Supabase**, accessed with Drizzle ORM
- Auth: **Clerk** (`@clerk/react` on frontend, `@clerk/backend` on the backend). Frontend attaches a Clerk JWT as a Bearer token; backend verifies it in `middleware/clerkAuth.ts`
- Email: Resend API (RESEND_API_KEY, RESEND_FROM_EMAIL env vars)
- Routing: Wouter
- Icons: Lucide React
- Fonts: Inter (Google Fonts)
- Secrets live in `.env` files (gitignored) and in the Vercel/Railway dashboards — never in code

## Security Rules — Never Break These
- **Public endpoints must never return email, clerkId, or role.** Any query that
  returns user data through a `publicProcedure` must select via the
  `publicUserColumns` allowlist in `backend/src/db.ts` (id, name, university,
  skills, portfolioLink, bio, createdAt only). We shipped and fixed this exact
  leak on 2026-06-12 — don't reintroduce it.
- Authorization lives in the backend only. Hiding a button in the UI is not
  access control — every mutation must re-check ownership/membership server-side.
- All user-supplied URLs (e.g. portfolioLink) must pass the `httpUrl()` validator
  in `routers.ts` (Zod `.url()` plus an http/https check — `.url()` alone lets
  `javascript:` links through).
- New public-facing queries: before merging, ask "what does the raw API response
  contain?" — not just "what does the page display?"

## Design Rules — Never Break These
- Color palette: deep navy primary, warm white background, gold accent
- Font: Inter only
- Components: always use existing shadcn/ui components
- Tailwind only — no custom CSS unless in index.css
- Keep all existing animations and transitions
- Mobile responsive at all times

## Branding
- Product name: pioHub
- Parent company: pioNox
- Footer brand line: © [year] pioNox. The source code in this repo is MIT-licensed (see LICENSE).

## Current File Structure
- `/frontend/src/pages/`: Home, Feed, ProjectDetail, CreateProject, EditProject,
  Dashboard, ProfilePage, WorkspacePage, AdminPage, OutreachPage, NotFound
- `/frontend/src/components/`: NavBar, ProjectCard, RoleTag, ProjectForm,
  ErrorBoundary, plus shadcn/ui kit in `components/ui/`
- `/frontend/src/`: App.tsx (routes), main.tsx (boots Clerk + tRPC),
  hooks/useAuth.ts, lib/trpc.ts (backend connection), index.css
- `/backend/src/`: routers.ts, db.ts, schema.ts, trpc.ts (public vs protected
  procedures), email.ts, env.ts, index.ts (server entry), middleware/clerkAuth.ts
- `/backend/drizzle/`: migrations (`npm run db:generate` after a schema change)
- `/backend/test/`, `/frontend/src/**/*.test.tsx`: tests (`npm test` in each folder)
- `/frontend/src/types/backend/`: generated snapshot of the backend's types —
  regenerate with `npm run types` in `/backend` whenever a return shape changes

## Database Tables
(PostgreSQL, defined in backend/src/schema.ts. neededRoles/skills are stored as JSON strings in text columns.)
- users: id, clerkId, name, email, role (user/admin), university, skills,
  portfolioLink, bio, createdAt, updatedAt, lastSignedIn
- projects: id, ownerId, title, description, neededRoles,
  maxTeamSize, status (open/closed), createdAt, updatedAt
- projectMembers: id, projectId, userId, joinedAt
- joinRequests: id, projectId, requesterId, message,
  status (pending/approved/rejected), createdAt, updatedAt
- workspaceLinks: id, projectId, addedByUserId, label, url, createdAt
- outreachContacts: id, name, channel, note, hasIdea, refCode (unique),
  signedUpUserId (nullable), createdAt — manual-outreach tracker; a signup via
  /?ref=<refCode> links that user here (admin-only)

## Features Already Built
- Post a project with title, description, roles, max team size
- Browse and filter projects by role and search
- Request to join a project with a message
- Owner approves or rejects join requests
- Owner can edit, close, and delete their projects
- Dashboard: owned projects, joined projects, profile editor
- Public profile pages at /profile/:id — banner, avatar, member-since,
  stats strip (projects/teams/skills), owned + joined project grids
- Team Workspace at /projects/:id/workspace (members only)
- Email notifications via Resend for join requests and responses
- Branding: inline SVG logo in NavBar, favicon.svg + logo.svg in /frontend/public
- Privacy hardening: all public endpoints filter user data through
  `publicUserColumns` (2026-06-12)
- Admin analytics dashboard at /admin (admin-only): growth, activation, core-loop
  health, engagement, marketplace balance, audience quality. Backed by
  `admin.overview` (adminProcedure) + `getAdminAnalytics()` in db.ts — returns
  aggregates only, no raw user PII
- Outreach tracker at /admin/outreach (admin-only): log each person contacted,
  generate a unique /?ref=<code> link per contact; signups via that link auto-
  attribute (outreach.attribute, captured client-side in useOutreachCapture).
  Shows contacted → signed up → posted conversion

## Features In Progress / Planned Next
- Notifications system (in-app)
- People/talent discovery tab on Feed
- Project activity signals
- Pagination on project feed
- Rate limiting on mutations

## How Claude Should Work on This Project
- **Start every session by reading this file fully before touching anything**
- Keep responses short — no code explanations unless asked
- State what you're changing before you change it
- Never delete existing features
- Run `npm test` in `/backend` and `/frontend` before committing; add a test with every fix
- Schema changes: update schema.ts + db.ts + routers.ts together, then add a Drizzle migration. Note: WSL2 can't connect to Supabase directly (IPv6 blocked) — apply schema changes via the Supabase SQL editor, not drizzle-kit push
- Flag anything that could break existing functionality before acting
- Prefer editing existing files over creating new ones
- Surface errors in plain English — assume coding basics, not
  advanced internals; explain the "what" and "why" without assuming deep expertise