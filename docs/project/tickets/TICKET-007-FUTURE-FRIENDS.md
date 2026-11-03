# TICKET-007 - Future: Friends and Requests

**Type:** Feature  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** PM-003, PM-004; TICKET-008, TICKET-009, TICKET-010  
**Sprint:** Post-MVP  

## Description
Let users find other users, send friend requests, accept or reject them and keep a friends list with the net balance shared with each friend.

## Requirements
- [ ] Search for a user by exact email
- [ ] Send a friend request and prevent self-requests, duplicates and requests to existing friends
- [ ] Accept or reject incoming requests and cancel outgoing requests
- [ ] List accepted friends with name and net balance ("owes you" / "you owe")
- [ ] Persist requests and friendships with requester, recipient, status and timestamps
- [ ] Add loading, empty and error states
- [ ] Add Firestore rules and validation for every state transition
- [ ] Add tests for request transitions, duplicate prevention and balance lookup

## Acceptance Criteria
- [ ] A user can send a request to an existing account by email
- [ ] The recipient can accept or reject it from the friends screen
- [ ] Accepted friends appear in both users' lists
- [ ] Duplicate, self and already-friend requests are rejected with a clear message
- [ ] The friends list shows the correct derived net balance
- [ ] Non-participants cannot read private requests

## Technical Notes
- Do not expose the whole `users` collection to the client. Evaluate a minimal `publicProfiles` document keyed by uid (name and searchable email) or a Cloud Function that resolves an email to a uid. Decide this before implementation.
- Suggested collections: `friendRequests/{id}` and `friendships/{id}`, or subcollections under each user. Keep a single source of truth for the friendship.
- The net balance is derived from shared expenses and settlements. It can start at 0 until TICKET-009 and TICKET-010 exist.
- Create `features/friends/` with `components/`, `hooks/`, `repositories/`, `schemas/`, `services/`, `types/` and `utils/`.

## Open Questions
- Should users be able to block or remove friends?
- Is email the only search key, or should a shareable user code be supported?
