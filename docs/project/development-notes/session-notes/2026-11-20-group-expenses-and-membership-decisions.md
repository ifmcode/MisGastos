# Group expenses and membership decisions (20/11/2026)

## Context
After TICKET-008 (groups and invitations) closed, the product clarified how group
expenses and member management must work when TICKET-009/010/011 and the future
membership ticket land. This note records the decisions so the implementation does
not invent a second money model or an unsafe leave flow.

## Net balance (Splitwise-style)
For each member and currency:

```text
net = sum(amountPaid) - sum(shareCents)
```

- Positive: the group owes the member.
- Negative: the member owes the group.
- The sum of all member nets is always zero, because every expense credits the
  payer `amountCents` and distributes the same `amountCents` across the selected
  participants.

Example: a 90 € dinner split three ways, with A paying:

```text
A: 90 - 30 = +60
B:  0 - 30 = -30
C:  0 - 30 = -30
sum = 0
```

The net balance is always computed from the raw expenses; it does not depend on
the simplification setting.

## Split methods and participant selection
- Equal, exact amounts (`fixed`), percentages (basis points) and shares
  (`weight`) reuse the existing split engine in integer cents and the
  largest-remainder rounding. A sum mismatch is rejected by the schema.
- The group form selects the participating members explicitly. All active members
  are selected by default; a **Todos** shortcut selects or clears all; only the
  selected members appear in the split inputs and receive a share.
- Equal split divides the amount among the selected participants.
- The payer must be an active group member but may be excluded from the
  participants (pays for others) with a 0 share. The payer is credited the full
  amount; each selected participant is debited their share. A 0 share creates no
  debt.
- Any active member can add an expense. The owner can edit/delete any group
  expense; the creator and the payer can edit/delete their own; the other members
  are read-only.

## Debt simplification
- Direct debts: one edge per non-payer participant with a positive share
  (`participant owes payer shareCents`). This is the raw "who owes whom" view.
- Simplified suggestions: split the per-currency nets into debtors (negative) and
  creditors (positive), match them deterministically (largest absolute amount
  first, ties by `userId` ascending), transfer `min(debt, credit)` and repeat. The
  result is deterministic, uses at most `n-1` transfers for `n` non-zero balances
  and never exceeds the net amounts.
- Example: A owes B 10 and B owes C 10 → nets A −10, B 0, C +10 → A owes C 10;
  B drops out.
- Simplification is per currency, never across currencies, and never converts.
- The group document gets `simplifyDebts` (default **true**; missing = true for
  groups created before the field). The owner toggles it from the group
  settings/edit form; the group metadata update and rules allow only the owner to
  change it. The change is recorded in the group history. When off, the UI shows
  the direct debts; when on, the simplified suggestions. The raw net balances are
  always displayed.

## Membership lifecycle
- A non-owner member can leave the group from the detail, with confirmation.
- The owner can remove a member. Both leave and removal require the member's net
  balance to be zero in **every** currency; otherwise the action is blocked with
  the outstanding amount and a **Liquidar** shortcut to the group settlement flow.
  The guard lives in the service because rules cannot sum the ledger; a
  hand-crafted client could bypass it, which is an accepted V1 trade-off until a
  membership-request/owner-approval flow exists.
- The owner can transfer ownership to another active member. The new owner becomes
  `ownerId` and the first `memberIds` entry; the old owner remains a regular
  member and can leave after settling. The group always has exactly one owner.
- The owner cannot leave without transferring ownership. Group deletion is out of
  scope.
- After leave/removal the member loses access to the group, its expenses and its
  history. Their past expenses remain in the ledger; because their net is zero,
  the remaining balances are unchanged and no debt is orphaned.
- Membership events are appended to the group history (TICKET-011):
  `member-left`, `member-removed`, `owner-transferred`, plus the existing group
  metadata and `simplify-debts-changed` events. Notifications are out of scope for
  the membership ticket; the history is the audit trail.

## Ownership transfer and the group id namespace
The group id is `${creatorId}__${autoId}` and the invitation create rule proves
ownership through that prefix without reading the group. A transfer changes the
current owner, so:

- Add an immutable `createdBy` (creator uid) to the group document. The id prefix
  is validated against `createdBy`, not `ownerId`, and the mapper checks
  `createdBy` (fallback to `ownerId` for unreleased groups before the field).
- The invitation create rule keeps the prefix check for the original creator and
  adds a fallback for the current owner:
  `isOwnedGroupId(groupId, request.auth.uid) || get(group).data.ownerId == request.auth.uid`.
  The prefix short-circuits for the creator (19-invite batch stays at one
  friendship read per invitation); a transferred owner pays one group read plus
  one friendship read per invitation, so the service creates those invitations
  sequentially (single-document writes). The notification create rule already
  reads the group and checks `ownerId`, so it works after a transfer.
- The transfer update branch allows changing `ownerId` and reordering `memberIds`
  to put the new owner first, preserving the same member set, the 20 cap and the
  immutable `createdAt`/`createdBy`. Only the current owner can transfer.

## Mapping to tickets
- **TICKET-009:** participant selector, payer outside the participant list, any
  member can add, owner/creator/payer edit permissions, tests.
- **TICKET-010:** net formula, zero-sum invariant, raw vs simplified views,
  `simplifyDebts` setting (default on), deterministic per-currency simplification,
  examples and tests.
- **TICKET-011:** membership and settings events in the history.
- **TICKET-068:** leave, balance-safe removal, ownership transfer, `createdBy`,
  invitation fallback and sequential writes after a transfer, rules and tests.

## Open items for implementation
- Choose the group-expense collection (`groupExpenses` root with `groupId` vs a
  `groups/{groupId}/expenses` subcollection) and document its access-control and
  read-budget trade-off. The 1:1 `sharedExpenses` mapper is pair-specific.
- Define the exact activity event payload and its copy keys.
- Measure the sequential invitation round after a transfer with a real account.
- No code, rules, tests or migrations changed in this session; these are product
  and ticket decisions only.
