# Guidelines: Security, Validation and Best Practices

## 1. Security
- **Env vars**: Use `EXPO_PUBLIC_*` only when necessary. Never commit `.env`
- **Firebase**: Strict Firestore rules per user/group in `firestore.rules` (deploy pending)
- **Auth**: Verify authenticated user before sensitive operations
- **Data**: Don't log sensitive info (tokens, passwords)
- **Errors**: Show user-friendly messages, log details in dev
- **Permissions**: Verify ownership/membership before CRUD

## 2. Validation
- **Client**: Validate forms (required, format, amount > 0)
- **Business**: Validate in services (sufficient balance, permissions)
- **Types**: Leverage TypeScript
- **Amounts**: Be careful with decimals. Consider working in cents (integers) or strict validation
- **Dates**: Valid, not in future if inappropriate

### Amount Rules
- > 0 for expenses/incomes as appropriate
- Transfers between own wallets allowed with validations
- Don't allow unexpected negative amounts

## 3. Input Validation Pattern
```typescript
function validateAmount(amount: number): {ok: boolean, error?: string} {
  if (isNaN(amount)) return {ok:false, error:'Invalid amount'}
  if (amount <= 0) return {ok:false, error:'Must be greater than 0'}
  return {ok:true}
}
```

## 4. Firestore Security (Implemented)
- Rules live in `firestore.rules` at the repository root.
- `users/{uid}` documents are only readable/writable by their owner (the current auth flow stores the uid in a field).
- The root `wallets/{walletId}` collection is owner-only; reads/deletes require `resource.data.ownerId == uid`, creates require `request.resource.data.ownerId == uid`, and updates cannot change `ownerId`.
- `publicProfiles/{uid}` is a minimal projection (display name + normalized email) readable by any **signed-in** user and writable only by its owner, with a field allow-list, an immutable `uid`, a stored email equal to the caller's token email (`isOwnTokenEmail`) and `delete` denied.
- `friendRequests/{id}` and `friendships/{id}` use the deterministic pair id `sortedUidA__sortedUidB` (`createFriendPairId`). Requests are participant-only and friendships member-only; a `get` on a missing pair resolves to not-found, so rules can be existence-only. Request updates only allow `pending → cancelled` (sender), `pending → rejected` (recipient) and `rejected|cancelled → pending` (re-send with swapped roles), with the pair and `createdAt` immutable; deletes only by the recipient while pending. A friendship is created by that same recipient in the transaction that deletes the request, is immutable, and either member can delete it.
- `sharedExpenses/{expenseId}` documents are 1:1 records between two accepted friends: reads are participant-only (`uid in participantIds`), creates require the caller as `createdBy`, a sorted pair whose join is `pairId`, the caller inside the pair, bounded money and description fields, one of the four split modes, and `exists(friendships/{pairId})`. `participantIds`, `pairId`, `createdBy` and `createdAt` are immutable, `deletedAt` only accepts `null` or an ISO string, a soft-deleted record cannot be edited back to life and `delete` is denied. Rules cannot sum list values, so the "shares add up to `amountCents`" invariant deliberately lives in `schemas/shared-expense.schema.ts`; rules only bound every stored share. No composite index is needed (a single `array-contains` query plus a client-side sort).
- `groups/{groupId}` and `groupInvitations/{groupId}__{inviteeId}` (TICKET-008) use an **owner-namespaced group id** (`${ownerId}__${autoId}`). Only the owner can create a group under their own prefix, and the invitation create requires that prefix (plus the friendship pair), so an invitation cannot be forged into someone else's group without reading the group and without spending more than one friendship read per invitation in a 19-invite batch. Group `list` is member-only; a pending invitee may `get` the group because the accept transaction needs it, and that rule re-checks the invitation's `groupId`. The owner edits name/description/defaultCurrency and removes one non-owner member; an invitee joins only through an **accepted deterministic invitation** verified with `getAfter`; `memberIds` is owner-first, unique and capped at 20; delete is denied. Invitations are participant-readable, friend-only and invitee-responded, with owner cancel/rename/reopen transitions; delete is denied. A pending invitation reserves a seat through the service/UI capacity (`20 - members - pending`), but the rules only cap `memberIds`: rules cannot count pending rows, so a hand-crafted write could queue extra pending invitations and the late acceptance would fail with `GROUP_FULL` (accepted trade-off). The `group-invite` notification type is validated against the invitation, its owner and the pending status. No composite index (single `array-contains`/equality queries sorted client-side).
- Transactions, transfers, categories, `publicProfiles`, `friendRequests`, `friendships`, `sharedExpenses`, `groups`, `groupInvitations`, the `group-invite` notification type and `settlements` share the same manual deployment command; the rules for the friends collections (`publicProfiles`, `friendRequests`, `friendships`), `sharedExpenses`, `groups`, `groupInvitations`, `settlements` and `notifications` (with the `group-invite` producer) are **pending deployment**.
- Deploy with `npm run firestore-update-rules` (login + deploy) or `npm run firebase-deploy:rules` when the session is already authenticated.
- `firestore.rules` is written in Firebase's CEL-derived rules language, **not** TypeScript: a `function` body is a single `return` with one expression, so no `if`/`else`, no second `return`, no local variables and no loops. Branch with `? :` or `&&`/`||`, and split small helpers instead of adding statements.
- Validate compilation with `npx firebase deploy --only firestore:rules --dry-run` before asking the user to deploy; it compiles the rules and publishes nothing. A syntax error can also surface as a misleading "Unexpected 'match'" on the next `match` block.
- Keep `firestore.indexes.json` updated when new composite indexes are needed.

## 5. Security Checklist
- [ ] No sensitive data in logs
- [ ] Client + business validation
- [ ] Auth/permission checks
- [x] Firestore rules considered (`firestore.rules`)
- [ ] No excessive console.logs in production
- [ ] Errors handled without exposing full stack to user
