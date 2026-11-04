import { and, desc, eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ENV } from "./env";
import {
  InsertUser,
  joinRequests,
  outreachContacts,
  projectMembers,
  projects,
  users,
  workspaceLinks,
} from "./schema";

// postgres.js connects lazily, so importing this module never opens a socket.
// Tests swap in an in-memory Postgres (PGlite) through setDb().
type Db = PgDatabase<PgQueryResultHKT>;
export let db: Db = drizzle(postgres(ENV.databaseUrl, { ssl: "require" }));
export function setDb(next: Db) {
  db = next;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.clerkId) throw new Error("clerkId is required");

  const updateSet: Partial<InsertUser> = {};
  if (user.name !== undefined) updateSet.name = user.name ?? null;
  if (user.email !== undefined) updateSet.email = user.email ?? null;
  if (user.role !== undefined) updateSet.role = user.role;
  if (user.lastSignedIn !== undefined) updateSet.lastSignedIn = user.lastSignedIn;
  updateSet.updatedAt = new Date();

  await db
    .insert(users)
    .values({ ...user, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: updateSet,
    });
}

export async function getUserByClerkId(clerkId: string) {
  const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

// Public-safe user fields — anything returned by a public endpoint must use
// this selection. Never expose email, clerkId, or role.
const publicUserColumns = {
  id: users.id,
  name: users.name,
  university: users.university,
  skills: users.skills,
  portfolioLink: users.portfolioLink,
  bio: users.bio,
  createdAt: users.createdAt,
};

export async function updateUserProfile(
  userId: number,
  data: {
    university?: string | null;
    skills?: string | null;
    portfolioLink?: string | null;
    bio?: string | null;
    name?: string | null;
  }
) {
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function createProject(data: {
  ownerId: number;
  title: string;
  description: string;
  neededRoles: string[];
  maxTeamSize: number;
}): Promise<number> {
  const result = await db
    .insert(projects)
    .values({
      ownerId: data.ownerId,
      title: data.title,
      description: data.description,
      neededRoles: JSON.stringify(data.neededRoles),
      maxTeamSize: data.maxTeamSize,
    })
    .returning({ id: projects.id });
  return result[0].id;
}

export async function listOpenProjects() {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "open"))
    .orderBy(desc(projects.createdAt));

  const ownerIds = Array.from(new Set(rows.map((p) => p.ownerId)));
  const projectIds = rows.map((p) => p.id);
  const [owners, members] = await Promise.all([
    ownerIds.length > 0
      ? db.select(publicUserColumns).from(users).where(inArray(users.id, ownerIds))
      : Promise.resolve([]),
    projectIds.length > 0
      ? db.select().from(projectMembers).where(inArray(projectMembers.projectId, projectIds))
      : Promise.resolve([]),
  ]);
  const ownerMap = new Map(owners.map((u) => [u.id, u]));
  const memberCountMap = new Map<number, number>();
  for (const m of members) {
    memberCountMap.set(m.projectId, (memberCountMap.get(m.projectId) ?? 0) + 1);
  }

  return rows.map((p) => ({
    ...p,
    neededRoles: JSON.parse(p.neededRoles) as string[],
    owner: ownerMap.get(p.ownerId) ?? null,
    memberCount: (memberCountMap.get(p.id) ?? 0) + 1,
  }));
}

export async function getProjectById(id: number) {
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!rows[0]) return undefined;
  const project = rows[0];

  const [ownerRows, memberRows] = await Promise.all([
    db.select(publicUserColumns).from(users).where(eq(users.id, project.ownerId)).limit(1),
    db.select().from(projectMembers).where(eq(projectMembers.projectId, id)),
  ]);
  const owner = ownerRows[0] ?? null;
  const memberUserIds = memberRows.map((m) => m.userId);
  const memberUsers =
    memberUserIds.length > 0
      ? await db.select(publicUserColumns).from(users).where(inArray(users.id, memberUserIds))
      : [];

  return {
    ...project,
    neededRoles: JSON.parse(project.neededRoles) as string[],
    owner,
    members: memberUsers,
    memberCount: memberUsers.length + 1,
  };
}

