import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  inngest,
  type ClerkUserCreatedData,
  type ClerkUserDeletedData,
  type ClerkUserUpdatedData,
} from "./client";

export const syncUserCreated = inngest.createFunction(
  {
    id: "sync-clerk-user-created",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event, step }) => {
    const data = event.data as ClerkUserCreatedData;

    const inserted = await step.run("insert-user", async () => {
      // Idempotent: Clerk (Svix) and Inngest can both retry, so a repeat is a no-op.
      const rows = await db
        .insert(users)
        .values({
          clerkId: data.clerkId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          imageUrl: data.imageUrl,
        })
        .onConflictDoNothing({ target: users.clerkId })
        .returning({ id: users.id });
      return rows[0] ?? null;
    });

    return { clerkId: data.clerkId, inserted: inserted !== null, userId: inserted?.id ?? null };
  },
);

export const syncUserUpdated = inngest.createFunction(
  {
    id: "sync-clerk-user-updated",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event, step }) => {
    const data = event.data as ClerkUserUpdatedData;

    const updated = await step.run("upsert-user", async () => {
      // Upsert so an update that arrives before (or without) its created event
      // still leaves a correct row. Retries just rewrite the same values.
      const profile = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        imageUrl: data.imageUrl,
      };
      const rows = await db
        .insert(users)
        .values({ clerkId: data.clerkId, ...profile })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: { ...profile, updatedAt: new Date() },
        })
        .returning({ id: users.id });
      return rows[0] ?? null;
    });

    return { clerkId: data.clerkId, userId: updated?.id ?? null };
  },
);

export const syncUserDeleted = inngest.createFunction(
  {
    id: "sync-clerk-user-deleted",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event, step }) => {
    const data = event.data as ClerkUserDeletedData;

    const deleted = await step.run("delete-user", async () => {
      // Idempotent: deleting a row that is already gone is a no-op.
      const rows = await db
        .delete(users)
        .where(eq(users.clerkId, data.clerkId))
        .returning({ id: users.id });
      return rows[0] ?? null;
    });

    return { clerkId: data.clerkId, deleted: deleted !== null, userId: deleted?.id ?? null };
  },
);

export const functions = [syncUserCreated, syncUserUpdated, syncUserDeleted];
