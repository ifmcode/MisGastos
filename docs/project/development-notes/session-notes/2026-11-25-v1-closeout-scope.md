# V1 closeout scope and integral visual redesign (decision record)

**Date:** 25/11/2026
**Scope:** docs only — roadmap reordered, TICKET-052 and TICKET-040 updated, TICKET-074 created
**Status:** decided, not implemented

## Context

The product is one phase away from V1.0: Phase 7 (offline-first) is in progress and
the remaining scope had been spread across a retention Phase 8 and a post-V1
backlog. Two changes to that plan were needed:

1. the first version should close with an **integral visual redesign** driven by
   references the user will provide, because the current screens work but do not
   yet look like the intended product;
2. push notifications and Storybook had to be placed relative to that redesign
   instead of staying at their previous positions.

Leaving TICKET-013 (export) and the retention tickets in front of the redesign
would delay the release for work that validates better once the visual system is
final. Leaving TICKET-052 post-V1 would split the notification story across two
releases.

## Decision

V1.0 ships in this order:

| Step | Ticket | Why here |
|---|---|---|
| 1 | Phase 7 — TICKET-023 offline-first | Already in progress; the release cannot ship without it |
| 2 | TICKET-052 push notifications | The in-app inbox is done; push is the last platform dependency and closes the notification story before the visual work |
| 3 | TICKET-074 integral visual redesign and UX alignment | The whole product must be reviewed against the references at once, before the catalog and the release captures |
| 4 | TICKET-040 Storybook | It catalogs the final visual system, not the pre-redesign one; V1 ships when it closes |

Phase 8 is therefore the **V1 closeout** (push, redesign, Storybook). The former
retention tickets — TICKET-012 budgets, TICKET-016 statistics, TICKET-015 advanced
search, TICKET-013 export, TICKET-017 history grouping and TICKET-019 dashboard
quick add — move to a new **Phase 9**, which starts only after V1 ships. TICKET-053
(import) and TICKET-054 (Google Drive backup) stay in the post-V1 backlog.

## TICKET-074 scope

- Aesthetics **and** approved UX/navigation alignment, applied to every screen,
  the shared component layer and both themes.
- Driven by visual references (moodboard, mockups, palette/type specimens,
  navigation sketches) that the user provides before implementation. The ticket
  keeps a **Visual References** section pending until then; the derived tokens and
  per-surface decisions are recorded in the implementation session note.
- No new features, business rules, data contracts, money math or offline
  internals. Navigation or information-architecture changes must be listed and
  approved before implementation.
- Accessibility (contrast, 44pt targets, screen-reader labels, dynamic type,
  reduced motion), i18n parity and offline states are acceptance criteria.

## Consequences

- `roadmap.md`: Current Focus milestone, V1 scope row, phase overview (8 = closeout,
  9 = post-V1), Phase 8/9 sections, ordering rules and post-V1 backlog updated.
- `TICKET-052`: moves to V1 / Phase 8 and its "why post-V1" note is rewritten as
  "why it lands after offline".
- `TICKET-040`: moves to the last V1 slot, depends on TICKET-074 and must cover
  the redesigned tokens and components.
- `TICKET-074`: created as a V1 epic with pending references.
- `README.md` and `project-memory.md` list the new order; no application source,
  rules, tests or configuration changed.
