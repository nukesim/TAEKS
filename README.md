# STAMPD

**Say it. Stamp it. Prove it.**

STAMPD turns a natural-language prediction into a timestamped, immutable receipt that can be shared into any chat.

## Current state: prototype

Without Supabase environment variables, the browser runs the original local
demo. Its two sample receipts, Back/Fade counts, `#take=` links and checksum are
local-only and reset on reload. With Supabase configured, the web UI uses email
magic links, saved takes, server-stamped SHA-256 receipts at `/t/<id>`, and saved
Back/Fade votes. The mobile app remains a visual starter. The SQL migrations
are included but are not deployed by this repository.

## Included prototype features

- Browser-first STAMP flow
- Natural-language normalization for common NFL takes
- Confidence capture before locking
- Receipt UI with short ID + local checksum
- Back / Fade reactions
- Share button using the native Web Share API where supported
- Local-session `#take=<STAMP_ID>` navigation
- Mobile Expo shell with haptic Stamp interaction
- Supabase/Postgres schema for profiles, groups, takes, reactions, challenges and resolutions
- PostgreSQL trigger designed to prevent edits to stamped take fields when deployed
- Parser unit tests

## Run the web MVP

```bash
npm install
npm run dev
```

Then open the local URL Vite prints.

## Test / build

```bash
npm test
npm run build
```

## Project layout

```text
apps/web       Working browser/PWA MVP
apps/mobile    React Native / Expo starter shell
packages/core  Shared take parser contract + tests
supabase       Database schema and immutability trigger
```

## AI parser contract

The production parser should return this shape before a take can be stamped:

```ts
{
  originalText: string,
  canonicalText: string,
  category: string,
  league?: string,
  subject?: string,
  subjectType?: 'player' | 'team' | 'event' | 'asset' | 'other',
  predictionType: 'winner' | 'stat_threshold' | 'yes_no' | 'before_after' | 'exact' | 'custom',
  metric?: string,
  operator?: '>' | '>=' | '<' | '<=' | '=' | 'before' | 'after',
  targetValue?: unknown,
  season?: number,
  resolutionCriteria: string,
  resolutionSource?: string,
  resolveAt?: string
}
```

**Intended production rule:** a structured interpretation is confirmed before a take is stamped. The database trigger protects the stamped content when the schema is deployed; the current browser prototype has no backend and does not enforce server-side immutability.

## Connect a Supabase project

1. Create a Supabase project. In its SQL editor run `001_init.sql`, then
   `002_server_receipts.sql` from `supabase/migrations` in order.
2. Enable Email authentication and add the deployed site URL (and a local URL
   such as `http://localhost:5173/**`) under Authentication > URL Configuration
   > Redirect URLs. Configure the Email provider and a mail sender appropriate
   for users beyond the initial test group.
3. Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in the project
   URL and **publishable** key. Never put a Supabase service-role key in a
   `VITE_` variable. Run `npm install && npm run dev`.
4. Deploy `apps/web` as a Vite static site (build command `npm run build`,
   output directory `dist`). Set the same two build-time environment variables.
   The included Vercel and Netlify rewrites allow `/t/<id>` to serve the app.
5. Sign in with two emails. Stamp a take with one account, open its `/t/<id>`
   link in a fresh browser, react with the second account, and confirm the
   counts and receipt survive a reload.

Email is the first working sign-in method. Apple/Google sign-in, link preview
images, automatic results, groups, and the native chat share extensions still
need implementation. A static host will show a generic link preview until a
server-side image/meta route is added.

## Next production steps

1. Verify the connected flow against a real Supabase project and review access rules with multiple accounts.
2. Replace the limited deterministic NFL parser with a validated server-side parser.
3. Add server-rendered receipt metadata and image previews for chat sharing.
4. Add Apple/Google sign-in, then Universal Links, Android App Links and native share extensions.
5. Add sports-data resolvers, private groups, leaderboards and Take Battles.
