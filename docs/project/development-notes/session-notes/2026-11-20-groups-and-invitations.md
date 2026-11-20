# Groups and invitations (TICKET-008, 20/11/2026)

## Context
Roadmap Phase 6 starts with groups. TICKET-008 originally asked for groups with
accepted friends added as members during creation; the product decision for this
session was to make membership explicit: the owner invites accepted friends, each
invitee receives an in-app notification and joins only after accepting. The group
join code and the join requests it enables were split into TICKET-061 so they do
not block TICKET-009. Group expenses and balances remain TICKET-009/010, so the
only correct balance today is **En paz**.

The group currency is not a fixed ledger currency. It is `defaultCurrency`, the
initial value for a new group expense; every group expense stores its own currency
and balances are grouped per currency, never converted, mirroring the 1:1
shared-expense model. TICKET-009 and TICKET-010 carry that contract.

## Data model
`groups/{groupId}`:
- `ownerId`
- `memberIds`: owner first, accepted members only, unique, maximum 20 including
  the owner
- `name` (1..60), `description` (`null` or <= 200)
- `defaultCurrency` (EUR, USD, GBP, JPY, CHF)
- `createdAt`, `updatedAt`

The document id is **owner-namespaced**: `${ownerId}__${autoId}`. This is the
security boundary that lets an invitation create prove its group belongs to the
caller without reading the group (see below).

`groupInvitations/{groupId}__{inviteeId}`:
- `groupId`, `groupName` (denormalized so the invitee list never reads the group)
- `inviterId` (the owner at invite time), `inviteeId`
- `pairId`: sorted friend pair, the same id used by `friendships`
- `status`: `pending`, `accepted`, `rejected` or `cancelled`
- `createdAt`, `updatedAt`

The deterministic id means one document per invitee and group. Re-inviting reopens
the same document; a duplicate create is impossible.

## Invitation lifecycle
- **Create:** the service validates that every invitee is an accepted friend
  (`NOT_FRIEND`), then one `writeBatch` writes the group (`memberIds: [ownerId]`)
  and every pending invitation. A creation has at most 19 invitees. Each
  invitation create reads exactly one friendship document, so a full 19-invite
  batch stays at 19 reads inside the 20-read batched-write budget. Notifications
  are sent afterwards, best-effort; a notification failure never rolls back the
  group or the invitations because the invitations screen is the fallback.
- **Accept:** one `runTransaction` sets the invitation to `accepted` and appends
  the caller to `memberIds` (owner stays first). The graph update rule verifies
  the accepted deterministic invitation with `getAfter`, so a group update without
  its accepted invitation is impossible. The transaction re-checks the member cap.
- **Reject:** the invitee only, `pending -> rejected`.
- **Cancel:** the owner only, `pending -> cancelled`.
- **Remove member:** the owner removes one non-owner member in a transaction. The
  owner can never remove themselves. The accepted invitation stays `accepted`; a
  later invite reopens it to `pending`.
- **Re-invite:** reopens the deterministic invitation instead of creating a second
  document. If the denormalized group name drifted it is refreshed by a second
  pending -> pending write, because the rules only allow `status`/`updatedAt` in
  the reopen transition.
- **Rename:** a metadata update also refreshes the `groupName` of pending
  invitations in the same batch, so the invitee list never shows an old name.

## Capacity and reserved seats
`getGroupInviteCapacity(memberIds, pendingCount) = max(20 - members - pending, 0)`.
A pending invitation reserves a seat: the owner cannot queue more invitations than
the group can honour. Creation allows 1 member + 19 pending = 20. An extra invite
round filters out current members and already-pending invitees, then requires
`members + pending + new <= 20` and throws `GROUP_FULL` otherwise. The UI passes
the pending count to the same helper, so the invite sheet's capacity and the
service cannot drift. A late acceptance after the group fills still fails with
`GROUP_FULL`; the owner can cancel a pending invitation to free a seat.

The rules cap `memberIds` at 20 but do **not** count pending invitations (rules
cannot count a query cheaply). A hand-crafted write outside the app could queue
extra pending rows; acceptance still fails with `GROUP_FULL`. This is an accepted
trade-off, documented in the ticket.

## Rules and security
`firestore.rules` adds `groups` and `groupInvitations`, plus the `group-invite`
notification type.

