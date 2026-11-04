import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { joinRequests, projectMembers, projects, users } from "../src/schema";
import { callerFor, freshDb, makeUser, resetDb } from "./helpers";

let db: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => {
  db = await freshDb();
});
beforeEach(() => resetDb(db));

const newProject = {
  title: "Dorm laundry tracker",
  description: "Which machines are free right now?",
  neededRoles: ["Hardware"],
  maxTeamSize: 3,
};

describe("outreach tracker: contacted -> signed up -> posted", () => {
  test("a ref link attributes the signup once, then the post", async () => {
    const admin = callerFor(await makeUser(db, { role: "admin" })).admin;
    await admin.outreach.add({ name: "Contact A", channel: "WhatsApp", hasIdea: true });
    await admin.outreach.add({ name: "Contact B" });

    let [b, a] = await admin.outreach.list(); // newest first
    expect(a.name).toBe("Contact A");
    expect(a.refCode).toMatch(/^[a-z0-9]{4,16}$/);
    expect(a.refCode).not.toBe(b.refCode);
    expect(a).toMatchObject({ signedUp: false, posted: false });

    const newcomer = await makeUser(db);
    await expect(
      callerFor(newcomer).outreach.attribute({ refCode: a.refCode })
    ).resolves.toEqual({ matched: true });
    // the same code can't be claimed twice, and one user can't claim two contacts
    const someoneElse = await makeUser(db);
    await expect(
      callerFor(someoneElse).outreach.attribute({ refCode: a.refCode })
    ).resolves.toEqual({ matched: false });
    await expect(
      callerFor(newcomer).outreach.attribute({ refCode: b.refCode })
    ).resolves.toEqual({ matched: false });
    await expect(
      callerFor(newcomer).outreach.attribute({ refCode: "nope" })
    ).resolves.toEqual({ matched: false });

    [, a] = await admin.outreach.list();
    expect(a).toMatchObject({ signedUp: true, posted: false, signedUpUserId: newcomer.id });

    await callerFor(newcomer).projects.create(newProject);
    [, a] = await admin.outreach.list();
    expect(a.posted).toBe(true);

    await admin.outreach.remove({ id: a.id });
    expect(await admin.outreach.list()).toHaveLength(1);
  });
});

describe("admin analytics", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3600_000);

  test("answers the dashboard's questions from raw rows", async () => {
    // 4 users: two signed up this week, one last week, one a month ago
    const [owner, joiner, lurker, old] = await db
      .insert(users)
      .values([
        { clerkId: "a", university: "Uni A", skills: '["React"]', bio: "hi", createdAt: ago(1), lastSignedIn: ago(0) },
        { clerkId: "b", university: "Uni A", createdAt: ago(2), lastSignedIn: ago(3) },
        { clerkId: "c", university: "Uni B", createdAt: ago(9), lastSignedIn: ago(9) },
        { clerkId: "d", createdAt: ago(40), lastSignedIn: ago(40), role: "admin" },
      ])
      .returning();

    const [p1, p2] = await db
      .insert(projects)
      .values([
        { ownerId: owner.id, title: "P1", description: "d", neededRoles: '["Frontend","Design"]', maxTeamSize: 4, createdAt: ago(1) },
        { ownerId: old.id, title: "P2", description: "d", neededRoles: '["Frontend"]', maxTeamSize: 2, status: "closed", createdAt: ago(30) },
      ])
      .returning();

    // joiner asked to join P1 one day ago and was approved 6 hours later
    await db.insert(joinRequests).values({
      projectId: p1.id,
      requesterId: joiner.id,
      status: "approved",
      createdAt: ago(1),
      updatedAt: ago(1, -6),
    });
    await db.insert(projectMembers).values({ projectId: p1.id, userId: joiner.id, joinedAt: ago(1, -6) });

    const stats = await callerFor(old).admin.overview();

    expect(stats.totals).toMatchObject({
      users: 4,
      projects: 2,
      openProjects: 1,
      closedProjects: 1,
      teamsFormed: 1,
      joinRequests: 1,
    });
    expect(stats.growth.signupsThisWeek).toBe(2);
    expect(stats.growth.signupsPrevWeek).toBe(1);
    expect(stats.growth.signupsByDay).toHaveLength(14);
    // owner posted and joiner requested within 7 days of signing up; old posted too late
    expect(stats.activation).toMatchObject({ activatedUsers: 2, activationRate: 50, profileCompleted: 1, lurkers: 1 });
    expect(stats.loop).toMatchObject({ approved: 1, responseRate: 100, approvalRate: 100, avgResponseHours: 6 });
    expect(stats.loop.avgTimeToFirstTeammateHours).toBeCloseTo(6, 0);
    expect(stats.engagement).toMatchObject({ active7: 2, active30: 3 });
    // P1: 2 of 4 seats taken, P2: 1 of 2 -> 50% fill; 2 open seats on the open project
    expect(stats.marketplace).toMatchObject({ owners: 2, joiners: 1, openSpots: 2, avgFillRate: 50 });
    expect(stats.quality.universityBreakdown[0]).toEqual({ university: "Uni A", count: 2 });
    expect(stats.quality.topRoles[0]).toEqual({ role: "Frontend", count: 2 });

    // aggregates only: no names, emails or Clerk ids in the payload
    expect(JSON.stringify(stats)).not.toMatch(/clerk|email|"a"|"b"/i);
    void lurker;
  });

  test("an empty platform returns zeros, not NaN", async () => {
    const admin = await makeUser(db, { role: "admin" });
    await db.delete(users); // admin is still in ctx; tables are empty
    const stats = await callerFor(admin).admin.overview();
    expect(stats.totals.users).toBe(0);
    expect(stats.activation.activationRate).toBe(0);
    expect(stats.loop.avgResponseHours).toBeNull();
    expect(stats.marketplace.ownerToJoinerRatio).toBeNull();
    expect(JSON.stringify(stats)).not.toContain("NaN");
  });
});
