# Group join requests in Social (TICKET-070)

> Session note for TICKET-070, implemented on 23/11/2026. Triggered by user
> feedback: the group detail always showed a **Solicitudes para unirse** block
> (even with 0 requests), the owner queue was not reachable from Social, and the
> Social header badge did not count pending join requests.

## What changed

- **One queue in Social.** `GroupsService.getOwnerJoinRequests(viewerUid)` reads
  the viewer's groups, keeps the owned ones, fans out the existing pending +
  non-member + profile loader over them (max 20, accepted V1 read budget, no
  denormalized `ownerId`, no composite index) and returns
  `OwnerJoinRequestItem { groupId, groupName, item }` sorted oldest first by the
  pure `buildOwnerJoinRequests`. A non-owner gets `[]`.
- **No queue in the group detail.** `GroupDetail` no longer carries
  `joinRequests`; the section, row, hook, copy and queue-only styles were
  deleted. `GroupJoinActionButton` is kept and reused by Social.
- **`/social/requests`** renders `OwnerJoinRequestsSection` first, with group
  name, requester name/email, request date, **Aceptar**/**Rechazar**, per-row
  busy state, inline first-load retry and a background/action error banner. The
  section renders nothing when the owner has no pending request, so the "0
  solicitudes" block no longer exists.
- **Badge.** `getPendingRequests`/`countPendingRequests` accept the owner queue
  as an optional third source (finite, truncated, non-negative). The Social
  header counts friend requests + received invitations + owned pending join
  requests; `/social/requests` totals all three.
- **Notification.** The `group-join-request` notification now opens
  `/social/requests`; `group-join-accepted` still opens the group detail.
- Accept/reject keeps the TICKET-061 transaction (owner, pending, non-member and
  20-member revalidation) and the existing inline error mapping.

## Verification

- `npx tsc --noEmit` and `npx expo lint` clean.
- `npm run check:copy` passed (315 TSX files).
- `npx jest --coverage`: 346 suites / 2171 tests, coverage 98.97 % statements /
  94.76 % branches / 98.61 % functions / 99.52 % lines.
- Reviewer findings fixed during the pass: the requests total had dropped the
  received invitations, and the request date was formatted from a full ISO
  timestamp instead of its calendar date.
- Manual device validation pending: owner with zero/one/many requests, several
  groups, mixed with invitations and friend requests, light/dark and screen
  reader.
