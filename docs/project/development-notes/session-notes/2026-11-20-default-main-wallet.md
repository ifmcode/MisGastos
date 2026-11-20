# Default main wallet on account creation (TICKET-057)

**Date:** 20/11/2026  
**Ticket:** `[DONE] TICKET-057-DEFAULT-WALLET-ON-ACCOUNT-CREATION.md`  
**Related:** TICKET-001 (wallets), TICKET-006 (profile and preferred currency), TICKET-018 (wallet management), TICKET-046 (settlement income)

## Context

A new account landed on an empty **Carteras** tab, so the first movement, transfer
or settlement had nothing to select until the user created a wallet by hand.

Closed decisions: seed new accounts **and** existing accounts with zero wallets;
never re-seed after the user deletes every wallet (zero wallets is a valid state);
the seeded wallet is an ordinary wallet that can be renamed, archived and deleted.

## Why a first-load seed

Neither email/password nor Google sign-up performs an app-controlled Firestore
write, and the `users` profile is materialised lazily by `ProfileProvider`
(`createProfileFromAuth`). There is no Cloud Function in V1, so "on account
creation" is implemented as an idempotent first authenticated load, the same
pattern `FriendsPublicProfileSync` already uses to backfill older accounts.

## Shape

- `buildDefaultWalletId(ownerId)` → `main-wallet_<uid>` (`/` replaced). A
  deterministic id makes two devices converge on one document instead of racing.
- `buildDefaultWalletDto(name, preferredCurrency)` reuses
  `createWalletFormValues` (icon `wallet`, `WALLET_COLORS[0]`, `cash`,
  `includeInTotal: true`), forces `initialBalance: 0` and resolves the currency
  with `resolveCurrencyCode` (EUR fallback).
- `buildWalletDocumentData` in `repositories/wallet-document.ts` is the single
  stored wallet shape, shared by `createWalletDocument` and the seed, so the
  seeded document is an ordinary wallet document.
- `DefaultWalletSeed` (renders `null`) is mounted in `app/_layout.tsx` inside
  `ProfileProvider`, next to `FriendsPublicProfileSync`.

## Final transaction flow

Outside the transaction (the client SDK cannot query inside `runTransaction`):

1. profile id: `users` where `uid == ownerId`, `limit(1)`;
2. wallet existence: `wallets` where `ownerId == ownerId`, `limit(1)`
   (archived wallets keep their document, so they count).

Inside one `runTransaction`, with `profileRef` null when the query found nothing:

1. read the profile document — **only** when `profileRef` exists;
2. marker `defaultWalletSeededAt` present → `already-seeded`, no writes;
3. owner has wallets → stamp the marker on the existing profile,
   `skipped-existing-wallets`;
4. otherwise → `set` the wallet and stamp the marker when the profile exists,
   `seeded`.

A profile-less account gets the wallet **without** a marker and without any
`users` write: the seed must not fabricate a profile next to the lazy one. The
marker is stamped on a later load through the "owner has wallets" branch.

## Rules analysis

No `firestore.rules` and no `firestore.indexes.json` change.

- **Reads:** two owner-scoped single-equality `list` queries (`users.uid`,
  `wallets.ownerId`) plus one `get` on a document the query proved to exist. Each
  query is a single equality filter, so no composite index is needed.
- **The denied `get`:** in this rules version a `get` on a **missing** document
  is denied instead of evaluating to "not found", so reading the
  `main-wallet_<uid>` document before creating it would fail the transaction. The
  design never reads the wallet: existence comes from the pre-transaction query
  and the deterministic id makes the write convergent. A deletion of the profile
  between the query and the `get` also fails the run, which is silent and retried
  (the retry then takes the no-profile path).
- **Writes:** a `wallets` create whose `ownerId == request.auth.uid`, already
  allowed by the owner-only collection rule; and an `update` of the existing
  `users` profile that adds `defaultWalletSeededAt`/`updatedAt` and keeps the
  immutable `uid`, already allowed for the owner. Name, email and preferred
  currency are never touched by the seed.

## Currency

`resolveSeedCurrency(profile, fallback)` runs inside the transaction, so the
**stored** `preferredCurrency` wins; an invalid or missing value falls back to the
DTO currency the service already resolved in memory (profile preference, then
EUR). Chain: stored profile → in-memory profile/DTO → EUR, so a profile-less
first load uses EUR.

## Behaviour and copy

- Runs once per account for email/password and Google, without visiting
  **Carteras**; silent, never blocks the UI.
- Bookkeeping in the hook: run key `uid | language | name` (the stored name depends
  on the seed-time language), 3 attempts 5 s apart, reset on `AppState` `active`
  and on sign-out.
- Name from `wallets.defaults.mainWalletName` («Cartera principal» / "Main
  wallet"); no other visible string.
- A failed seed is swallowed, retried, and next load tries again.
- With zero wallets the settlement picker keeps `form.walletEmpty` and the user
  creates a wallet first; nothing re-creates the main wallet.

## Accepted edges and limitations

1. The wallet-existence query runs outside the transaction, so a wallet created in
   that window can coexist with the seeded one for that session.
2. A profile-less account seeds without the marker; deleting every wallet while
   the account still has no `users` document would re-seed (narrow, self-healing:
   the next email sign-in repairs the profile).
3. Every foreground resume re-runs the seed; after the marker exists it is
   read-only.
4. Legacy duplicated `uid` profile documents make the marker location ambiguous;
   harmless, because the wallet-existence branch stamps the document it read.
5. The seed never creates the profile, which is why the marker can lag.

## Tests and verification

Tests: pure builder, service guards, three operation suites (seed + marker,
marker no-op, wallets-exist stamp, missing-profile path, currency resolution) and
a regression assertion that the transaction never reads the wallet document. The
shared Firestore mock helper gained `limit` and `transaction.set`.

- `npx tsc --noEmit`: clean.
- `npx expo lint`: clean on Node 24.14.0 (`expo lint` requires Node >= 22.13; it
  crashes with `parseEnv is not a function` on the default Node 20.6.1).
- `npx jest`: 265 suites / 1583 tests.
- `npm run test:coverage`: 98.93 % statements / 94.59 % branches / 98.55 %
  functions / 99.36 % lines; the new seed modules are at 100 %.
- `npm run check:copy`: passed, 261 TSX files.

Review verdict: `approve with nits` after one round of changes (the first version
read the wallet document inside the transaction, created a `users` document and
could pick EUR over the stored preference).

## Open items

- Manual device validation of the Validation Plan (sign-up with email and Google,
  existing zero-wallet account, two devices/retry, delete every wallet,
  rename/archive/delete, es/en and light/dark, settlement `walletEmpty`).
- Only `sharedExpenses`, `settlements`, `notifications` and the friends rules
  remain pending deployment; this ticket adds none.
