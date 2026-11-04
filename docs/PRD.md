# pioHub — Product Requirements Document

The product spec: what pioHub is, who it's for, and what it must do. For *how*
it's built see [ARCHITECTURE.md](./ARCHITECTURE.md); for click-by-click flows see
[USERJOURNEY.md](./USERJOURNEY.md).

Last updated: 2026-06-16

---

## 1. One-line summary

pioHub is a platform where students post project ideas, say what roles they need,
and other students request to join — owners approve or reject. A product under the
parent company **pioNox**.

## 2. Problem

Students with an idea can't easily find collaborators, and students who want to
build can't easily find projects worth joining. It happens today through scattered
group chats and word of mouth — no central place, no way to judge who's credible,
no structured way to ask to join. The result: good ideas die alone and capable
people sit idle.

## 3. Vision

The default place students go to start something with others, or to join someone
who already did. Credibility is visible (profiles, project history), the ask is
structured (join requests), and the team has a home once formed (workspace).

## 4. Target users

- **Primary:** university students (starting with second-year+ engineering, our
  own network in Hong Kong) who want to build real projects outside coursework.
- **Two roles, same person over time:**
  - **Owner / founder** — has an idea, needs a team.
  - **Joiner / collaborator** — has skills, wants a project.
- **Later:** the professionals on the other side of the monetization model
  (investors, professors) — out of scope for the current product.

## 5. Goals & success metrics

The product exists to make the **core loop** happen: post → discover → request →
approve → team forms. Health is measured along that loop (mirrors `/admin`):

- **Activation** — % of signups that complete a profile and post or join.
- **Core-loop health** — projects receiving join requests; requests getting a
  decision; approval → team-formed rate.
- **Marketplace balance** — ratio of open roles to people seeking, so neither
  side starves.
- **Engagement / retention** — return visits, active projects over time.

Pre-launch target: a non-empty feed (~5–7 real projects) and the
full loop tested in production before public posting.

## 6. Core features (built)

| # | Feature | Requirement |
|---|---|---|
| F1 | Post a project | Title, description, needed roles, max team size. Owner-only edit/close/reopen/delete. |
| F2 | Browse & filter | Public feed; filter by role; search. |
| F3 | Request to join | Logged-in user sends a message with the request. |
| F4 | Approve / reject | Owner decides; applicant emailed the outcome. |
| F5 | Dashboard | My owned projects, joined projects, profile editor. |
| F6 | Public profiles | `/profile/:id` — banner, avatar, member-since, stats, owned + joined projects. Credibility surface. |
| F7 | Team workspace | `/projects/:id/workspace` — members-only shared links. |
| F8 | Email notifications | Resend emails on join request and on the owner's response. |
| F9 | Admin analytics | `/admin` (admin-only) — growth, activation, core-loop, engagement. Aggregates only, no raw PII. |
| F10 | Outreach tracker | `/admin/outreach` — per-contact `/?ref=` links; signups auto-attribute; contacted → signed-up → posted funnel. |

## 7. Product requirements that are non-negotiable

These are product constraints, not just engineering preferences. Enforcement
details live in ARCHITECTURE.md and [CLAUDE.md](../CLAUDE.md).

- **Privacy.** Public endpoints must never expose email, Clerk ID, or role. Public
  user data is limited to: name, university, skills, portfolio link, bio, join
  date. (We shipped and fixed this exact leak on 2026-06-12.)
- **Authorization is server-side.** Hiding a UI button is not access control; every
  mutation re-checks ownership/membership on the backend.
- **Trust & safety.** User-supplied URLs validated server-side as http(s) only (no `javascript:`
  links). Auth via Clerk (we never store passwords).
- **Brand & design.** Name is always pioHub / pioNox. Deep-navy +
  warm-white + gold palette, Inter font, shadcn/ui components, mobile responsive.

## 8. Out of scope (now)

Deferred until real users exist:
in-app notifications, people/talent discovery tab, feed pagination, rate limiting,
in-app multi-account switching. The **leaderboard → matchmaking → commission**
monetization (FOUNDATIONALPLAN) is long-term and intentionally far out — it only
works with traction.

## 9. Open questions

- Leaderboard ranking signal that proves real interest and resists gaming (TBD).
- When to introduce talent discovery vs. keeping the loop project-first.
- Legal pages (privacy/terms) and Resend sender domain still gate public launch.
