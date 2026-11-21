import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { UserJSON } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { inngest, type ClerkUserData } from "@/inngest/client";

function toUserData(u: UserJSON): ClerkUserData {
  const primaryEmail =
    u.email_addresses.find((e) => e.id === u.primary_email_address_id) ?? u.email_addresses[0];

  return {
    clerkId: u.id,
    email: primaryEmail?.email_address ?? null,
    firstName: u.first_name ?? null,
    lastName: u.last_name ?? null,
    imageUrl: u.image_url ?? null,
  };
}

export async function POST(req: NextRequest) {
  let evt;
  try {
    // Reads CLERK_WEBHOOK_SIGNING_SECRET and throws on a bad signature.
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  // svix-id as the event id dedupes Clerk retries inside Inngest.
  const svixId = req.headers.get("svix-id");
  const idOpt = svixId ? { id: svixId } : {};

  switch (evt.type) {
    case "user.created":
      await inngest.send({ name: "clerk/user.created", data: toUserData(evt.data), ...idOpt });
      break;

    case "user.updated":
      await inngest.send({ name: "clerk/user.updated", data: toUserData(evt.data), ...idOpt });
      break;

    case "user.deleted": {
      const clerkId = evt.data.id;
      if (!clerkId) {
        console.warn("Clerk user.deleted webhook without a user id; ignoring");
        break;
      }
      await inngest.send({ name: "clerk/user.deleted", data: { clerkId }, ...idOpt });
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
