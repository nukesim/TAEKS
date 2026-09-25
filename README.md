# STAMPD

**Say it. Stamp it. Prove it.**

STAMPD turns a natural-language prediction into a timestamped, immutable receipt that can be shared into any chat.

## Current state: prototype

The browser UI is a local demonstration. Takes and Back/Fade counts live only in
React state and reset when the page reloads. The two example receipts and their
counts are sample data. Its `#take=` links only find takes in the current session;
they are **not** publicly retrievable receipts yet. The displayed browser hash
is a small non-cryptographic checksum, not proof of an immutable server record.
The mobile app is a visual starter with haptics, not a connected app. The SQL
migration is a starting schema and has not been deployed by this repository.

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

## Next production steps

1. Connect Supabase auth + database to the web client; generate receipts on the server and test row-level access rules.
2. Replace the deterministic parser with a server-side structured-output LLM endpoint with validation.
3. Add actual Universal Links / Android App Links using `https://stampd.app/t/<id>`.
4. Add iOS Share Extension and Android share target.
5. Add sports-data resolver workers for objective NFL takes.
6. Add private groups and group leaderboards.
7. Add Take Battles.
