# Session note - Friends and requests (TICKET-007)

**Date:** 15/11/2026  
**Ticket:** TICKET-007  
**Status:** ✅ Done

## Problem
The app could not connect two accounts. Users needed to find another account,
send a friend request, accept or reject it, and keep a list of friends with the
amount they share. Everything had to stay compatible with the Phase 4
constraints: append-only social ledgers, no readable `users` collection and no
Cloud Functions in V1.

## Data model

| Collection | Id | Fields | Owner |
|---|---|---|---|
| `publicProfiles` | `{uid}` | `uid`, `displayName`, `email` (normalized lowercase), `createdAt`, `updatedAt` | The account itself |
| `friendRequests` | `{uidA__uidB}` | `requesterId`, `recipientId`, `participantIds` (sorted pair), `status`, `createdAt`, `updatedAt` | The two participants |
| `friendships` | `{uidA__uidB}` | `memberIds` (sorted pair), `requesterId`, `recipientId`, `createdAt` | The two members |

**Pair id.** `createFriendPairId(uidA, uidB)` in
`features/friends/utils/friend-pair.ts` sorts both uids lexicographically and
joins them with `__`. Requests and friendships of the same pair therefore share
the id, both clients compute it without a query, and `firestore.rules` can prove
`participantIds[0] < participantIds[1]` and that the id is the join of the pair.
`createdAt` is immutable; the friendship document is immutable as a whole.

**No stored balance.** The friends list folds ledger entries, so no balance
field can drift from its source.

## Request lifecycle

```text
                 send               accept (recipient)
   (no document) ──▶ pending ─────────────────────────▶ friendship
                       │  ▲                             (request deleted)
        cancel         │  │  reject (recipient)
     (requester)       ▼  │
                   cancelled / rejected
                       │
                       └── re-send by either user ──▶ pending (roles swapped)
```

| From | To | Who | Notes |
|---|---|---|---|
| — | `pending` | Requester | Blocks self, missing recipient profile, existing friendship, pending request |
| `pending` | `cancelled` | Requester | Keeps the document for a later re-send |
| `pending` | `rejected` | Recipient | Keeps the document for a later re-send |
| `rejected` / `cancelled` | `pending` | Either user | Reuses the document and swaps `requesterId`/`recipientId` |
| `pending` | — (deleted) | Recipient | Same transaction creates the friendship |
| friendship | — (deleted) | Either member | Removal, no blocking |

`accepted` is not a stored status: the friendship is the only accepted state.
`FriendsService` owns the guards (`REQUEST_NOT_FOUND`, `NOT_REQUEST_RECIPIENT`,
`NOT_REQUEST_SENDER`, `REQUEST_NOT_PENDING`, `SELF_REQUEST`, `ALREADY_FRIENDS`,
`DUPLICATE_REQUEST`, `INCOMING_REQUEST_EXISTS`, `FRIEND_NOT_FOUND`) and returns
codes that the UI translates.

## Balance seam

`IFriendLedgerRepository` and `EmptyFriendLedgerRepository` live in
`features/friends/repositories/friend-ledger.repository.ts`. The production
factory wires the empty implementation, so every friend shows **En paz** (0)
until TICKET-009/010 write ledger entries. `calculateFriendNetBalance` folds a
pair's entries in integer cents (positive = the friend owes the viewer),
`filterFriendLedgerEntries` ignores soft-deleted entries and `centsToAmount`
converts to decimals only when rendering, in the preferred currency.

## Rules summary

- `publicProfiles`: `get`/`list` for any signed-in user; `create`/`update` only
  for the owner, with a field allow-list, an immutable `uid` and a stored email
  equal to the caller's token email; `delete` denied.
- `friendRequests`: participant-only reads; `get` on a missing pair resolves to
  not-found so the sender can decide create vs re-open; creates validated
  against the sorted pair, the document id, the recipient public profile and the
  absence of a friendship; only the three transitions above are allowed, with
  pair and `createdAt` immutable; deletes only by the recipient while pending.
- `friendships`: member-only reads and deletes, create validated against the
  pending request read in the same write, updates denied.
- No composite index was required.

## Privacy trade-off of `publicProfiles`

Exact-email search needs a readable directory. A Cloud Function lookup would
hide the directory, but it is out of V1 and adds a deploy target. The accepted
alternative is a minimal projection (display name plus normalized email) that
any signed-in user can read, keyed by uid so nothing else leaks. Consequences:
an account is discoverable by whoever knows its email; changes to the display
name propagate on the next app open; accounts created before this ticket become
searchable after their next successful login/app open (backfill by usage).

## Verification

```powershell
npx tsc --noEmit
npx expo lint
npx jest
npm run check:copy
```

All pass: 166 suites / 809 tests, coverage 98.87% statements, 94.21% branches,
98.93% functions, 99.39% lines; `check:copy` audits 180 TSX files and the web
export succeeds. Reviewer verdict: `approve with nits`, all majors fixed.

## Limitations and next steps
- **Rules are not deployed:** run `npm run firebase-deploy:rules` before testing
  with real accounts.
- Friend balances stay at 0 until TICKET-009 (1:1 shared expense) and TICKET-010
  (balance and settlement) produce ledger entries.
- Blocking is out of V1; removal is available and reversible by sending a new
  request.
- Email is the only search key; a shareable user code remains an open follow-up.
- Offline friend movements wait for roadmap Phase 7.
