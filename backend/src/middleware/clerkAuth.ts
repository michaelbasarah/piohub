import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Request } from "express";
import { getUserByClerkId, upsertUser } from "../db";
import { ENV } from "../env";
import type { Context } from "../trpc";

const clerk = createClerkClient({ secretKey: ENV.clerkSecretKey });

export async function getAuthContext(req: Request): Promise<Context> {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return { user: null };

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token, { secretKey: ENV.clerkSecretKey });
    const clerkId = payload.sub;

    let user = await getUserByClerkId(clerkId);

    // First time this Clerk user hits our backend — create a record for them
    if (!user) {
      const clerkUser = await clerk.users.getUser(clerkId);
      const primaryEmail = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress ?? null;
      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

      await upsertUser({
        clerkId,
        name,
        email: primaryEmail,
        lastSignedIn: new Date(),
      });

      user = await getUserByClerkId(clerkId);
    } else {
      // Bookkeeping only — don't make every request wait on this write
      void upsertUser({ clerkId, lastSignedIn: new Date() }).catch(() => {});
    }

    return { user: user ?? null };
  } catch {
    return { user: null };
  }
}
