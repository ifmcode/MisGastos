# TICKET-011 - Future: Group History

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-009; TICKET-009, TICKET-010  
**Sprint:** Post-MVP  

## Description
Provide an activity feed per group so members can review shared expenses, settlements and relevant changes in chronological order.

## Requirements
- [ ] Show a chronological activity feed for each group
- [ ] Include expense creation, expense edits, expense deletions and settlements
- [ ] Include member joined, member left, member removed, ownership transfer, group metadata edits and the **Simplificar deudas** setting change
- [ ] Include actor, date, amount and a short description for each entry; membership changes identify the affected member
- [ ] Show the current user's involvement where relevant
- [ ] Support loading, empty and error states
- [ ] Keep the feed consistent after an edit or soft delete
- [ ] Only group members can read the feed; a member who leaves loses access
- [ ] Add tests for activity mapping and ordering

## Acceptance Criteria
- [ ] New group activity appears without a manual refresh on the group screen
- [ ] Edited and deleted expenses are represented accurately
- [ ] Settlements appear in the feed with the correct members
- [ ] Member join, leave, removal and ownership transfer appear with the actor and the affected member
- [ ] Group metadata and **Simplificar deudas** changes appear accurately
- [ ] Only group members can read the history
- [ ] The feed remains ordered when entries share the same timestamp

## Technical Notes
- Prefer an explicit `groups/{groupId}/activity/{activityId}` event collection for auditability. Deriving the feed only from current documents loses edit and delete history.
- Event shape: `type`, `groupId`, `actorId`, optional `targetUserId`, optional `expenseId`/`settlementId`, a small structured payload (amount, currency, changed fields) and `createdAt`. The copy is resolved by the UI from the type and the payload; never store a sentence.
- Membership events: `member-joined`, `member-left`, `member-removed`, `owner-transferred` (with the previous and new owner), `group-updated` and `simplify-debts-changed`. The affected member and the actor are separate fields.
- If the feed is derived, keep `updatedAt` and `deletedAt` on expenses and settlements and clearly label edited/deleted entries. An append-only event collection is preferred for membership and settings changes because the current documents only show the final state.
- Use pure mappers to convert events into display items; keep Firestore access in a repository.
- The group detail should refresh the feed after a mutation and on focus; a member who leaves loses read access because the rules stay member-only.
- Consider pagination if a group can accumulate hundreds of events.
- Decision record: `session-notes/2026-11-20-group-expenses-and-membership-decisions.md`.

## Dependencies
- TICKET-009 Shared Expenses
- TICKET-010 Group Balances and Settlements
- TICKET-068 Group membership lifecycle
