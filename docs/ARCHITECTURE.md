# pioHub — How Everything Works (Start Here)

A plain-English tour of how pioHub is built, written for people who are **not**
developers. If you're trying to understand the project without reading the code,
read this first. For the deeper build plan and decisions, see
[FOUNDATIONALPLAN.md](./FOUNDATIONALPLAN.md).

---

## The one-sentence version

> A student opens a website (served by **Vercel**), signs in (handled by
> **Clerk**), their clicks travel to our brain (running on **Railway**), which
> reads and writes data in our database (**Supabase**), and sometimes sends an
> email (**Resend**).

Everything below is just detail on those five players.

---

## The five services (the restaurant analogy)

Think of pioHub as a restaurant. We don't own any servers — we *rent* five
specialised services, each doing one job well.

| Service | Restaurant role | In plain terms | If it goes down |
|---|---|---|---|
| **Vercel** | The dining room | Hosts the website users see and click | Site won't load at all |
| **Clerk** | The bouncer / ID check | Sign-up, login, "prove who you are" | Nobody can log in |
| **Railway** | The kitchen | Our server code — applies the rules | Site loads but nothing works |
| **Supabase** | The storage room | The database — every user, project, request | Data can't be read or saved |
| **Resend** | The mail courier | Sends notification emails | Everything works, just no emails |

These are five separate companies' computers, talking to each other over the
internet. That's modern software — you assemble specialised rented pieces
instead of building one giant machine.

---

## Two halves of our own code

Everything we write lives in one place (our GitHub repo), split into two folders:

```
pioHub/
├── frontend/   →  what users SEE      →  deployed to Vercel
└── backend/    →  the BRAIN / rules   →  deployed to Railway
```

This split is the most important idea in the whole project:

- **Frontend = the menu and the waiter.** Pretty, friendly, in front of the
  customer. It runs on the user's own computer, so we can't fully trust it —
  anyone can mess with what's in front of them.
- **Backend = the kitchen.** Hidden. It enforces every rule ("you can't edit a
  project you don't own"). Even if someone tampers with the menu, they can't get
  past the kitchen.

**Why separate them?** Security. The frontend *proposes* an action; the backend
*decides* whether it's allowed. That's why you'll see ownership checks in the
backend even when the button is already hidden in the UI.

---

## The data flow — follow one click

Let's trace **"a student approves someone's request to join their project."**
This one example touches all five services.

```
  1. CLICK — student clicks "Approve" in the browser
        │
        ▼
  2. FRONTEND (Vercel) — packages "approve request #42",
        asks Clerk for this user's ID badge (a token)
        │
        ▼
  3. CLERK — hands back a signed token proving who the user is
        │
        ▼   (request flies across the internet, token attached)
  4. BACKEND (Railway):
        - checks the token with Clerk → "yes, this is really user #7"
        - checks: does user #7 actually OWN the project for request #42?
        - if not → REJECTED ("Not authorized")
        - if yes → update the database
        │
        ▼
  5. SUPABASE — marks request #42 "approved", adds the person to the team
        │
        ▼
  6. RESEND (sometimes) — emails the applicant "You're in!"
        │
        ▼   (answer travels back)
  7. FRONTEND — screen updates: request gone, new member shown
```

The key takeaway: **step 4 is where safety lives.** The browser *asked* to
approve, but the backend *decided* whether it was allowed. The frontend
proposes; the backend disposes.

---

## How the pieces find each other

They connect through **addresses and keys**, stored as "environment variables"
(secret settings kept out of the code).

- **Frontend → Backend:** the frontend knows the backend's web address
  (`VITE_API_URL`, the Railway URL). Set in `frontend/src/lib/trpc.ts`.
- **Frontend → Clerk:** set up once in `frontend/src/main.tsx`, so any screen
  can ask "who's logged in?"
- **Backend → Clerk:** holds a secret Clerk key to verify tokens are real
  (`backend/src/middleware/clerkAuth.ts`).
- **Backend → Supabase:** one connection string (`DATABASE_URL`) — the address
  and password to our database.
- **Backend → Resend:** an API key to send mail.

> **Why secrets matter:** these keys are the restaurant's keys and safe
> combination. They live only in our local `.env` files and in the Vercel /
> Railway dashboards — **never** in the code on GitHub. If a key leaks, someone
> could impersonate our backend.

---

## File extensions — what `.ts`, `.tsx`, etc. mean

The vocabulary you'll keep seeing, smallest to biggest:

- **`.js`** — JavaScript. The only programming language a web browser actually
  understands.
- **`.ts`** — **TypeScript**: JavaScript plus a *safety layer* that labels what
  kind of data each thing is (a number, some text). The computer then catches
  mistakes *before* users see them — like spell-check for code. Used for logic
  with no visuals (our whole backend).
- **`.tsx`** — TypeScript **+ visuals**. The `x` means the file can also describe
  what appears on screen. **Rule of thumb: if a file draws something it's
  `.tsx`; if it only thinks, it's `.ts`.**
- **`.css`** — styling: colours, spacing, fonts.
- **`.json`** — a settings/data file, not code.
- **`.d.ts`** — a pure "description" file, no working code (see "the clever bit"
  below).

**Why TypeScript matters to us:** a whole category of bugs gets caught on our
screen while building, instead of on a user's screen in public. For a brand
building in public, fewer embarrassing live bugs is real value.

Other words you'll hear: **React** (toolkit for building screens from reusable
pieces called *components*), **Tailwind** (our styling shorthand), **shadcn/ui**
(a kit of ready-made buttons/dialogs), **Vite** (bundles the frontend so it
loads fast), **Wouter** (maps URLs to pages), **Drizzle** (translates our code
into database language).

