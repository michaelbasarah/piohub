# pioHub — User Journey Flow

The actual click-paths through pioHub, end to end. Pairs with
[PRD.md](./PRD.md) (what & why) and [ARCHITECTURE.md](./ARCHITECTURE.md)
(what happens behind each click). Pages referenced live in
`frontend/src/pages/`.

Last updated: 2026-06-16

---

## The core loop (the one that matters)

```
  OWNER                                   JOINER
  ─────                                   ──────
  Sign up ─► Create profile               Sign up ─► Create profile
     │                                        │
     ▼                                        ▼
  Post a project ──────────────►  Browse / filter feed
  (title, roles, team size)               │
     │                                     ▼
     │                            Open project ─► view owner profile
     │                                     │
     │                                     ▼
     │              ◄───────────  Request to join (+ message)
     ▼                                     │
  Email: "new request"                     │
     │                                     ▼
  Review request ─► Approve/Reject   Email: "you're in" / "not this time"
     │                                     │
     ▼                                     ▼
        Both land in the Team Workspace (members only)
```

Everything below is the detail on each leg.

---

## 1. First-time visitor → signed-up user

1. Lands on **Home** (`/`) — landing copy: "Start something. Or join someone who
   did." CTAs throughout.
2. Clicks sign up → **Clerk** modal (email or Google OAuth). No passwords stored
   by us.
3. On first sign-in the backend auto-creates their `users` row (linked to Clerk by
   `clerkId`).
4. Redirected straight to **Browse** (`/projects`) — not back to the landing page.
   *(This was test-feedback #1; fixed.)*

**Friction watched:** profile/data can lag a beat right after sign-in — felt like a
failed login in testing. Keep this fast.

## 2. Becoming credible — the profile

1. From **Dashboard** (`/dashboard`) → profile editor: name, university, skills,
   portfolio link, bio.
2. Public profile renders at **`/profile/:id`** — banner, gold-ring avatar,
   member-since, stats strip, owned + joined project grids.
3. Other users can open this profile from any project (owner and applicants are
   clickable). Credibility is the point — people decide who to team with here.

## 3. Owner path — post a project

1. **Create Project** (`/projects/new`) — title, description, needed roles,
   max team size.
2. Project appears on the public **Feed**.
3. Owner can later **Edit** (`/projects/:id/edit`), **close**, **reopen**, or
   **delete** it (owner-only, re-checked server-side).

## 4. Joiner path — discover & request

1. **Feed** (`/projects`) — browse all open projects; filter by role; search.
2. Open **Project Detail** (`/projects/:id`) — read it, check needed roles, click
   through to the owner's profile.
3. Logged in → **Request to join** with a short message. Logged out → prompted to
   sign in first (the action literally cannot run server-side without auth).
4. Owner receives an email (Resend): "new join request."

## 5. The decision — approve or reject

1. Owner sees pending requests (Dashboard / project view).
2. **Approve** → applicant added to `projectMembers`, emailed "you're in."
   **Reject** → emailed the outcome.
3. Ownership is re-verified on the backend before the change — UI hiding is not the
   gate. *(See ARCHITECTURE.md "follow one click" for the full trace.)*

## 6. After the team forms — workspace

1. Approved members reach **Team Workspace** (`/projects/:id/workspace`) — a
   members-only area for shared links (`workspaceLinks`).
2. A guidance banner orients new teams on what to put there.
3. Non-members are blocked server-side, not just hidden in the UI.

---

## Admin / founder journeys (not user-facing)

- **Analytics** — `/admin` (admin role only): growth, activation, core-loop health,
  engagement, marketplace balance. Aggregates only.
- **Outreach** — `/admin/outreach`: log each person contacted, generate a unique
  `/?ref=<code>` link. A signup via that link auto-attributes to the contact
  (captured client-side in `useOutreachCapture`), giving a contacted → signed-up →
  posted funnel.

---

## Edge cases & states to keep honest

- **Empty feed** — pre-launch risk; smart empty states with CTAs, and seeding
  5–7 real projects before public launch.
- **Logged-out actions** — browsing is public; posting/joining/approving require
  auth and fail server-side if attempted without it.
- **Not-the-owner** — edit/close/delete/approve all re-check ownership on the
  backend.
- **Two accounts, one browser** — browsers share one login across tabs (by design,
  like Gmail); test with a normal + incognito window, not two tabs.
