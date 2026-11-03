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
- [ ] Include actor, date, amount and a short description for each entry
- [ ] Show the current user's involvement where relevant
- [ ] Support loading, empty and error states
- [ ] Keep the feed consistent after an edit or soft delete
- [ ] Add tests for activity mapping and ordering

## Acceptance Criteria
- [ ] New group activity appears without a manual refresh on the group screen
- [ ] Edited and deleted expenses are represented accurately
- [ ] Settlements appear in the feed with the correct members
- [ ] Only group members can read the history
- [ ] The feed remains ordered when entries share the same timestamp

## Technical Notes
- Prefer an explicit `groups/{groupId}/activity/{activityId}` event collection for auditability. Deriving the feed only from current documents loses edit and delete history.
- If the feed is derived, keep `updatedAt` and `deletedAt` on expenses and settlements and clearly label edited/deleted entries.
- Use pure mappers to convert events into display items; keep Firestore access in a repository.
- Consider pagination if a group can accumulate hundreds of events.

## Dependencies
- TICKET-009 Shared Expenses
- TICKET-010 Group Balances and Settlements
