import type { Request } from "express";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { freshDb, makeUser, resetDb } from "./helpers";

// Stand-in for Clerk: "good-token-<id>" verifies as that Clerk user, anything else fails.
vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn(async (token: string) => {
    if (!token.startsWith("good-token-")) throw new Error("invalid token");
    return { sub: token.slice("good-token-".length) };
  }),
  createClerkClient: () => ({
    users: {
      getUser: vi.fn(async (id: string) => ({
        firstName: "New",
        lastName: "Student",
        primaryEmailAddressId: "e2",
        emailAddresses: [
          { id: "e1", emailAddress: "old@example.test" },
          { id: "e2", emailAddress: `${id}@example.test` },
        ],
      })),
    },
  }),
}));

const { getAuthContext } = await import("../src/middleware/clerkAuth");
const req = (authorization?: string) => ({ headers: { authorization } }) as unknown as Request;

let db: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => {
  db = await freshDb();
});
beforeEach(() => resetDb(db));

describe("getAuthContext", () => {
  test("no or malformed header = logged out", async () => {
    expect(await getAuthContext(req())).toEqual({ user: null });
    expect(await getAuthContext(req("Basic abc"))).toEqual({ user: null });
  });

  test("a token Clerk rejects = logged out, not an error", async () => {
    expect(await getAuthContext(req("Bearer forged"))).toEqual({ user: null });
  });

  test("first sign-in creates the user row from the Clerk profile", async () => {
    const { user } = await getAuthContext(req("Bearer good-token-user_abc"));
    expect(user).toMatchObject({
      clerkId: "user_abc",
      name: "New Student",
      email: "user_abc@example.test", // the primary address, not the first one
      role: "user",
    });
  });

  test("returning users are loaded, not re-created", async () => {
    const existing = await makeUser(db, { clerkId: "user_known", name: "Known" });
    const { user } = await getAuthContext(req("Bearer good-token-user_known"));
    expect(user?.id).toBe(existing.id);
    expect(user?.name).toBe("Known");
  });
});
