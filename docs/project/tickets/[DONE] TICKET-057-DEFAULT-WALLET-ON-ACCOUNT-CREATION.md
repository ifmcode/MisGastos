# [DONE] TICKET-057 - Default Main Wallet on Account Creation

**Type:** Feature  
**Priority:** Medium  
**Status:** ✅ Done (20/11/2026)  
**Related:** TICKET-001, TICKET-006, TICKET-018, TICKET-046  
**Sprint:** Post-MVP / Phase 5.4

## Description
A brand-new account currently lands on an empty **Carteras** tab, so the first movement, transfer or settlement has nothing to select until the user creates a wallet by hand. This ticket gives every account one **Cartera principal** / **Main wallet** so the personal side works from the first screen.

The scope is fixed by three decisions already closed with the user:

1. **Seed new accounts and existing accounts with zero wallets.** Accounts created before this ticket get the wallet on their next authenticated load, so no migration script is needed.
2. **Never re-seed.** If the user deletes every wallet, the account stays with zero wallets and the main wallet does not come back. Zero wallets is a valid state: the user creates one manually when a flow needs it, for example to receive a settlement as creditor.
3. **The wallet is a normal wallet.** Name «Cartera principal» / "Main wallet" resolved from the `wallets` namespace in the language active at seed time (wallet names are stored data and are never re-translated), currency from the profile preferred currency with EUR fallback, type `cash`, the existing default icon and colour, `includeInTotal: true`, initial and current balance 0. It can be renamed, archived and deleted like any other wallet.

Automatically recreating the wallet when a flow needs one is explicitly out of scope.

## Requirements
### Seed content
- [x] Seed exactly one wallet named «Cartera principal» / "Main wallet", resolved from the `wallets` namespace in the language active at seed time (the name is stored, never re-translated later)
- [x] Use the profile preferred currency (EUR fallback when the profile is not loaded yet) and the existing wallet defaults for icon, colour, type (`cash`) and `includeInTotal`; initial and current balances start at 0

### When it runs
- [x] Run once per account on the first authenticated load, for email/password **and** Google accounts, without requiring a visit to the Carteras tab and without blocking the UI
- [x] Remember the seed per account and make the write idempotent and atomic, so two devices, a retry or a reinstall cannot create two wallets
- [x] Cover existing accounts with zero wallets; an account with at least one wallet document (active or archived) is never seeded
- [x] Never re-seed after the user deletes every wallet: zero wallets is a valid state

### Behaviour and safety
- [x] The seeded wallet behaves like any other: editable, archivable, deletable, included in totals and selectable in movements, transfers and settlements
- [x] Add no new Firestore rules: wallet creation stays owner-only and the `users` owner rules stay unchanged
- [x] A failed seed must not block sign-in; it is silent for the user and is retried on the next load
- [x] Add es/en copy for the name and any new guidance; `npm run check:copy` passes
- [x] Add colocated tests for the pure default-wallet builder, the seed operation (idempotent, existing wallet, existing marker) and the service guards
- [x] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [x] A new email/password account gets exactly one «Cartera principal» with 0 balance in the preferred currency
- [x] A new Google account gets the same wallet
- [x] An existing account with zero wallets gets it on the next load
- [x] An account with one or more wallets (active or archived) gets none
- [x] Reopening the app, signing in on another device or retrying does not duplicate it
- [x] Deleting every wallet leaves the account with zero wallets and the main wallet does not come back
- [x] The seeded wallet can be renamed, archived and deleted like any other
- [x] A zero-wallet account can still create a wallet from the wallets empty state and then link a settlement income
- [x] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

> The acceptance criteria are covered by the automated suites and the code review; the device checks of the Validation Plan are still pending (see **Pending manual validation**).

## Implemented

### Seed content and shared defaults
`features/wallets/utils/default-wallet.ts` is the pure builder. `buildDefaultWalletId(ownerId)` returns the deterministic `main-wallet_<uid>` id (`/` replaced, because a document id cannot contain it) so two devices converge on one document. `buildDefaultWalletDto(name, preferredCurrency)` reuses the existing `createWalletFormValues`, so icon `wallet`, `WALLET_COLORS[0]`, type `cash` and `includeInTotal: true` are not redefined, forces `initialBalance: 0` and resolves the currency with `resolveCurrencyCode` (EUR fallback). The name is not built here: the hook resolves `defaults.mainWalletName` from the `wallets` namespace in the active language.

`features/wallets/repositories/wallet-document.ts` `buildWalletDocumentData` is now the single stored wallet shape, shared by `createWalletDocument` and the seed, so a seeded wallet is byte-for-byte an ordinary wallet document.

