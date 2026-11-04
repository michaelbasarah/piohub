# pioHub — Foundation Plan

## Goal
Rebuild pioHub on a strong, scalable, legally compliant foundation.
Keep the existing design and features — replace everything underneath.

---

## How a Web App Is Built (Layer by Layer)

### Layer 1 — Auth (Who are you?)
**What it means:** How users sign in. Every other layer depends on this.

**Problem with current setup:** Auth is locked into Manus's OAuth system. We don't control it.

**Tool:** Clerk (https://clerk.com)
- Handles sign up, login, password reset, email verification
- GDPR compliant, user data is ours
- Free up to 10,000 monthly users → $25/month after

---

### Layer 2 — Database (Where is the data stored?)
**What it means:** Every user, project, and join request lives here.

**Tool:** PostgreSQL via Supabase (https://supabase.com)
- Industry standard, managed, backed up
- Includes file storage for future use (profile pictures etc.)
- Free tier covers early growth → $25/month for Pro

**ORM (how code talks to the database):** Drizzle ORM — already in codebase, keep it.

---

### Layer 3 — Backend (The brain)
**What it means:** Server-side code that receives requests, talks to the database, applies rules, sends responses. Users never see it.

**Tool:** Node.js + tRPC — already in codebase, keep it.
- Add rate limiting, input validation (Zod — already there), and access control

**Hosting:** Railway (https://railway.app)
- ~$5/month hobby → ~$20/month as we scale

---

### Layer 4 — Frontend (What users see)
**What it means:** Everything visible in the browser.

**Tools:** React + TypeScript + Tailwind CSS + shadcn/ui — keep everything as-is.
- Only rewire it to talk to the new backend and Clerk instead of Manus

**Hosting:** Vercel (https://vercel.com)
- Built for React, free tier, auto-deploys from GitHub

---

### Layer 5 — Email (Notifications)
**What it means:** Sending emails for join requests, approvals, rejections.

**Tool:** Resend (https://resend.com) — already integrated, keep it.
- 3,000 emails/month free → $20/month after

---

### Layer 6 — Security (Protection)
**What it means:** Ensuring only the right people can do the right things.

| Threat | Protection |
|---|---|
| Fake/bot signups | Clerk handles this |
| Form/API spam | Rate limiting via Upstash (https://upstash.com) — free tier |
| SQL injection | Drizzle ORM prevents this by design |
| Accessing other users' data | Row-level access control in every backend route |
| Exposed API keys/secrets | Environment variables, never in code |
| Unencrypted connections | HTTPS via Vercel + Railway automatically |

---

### Layer 7 — Legal (Compliance)
**What it means:** Required by law when you collect user data (emails, names, universities).

**Documents to create:**
- Privacy Policy — what data we collect, why, how long we keep it
- Terms of Service — rules for using pioHub
- Cookie Policy — what cookies we set and why
- GDPR compliance — required if any users are in Europe

**Tool:** Termly (https://termly.io) or AI-assisted, tailored to pioHub's data flows.

---

### Layer 8 — Domain (Your address)
**What it means:** The URL users type to visit the site (e.g. piohub.io).

**Tool:** Namecheap (https://namecheap.com) or Cloudflare Registrar (https://cloudflare.com/registrar)
- ~$10–15/year
- Connect to Vercel in minutes

---

### Layer 9 — Monitoring (Is everything working?)
**What it means:** Know when something breaks before users do.

**Tools:**
- Sentry (https://sentry.io) — catches errors and shows exactly what broke. Free tier.
- Vercel + Railway both have built-in uptime monitoring

---

## Full Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Auth | Clerk | Free → $25/mo |
| Database | Supabase (PostgreSQL) | Free → $25/mo |
| ORM | Drizzle ORM | Free |
| Backend | Node.js + tRPC on Railway | ~$5/mo |
| Frontend | React + TS + Tailwind + shadcn on Vercel | Free |
| Email | Resend | Free → $20/mo |
| Rate limiting | Upstash Redis | Free |
| Error monitoring | Sentry | Free |
| Domain | Namecheap / Cloudflare | ~$12/year |
| Legal docs | Termly or AI-assisted | Free |
| **Total** | | **~$5–10/month to start** |

---

## Build Order

| Step | Task | Status |
|---|---|---|
| 0 | Git setup — repo initialized, .gitignore created | ✅ |
| 1 | Set up accounts — Supabase, Clerk, Vercel, Railway, Resend, Sentry | ✅ |
| 2 | Database — migrate schema from MySQL to PostgreSQL | ✅ |
| 3 | Auth — replace Manus OAuth with Clerk | ✅ |
| 4 | Backend — rewire tRPC routes to new DB + Clerk | ✅ |
| 5 | Frontend — rewire pages to new backend, keep all UI | ✅ |
| 6 | Security — rate limiting, access control audit | 🟨 data-exposure audit done (2026-06-12); rate limiting still TODO |
| 7 | Legal pages — Privacy Policy, Terms of Service | ⬜ |
| 8 | Domain — buy and connect | ⬜ |
| 9 | Deploy — go live on Vercel + Railway | ✅ was live, auto-deploying from GitHub (now on hold) |
| 10 | Monitoring — Sentry connected, test everything | ⬜ |

---

## Monetization Strategy (Long-Term Vision)

pioHub is free for students — we don't charge them. The revenue model is a
**leaderboard → matchmaking → commission** pipeline:

1. **Leaderboard.** Surface the best/most-loved projects via a ranking signal
   (likes, join-request volume, member count, engagement — exact metric TBD,
   pick whatever best proves real public interest and resists gaming).
2. **Validation for free.** A project sitting on top of the leaderboard is
   public proof of two things at once: the team is competent, and people
   actually want the idea. That validation is the product we're selling.
3. **Matchmaking.** For top projects, we connect the right professional:
   - Startup-type idea → **investors** to fund/support it
   - Research-type idea → **professors / mentors** to guide it
4. **Commission.** When a deal happens (funding, partnership, etc.), pioHub
   earns a percentage. We save the professionals the work of finding talent,
   and save students the work of finding backers — and the leaderboard already
   pre-qualifies both sides.

**Why this is "far later," not now:** it only works once the platform has real
users and active projects — a leaderboard of an empty platform proves nothing,
and we can't credibly bring in investors/professors without traction. Sequence
is: get users → engagement → leaderboard → then approach professionals.

---

## Notes
- Zero visible change to users — same design, same features
- Budget target: under $50/month
- All tools chosen for free tiers that scale gracefully
- Legal compliance built in from the start, not added later