export async function getProjectsByOwner(ownerId: number) {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, ownerId))
    .orderBy(projects.createdAt);
  return rows.map((p) => ({ ...p, neededRoles: JSON.parse(p.neededRoles) as string[] }));
}

export async function getJoinedProjects(userId: number) {
  const memberRows = await db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId));
  if (memberRows.length === 0) return [];
  const projectIds = memberRows.map((m) => m.projectId);
  const rows = await db.select().from(projects).where(inArray(projects.id, projectIds));
  return rows.map((p) => ({ ...p, neededRoles: JSON.parse(p.neededRoles) as string[] }));
}

// ─── Join Requests ─────────────────────────────────────────────────────────────

export async function createJoinRequest(data: {
  projectId: number;
  requesterId: number;
  message?: string;
}) {
  const result = await db
    .insert(joinRequests)
    .values({
      projectId: data.projectId,
      requesterId: data.requesterId,
      message: data.message ?? null,
    })
    .returning({ id: joinRequests.id });
  return result[0].id;
}

export async function getJoinRequestById(requestId: number) {
  const rows = await db
    .select()
    .from(joinRequests)
    .where(eq(joinRequests.id, requestId))
    .limit(1);
  return rows[0];
}

export async function getExistingRequest(projectId: number, requesterId: number) {
  const rows = await db
    .select()
    .from(joinRequests)
    .where(
      and(eq(joinRequests.projectId, projectId), eq(joinRequests.requesterId, requesterId))
    )
    .limit(1);
  return rows[0];
}

export async function getPendingRequestsForProject(projectId: number) {
  const rows = await db
    .select()
    .from(joinRequests)
    .where(and(eq(joinRequests.projectId, projectId), eq(joinRequests.status, "pending")));

  const requesterIds = rows.map((r) => r.requesterId);
  const requesters =
    requesterIds.length > 0
      ? await db.select().from(users).where(inArray(users.id, requesterIds))
      : [];
  const requesterMap = new Map(requesters.map((u) => [u.id, u]));

  return rows.map((r) => ({ ...r, requester: requesterMap.get(r.requesterId) ?? null }));
}

export async function getPendingRequestsForOwner(ownerId: number) {
  const ownerProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, ownerId));
  if (ownerProjects.length === 0) return [];

  const projectIds = ownerProjects.map((p) => p.id);
  const rows = await db
    .select()
    .from(joinRequests)
    .where(and(inArray(joinRequests.projectId, projectIds), eq(joinRequests.status, "pending")));

  const requesterIds = Array.from(new Set(rows.map((r) => r.requesterId)));
  const requesters =
    requesterIds.length > 0
      ? await db.select().from(users).where(inArray(users.id, requesterIds))
      : [];
  const requesterMap = new Map(requesters.map((u) => [u.id, u]));
  const projectMap = new Map(ownerProjects.map((p) => [p.id, p]));

  return rows.map((r) => ({
    ...r,
    requester: requesterMap.get(r.requesterId) ?? null,
    project: projectMap.get(r.projectId) ?? null,
  }));
}

export async function respondToJoinRequest(
  requestId: number,
  ownerId: number,
  status: "approved" | "rejected"
) {
  const reqRows = await db
    .select()
    .from(joinRequests)
    .where(and(eq(joinRequests.id, requestId), eq(joinRequests.status, "pending")))
    .limit(1);
  if (!reqRows[0]) throw new Error("Request not found or already resolved");
  const req = reqRows[0];

  const projectRows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, req.projectId), eq(projects.ownerId, ownerId)))
    .limit(1);
  if (!projectRows[0]) throw new Error("Not authorized");
  const project = projectRows[0];

  await db
    .update(joinRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(joinRequests.id, requestId));

  if (status === "approved") {
    const currentMembers = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, req.projectId));

    if (currentMembers.length + 1 >= project.maxTeamSize) {
      await db
        .update(joinRequests)
        .set({ status: "pending", updatedAt: new Date() })
        .where(eq(joinRequests.id, requestId));
      throw new Error("Project team is already full");
    }

    const alreadyMember = currentMembers.some((m) => m.userId === req.requesterId);
    if (!alreadyMember) {
      await db.insert(projectMembers).values({
        projectId: req.projectId,
        userId: req.requesterId,
      });
    }
  }
}