### Seed operation
`features/wallets/repositories/wallet-seed.operation.ts`, with the marker and currency helpers in `wallet-seed-profile.ts`:

1. Two owner queries **outside** the transaction, because the client SDK cannot query inside `runTransaction`: the profile (`users` where `uid == ownerId`, `limit(1)`, auto-id lookup) and the wallet existence check (`wallets` where `ownerId == ownerId`, `limit(1)`; archived wallets keep their document and therefore count).
2. One `runTransaction` that reads **only** the profile document, and only when the query returned an id. A `get` on a missing document is **denied** by the rules instead of resolving as not-found, so the wallet document is never read; the deterministic id makes the write convergent anyway.
3. `defaultWalletSeededAt` present → `already-seeded`, no writes.
4. Existing wallets → stamp the marker on an existing profile, `skipped-existing-wallets`.
5. Otherwise → write the wallet plus the marker (`seeded`). A profile-less account gets the wallet without a marker and **no `users` write**: the seed never fabricates a profile (which would risk a duplicate next to the lazy `ProfileProvider` document). The marker lands on a later load through the "owner has wallets" branch once the auth flow has created the profile.

The wallet currency comes from the stored profile `preferredCurrency` read inside the transaction (`resolveSeedCurrency`), falling back to the DTO currency supplied in memory; only a profile-less first load therefore uses the in-memory preference and then EUR.

### Service and repository seam
`IWalletRepository.seedDefaultWallet(ownerId, dto: CreateWalletDto)` is implemented by `FirebaseWalletRepository`. `WalletService.seedDefaultWallet(ownerId, { name, preferredCurrency })` normalizes and guards the owner (`OWNER_REQUIRED`), rejects an empty name (`NAME_REQUIRED`) and builds the DTO through the pure builder. Two fake repositories gained the method.

### Root sync
`features/wallets/hooks/use-default-wallet-seed.ts` + `features/wallets/components/default-wallet-seed.tsx` (`DefaultWalletSeed`, renders `null`) are mounted in `app/_layout.tsx` inside `ProfileProvider`, next to `FriendsPublicProfileSync`. It runs once per account on the first authenticated load for email/password and Google accounts, never blocks the UI and is silent for the user. Bookkeeping: a run key of `uid | language | name` (the stored name depends on the language at seed time), `MAX_ATTEMPTS = 3` with a 5 s delay, a reset on `AppState` `active` and a reset on sign-out so a later sign-in seeds again. It does not wait for the profile: `profile.preferredCurrency` is only the in-memory fallback.

### Copy
`features/wallets/locales/{es,en}.json` → `defaults.mainWalletName` («Cartera principal» / "Main wallet"). No other visible string was added, so `npm run check:copy` passes.

### Rules and indexes: no change needed
No `firestore.rules` and no `firestore.indexes.json` change. The operation performs two owner-scoped single-equality list queries (no composite index), one `get` on a profile document known to exist, one `wallets` **create** whose `ownerId == auth.uid` already satisfies the owner-only `wallets` rule, and one **update** of the existing `users` profile that only adds `defaultWalletSeededAt` and `updatedAt` while keeping the immutable `uid`; the `users` rules already accept that update for the owner. The rules analysis and the denied-`get` detail are in `session-notes/2026-11-20-default-main-wallet.md`.

### Tests
- `features/wallets/utils/__tests__/default-wallet.test.ts`: deterministic id (including `/`), defaults reuse and balance 0, EUR fallback.
- `features/wallets/services/__tests__/wallet.service.seed.test.ts`: owner and empty-name guards, DTO built from the shared defaults, delegation.
- `features/wallets/repositories/__tests__/wallet-seed.operation.test.ts`: seed + marker, marker no-op, wallets-exist stamp, plus a regression assertion that the transaction never reads the wallet document.
- `wallet-seed.operation.profile.test.ts`: missing-profile path (wallet without marker, no `users` write).
- `wallet-seed.operation.currency.test.ts`: stored-profile currency beats the in-memory one.
- The shared Firestore mock helper gained `limit` and `transaction.set`.

### Verification (20/11/2026)
- `npx tsc --noEmit`: clean.
- `npx expo lint`: clean (requires Node >= 22.13; `expo lint` crashes on Node 20.6.1 with `parseEnv is not a function`, run on Node 24.14.0).
- `npx jest`: 265 suites / 1583 tests.
- `npm run test:coverage`: gate passed, 98.93 % statements / 94.59 % branches / 98.55 % functions / 99.36 % lines; the new seed modules are at 100 %.
- `npm run check:copy`: passed, 261 TSX files.

### Review
Verdict `approve with nits` after one round of changes requested: the first version read the to-be-created wallet document inside the transaction (denied by the rules), created a `users/{uid}` document (risking a duplicate profile) and could pick EUR over the stored preference. The final design removes all three.

