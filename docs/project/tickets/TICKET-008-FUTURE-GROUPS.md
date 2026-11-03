# TICKET-008 - Future: Groups

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-005; TICKET-007, TICKET-009, TICKET-010, TICKET-011  
**Sprint:** Post-MVP  

## Description
Create Splitwise-style groups to organise shared expenses between friends, with a name, members, group currency and optional description.

## Requirements
- [ ] Create a group with name, group currency and optional description
- [ ] Add accepted friends as members during creation
- [ ] List groups the current user belongs to
- [ ] Show group name, currency, member count and current user's balance summary
- [ ] Allow the owner to edit the name and description
- [ ] Prevent adding non-friends or duplicate members
- [ ] Add empty, loading and error states
- [ ] Add Firestore rules that let members read and restrict updates to the owner
- [ ] Add tests for membership validation and group mapping

## Acceptance Criteria
- [ ] A user can create a group with at least one friend
- [ ] The group appears for every member after creation
- [ ] Non-members cannot read or modify the group
- [ ] The group currency is fixed once shared expenses exist
- [ ] The group list shows the correct member count and balance summary

## Technical Notes
- Suggested collection: `groups/{groupId}` with `ownerId`, `memberIds`, `name`, `currency`, `description`, `createdAt` and `updatedAt`.
- Group membership must reference accepted friendships; do not store arbitrary user ids.
- Group currency should be locked after the first shared expense to avoid mixed-currency ledgers.
- Keep group money separate from personal wallets. Transfers between personal wallets and groups are out of scope for this ticket.
- Create `features/groups/` with `components/`, `hooks/`, `repositories/`, `schemas/`, `services/`, `types/` and `utils/`.

## Dependencies
- TICKET-007 Friends and Requests
