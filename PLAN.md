# Craft: v1 Implementation Plan

A two-sided mobile marketplace for Algeria (launching in **Boumerdès**). Clients find and hire craftsmen, and craftsmen find work. Clients pay craftsmen in cash, outside the app. Craftsman subscriptions and ads come later.

**Stack:** Expo (React Native) mobile app · Next.js on Vercel (API, webhooks, admin panel) · Clerk (Google, Apple, email/phone + password) · Neon Postgres + Drizzle · Inngest · ImageKit · Sentry · EAS builds · pnpm monorepo
**Languages:** Arabic (default, right-to-left), French, English
**v1 goal:** a closed beta in Boumerdès, through TestFlight and Play internal testing

Legend: `- [ ]` to do · `- [x]` done

---

## Phase 0: Setup and accounts
- [x] Confirm current versions and docs: Expo SDK 58, `@clerk/expo` 4, Sentry React Native 8 (Drizzle, Neon driver, Inngest and ImageKit to confirm when they are added)
- [ ] Check that Clerk can send SMS codes to Algeria (+213): support, cost and deliverability
- [ ] Create the pnpm monorepo: `apps/mobile`, `apps/api`, `packages/shared` (types, validation, i18n keys). The mobile app currently lives on its own in `craftlink/`
- [x] Set up TypeScript and ESLint for the mobile app (Prettier and a shared tsconfig still to do with the monorepo)
- [x] Create the Clerk app and enable Google and Apple sign-in, plus email/phone with password
- [ ] Facebook sign-in and phone sign-in with an SMS code: deferred, the current auth screen is final for now
- [x] Create the Neon project (`DATABASE_URL` set)
- [ ] Create Neon preview and prod branches
- [x] Create the Inngest, ImageKit and Sentry projects; all keys are in `.env`
- [ ] Create the Vercel project for `apps/api` and the EAS project for `apps/mobile` (dev, preview and production profiles)
- [x] Add `.env.example` (no secrets committed)
- [ ] README with local setup steps

## Phase 1: Database and API foundation
- [ ] Drizzle schema: `users`, `craftsman_profiles`, `crafts`, `craftsman_crafts` (with `custom_craft_name` for "Other"), `wilayas`, `communes`, `craftsman_service_communes`, `working_hours`, `media`
- [ ] Drizzle schema: `jobs` (with `offers_closed`), `offers`, `conversations`, `messages`, `job_completions`, `reviews`, `reports`, `blocks`, `banners`, `push_tokens`
- [ ] Constraints and indexes: unique keys (Clerk ID, offer per job and craftsman, review per accepted offer, block pair), and foreign keys with sensible cascades
- [ ] Migrations workflow (generate and migrate per Neon branch)
- [ ] Seed data: Boumerdès wilaya and its communes, around 12 crafts with AR/FR/EN names and icons
- [ ] API middleware that checks the Clerk login token and loads the current user
- [ ] Shared validation schemas (zod) and a standard error format
- [x] Clerk webhook: sync user created, updated and deleted events (via Inngest; updated is an upsert, deleted removes the `users` row)
- [x] Inngest endpoint wired up in Next.js (`/api/inngest`, serving the three user sync functions)
- [ ] Sentry in the API

## Phase 2: Mobile app shell
- [x] Expo Router layout: `(auth)` stack and `(tabs)` with protected routes and an SSO callback route
- [ ] Onboarding stack
- [ ] Translations (AR/FR/EN) with Arabic as the default, right-to-left layout, and a language switcher (auth screens are in Arabic only for now)
- [x] Design tokens and base auth components (NativeWind, colors, Tajawal font)
- [x] Clerk auth screens: one auth screen with sign-in, sign-up, forgot password, 2FA code step, and Google + Apple buttons
- [ ] API client that sends the Clerk token, plus a data cache (React Query)
- [x] Sentry in the mobile app (tagged with Clerk user ID only)
- [ ] Register for Expo push notifications and save the token (`push_tokens`)

## Phase 3: Onboarding
- [ ] "Are you a craftsman or looking for a craftsman?" screen
- [ ] Client form: first name, last name, birth date (**15+**), optional public phone number
- [ ] Craftsman form: first name, last name, birth date (**18+**), birth place, years of experience, certificate or experience only
- [ ] Craft picker: primary craft plus specialties, and an **"Other"** option that shows a text field to type the craft
- [ ] Craftsman service area: home commune and served communes (Boumerdès)
- [ ] Craftsman working days and hours, and an "available now" toggle
- [ ] Profile photo, bio and portfolio photos (signed uploads to ImageKit)
- [ ] Server-side age checks (clients 15+, craftsmen 18+), with clear error messages in all 3 languages
- [ ] Returning users skip onboarding; users who quit halfway resume where they left off

## Phase 4: Home and directory
- [ ] Home: banner carousel (by language and active dates) and a grid of craft categories
- [ ] Category → list of craftsmen with filters (commune, verified, available now), sorted by rating
- [ ] Search by name or craft, including "Other" craft names
- [ ] Craftsman profile page: photo, bio, crafts, experience, verified badge, portfolio, rating and reviews, area, hours, public phone if shared
- [ ] "Start chat" button on the profile
- [ ] Empty, loading and error states

## Phase 5: Account and mode switching
- [ ] One account can be both client and craftsman: "Become a craftsman" from settings
- [ ] Switch between client and craftsman mode
- [ ] Edit profile (client and craftsman fields, photos, communes, hours)
- [ ] Show or hide the public phone number