export async function getUserJoinRequestStatuses(userId: number) {
  const rows = await db
    .select()
    .from(joinRequests)
    .where(eq(joinRequests.requesterId, userId));

  const projectIds = Array.from(new Set(rows.map((r) => r.projectId)));
  const projectRows =
    projectIds.length > 0
      ? await db.select().from(projects).where(inArray(projects.id, projectIds))
      : [];
  const projectMap = new Map(projectRows.map((p) => [p.id, p]));

  return rows.map((r) => ({ ...r, project: projectMap.get(r.projectId) ?? null }));
}

export async function updateProjectStatus(
  projectId: number,
  ownerId: number,
  status: "open" | "closed"
) {
  const projectRows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);
  if (!projectRows[0]) throw new Error("Not authorized");

  await db
    .update(projects)
    .set({ status, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
}

export async function updateProject(
  projectId: number,
  ownerId: number,
  data: {
    title: string;
    description: string;
    neededRoles: string[];
    maxTeamSize: number;
  }
) {
  const projectRows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);
  if (!projectRows[0]) throw new Error("Not authorized");

  await db
    .update(projects)
    .set({
      title: data.title,
      description: data.description,
      neededRoles: JSON.stringify(data.neededRoles),
      maxTeamSize: data.maxTeamSize,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
}

// ─── Delete Project ───────────────────────────────────────────────────────────

export async function deleteProject(projectId: number, ownerId: number) {
  const projectRows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);
  if (!projectRows[0]) throw new Error("Not authorized");

  await db.delete(workspaceLinks).where(eq(workspaceLinks.projectId, projectId));
  await db.delete(joinRequests).where(eq(joinRequests.projectId, projectId));
  await db.delete(projectMembers).where(eq(projectMembers.projectId, projectId));
  await db.delete(projects).where(eq(projects.id, projectId));
}

// ─── Workspace Links ──────────────────────────────────────────────────────────

export async function getWorkspaceLinks(projectId: number) {
  const links = await db
    .select()
    .from(workspaceLinks)
    .where(eq(workspaceLinks.projectId, projectId))
    .orderBy(desc(workspaceLinks.createdAt));

  const enriched = await Promise.all(
    links.map(async (link) => {
      const user = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, link.addedByUserId))
        .limit(1);
      return { ...link, addedByName: user[0]?.name || "Unknown" };
    })
  );

  return enriched;
}

export async function addWorkspaceLink(
  projectId: number,
  addedByUserId: number,
  label: string,
  url: string
) {
  const isMember = await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, addedByUserId)))
    .limit(1);

  const isOwner = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, addedByUserId)))
    .limit(1);

  if (!isMember[0] && !isOwner[0]) throw new Error("Not a member of this project");

  await db.insert(workspaceLinks).values({ projectId, addedByUserId, label, url });
}

export async function deleteWorkspaceLink(linkId: number, userId: number) {
  const linkRows = await db
    .select()
    .from(workspaceLinks)
    .where(eq(workspaceLinks.id, linkId))
    .limit(1);
  if (!linkRows[0]) throw new Error("Link not found");
  const link = linkRows[0];

  const isOwner = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, link.projectId), eq(projects.ownerId, userId)))
    .limit(1);

  if (link.addedByUserId !== userId && !isOwner[0]) {
    throw new Error("Not authorized to delete this link");
  }

  await db.delete(workspaceLinks).where(eq(workspaceLinks.id, linkId));
}

// ─── Public Profile ───────────────────────────────────────────────────────────

