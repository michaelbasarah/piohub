import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { ENV } from "../src/env";
import { callerFor, freshDb, makeUser, resetDb } from "./helpers";

let db: Awaited<ReturnType<typeof freshDb>>;
const fetchMock = vi.fn();

beforeAll(async () => {
  db = await freshDb();
});
beforeEach(async () => {
  await resetDb(db);
  fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.stubGlobal("fetch", fetchMock);
  ENV.resendApiKey = "re_test_key";
  ENV.frontendUrl = "https://app.example.test";
});
afterEach(() => vi.unstubAllGlobals());

const sent = () =>
  fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string));

async function setup(maxTeamSize = 3) {
  const owner = await makeUser(db, { name: "Olivia Owner" });
  const joiner = await makeUser(db, { name: "Jamie Joiner" });
  const { id } = await callerFor(owner).projects.create({
    title: "Study-group finder",
    description: "Match classmates into study groups.",
    neededRoles: ["Backend"],
    maxTeamSize,
  });
  return { owner, joiner, projectId: id };
}

describe("request to join", () => {
  test("creates a pending request and emails the owner", async () => {
    const { owner, joiner, projectId } = await setup();
    await callerFor(joiner).joinRequests.request({ projectId, message: "I know Postgres" });

    const pending = await callerFor(owner).joinRequests.listForProject({ projectId });
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ status: "pending", message: "I know Postgres" });

    expect(sent()).toHaveLength(1);
    expect(sent()[0].to).toBe(owner.email);
    expect(sent()[0].html).toContain("Jamie Joiner");
    expect(sent()[0].html).toContain("https://app.example.test/dashboard");
  });

  test("blocks joining your own project, double requests, and re-joining", async () => {
    const { owner, joiner, projectId } = await setup();
    await expect(
      callerFor(owner).joinRequests.request({ projectId })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const { id } = await callerFor(joiner).joinRequests.request({ projectId });
    await expect(
      callerFor(joiner).joinRequests.request({ projectId })
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await callerFor(owner).joinRequests.respond({ requestId: id, status: "approved" });
    await expect(
      callerFor(joiner).joinRequests.request({ projectId })
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringMatching(/already a member/) });
  });

  test("only the owner sees a project's pending requests", async () => {
    const { joiner, projectId } = await setup();
    await expect(
      callerFor(joiner).joinRequests.listForProject({ projectId })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("approve / reject", () => {
  test("approving adds the member and emails a link to the project", async () => {
    const { owner, joiner, projectId } = await setup();
    const { id } = await callerFor(joiner).joinRequests.request({ projectId });
    fetchMock.mockClear();

    await callerFor(owner).joinRequests.respond({ requestId: id, status: "approved" });

    const project = await callerFor(null).projects.getById({ id: projectId });
    expect(project.members.map((m) => m.id)).toEqual([joiner.id]);
    expect(sent()[0]).toMatchObject({ to: joiner.email });
    expect(sent()[0].subject).toMatch(/approved/);
    expect(sent()[0].html).toContain(`https://app.example.test/projects/${projectId}`);

    const [status] = await callerFor(joiner).joinRequests.myStatuses();
    expect(status.status).toBe("approved");
  });

  test("rejecting leaves the team unchanged and tells the requester", async () => {
    const { owner, joiner, projectId } = await setup();
    const { id } = await callerFor(joiner).joinRequests.request({ projectId });
    fetchMock.mockClear();

    await callerFor(owner).joinRequests.respond({ requestId: id, status: "rejected" });

    expect((await callerFor(null).projects.getById({ id: projectId })).members).toEqual([]);
    expect(sent()[0].subject).toMatch(/^Update on your request/);
  });

  test("a non-owner cannot decide, and a decided request cannot be re-decided", async () => {
    const { owner, joiner, projectId } = await setup();
    const { id } = await callerFor(joiner).joinRequests.request({ projectId });

    await expect(
      callerFor(joiner).joinRequests.respond({ requestId: id, status: "approved" })
    ).rejects.toThrow("Not authorized");

    await callerFor(owner).joinRequests.respond({ requestId: id, status: "rejected" });
    await expect(
      callerFor(owner).joinRequests.respond({ requestId: id, status: "approved" })
    ).rejects.toThrow("already resolved");
  });

  test("a full team refuses new members and keeps the request pending", async () => {
    // maxTeamSize 2 = the owner + one member
    const { owner, joiner, projectId } = await setup(2);
    const late = await makeUser(db);
    const first = await callerFor(joiner).joinRequests.request({ projectId });
    const second = await callerFor(late).joinRequests.request({ projectId });

    await callerFor(owner).joinRequests.respond({ requestId: first.id, status: "approved" });
    await expect(
      callerFor(owner).joinRequests.respond({ requestId: second.id, status: "approved" })
    ).rejects.toThrow("already full");

    const pending = await callerFor(owner).joinRequests.listForProject({ projectId });
    expect(pending.map((r) => r.id)).toEqual([second.id]);
    expect((await callerFor(null).projects.getById({ id: projectId })).memberCount).toBe(2);
  });

  test("the owner's dashboard lists pending requests across projects", async () => {
    const { owner, joiner, projectId } = await setup();
    await callerFor(joiner).joinRequests.request({ projectId, message: "hi" });

    const data = await callerFor(owner).dashboard.myData();
    expect(data.ownedProjects).toHaveLength(1);
    expect(data.pendingRequests).toHaveLength(1);
    expect(data.pendingRequests[0].project?.id).toBe(projectId);
    expect(data.pendingRequests[0].requester?.id).toBe(joiner.id);
  });
});