## Phase 6: Job posts and offers
- [ ] Client creates a job: craft, description, photos, commune, optional GPS location, urgency
- [ ] Inngest: notify matching craftsmen (same craft and served commune) with a push notification
- [ ] Craftsman: list of open jobs that match them, and job details
- [ ] Craftsman sends an offer (estimate in DZD and a message); can withdraw it
- [ ] Client sees offers and accepts one, which opens or links a chat
- [ ] After accepting, ask the client: **close the other offers or keep them open**
- [ ] If offers are kept open, the client can accept more craftsmen for the same job
- [ ] Client can cancel a job; notify craftsmen who sent offers
- [ ] Job and offer state machine enforced on the server

## Phase 7: Chat
- [ ] Conversations list (polls about every 30 seconds) with unread counts
- [ ] Chat screen (polls about every 4 seconds while open): text, images, location pin (opens Google or Apple Maps)
- [ ] Chat can start from a profile or from an accepted offer (linked to the job)
- [ ] Inngest: push notification for each new message, idempotent by event ID
- [ ] Read receipts (`read_at`)
- [ ] Blocked users cannot message each other

## Phase 8: Job completion and reviews
- [ ] Either side marks an accepted job as done, and the other confirms (per accepted offer)
- [ ] Client reviews after confirmation: 1–5 stars and text, one per accepted offer
- [ ] Update the craftsman's rating average and count
- [ ] Inngest: send a review reminder after the job is done

## Phase 9: Craftsman verification
- [ ] Craftsman uploads certificates as private ImageKit files
- [ ] Verification status: none, pending, verified, rejected
- [ ] Notify the craftsman when the admin decides
- [ ] Verified badge in the directory and on the profile

## Phase 10: Safety
- [ ] Report a profile, job, message or review (with a reason)
- [ ] Block and unblock users (blocked users are hidden and cannot chat)
- [ ] Safety notice for clients aged 15–17 and when inviting a craftsman home

## Phase 11: Admin panel (Next.js)
- [ ] Admin-only access (Clerk role)
- [ ] Verification queue: view certificates, approve or reject
- [ ] Reports queue: hide content, ban or unban users
- [ ] Banners: upload, link, language, start and end dates, order
- [ ] Manage crafts (AR/FR/EN names, icons, order, active), and review "Other" craft names to turn into categories
- [ ] Basic users, jobs and reviews lists

## Phase 12: Privacy and account
- [ ] Account deletion in the app (required by both stores), with an Inngest cleanup job; reviews kept anonymised
- [ ] Privacy policy and terms (AR/FR/EN), with Algerian Law 18-07 in mind
- [ ] Ask for location and notification permissions only when needed, with clear explanations

## Phase 13: Monitoring
- [ ] Sentry release tracking and source maps (mobile and API)
- [ ] Alerts for new error spikes
- [ ] Inngest failure alerts and retries reviewed
- [ ] Basic counts: sign-ups, jobs posted, offers, completed jobs

## Phase 14: Testing and QA
- [ ] API tests: age rules, access control (chats, private certificates), job and offer state machine, review eligibility, blocks
- [ ] End-to-end test: sign up → onboarding → post job → offer → accept → chat → done → review
- [ ] Manual right-to-left check in Arabic, plus French and English, on iOS and Android
- [ ] Slow network and offline error handling

## Phase 15: Closed beta (Boumerdès)
- [ ] Production Neon branch, Vercel prod, EAS production builds
- [ ] TestFlight and Play internal testing release
- [ ] Sign up and onboard first craftsmen before inviting clients
- [ ] Invite 20–50 beta users and collect feedback

---

## Later (not in v1)
- [ ] Craftsman subscriptions and paid profile ads (choose between Apple and Google in-app purchase and a local Algerian provider)
- [ ] More wilayas
- [ ] Map with radius search
- [ ] Real-time chat provider if usage grows
- [ ] Public website for clients

## Assumptions
1. Craftsmen pick a home commune and served communes inside Boumerdès. Job alerts go to craftsmen with the same craft and a matching served commune.
2. GPS is optional. The client shares it on a job or in chat as a pin that opens Google or Apple Maps. There is no map inside the app in v1.
3. Admins manage the craft list, starting with around 12 crafts in AR/FR/EN.
4. A chat can start from a profile or from an accepted offer.
5. The public phone number is separate from the sign-in phone number, and showing it is optional.
6. Push notifications are the only alert channel.
7. Account deletion is in the app, and reviews are kept anonymised.
8. Chat polls about every 4 seconds while open, and the chat list about every 30 seconds.
9. If other offers stay open, the client can accept more craftsmen for the same job. Each one is completed and reviewed separately.
10. A craftsman who picks "Other" appears in search by the typed name, not in the category grid, until an admin creates the category.
11. The beta has about 20–50 users, so there are no special performance targets.

## Open risks
1. Clerk SMS sign-in to Algeria (+213): support and cost
2. Subscriptions on iOS and Android probably have to use Apple and Google in-app purchase, and Stripe doesn't work for Algerian merchants
3. Facebook login needs Meta app review. Apple sign-in is required on iOS when other social logins are offered
4. Clients aged 15–17 inviting adult strangers home, and personal data protection under Algerian Law 18-07
5. Empty directory at launch: craftsmen must be signed up first
6. Arabic right-to-left quality and the wording of craft names
7. Polling cost and delay if chat use grows
8. Exact library versions must be confirmed when setting up
