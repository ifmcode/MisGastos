# [DONE] TICKET-007 - Future: Friends and Requests

**Type:** Feature  
**Priority:** High  
**Status:** ✅ Done (15/11/2026)  
**Related:** PM-003, PM-004; TICKET-008, TICKET-009, TICKET-010  
**Sprint:** Post-MVP (roadmap Phase 5)

## Description
Let users find other users, send friend requests, accept or reject them and keep a friends list with the net balance shared with each friend.

## Requirements
- [x] Search for a user by exact email
- [x] Send a friend request and prevent self-requests, duplicates and requests to existing friends
- [x] Accept or reject incoming requests and cancel outgoing requests
- [x] List accepted friends with name and net balance ("owes you" / "you owe")
- [x] Persist requests and friendships with requester, recipient, status and timestamps
- [x] Add loading, empty and error states
- [x] Add Firestore rules and validation for every state transition
- [x] Add tests for request transitions, duplicate prevention and balance lookup

## Acceptance Criteria
- [x] A user can send a request to an existing account by email
- [x] The recipient can accept or reject it from the friends screen
- [x] Accepted friends appear in both users' lists
- [x] Duplicate, self and already-friend requests are rejected with a clear message
- [x] The friends list shows the correct derived net balance
- [x] Non-participants cannot read private requests

## Implemented

### Feature module
- New `features/friends/` with `types/friend.types.ts`, `schemas/` (`friend.schema.ts`, `friend-email.schema.ts`, `friend-validation.types.ts`), `utils/` (`friend-pair.ts`, `friend-balance.ts`, `friend-display.ts`), `repositories/` (`firebase-friends.repository.ts` behind `friends.repository.ts`, plus `friends-request.operations.ts`, `friends-friendship.operations.ts`, `friends-profile.operations.ts`, `friend-accept.operation.ts`, `friends.mapper.ts`), `services/` (`friends.service.ts` with the search/send/accept/reject/cancel/remove pieces, `friend.errors.ts`, `friends.factory.ts`), `hooks/` (`use-friends-screen.ts`, `use-friends-overview.ts`, `use-friend-search.ts`, `use-friend-actions.ts`, `use-friends-profile-sync.ts`, `use-friends-service.ts`), `components/`, `styles/friends.styles.ts` and `locales/{es,en}.json`.

### Amigos tab
- New tab in `app/(tabs)/friends.tsx` → `FriendsScreen`, registered in `app/(tabs)/_layout.tsx` with the `person.2.fill` icon. The label comes from `navigation` copy (`tabs.friends`: **Amigos** / **Friends**); every other string lives in the `friends` namespace and passes `npm run check:copy`.

### Public identity (`publicProfiles/{uid}`)
- Minimal projection of the account: `uid`, `displayName`, normalized `email`, `createdAt`, `updatedAt`. The document id is the uid, so no lookup query is needed.
- Owner-writable and readable by any signed-in user; creates and updates are validated against an explicit field allow-list, the uid cannot be reassigned and the stored email must match the caller's token email (`isOwnTokenEmail`). Deletes are denied.
- Created and refreshed by `FriendsPublicProfileSync`, mounted in the root layout inside `AuthProvider`/`ProfileProvider`. `useFriendsProfileSync` waits for the profile to finish loading, prefers the auth email (the write is authorized against it) and retries a failed publish 3 times, 5s apart, plus once more whenever the app returns to the foreground.

### Requests and friendships
- Deterministic pair documents: `friendRequests/{sortedUidA__sortedUidB}` and `friendships/{sortedUidA__sortedUidB}`. Both clients compute the same id through `createFriendPairId`, so one document exists per pair and the rules can verify the id against `participantIds`/`memberIds`.
- Stored request statuses: `pending`, `rejected`, `cancelled`. `accepted` is never stored: accepting writes the friendship and deletes the request in one `runTransaction`.
- Re-sending after `rejected`/`cancelled` reuses the same document, sets it back to `pending` and swaps `requesterId`/`recipientId` when the other user now asks. A pending request or an existing friendship blocks the send with `DUPLICATE_REQUEST`, `INCOMING_REQUEST_EXISTS` or `ALREADY_FRIENDS`, and self-requests fail with `SELF_REQUEST`.
- Either member can remove the friendship (hard delete, no blocking); re-adding later is possible because the pair document is free again.