### Session note
`docs/project/development-notes/session-notes/2026-11-20-default-main-wallet.md`

## Known limitations
1. `ownerHasAnyWallet` runs outside the transaction (the client SDK cannot query inside one), so a wallet created in that window can coexist with the seeded one for that session.
2. A profile-less account seeds the wallet without the marker; the marker is stamped on a later load. Residual: deleting every wallet while the account still has no `users` document would re-seed (narrow and self-healing, because the next email sign-in repairs the profile).
3. Every foreground resume re-runs the seed; once the marker exists it is read-only (no writes).
4. Legacy duplicated `uid` profile documents (no longer creatable) make the marker location ambiguous; harmless because the wallet-existence branch stamps the document it read.
5. The currency fallback chain is stored profile → in-memory profile/DTO → EUR, so a profile-less first load uses EUR.

## Pending manual validation
The Validation Plan below is still pending on device: email and Google sign-up, an existing zero-wallet account, two devices/retry, deleting every wallet, rename/archive/delete of the seeded wallet, es/en plus light/dark, and the settlement `walletEmpty` path.

## Technical Notes
- **There is no signup hook, so the seed is an idempotent first-load seed.** Email/password and Google both create the Auth user without an app-controlled Firestore write, and the `users` profile is materialised lazily (`ProfileProvider` falls back to `createProfileFromAuth` in `features/profile/providers/profile-provider.tsx`). "On account creation" therefore became a first authenticated load, mirroring `FriendsPublicProfileSync` in `app/_layout.tsx`, which also backfills accounts created before its ticket.
- **Marker:** the ISO string `defaultWalletSeededAt` on the `users` profile document. It is written even when no wallet is created, because it is the only thing that stops a re-seed after the user deletes every wallet. The seed never creates the `users` document; it only stamps an existing profile, and every other profile field (name, email, preferred currency) is left untouched.
- **Atomicity:** one `runTransaction` re-checks the marker and the wallet existence and writes the wallet plus the marker together, with the deterministic `main-wallet_<uid>` id so two devices converge instead of racing.
- **Reads inside the transaction:** only the profile document, and only when the owner query returned its id. A `get` on a missing document is denied by the rules (not "not found"), so the future wallet is never read; existence comes from the pre-transaction owner query.
- **Where it lives:** `useWallets` only reads. The seed is a root sync component mounted inside `AuthProvider`/`ProfileProvider` next to `FriendsPublicProfileSync`, not in the **Carteras** tab, so a user who never opens the tab still gets the wallet.
- **Defaults already exist:** `DEFAULT_WALLET_FORM_VALUES` / `createWalletFormValues` in `features/wallets/utils/wallet-options.ts` carry icon `wallet`, `WALLET_COLORS[0]`, type `cash` and `includeInTotal: true`; `resolveCurrencyCode` in `shared/constants/currencies.ts` provides the EUR fallback. The seed reuses them through the pure builder instead of a second defaults object.
- **No composite index:** `getWallets(ownerId)` already filters by owner, and both seed queries are single-equality owner filters with `limit(1)`.
- **Edge accepted by the user:** with zero wallets the settlement wallet picker keeps its existing `form.walletEmpty` guidance (`features/settlements/components/settlement-form-wallet-selector.tsx`) and the user creates a wallet first. This ticket adds no automatic re-creation.
- **Out of scope:** one main wallet per currency, seeding categories or any other collection, rewriting existing wallet names, a Settings entry to reset the main wallet, and a migration script for legacy accounts.

## Validation Plan
- Sign up with email/password and confirm exactly one «Cartera principal» with 0 balance in the preferred currency, without opening **Carteras** first.
- Sign up with Google and confirm the same result.
- Sign in to an existing account with zero wallets and confirm the wallet appears on that first load; sign in to an account with wallets (including a set where only archived ones remain) and confirm nothing is added.
- Simulate two devices and a retry (reload while the seed write is pending) and confirm no duplicate.
- Delete every wallet, reopen the app and confirm the account stays with zero wallets and the empty state can create a new wallet.
- Receive a settlement as creditor with zero wallets, confirm the existing `walletEmpty` guidance, create a wallet and link the income.
- Rename, archive and delete the main wallet and confirm it behaves like any other.
- Check the name and the guidance in Spanish/English and in light/dark mode, then run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Dependencies
- TICKET-001 wallets, defaults, owner-only persistence
- TICKET-006 profile document and preferred currency (the document that also carries the seed marker)
- TICKET-018 wallet management (edit, archive/restore and guarded deletion of the seeded wallet)
- TICKET-046 settlement income link (the zero-wallet edge that this ticket accepts instead of re-seeding)