- **Group id namespace:** `isOwnedGroupId(groupId, ownerId)` uses
  `groupId.split('__')[0] == ownerId` (plus a non-empty suffix). Group create
  requires it, and invitation create requires
  `isOwnedGroupId(invitation.groupId, request.auth.uid)`. Only the owner can create
  a group under their own prefix, so nobody can forge an invitation into someone
  else's group. `split` is used instead of a regex: Firebase uids and auto ids are
  alphanumeric, so the separator is unambiguous and caller input never reaches a
  pattern. This closes the first review's blocker (a forged invitation used to
  grant the invitee a read of the group through the pending-invitee `get`).
- **Group reads:** members can `list` and `get`. A pending invitee may `get` one
  group; that is what the accept transaction needs, and the rule re-checks the
  invitation's `groupId`. `list` stays member-only.
- **Group updates:** identity (`ownerId`, `createdAt`) is immutable. The only
  allowed shapes are an owner metadata edit, an owner removal of one member (owner
  stays, old list contains the new one, size -1), and an invitee joining through an
  accepted deterministic invitation (`getAfter`, caller not in the old list, size
  +1, new list contains the old one, caller in the new list, <= 20). Delete is
  denied.
- **Invitation reads:** participant-only. A `get` on a missing deterministic id
  resolves to not-found so an idempotent invite can decide create vs reopen; the
  same deliberate existence-oracle trade-off as the friend pair documents.
- **Invitation writes:** the create is friend-only (one `get` of
  `friendships/{pairId}`) and owner-namespaced, with the exact field allow-list and
  `status: pending`. The invitee accepts/rejects; the owner cancels, renames a
  pending invitation or reopens a rejected/cancelled/accepted one. Every
  transition restricts the diff. Delete is denied.
- **No composite index:** the group list uses `memberIds array-contains`, the
  owner's invitation list uses `inviterId ==`, and the received list uses
  `inviteeId ==`; all sort client-side.

The invitation create rule deliberately does not read the group (to keep the
19-invite batch inside the read budget). An invitation for a non-existent group
under the caller's own namespace is possible, but it cannot read a real group,
cannot notify (the notification rule reads the group and checks its owner) and
cannot be accepted. This is a residual spam vector only, recorded in the ticket.

## Notifications
`group-invite` is an active inbox type with payload
`{ invitationId, groupId, groupName, friendUid }` (`friendUid` is the inviter).
The notification create rule checks the referenced invitation with `getAfter`:
invitee = recipient, inviter = actor, group/name match, status pending, and the
actor must own the group. The inviter may `get` its deterministic notification
document so `createNotificationOperation` stays idempotent. The dedupe key includes
the invitation `updatedAt`, so a re-invite notifies once more. The target resolver
maps `group-invite` to `/social/requests`; rows and the foreground
banner resolve their copy from the type, the actor name and the denormalized group
name.

## UI and routes
- **Social → Tus grupos:** `features/social` composes the groups controller
  (`use-social-groups`) with `useGroups`, `useGroupInvitations` and
  `useGroupEditor`. The segment owns its loading/error states: a failed first load
  shows only the error with retry and a background failure keeps cached groups plus
  an `ErrorBanner`. The top **Peticiones pendientes** banner adds the received group
  invitations to the friend-request count and opens `/social/requests`. The empty
  state only offers **Crear grupo** when there are accepted friends; otherwise it
  explains how to add one.
- **Social FAB:** **Crear grupo** next to **Añadir amigo**. It is disabled while
  friends load or when there are no accepted friends, with a distinct hint when the
  friends load failed. **Unirse a grupo** is TICKET-061.
- **Create/edit form:** a page sheet with name, description, `CurrencyField` and a
  multi-select of accepted friends on create. The profile preferred currency is
  the default (EUR fallback). Selecting a friend only sends an invitation; the form
  explains that they join after accepting. Edit only changes name, description and
  default currency.
- **Group detail:** `/social/groups/[groupId]` with back, the group name as a
  pressable heading that opens the details sheet, member count + default currency,
  **En paz**, and owner-only edit/invite shortcuts. The details sheet shows name,
  description, default currency, member count, member list with roles, pending
  invitations and the owner remove/cancel actions with confirmation. The main body
  is the group-expense empty card until TICKET-009.
