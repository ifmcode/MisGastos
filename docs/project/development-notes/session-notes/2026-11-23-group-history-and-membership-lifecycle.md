# Group history and membership lifecycle (TICKET-011 and TICKET-068, 23/11/2026)

> Superseded in part by `2026-11-24-group-activity-in-detail.md`: the activity
> data model and rules stay, the separate history route moved into the group
> detail.

## Context

TICKET-011 (group history) and TICKET-068 (membership lifecycle) had a circular
dependency: the history feed needs the `member-left`, `member-removed` and
`owner-transferred` events, and those events only exist because the membership
ticket writes them. The user decided to implement both in the same session and
close them together, with the feed owning the collection and the membership work
owning the events.

The user also fixed the shape of the solution up front: the feed lives in a
member-only subcollection shown on its own route, it records from this release
onwards (no backfill), it paginates with **Cargar más**, and membership safety
reuses TICKET-010's ledger instead of inventing a second balance model.

## Activity model and event list

- Member-only, append-only `groups/{groupId}/activity/{activityId}`. Deliberately
  neither a root collection nor a collection-group query: history is always read
  in the context of one group, so a subcollection keeps the read budget and the
  rules simple.
- Twelve event types: `expense-created`, `expense-updated`, `expense-deleted`,
  `settlement-created`, `settlement-updated`, `settlement-deleted`,
  `member-joined`, `member-left`, `member-removed`, `owner-transferred`,
  `group-updated` and `simplify-debts-changed`
  (`features/groups/types/group-activity.types.ts`).
- Structured payload only, never a sentence: `actorId`, `targetUserId`,
  `targetName` (display-name snapshot written only for removals and leaves,
  because the member leaves `memberIds`), `expenseId`, `settlementId`,
  `fromUserId`/`toUserId` (debtor pays creditor), `amountCents`, `currency`,
  `description`, `changedFields`, `simplifyDebts`, `previousOwnerId`,
  `newOwnerId` and `createdAt`. Copy is resolved in the UI from the type and the
  payload (`features/groups/utils/group-activity-copy.ts`,
  `group-activity-display.ts`).

## Atomicity

Every event is written in the same `runTransaction` or `writeBatch` as the record
it describes, so the feed and the ledger cannot diverge: expense and settlement
create/update/delete, group settings edits, joins, leaves, removals and
ownership transfers. Deletes are idempotent, so a repeated soft delete never
duplicates an event. Rejected and cancelled invitations, the lazy join-code
backfill and group creation emit nothing, because they are not group activity.

## Pagination and cursor

`createdAt` desc plus the document id desc, `startAfter(createdAt, id)`, page 20
clamped to 50 in the service. `nextCursor` is taken from the last **raw** row of
the page rather than the last mapped event, so a malformed row dropped by the
mapper cannot stall **Cargar más**. No composite index: the ordering stays inside
one subcollection with no extra filter.

## Rules and trade-offs

Reads are member-only. A create must come from the signed-in actor
(`actorId == request.auth.uid`), must set `groupId` to the path and must pass the
type and field allow-lists. Membership is checked with `get`/`getAfter`, so a
join or leave event can be written in the same commit as the `memberIds` change;
updates and deletes are denied.

Accepted trade-off: the rules cannot read the expense or settlement an event
points to, nor sum a ledger, so a member could forge an event attributed to
themselves. The service is the only writer and the feed is advisory — the ledger
remains the only source of money truth.

## `createdBy`

The group id is owner-namespaced at creation (`${creatorId}__${autoId}`), so a
transfer would invalidate the prefix. `groups` now carries an immutable
`createdBy`; create writes `createdBy = ownerId = creator`, the mapper validates
the id prefix against `createdBy` with an `ownerId` fallback for groups created
before the field existed, and the rules keep it immutable. The invitation-create
rule accepts the current owner as a fallback to the prefix (`isGroupOwner`), so a
promoted owner can still invite.

## Balance guard and the accepted race

`IGroupBalancePort` returns the member's non-zero nets per currency and is
implemented in `features/group-expenses` over `calculateGroupNetBalances` +
`getMemberNetBalances`, the same engine the balances screen renders, so the guard
and the UI never disagree. `assertGroupMemberSettled` rejects with
`BALANCE_NOT_SETTLED` before leave and removal.

The ledger read happens outside the write transaction (rules cannot sum a
ledger). A concurrent write can therefore slip between the check and the commit;
it is the same class of race already accepted for the settlement amount bound,
and it can only let a member through whose net was zero at read time.

## Leave, removal and transfer

- Leave: non-owner only, with confirmation; the owner gets `CANNOT_REMOVE_OWNER`
  and the UI hint to transfer ownership first.
- Balance-safe removal: the existing owner removal action reuses the same guard.
- Transfer: owner-only, target must be an active non-owner
  (`INVALID_OWNERSHIP_TARGET`). `ownerId` moves, `memberIds` is reordered
  owner-first with the same set, the old owner stays a member and the group keeps
  exactly one owner.
- All three emit `member-left`/`member-removed`/`owner-transferred` in the same
  transaction, with the target-name snapshot where the member leaves.

