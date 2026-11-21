# Group join code and join requests (TICKET-061, 20/11/2026)

## Context
TICKET-008 closed groups and friend invitations. TICKET-061 adds the second way
into a group: a stable code that any signed-in user can resolve and use to ask
the owner for access. The owner accepts or rejects from the group detail, and an
acceptance must reuse the TICKET-008 membership invariant, never bypass it.

This session implemented **only TICKET-061**. By product decision, the remaining
group requirements of TICKET-009 (group expenses, participant selector, net
balances and their detail screen) were deferred to the next session, so no
expense or balance model changed here.

## Code lookup without exposing the group
A join code cannot be a `where('joinCode', '==', code)` query on `groups`,
because a non-member cannot list or read that collection. Two alternatives were
considered:

- a callable/server-side lookup, rejected because the project has no backend and
  every social write currently runs on the client;
- a projection collection, chosen: `groupCodes/{code}` with
  `{ groupId, ownerId, groupName }`.

`groupCodes` allows `get` to any signed-in user and denies `list`, so a code can
be resolved by exact id but codes cannot be enumerated. Only the owner writes it:
the create rule re-reads the group with `getAfter` and requires
`group.joinCode == code`, the same owner and the same name, so a forged row
cannot point a code at another owner's group. A rename updates the projection's
`groupName` in the same batch as the group (`getAfter` keeps both coherent).

