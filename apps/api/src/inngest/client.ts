import { Inngest } from "inngest";

// Dev only: isDev talks to the local Inngest Dev Server (http://localhost:8288)
// and needs no INNGEST_EVENT_KEY or INNGEST_SIGNING_KEY.
export const inngest = new Inngest({ id: "craft-api", isDev: true });

// Payload for clerk/user.created and clerk/user.updated.
export type ClerkUserData = {
  clerkId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

export type ClerkUserCreatedData = ClerkUserData;
export type ClerkUserUpdatedData = ClerkUserData;

export type ClerkUserDeletedData = {
  clerkId: string;
};