## Join-code propagation

The `groupCodes/{code}` projection follows the new owner inside the transfer
commit, so the promoted owner can rename the group and receive join requests
without a stale `ownerId` in the projection.

## Post-transfer invitation lifecycle

The transfer exposed several invitation assumptions, all fixed in the same pass:

- The invitation mapper no longer requires the id prefix to match `inviterId`.
- `getGroupInvitations` queries by `groupId`, so the current owner lists them.
- The current owner can cancel, rename-propagate and reopen the group's
  invitations.
- The accept rule no longer requires the stored inviter to be the current owner.
- Reopening after a transfer rewrites `inviterId`/`pairId` and re-checks the new
  friendship, so a reopened invitation never points at a stale pair.

New rule branches: `isGroupOwner`, participant-or-owner invitation reads,
owner-only cancel/rename/reopen, self-removal and ownership-transfer group
updates.

## Review outcome

The reviewer returned `approve with nits` after a fix round: the blockers raised
in that round were resolved before closing, and the remaining nits are the
accepted limitations listed below (no backfill, focus refresh instead of
listeners, `ScrollView` with mapped rows, the former-owner invitation read, and
no membership notifications).

## UI surfaces

- `/social/groups/[groupId]/history` (`app/social/groups/[groupId]/history.tsx`)
  opened from **Ver historial** in **Detalles del grupo**.
- The shared `TimelineRow` gained an optional press: expense and settlement rows
  open their detail, membership and settings rows are not pressable.
- Rows show the date gutter, actor, affected member, amount, description,
  settlement pair and viewer variants, with a **Cargar más** footer; the screen
  covers loading, empty, error, missing and pull-to-refresh.
- Membership: non-owner **Salir del grupo** with confirmation, the owner hint to
  transfer first, an owner-only key action per member row for the transfer, and a
  blocked-balance dialog that lists the amount and direction per currency with a
  **Liquidar** confirm opening the group settle route. After leaving, the sheet
  closes and the app returns to Social.

## Files by layer

- **Types and utils** (`features/groups`): `types/group-activity.types.ts`,
  `utils/group-activity.ts`, `group-activity-display.ts`,
  `group-activity-display.types.ts`, `group-activity-copy.ts`,
  `group-activity-participants.ts`, `utils/group-membership.ts`,
  `group-membership-copy.ts`, `group-member-balances.ts`.
- **Repository** (`features/groups/repositories`): `group-activity.data.ts`,
  `group-activity.mapper.ts`, `group-activity.operations.ts`,
  `group-activity.writes.ts`, `group-member-leave.operation.ts`,
  `group-member-remove.operation.ts`, `group-owner-transfer.operation.ts`,
  `group-invitation.operations.ts`, `groups.mapper.ts`, `groups.data.ts`.
- **Service** (`features/groups/services`): `group-activity.read.ts`,
  `group-balance.port.ts`, `group-balance.guard.ts`,
  `group-membership-write.ts`, `groups.service.ts`; the port implementation lives
  in `features/group-expenses/repositories/firebase-group-balance.port.ts`.
- **UI** (`features/groups/components`): `group-history-screen.tsx`,
  `group-history-content.tsx`, `group-history-list.tsx`,
  `group-history-footer.tsx`, `group-history-empty.tsx`, `group-activity-row.tsx`,
  `group-details-history-button.tsx`, `group-details-leave-button.tsx`,
  `group-member-actions.tsx`; hooks in `features/groups/hooks`
  (`use-group-history*`, `use-group-leave-action.ts`,
  `use-group-member-actions-core.ts`).

## Verification

- `npx tsc --noEmit` and `npx expo lint` clean.
- `npx jest`: 379 suites / 2506 tests passed.
- `npm run test:coverage`: 98.97 % statements, 94.83 % branches, 98.67 %
  functions, 99.57 % lines.
- `npm run check:copy`: copy audit passed (348 TSX files).
- `npx firebase deploy --only firestore:rules --dry-run`: compiled successfully,
  nothing deployed.

## Accepted limitations

- **No backfill:** the feed records from this release onwards; earlier expenses,
  settlements and settings changes have no event.
- **Focus refresh instead of listeners:** the automatic-refresh answer is the
  focus refresh plus pull-to-refresh; the project uses no `onSnapshot`
  subscriptions.
- **`ScrollView` with mapped rows** instead of `FlatList`, following the existing
  timeline pattern (accepted nit).
- **Former-owner invitation reads:** a former owner who later leaves keeps read
  access to the invitation rows they created, because invitation reads accept the
  stored inviter as a participant. Pre-existing and narrow.
- **No membership notifications:** the history is the audit trail; a future
  ticket can notify the removed member or the promoted owner through the inbox.

## Pending

- Firestore rules deployment (`npm run firebase-deploy:rules`): the new
  `groups/{groupId}/activity` subcollection, `createdBy`, the
  self-removal/ownership-transfer/invitation-owner rules and the `groupCodes`
  owner propagation are compiled but not published.
- Manual device and dark-mode validation of the history screen, the leave flow
  and the blocked-balance dialog.