The projection deliberately reveals the group id, the owner uid and the name to
whoever holds the code. That is what makes the join screen useful ("vas a pedir
entrar en «Viaje»") without reading the group document. Members, invitations,
expenses and balances stay behind the member-only `groups` rules.

## Code generation and legacy backfill
- `joinCode` lives on the group document, so every member can read and share it.
- 8 characters over `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (no `0`/`O`/`1`/`I`):
  40 bits, rendered as `ABCD-2345` for sharing and read back with the dashes and
  spaces removed, case-insensitively.
- Creation generates the code and writes the group plus its `groupCodes`
  projection in the existing batch. There is no rotation; changing the code is
  out of scope.
- A group created before this ticket has `joinCode: null`. Its owner generates it
  from the detail (**Generar código**) through `ensureJoinCode`: an existing code
  is returned without a write, a denied write is retried after reloading the
  group, and a code collision is retried with a fresh code up to three times.
- The generator uses `Math.random` with rejection sampling so the alphabet is
  unbiased. It is not a CSPRNG; 40 bits plus owner approval is accepted for V1,
  with `expo-crypto` as the future hardening step.

## Join request lifecycle
`groupJoinRequests/{groupId}__{requesterId}`:

| Field | Notes |
|---|---|
| `groupId` | Target group |
| `requesterId` | The caller; also part of the deterministic id |
| `joinCode` | Proof of the code the caller used; checked by the create rule |
| `status` | `pending`, `accepted`, `rejected`, `cancelled` (reserved, no producer) |
| `createdAt`, `updatedAt` | String stamps |

There is no denormalized `ownerId`: the rules and the transaction read the group
to prove ownership. The deterministic id means one document per group and
requester, so a duplicate create is impossible; a second attempt is an update
the rules deny. `accepted` and `rejected` are terminal and a resolved request is
never reopened, matching the product decision.

`lookupJoinCode` reads only `groupCodes` plus the viewer's own groups (to report
membership) and the viewer's own request. An invalid or unknown code returns
`INVALID_JOIN_CODE` and writes nothing. `requestToJoin` revalidates everything
before writing and returns `ALREADY_MEMBER`, `JOIN_REQUEST_ALREADY_PENDING` or
`JOIN_REQUEST_RESOLVED`.

## Acceptance and rules
Acceptance is one `runTransaction` that re-reads the request and the group,
checks the caller is the owner, the request is `pending`, the requester is not
already a member and the group is not full, then appends the requester with
`appendGroupMember` (owner-first, maximum 20) and flips the request to
`accepted`. Rejection only writes `rejected`. The service is the first guard; the
rules are the boundary.

The rules cross-check both documents with `getAfter`:

- a group update may append one member only when the appended uid (obtained with
  `next.memberIds.removeAll(previous.memberIds)`) has an `accepted` request;
- a request may move `pending → accepted` only when the same atomic write put
  its requester in `memberIds`;
- a request may move `pending → rejected` only by the group owner;
- group create and backfill validate the code format; backfill only when the
  field did not exist, so it cannot rotate.

A requester can join through a TICKET-008 invitation while their request is
still pending. That row would always fail with `ALREADY_MEMBER`, so the owner
queue filters out requesters already in `memberIds`; the document remains
pending as an audit record. This is a deliberate client-side filter (no
composite index): the owner reads the request history and keeps pending,
non-member rows. The single distinct group document read performed by the list
rule is cached across the documents of one query.

## Notifications
Three inbox events reuse TICKET-047:

- `group-join-request` → the owner, written by the requester's client;
- `group-join-accepted` / `group-join-rejected` → the requester, written by the
  owner's client after the decision.

Payload: `{ requestId, groupId, groupName, friendUid }`, where `friendUid` is the
requester on the request event and the owner on the outcome. Delivery is
best-effort: the request or the acceptance already committed, and a notification
failure is swallowed because the group detail queue is the fallback. The copy
never names the actor because the requester may not be a friend ("Alguien quiere
unirse al grupo «X»", "Han aceptado tu solicitud…").

The create rule ties the notification id to the event stamp
(`${type}:${requestId}:${createdAt|updatedAt}`), so a requester cannot manufacture
extra inbox rows for the same request. `group-join-request` and
`group-join-accepted` open the group detail; `group-join-rejected` opens
`/social/requests`, since there is no per-request status screen.

## UI
- Group details sheet (the page sheet opened from the group header): a code card
  for every member with the formatted code and **Compartir código** (native
  `Share`, no new dependency); the owner of a legacy group sees **Generar
  código** instead. A member without a code sees the pending notice. The card is
  deliberately not in the group route body, which keeps the owner request queue
  and the expenses placeholder.
- Owner-only **Solicitudes para unirse** (group route body): counter, empty
  state, requester name from `publicProfiles`, accept/reject with a per-row busy
  state and a single flight. The detail reloads after every decision.
- Social FAB: **Unirse a grupo** → `/social/groups/join`. The screen validates the
  code locally, looks it up and renders `found`, `member`, `pending`, `rejected`
  or `sent`; `INVALID_JOIN_CODE` stays in the field, other failures use the
  banner. The rejected state offers **Probar otro código**.
- Copy is in the `groups` and `social` namespaces (es/en); the layout lives in
  `features/groups/styles/group-join.styles.ts`; every action has a label, hint
  and busy/disabled state.

## Alternatives and consequences
- **Hash the code instead of a readable projection** would keep the name secret
  but lose the confirmation step and add a hashing dependency; rejected.
- **A subcollection `groups/{groupId}/joinRequests`** would remove the group
  read from the list rule but deviate from the ticket's suggested root
  collection and the existing invitation shape; the cached group read is cheap.
- **Rotating or expiring codes** was explicitly out of scope; the code is stable.
- **Requester cancellation** (which would make `cancelled` reachable) was not
  requested and is left for a follow-up, together with re-requesting after a
  rejection.

## Verification
`npx tsc --noEmit`, `npx expo lint`, `npx jest --runInBand` (297 suites / 1798
tests), `npm run test:coverage` (98.82 % statements, 94.22 % branches, 98.52 %
functions, 99.45 % lines), `npm run check:copy` (290 TSX) and
`npx firebase deploy --only firestore:rules --dry-run` (compiles).

The reviewer requested changes; the phantom row for an already accepted member
(major), the notification dedupe tie, the re-lookup after a denied double submit,
the backfill retry, the useless Social refresh and the style nits were fixed.

## Pending and next
- The `groups`, `groupCodes`, `groupJoinRequests` and notification rules are
  **not deployed**: run `npm run firebase-deploy:rules`. No index changes.
- Manual validation with two real accounts on a device is still pending.
- TICKET-009 (group shared expenses) is the next ticket. The previous decisions
  stand: expenses list plus per-member net balance in the group detail, a
  dedicated group expense detail screen, the four split modes returning to the
  group form, and owner/creator/payer edit permissions.
