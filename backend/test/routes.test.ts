import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { callerFor, freshDb, makeUser, resetDb } from "./helpers";

let db: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => {
  db = await freshDb();
});
beforeEach(() => resetDb(db));

const project = {
  title: "Campus bike-share map",
  description: "A live map of free bikes around campus.",
  neededRoles: ["Frontend", "Designer"],
  maxTeamSize: 4,
};

// The 2026-06-12 leak: public endpoints returned whole user rows. Judge them by
// the raw response, not by what the page renders.
describe("public endpoints never leak private user fields", () => {
  const PRIVATE = /email|clerk|"role"/i;

  test("feed, project detail, and both profile endpoints", async () => {
    const owner = await makeUser(db, { role: "admin", bio: "Builds things" });
    const member = await makeUser(db);
    const requester = await makeUser(db);
    const { id } = await callerFor(owner).projects.create(project);
    const req = await callerFor(member).joinRequests.request({ projectId: id });
    await callerFor(owner).joinRequests.respond({ requestId: req.id, status: "approved" });
    await callerFor(requester).joinRequests.request({ projectId: id });

    const anon = callerFor(null);
    const responses = [
      await anon.projects.list(),
      await anon.projects.getById({ id }),
      await anon.profile.getPublic({ userId: owner.id }),
      await anon.profile.getPublic({ userId: member.id }),
      await anon.auth.getProfile({ userId: owner.id }),
    ];
    for (const r of responses) {
      const raw = JSON.stringify(r);
      expect(raw).not.toMatch(PRIVATE);
      expect(raw).not.toContain("@example.test");
    }
    // ...while still carrying what the pages need
    const detail = await anon.projects.getById({ id });
    expect(detail.owner?.name).toBe(owner.name);
    expect(detail.members.map((m) => m.id)).toEqual([member.id]);
    expect(detail.memberCount).toBe(2);
  });
});

describe("access control", () => {
  test("logged-out visitors can browse but not act", async () => {
    const anon = callerFor(null);
    await expect(anon.projects.list()).resolves.toEqual([]);
    await expect(anon.projects.create(project)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anon.dashboard.myData()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(anon.joinRequests.request({ projectId: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("admin routes reject normal users", async () => {
    const user = await makeUser(db);
    await expect(callerFor(user).admin.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor(user).admin.outreach.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  test("only the owner can edit, close, reopen or delete a project", async () => {
    const owner = await makeUser(db);
    const other = await makeUser(db);
    const { id } = await callerFor(owner).projects.create(project);
    const stranger = callerFor(other);

    await expect(stranger.projects.update({ id, ...project, title: "Hijacked" })).rejects.toThrow(
      "Not authorized"
    );
    await expect(stranger.projects.close({ id })).rejects.toThrow("Not authorized");
    await expect(stranger.projects.delete({ id })).rejects.toThrow("Not authorized");
    expect((await callerFor(null).projects.getById({ id })).title).toBe(project.title);

    await callerFor(owner).projects.close({ id });
    expect(await callerFor(null).projects.list()).toHaveLength(0);
    await callerFor(owner).projects.reopen({ id });
    expect(await callerFor(null).projects.list()).toHaveLength(1);
  });

  test("deleting a project also removes its requests, members and links", async () => {
    const owner = await makeUser(db);
    const joiner = await makeUser(db);
    const { id } = await callerFor(owner).projects.create(project);
    const req = await callerFor(joiner).joinRequests.request({ projectId: id });
    await callerFor(owner).joinRequests.respond({ requestId: req.id, status: "approved" });
    await callerFor(joiner).workspace.addLink({
      projectId: id,
      label: "Repo",
      url: "https://example.com/repo",
    });

    await callerFor(owner).projects.delete({ id });

    await expect(callerFor(null).projects.getById({ id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    const mine = await callerFor(joiner).dashboard.myData();
    expect(mine.joinedProjects).toEqual([]);
    expect(await callerFor(joiner).joinRequests.myStatuses()).toEqual([]);
  });
});

describe("input validation", () => {
  test("project fields are bounded", async () => {
    const owner = callerFor(await makeUser(db));
    await expect(owner.projects.create({ ...project, title: "ab" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(owner.projects.create({ ...project, neededRoles: [] })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(owner.projects.create({ ...project, maxTeamSize: 50 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  test("profile links must be real URLs (no javascript:)", async () => {
    const user = await makeUser(db);
    const me = callerFor(user);
    await expect(
      me.auth.updateProfile({ portfolioLink: "javascript:alert(1)" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await me.auth.updateProfile({
      portfolioLink: "https://example.com/me",
      skills: ["React", "Figma"],
      university: "Example University",
    });
    const profile = await callerFor(null).profile.getPublic({ userId: user.id });
    expect(profile.portfolioLink).toBe("https://example.com/me");
    expect(profile.skills).toEqual(["React", "Figma"]);
  });
});

describe("team workspace", () => {
  test("members and the owner can use it; outsiders cannot", async () => {
    const owner = await makeUser(db);
    const member = await makeUser(db);
    const outsider = await makeUser(db);
    const { id } = await callerFor(owner).projects.create(project);
    const req = await callerFor(member).joinRequests.request({ projectId: id });
    await callerFor(owner).joinRequests.respond({ requestId: req.id, status: "approved" });

    await callerFor(member).workspace.addLink({
      projectId: id,
      label: "Figma",
      url: "https://example.com/figma",
    });
    await expect(
      callerFor(outsider).workspace.addLink({ projectId: id, label: "x", url: "https://e.com" })
    ).rejects.toThrow("Not a member");
    await expect(callerFor(outsider).workspace.getLinks({ projectId: id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      callerFor(member).workspace.addLink({ projectId: id, label: "x", url: "javascript:void(0)" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const links = await callerFor(owner).workspace.getLinks({ projectId: id });
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ label: "Figma", addedByName: member.name });

    // The owner may remove anyone's link; an outsider may not
    await expect(
      callerFor(outsider).workspace.deleteLink({ linkId: links[0].id })
    ).rejects.toThrow("Not authorized");
    await callerFor(owner).workspace.deleteLink({ linkId: links[0].id });
    expect(await callerFor(member).workspace.getLinks({ projectId: id })).toEqual([]);
  });
});
