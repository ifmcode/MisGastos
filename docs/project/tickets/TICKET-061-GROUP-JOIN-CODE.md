# TICKET-061 - Group Join Code and Join Requests

**Type:** Feature  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** TICKET-008, TICKET-047, TICKET-010  
**Sprint:** Post-MVP / Phase 6

## Description
Give every group a shareable join code so someone who was not invited can ask to join. Entering a valid code creates a join request for the group owner, who accepts or rejects it from the group detail. Accepting adds the requester to the group through the same membership rules used by TICKET-008 invitations.

## Requirements
- [ ] Generate a non-guessable join code when a group is created and keep it stable
- [ ] Show the join code to group members so they can share it
- [ ] Add **Unirse a grupo** to the Social FAB and a screen to enter a code
- [ ] Resolve a code to its group without exposing groups to non-members
- [ ] Create a pending join request for the owner when the code is valid
- [ ] Reject duplicate requests and requests from existing members
- [ ] Let the owner accept or reject join requests from the group detail
- [ ] Notify the owner of new requests and the requester of the outcome
- [ ] Enforce the 20-member limit on acceptance
- [ ] Add empty, loading and error states
- [ ] Add Firestore rules for the code lookup, requests and owner-only acceptance
- [ ] Add tests for code resolution, request transitions and membership updates

## Acceptance Criteria
- [ ] A valid code sends a join request to the owner
- [ ] An invalid or unknown code shows a clear error and writes nothing
- [ ] Only the owner can accept or reject a join request
- [ ] Accepting makes the group appear for the requester and respects the member limit
- [ ] A rejected request cannot be accepted later
- [ ] Non-members still cannot read the group or its members
- [ ] The owner receives an in-app notification for every new request

## Technical Notes
- Suggested collection: `groupJoinRequests/{groupId}__{requesterId}` with `groupId`, `requesterId`, `status` (`pending`/`accepted`/`rejected`/`cancelled`), `createdAt` and `updatedAt`.
- The code lookup must not expose group documents: use a `groupCodes/{code}` projection with `{ groupId }`, readable by signed-in users, or an equivalent server-side/callable design.
- Reuse TICKET-008 membership, rules, detail and notification infrastructure. Acceptance must append the member through the same `memberIds` invariant, never bypass it.
- Notifications use the TICKET-047 inbox with new types (for example `group-join-request`, `group-join-accepted`, `group-join-rejected`) and targets to the group detail or the requests screen.
- Keep the code stable; rotating it is out of scope.
- No group expenses or balances are touched by this ticket.

## Dependencies
- TICKET-008 Groups and invitations (membership model and rules)
- TICKET-047 In-app notification inbox
- TICKET-010 Group balances (only for the accepted-member detail after TICKET-009)