---

## The clever bit — tRPC and shared types

Normally the frontend and backend are two strangers passing notes, and they
miscommunicate ("I sent a date, you expected text"). **tRPC** makes them speak
one shared language. Because both halves are TypeScript, the frontend
*automatically knows* the exact shape of everything the backend offers (mirrored
into `frontend/src/types/backend/`). If the backend changes, the frontend lights
up red until it's updated — **the two halves can't silently drift apart.** Big
reliability win for a small team.

What the backend can do (`backend/src/routers.ts`), in business terms:
- **auth** — who am I, update my profile, view a profile
- **projects** — list, view one, create, edit, close, delete
- **requests** — ask to join, list pending, approve/reject, see my requests
- **workspace** — the members-only links area
- **profile** — public profile pages

Each ability is **public** (anyone — e.g. browsing) or **protected** (must be
logged in — e.g. creating a project). A protected action literally cannot run
for a logged-out user. That single distinction is the backbone of our access
control.

---

## The database — our five tables

Everything pioHub remembers lives in five tables in Supabase
(`backend/src/schema.ts`):

| Table | Holds | Plain English |
|---|---|---|
| **users** | id, clerkId, name, email, university, skills, bio… | One row per person |
| **projects** | id, ownerId, title, description, neededRoles, maxTeamSize, status | One row per project |
| **projectMembers** | projectId + userId | "This person is on this team" |
| **joinRequests** | projectId, requesterId, message, status | "This person asked to join" |
| **workspaceLinks** | projectId, label, url | Shared links inside a team's workspace |

Notice **users has a `clerkId`.** That's the bridge: Clerk owns the *login*
(passwords, emails — we never store passwords, a big safety and legal win), and
our database owns the *profile* (skills, university, projects). They're linked
by that one ID. The first time you sign in, the backend auto-creates your row.

> We never write raw database commands by hand. **Drizzle** lets us write them in
> normal TypeScript, which also automatically prevents "SQL injection," one of
> the most common ways websites get hacked.

---

## Security — how we protect user data

Four layers, from outside in:

1. **Identity (Clerk).** We never see or store passwords. Clerk hands the
   browser a signed token; the backend verifies it on every protected request
   (`backend/src/middleware/clerkAuth.ts`). Fake token = rejected before any
   code runs.
2. **Public vs protected.** Every backend ability is declared one or the other
   in `backend/src/trpc.ts`. Protected actions literally cannot execute for a
   logged-out caller.
3. **Ownership checks.** Being logged in isn't enough — editing a project also
   re-checks "does this user own it?" in the backend, even though the UI already
   hides the button. The UI hiding things is *politeness*; the backend check is
   *security*.
4. **The data allowlist.** Public answers (project feed, profiles) are packed
   from an explicit list of safe fields — `publicUserColumns` in
   `backend/src/db.ts`: id, name, university, skills, portfolio, bio, join date.
   Email, Clerk ID, and role **never leave the server** on a public endpoint.

> **The lesson behind layer 4 (learned 2026-06-12):** we once returned whole
> database rows on public endpoints. The pages only *displayed* safe fields, but
> the raw API response carried every user's email — visible to anyone who opened
> browser dev tools. The fix and the rule: **judge an endpoint by its raw
> response, not by what the page shows.** Default to an allowlist ("only send
> these fields"), never a blocklist ("send everything except...").

Also standing: Drizzle prevents SQL injection by design; Zod validates every
input (links must be real http(s) URLs, which blocks `javascript:` tricks); React
escapes everything it renders, blocking script-injection (XSS); HTTPS is
automatic on Vercel/Railway; secrets live only in `.env` files and host
dashboards, never in the code on GitHub.

---

## How a change goes live

```
We edit code  →  push to GitHub  →  two things happen automatically:
   • Vercel sees the change → rebuilds & redeploys the FRONTEND
   • Railway sees the change → rebuilds & redeploys the BACKEND
```

GitHub is the single source of truth; Vercel and Railway watch it and update
themselves. One detail: `frontend/vercel.json` redirects all URLs to the app, so
refreshing on a page like `/dashboard` doesn't break.

---

## Where things stand

Done: the platform runs end-to-end (Vercel + Clerk + Railway + Supabase +
Resend), public endpoints are privacy-hardened (no email/ID leakage), branding
is in (logo, favicon), and the marketing-facing pages (landing, profiles) are
polished for traffic. Still ahead before a public launch: rate limiting, legal
pages (privacy/terms), a custom domain, switching Clerk to production keys, and
error monitoring. Running cost target: a few dollars a month to start, on free tiers
that scale. The project has been on hold since 2026-06-26.

---

## 30-second recap

> Five rented services, each doing one job. Our code is split in two: a
> **frontend** (what users see, on Vercel) and a **backend** (the rules, on
> Railway). The frontend is friendly but untrusted; the backend is hidden and
> enforces every rule. Clerk proves who you are, Supabase remembers everything,
> Resend sends mail. They stay in sync because the whole thing is written in
> **TypeScript**, which catches mistakes before users do.
