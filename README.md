# piohub

A place for students to find teammates. You post an idea and list the roles
you need. Other students ask to join with a short note, and you approve or
reject them. Once the team exists it gets a members-only workspace. An admin
side tracks whether any of this is working: activation and core-loop numbers,
plus per-contact outreach links that show who signed up and who went on to post.

**Status: on hold since June 2026.** It ran in production (Vercel + Railway +
Supabase + Clerk) and was ready for its first users. Then I parked it to
work on other things before a public launch. This repo is the code as it
stood, plus the tests and cleanup it needed to be public.

## Why it exists

At university, projects get started in group chats and die in them. If you have
an idea you can't easily find a designer or a backend person. If you have
skills, you can't easily find a project worth joining. Nothing shows who is
credible, and there's no structured way to ask to join. pioHub is that one
loop: **post → discover → request → approve → team forms**.

It started as a no-code prototype. I rebuilt it on a stack I own and can
reason about. The design stayed, everything underneath was replaced.
[docs/FOUNDATIONALPLAN.md](docs/FOUNDATIONALPLAN.md) has the layer-by-layer
reasoning.

## What's in it

| | |
|---|---|
| `frontend/` | React 18 + TypeScript + Vite, Tailwind v4 + shadcn/ui, Wouter routing, Clerk sign-in |
| `backend/` | Express + tRPC + Zod, Drizzle ORM on Postgres (Supabase), Clerk token check, Resend emails |
| `backend/drizzle/` | SQL migrations, applied on deploy by `src/migrate.ts` |
| `docs/` | [PRD](docs/PRD.md), [user journey](docs/USERJOURNEY.md), [plain-English architecture](docs/ARCHITECTURE.md), [stack plan](docs/FOUNDATIONALPLAN.md) |

The parts I'd point at:

- **End-to-end types.** The frontend imports the backend's `AppRouter` type,
  so a change in what the server returns shows up as a compile error in the
  UI. The frontend deploys on its own (Vercel only installs `frontend/`), so
  it reads a generated snapshot in `frontend/src/types/backend/`. CI fails if
  the snapshot drifts from the backend.
- **The privacy allowlist.** At one point the public feed and profile
  endpoints returned whole user rows, emails and Clerk IDs included. The
  pages only showed names, but anyone could read the rest in dev tools. Every
  public query now selects through `publicUserColumns` in `backend/src/db.ts`.
  A test checks the raw JSON of each public endpoint for private fields.
- **Authorization lives on the server.** Every mutation re-checks ownership or
  membership. Hiding a button is a courtesy, not access control.
- **Outreach attribution.** Each person you reach out to gets a `/?ref=<code>`
  link. The code is stored when they first visit and claimed when they sign
  in (`useOutreachCapture`). The admin page then shows contacted → signed up
  → posted for each contact.
- **Admin analytics** (`getAdminAnalytics`). Six questions answered from raw
  tables: growth, activation, core-loop health, engagement, marketplace
  balance and audience. It returns aggregates only, no user PII.

## Run it locally

Node 22. You need a Postgres database (a free Supabase project works) and a
Clerk application. Resend is optional: without a key, emails are skipped.

```bash
cp .env.example .env                    # backend settings, repo root
cp frontend/.env.example frontend/.env.local

cd backend
npm ci
npm run build && node dist/migrate.js   # creates the tables
npm run dev                             # http://localhost:3000/health

cd ../frontend
npm ci
npm run dev                             # http://localhost:5173
```

To make yourself an admin (for `/admin` and `/admin/outreach`), sign in once,
then run `update users set role = 'admin' where email = '<you>';` in SQL.

Deploys as two services: `frontend/` to Vercel (`vercel.json` sends every path
to the SPA) and `backend/` to Railway (`railway.json` builds, migrates, then
starts).

## Tests

```bash
cd backend  && npm test    # 27 tests
cd frontend && npm test    # 11 tests
```

Neither needs a network or an account. Backend tests run the real tRPC
routers and the real SQL against [PGlite](https://pglite.dev), which is
Postgres compiled to WASM and running in-process. They apply the same
migration files production uses. Clerk is replaced with a fake that verifies
`good-token-<id>`, and `fetch` is stubbed so no email goes out. They cover:

- public endpoints never leak email, Clerk ID or role
- logged-out and non-admin callers are refused, and only owners can edit,
  close, delete or approve
- the join flow: duplicate requests, joining your own project, a full team
  refusing a member while keeping the request pending, and the email each
  side gets
- workspace links are members-only and accept http(s) links only
- outreach codes attribute one signup each, and analytics come out right
  from a known set of rows, including an empty database
- first sign-in creates the user from the Clerk profile

Frontend tests (Vitest + Testing Library + jsdom) cover `ProjectForm`
validation, `ProjectCard`, `RoleTag` and the `?ref=` capture hook.
GitHub Actions runs build and tests for both halves on every push.

Writing these tests found two real bugs, both fixed here:

- **`javascript:` links.** Zod's `.url()` accepts anything `new URL()` can
  parse, `javascript:alert(1)` included. Portfolio and workspace links are
  rendered as `<a href>`, so this was a stored-XSS hole. Links must now be
  http(s).
- **The outreach migration never ran.** It wasn't in Drizzle's journal, so
  `migrate()` skipped it. It's journaled now.

A third fix: names and project titles are now HTML-escaped in emails.

## Demo

TODO: screenshots of the feed, a project page and the admin dashboard with
demo data. The production instance is offline and the UI needs a Clerk app to
render, so none are included yet.

## Not in this repo

The original no-code prototype, my marketing and content plans, and the
deployment's real keys and data. Settings come from `.env` (see
`.env.example`), which is gitignored.

## License

MIT, see [LICENSE](LICENSE).