- **Pending requests:** `/social/requests` is the single pending screen. It shows
  incoming friend requests, the **Invitaciones a grupos** section with received
  group invitations and accept/reject, and outgoing friend requests. The header
  subtitle uses the combined total; the empty state only appears when both sources
  finished and are empty. The group section has its own inline loading/error with
  retry, and the friend sources keep their own states. The top **Peticiones
  pendientes** banner counts friend requests (incoming + outgoing) plus received
  group invitations; sent group invitations stay in the group detail. The
  notification target is `/social/requests`. The separate groups-segment row and
  the dedicated `/social/groups/invitations` route/screen were removed.
- **Copy:** a new `groups` i18n namespace with es/en parity; the notification
  namespace gains `types.group-invite`.

## Alternatives rejected
- **Immediate membership during creation** (the original ticket): replaced by
  invitations after the product decision. It would have made the group appear for
  people who never agreed to join.
- **A second money implementation for groups:** rejected. Group expenses will
  reuse the shared-expense split/ledger model, with per-expense currency.
- **Reading the group in the invitation create rule:** rejected for the batch read
  budget. The owner-namespaced id proves ownership instead.
- **Regex prefix check with `matches('^' + ownerId + '__')`:** replaced by
  `split('__')` to avoid regex interpolation and anchoring assumptions.
- **A group code in TICKET-008:** deferred to TICKET-061 to unblock TICKET-009.

## Verification (20/11/2026)
- `npx tsc --noEmit`: pass.
- `npx expo lint`: exit 0.
- `npx jest` / `npm run test:coverage -- --silent`: 286 suites / 1711 tests.
- Coverage: 98.84 % statements, 94.20 % branches, 98.43 % functions, 99.42 % lines
  (gate 90 %).
- `npm run check:copy`: passed, 282 TSX files.
- `npx firebase deploy --only firestore:rules --dry-run`: compiled successfully.
- Review: first round found a forged-invitation read blocker and two majors; fixed
  with the owner-namespaced id, the reserved-seat capacity and the groups-segment
  error state. Second focused review: `approve with nits`; the remaining nits are
  documented trade-offs.

## Pending and known limitations
- Deploy the rules manually: `npm run firebase-deploy:rules` (`groups`,
  `groupInvitations`, `group-invite`).
- Manual device validation: light/dark, es/en, page sheets, screen reader, a
  two-account invite/accept round and the notification deep link.
- Group expenses and balances are TICKET-009/010; the summary is always **En paz**
  today. The join code and join requests are TICKET-061.
- Rules cap members but do not count pending invitations; the service/UI reserve
  seats. A hand-crafted write can queue extra pending rows and a late acceptance
  fails with `GROUP_FULL`.
- Two full `groupInvitations` list reads per invite round (pending count + existing
  invitations) is accepted optimization debt.
- Answering an invitation from `/social/requests` does not auto-mark its
  inbox notification read; opening the notification does.
- `useGroupFormValues` captures the profile preferred currency when the form opens;
  a profile that arrives later keeps the EUR fallback for that open form.
- Legacy pre-namespace group test documents are dropped by the mapper (the feature
  is unreleased and the rules are not deployed). There is no rules emulator suite
  yet, so the `split('__')` semantic is validated by compilation plus the mapper
  tests, not by rules unit tests.

## Post-close refinement (20/11/2026)
The first delivery added a received-invitations row inside **Tus grupos** and a
dedicated `/social/groups/invitations` screen. The product asked to reuse the
existing top **Peticiones pendientes** banner instead. The row and the dedicated
screen/route were removed; the banner count now adds the received group invitations
to the friend requests and opens `/social/requests`, which shows incoming friend
requests, the **Invitaciones a grupos** section and outgoing friend requests. The
group section owns its inline loading/error states, and a friends failure no longer
hides group invitations that loaded. The `group-invite` notification target is
`/social/requests` (the `group-invitations` target kind was removed). Sent group
invitations stay in the group detail. Re-verified with 286 suites / 1711 tests,
coverage 98.84 % / 94.20 % / 98.43 % / 99.42 %, and `check:copy` over 282 TSX files.

## Next
TICKET-009 (group shared expenses with per-expense currency) is the next ticket.
TICKET-061 (join code and join requests) stays queued after the group core.