export async function getPublicProfile(userId: number) {
  const user = await db
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user[0]) return null;

  const ownedProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.ownerId, userId), eq(projects.status, "open")))
    .orderBy(desc(projects.createdAt));

  const joinedProjectIds = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId));

  const joinedProjects =
    joinedProjectIds.length > 0
      ? await db
          .select()
          .from(projects)
          .where(
            and(
              inArray(projects.id, joinedProjectIds.map((p) => p.projectId)),
              eq(projects.status, "open")
            )
          )
          .orderBy(desc(projects.createdAt))
      : [];

  return { ...user[0], ownedProjects, joinedProjects };
}

// ─── Outreach Tracker ─────────────────────────────────────────────────────────

function genRefCode(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function createOutreachContact(data: {
  name: string;
  channel?: string | null;
  note?: string | null;
  hasIdea: boolean;
}): Promise<number> {
  let refCode = genRefCode();
  for (let i = 0; i < 5; i++) {
    const clash = await db
      .select({ id: outreachContacts.id })
      .from(outreachContacts)
      .where(eq(outreachContacts.refCode, refCode))
      .limit(1);
    if (!clash[0]) break;
    refCode = genRefCode();
  }
  const result = await db
    .insert(outreachContacts)
    .values({
      name: data.name,
      channel: data.channel ?? null,
      note: data.note ?? null,
      hasIdea: data.hasIdea,
      refCode,
    })
    .returning({ id: outreachContacts.id });
  return result[0].id;
}

export async function listOutreachContacts() {
  const contacts = await db
    .select()
    .from(outreachContacts)
    .orderBy(desc(outreachContacts.createdAt));

  const signedUpIds = contacts
    .map((c) => c.signedUpUserId)
    .filter((x): x is number => x !== null);

  const owners =
    signedUpIds.length > 0
      ? await db
          .select({ ownerId: projects.ownerId })
          .from(projects)
          .where(inArray(projects.ownerId, signedUpIds))
      : [];
  const posterSet = new Set(owners.map((o) => o.ownerId));

  return contacts.map((c) => ({
    ...c,
    signedUp: c.signedUpUserId !== null,
    posted: c.signedUpUserId !== null && posterSet.has(c.signedUpUserId),
  }));
}

export async function deleteOutreachContact(id: number) {
  await db.delete(outreachContacts).where(eq(outreachContacts.id, id));
}

export async function attributeOutreachSignup(refCode: string, userId: number) {
  const rows = await db
    .select()
    .from(outreachContacts)
    .where(eq(outreachContacts.refCode, refCode))
    .limit(1);
  const contact = rows[0];
  if (!contact || contact.signedUpUserId !== null) return { matched: false };

  // Don't attribute the same user to more than one contact
  const already = await db
    .select({ id: outreachContacts.id })
    .from(outreachContacts)
    .where(eq(outreachContacts.signedUpUserId, userId))
    .limit(1);
  if (already[0]) return { matched: false };

  await db
    .update(outreachContacts)
    .set({ signedUpUserId: userId })
    .where(eq(outreachContacts.id, contact.id));
  return { matched: true };
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────
// Aggregates the whole platform into the 6 questions our dashboard answers.
// Computed in JS over full-table reads — fine at our scale, and keeps the SQL
// simple. Returns only numbers and small derived lists — never raw user PII.

export async function getAdminAnalytics() {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const HOUR = 60 * 60 * 1000;
  const weekAgo = new Date(now - 7 * DAY);
  const twoWeeksAgo = new Date(now - 14 * DAY);
  const thirtyAgo = new Date(now - 30 * DAY);

  const [allUsers, allProjects, allMembers, allRequests, allLinks] = await Promise.all([
    db
      .select({
        id: users.id,
        role: users.role,
        university: users.university,
        skills: users.skills,
        bio: users.bio,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users),
    db
      .select({
        id: projects.id,
        ownerId: projects.ownerId,
        status: projects.status,
        neededRoles: projects.neededRoles,
        maxTeamSize: projects.maxTeamSize,
        createdAt: projects.createdAt,
      })
      .from(projects),
    db.select().from(projectMembers),
    db.select().from(joinRequests),
    db.select({ projectId: workspaceLinks.projectId }).from(workspaceLinks),
  ]);

  const ms = (d: Date | string) => new Date(d).getTime();
  const since = (d: Date | string, t: Date) => ms(d) >= t.getTime();
  const pct = (num: number, den: number) => (den === 0 ? 0 : Math.round((num / den) * 1000) / 10);
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
  const parseList = (json: string | null): string[] => {
    if (!json) return [];
    try {
      const v = JSON.parse(json);
      return Array.isArray(v) ? (v as string[]) : [];
    } catch {
      return [];
    }
  };

  // ── Totals ──
  const totalUsers = allUsers.length;
  const totalProjects = allProjects.length;
  const openProjects = allProjects.filter((p) => p.status === "open").length;

  const membersByProject = new Map<number, number>();
  for (const m of allMembers) {
    membersByProject.set(m.projectId, (membersByProject.get(m.projectId) ?? 0) + 1);
  }
  const teamsFormed = [...membersByProject.values()].filter((c) => c >= 1).length;

  // ── Q1: Growth ──
  const inPrevWeek = (d: Date | string) => since(d, twoWeeksAgo) && !since(d, weekAgo);
  const signupsThisWeek = allUsers.filter((u) => since(u.createdAt, weekAgo)).length;
  const signupsPrevWeek = allUsers.filter((u) => inPrevWeek(u.createdAt)).length;
  const projectsThisWeek = allProjects.filter((p) => since(p.createdAt, weekAgo)).length;
  const projectsPrevWeek = allProjects.filter((p) => inPrevWeek(p.createdAt)).length;
  const requestsThisWeek = allRequests.filter((r) => since(r.createdAt, weekAgo)).length;

  const signupsByDay: { date: string; count: number }[] = [];
  const projectsByDay: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const key = dayKey(now - i * DAY);
    signupsByDay.push({ date: key, count: allUsers.filter((u) => dayKey(ms(u.createdAt)) === key).length });
    projectsByDay.push({ date: key, count: allProjects.filter((p) => dayKey(ms(p.createdAt)) === key).length });
  }

  // ── Q2: Activation ──
  const ownerIds = new Set(allProjects.map((p) => p.ownerId));
  const requesterIds = new Set(allRequests.map((r) => r.requesterId));
  const memberIds = new Set(allMembers.map((m) => m.userId));

  const earliest = (map: Map<number, number>, id: number, t: number) => {
    if (!map.has(id) || t < map.get(id)!) map.set(id, t);
  };
  const firstProjectByUser = new Map<number, number>();
  for (const p of allProjects) earliest(firstProjectByUser, p.ownerId, ms(p.createdAt));
  const firstRequestByUser = new Map<number, number>();
  for (const r of allRequests) earliest(firstRequestByUser, r.requesterId, ms(r.createdAt));

  let activatedUsers = 0;
  for (const u of allUsers) {
    const signup = ms(u.createdAt);
    const fp = firstProjectByUser.get(u.id);
    const fr = firstRequestByUser.get(u.id);
    const acted =
      (fp !== undefined && fp - signup <= 7 * DAY) || (fr !== undefined && fr - signup <= 7 * DAY);
    if (acted) activatedUsers++;
  }
  const profileCompleted = allUsers.filter((u) => parseList(u.skills).length > 0 && !!u.bio).length;
  const lurkers = allUsers.filter(
    (u) => !ownerIds.has(u.id) && !requesterIds.has(u.id) && !memberIds.has(u.id)
  ).length;

  // ── Q3: Core loop ──
  const projectsWithRequests = new Set(allRequests.map((r) => r.projectId)).size;
  const pending = allRequests.filter((r) => r.status === "pending").length;
  const approved = allRequests.filter((r) => r.status === "approved").length;
  const rejected = allRequests.filter((r) => r.status === "rejected").length;
  const responded = approved + rejected;

  const respondedReqs = allRequests.filter((r) => r.status !== "pending");
  const avgResponseHours =
    respondedReqs.length === 0
      ? null
      : round1(
          respondedReqs.reduce((s, r) => s + (ms(r.updatedAt) - ms(r.createdAt)), 0) /
            respondedReqs.length /
            HOUR
        );

  const projectCreatedAt = new Map(allProjects.map((p) => [p.id, ms(p.createdAt)]));
  const firstJoinByProject = new Map<number, number>();
  for (const m of allMembers) earliest(firstJoinByProject, m.projectId, ms(m.joinedAt));
  const ttf: number[] = [];
  for (const [pid, jt] of firstJoinByProject) {
    const ct = projectCreatedAt.get(pid);
    if (ct !== undefined && jt >= ct) ttf.push(jt - ct);
  }
  const avgTimeToFirstTeammateHours =
    ttf.length === 0 ? null : round1(ttf.reduce((a, b) => a + b, 0) / ttf.length / HOUR);

  // ── Q4: Engagement ──
  const active7 = allUsers.filter((u) => since(u.lastSignedIn, weekAgo)).length;
  const active30 = allUsers.filter((u) => since(u.lastSignedIn, thirtyAgo)).length;
  const teamsWithWorkspace = new Set(allLinks.map((l) => l.projectId)).size;

  // ── Q5: Marketplace balance ──
  const owners = ownerIds.size;
  const joiners = new Set([...requesterIds, ...memberIds]).size;
  let openSpots = 0;
  const fillRates: number[] = [];
  for (const p of allProjects) {
    const memberCount = (membersByProject.get(p.id) ?? 0) + 1; // +1 = owner
    fillRates.push(Math.min(memberCount / p.maxTeamSize, 1));
    if (p.status === "open") openSpots += Math.max(p.maxTeamSize - memberCount, 0);
  }
  const avgFillRate = fillRates.length === 0 ? 0 : pct(fillRates.reduce((a, b) => a + b, 0), fillRates.length);

  // ── Q6: Quality / target audience ──
  const uniCounts = new Map<string, number>();
  for (const u of allUsers) {
    const uni = (u.university ?? "").trim();
    if (uni) uniCounts.set(uni, (uniCounts.get(uni) ?? 0) + 1);
  }
  const universityBreakdown = [...uniCounts.entries()]
    .map(([university, count]) => ({ university, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const roleCounts = new Map<string, number>();
  for (const p of allProjects) {
    for (const r of parseList(p.neededRoles)) {
      const k = r.trim();
      if (k) roleCounts.set(k, (roleCounts.get(k) ?? 0) + 1);
    }
  }
  const topRoles = [...roleCounts.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      users: totalUsers,
      projects: totalProjects,
      openProjects,
      closedProjects: totalProjects - openProjects,
      teamsFormed,
      joinRequests: allRequests.length,
      workspaceLinks: allLinks.length,
    },
    growth: {
      signupsThisWeek,
      signupsPrevWeek,
      projectsThisWeek,
      projectsPrevWeek,
      requestsThisWeek,
      signupsByDay,
      projectsByDay,
    },
    activation: {
      activatedUsers,
      activationRate: pct(activatedUsers, totalUsers),
      profileCompleted,
      profileCompletionRate: pct(profileCompleted, totalUsers),
      lurkers,
    },
    loop: {
      projectsWithRequests,
      projectsWithRequestsRate: pct(projectsWithRequests, totalProjects),
      pending,
      approved,
      rejected,
      responded,
      responseRate: pct(responded, allRequests.length),
      approvalRate: pct(approved, responded),
      avgResponseHours,
      avgTimeToFirstTeammateHours,
    },
    engagement: { active7, active30, teamsWithWorkspace },
    marketplace: {
      owners,
      joiners,
      ownerToJoinerRatio: joiners === 0 ? null : Math.round((owners / joiners) * 100) / 100,
      openRecruiting: openProjects,
      openSpots,
      avgFillRate,
    },
    quality: { universityBreakdown, topRoles },
  };
}
