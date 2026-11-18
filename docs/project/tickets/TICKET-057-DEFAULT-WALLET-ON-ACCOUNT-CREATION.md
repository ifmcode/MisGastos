# TICKET-057 - Default Main Wallet on Account Creation

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
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
- [ ] Seed exactly one wallet named «Cartera principal» / "Main wallet", resolved from the `wallets` namespace in the language active at seed time (the name is stored, never re-translated later)
- [ ] Use the profile preferred currency (EUR fallback when the profile is not loaded yet) and the existing wallet defaults for icon, colour, type (`cash`) and `includeInTotal`; initial and current balances start at 0

### When it runs
- [ ] Run once per account on the first authenticated load, for email/password **and** Google accounts, without requiring a visit to the Carteras tab and without blocking the UI
- [ ] Remember the seed per account and make the write idempotent and atomic, so two devices, a retry or a reinstall cannot create two wallets
- [ ] Cover existing accounts with zero wallets; an account with at least one wallet document (active or archived) is never seeded
- [ ] Never re-seed after the user deletes every wallet: zero wallets is a valid state

### Behaviour and safety
- [ ] The seeded wallet behaves like any other: editable, archivable, deletable, included in totals and selectable in movements, transfers and settlements
- [ ] Add no new Firestore rules: wallet creation stays owner-only and the `users` owner rules stay unchanged
- [ ] A failed seed must not block sign-in; it is silent for the user and is retried on the next load
- [ ] Add es/en copy for the name and any new guidance; `npm run check:copy` passes
- [ ] Add colocated tests for the pure default-wallet builder, the seed operation (idempotent, existing wallet, existing marker) and the service guards
- [ ] Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`

## Acceptance Criteria
- [ ] A new email/password account gets exactly one «Cartera principal» with 0 balance in the preferred currency
- [ ] A new Google account gets the same wallet
- [ ] An existing account with zero wallets gets it on the next load
- [ ] An account with one or more wallets (active or archived) gets none
- [ ] Reopening the app, signing in on another device or retrying does not duplicate it
- [ ] Deleting every wallet leaves the account with zero wallets and the main wallet does not come back
- [ ] The seeded wallet can be renamed, archived and deleted like any other
- [ ] A zero-wallet account can still create a wallet from the wallets empty state and then link a settlement income
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass

## Technical Notes
The approach below is a proposal for the implementation; the requirements above are the contract.

- **There is no signup hook, so the seed is an idempotent first-load seed.** Email/password and Google both create the Auth user without an app-controlled Firestore write, and the `users` profile is materialised lazily (`ProfileProvider` falls back to `createProfileFromAuth` in `features/profile/providers/profile-provider.tsx`). "On account creation" therefore becomes a first authenticated load, mirroring `FriendsPublicProfileSync` in `app/_layout.tsx`, which also backfills accounts created before its ticket.
- **Marker proposal:** an ISO string `defaultWalletSeededAt` on the `users` profile document. The existing `match /users/{userId}` rules in `firestore.rules` only require `uid == request.auth.uid` on create and an immutable owner `uid` on update, so no rules change is expected. When the profile document is missing at seed time, the operation creates it with `uid`, email, display name (`name` in the document, as the profile mapper reads it), preferred currency and the stamp.
- **Atomicity:** one `runTransaction` that re-checks the marker and the wallet existence and writes the wallet plus the stamp together, with a deterministic wallet id so two devices converge instead of racing.
- **Where it lives:** `useWallets` only reads. The seed belongs to a root sync component mounted inside `AuthProvider`/`ProfileProvider` next to `FriendsPublicProfileSync`, not to the **Carteras** tab, so a user who never opens the tab still gets the wallet.
- **Defaults already exist:** `DEFAULT_WALLET_FORM_VALUES` / `createWalletFormValues` in `features/wallets/utils/wallet-options.ts` carry icon `wallet`, `WALLET_COLORS[0]`, type `cash` and `includeInTotal: true`; `resolveCurrencyCode` in `shared/constants/currencies.ts` provides the EUR fallback. The seed reuses them through a pure builder instead of a second defaults object.
- **No composite index:** `getWallets(ownerId)` already filters by owner in `features/wallets/services/wallet.service.ts`, and the zero-wallet check only needs the owner's document set.
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