### Friends screen
- Exact-email search (normalized email) with relation-aware results: `none` (send), `self`, `friend`, `outgoing`, `incoming`, plus a not-found state. Returned emails are the stored normalized value.
- **Solicitudes recibidas** / **Solicitudes enviadas** sections with accept, reject and cancel actions; a **Tus amigos** list with the derived net balance rendered in the preferred currency (**Te debe** / **Le debes** / **En paz**).
- Loading, error (with retry), empty and pull-to-refresh states, inline action errors, a single in-flight action guard and a `ConfirmDialog` before removing a friend. Accessibility labels/hints for the search field, send, accept, reject, cancel and remove actions; es/en copy.

### Balance seam
- `IFriendLedgerRepository` + `EmptyFriendLedgerRepository` (`features/friends/repositories/friend-ledger.repository.ts`) are the seam for TICKET-009 (shared expenses) and TICKET-010 (settlements).
- `calculateFriendNetBalance` folds the pair's ledger entries with integer cents (positive = the friend owes the viewer), `filterFriendLedgerEntries` drops soft-deleted entries and `centsToAmount` converts to decimals only at the display boundary. Production has no ledger yet, so every balance is 0 until TICKET-009/010.

### Firestore rules
- `publicProfiles`: signed-in reads, owner-only create/update, field allow-list, token-email match, immutable uid, no delete.
- `friendRequests`: reads participant-only (a `get` on a missing pair resolves to not-found, a documented existence-only trade-off), creates require the caller as requester, a sorted pair whose join matches the document id, a `pending` status, an existing recipient public profile and no existing friendship; updates allow only `pending → cancelled` (sender), `pending → rejected` (recipient) and `rejected|cancelled → pending` (re-send with swapped roles, never for existing friends); deletes only by the recipient while pending.
- `friendships`: reads member-only (same missing-document contract), create requires the caller as recipient, a sorted pair matching the id, a matching pending request read in the same write and a field allow-list; the document is immutable and either member can delete it.
- No index change was needed.

### Tests and verification
- Tests cover pair ids, request transitions and guards, duplicate/already-friend prevention, relation resolution, overview folding, balance math, profile normalization, mappers and the Firestore operations.
- `npx tsc --noEmit`, `npx expo lint`, `npx jest` (166 suites / 809 tests), `npm run check:copy` (180 TSX files) and the web export pass. Scoped coverage: 98.87% statements, 94.21% branches, 98.93% functions, 99.39% lines.
- Reviewer verdict: `approve with nits`; all major findings were fixed in the same session.

### Deploy note
- The rules are **not deployed yet**: run `npm run firebase-deploy:rules` (or `npm run firestore-update-rules` to log in first) before testing with real accounts.

### Limitations
- Accounts created before this ticket become searchable after their next successful login/app open, when `FriendsPublicProfileSync` writes their public profile (backfill by usage).
- `publicProfiles` is readable by any signed-in user. Only display name and email are exposed; that minimal projection is the accepted trade-off instead of a Cloud Function lookup.
- Friend balances stay at 0 until TICKET-009/010 produce ledger entries; the list already renders the folded value.
- Removing a friend is allowed, but blocking is out of V1, and email remains the only search key (no shareable user code).
- Full design: `docs/project/development-notes/2026-11-15-friends-and-requests.md`.

## Technical Notes
- Do not expose the whole `users` collection to the client. Evaluate a minimal `publicProfiles` document keyed by uid (name and searchable email) or a Cloud Function that resolves an email to a uid. Decide this before implementation.
- Suggested collections: `friendRequests/{id}` and `friendships/{id}`, or subcollections under each user. Keep a single source of truth for the friendship.
- The net balance is derived from shared expenses and settlements. It can start at 0 until TICKET-009 and TICKET-010 exist.
- Create `features/friends/` with `components/`, `hooks/`, `repositories/`, `schemas/`, `services/`, `types/` and `utils/`.
- **Resolved:** a minimal `publicProfiles/{uid}` projection (no Cloud Function) is implemented; both collections are root collections linked by the deterministic pair id; the friendship is the single source of truth after accept; balances come from the ledger seam and stay at 0.

## Open Questions
- Should users be able to block or remove friends? → Removal is implemented; blocking stays out of V1.
- Is email the only search key, or should a shareable user code be supported? → Email only in V1; a user code remains an open follow-up.
