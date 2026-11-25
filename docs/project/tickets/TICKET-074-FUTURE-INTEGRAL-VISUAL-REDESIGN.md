# TICKET-074 - Integral Visual Redesign and UX Alignment

**Type:** Epic / Design + UI  
**Priority:** High  
**Status:** ⏳ Pending  
**Related:** TICKET-014, TICKET-031, TICKET-037, TICKET-040, TICKET-023  
**Sprint:** V1 / Phase 8

## Description
Replace the current look and feel with the visual direction the user will provide, applying it to every screen, the shared component layer and both themes, and align the navigation and UX patterns with the same references. The ticket covers aesthetics and UX/navigation coherence only: no business rule, document shape, money calculation or offline behaviour changes, and the existing i18n, accessibility and money-formatting contracts must survive intact.

## Visual References
The user provides the visual references before implementation: moodboard, screen mockups, palette and typography specimens, and navigation sketches or flows. The implementation must link or record them — together with the derived tokens and the screen-by-screen decisions — in the session note for this ticket. This section is intentionally pending until those assets arrive.

## Requirements
### References and design direction
- [ ] Collect and review every reference from the user before touching the UI
- [ ] Decide palette, typography scale, spacing, radii, elevation/shadows, iconography, imagery/illustration and motion, listing the rejected alternatives
- [ ] Record the direction, the token decisions and their per-surface consequences in a dated note in `session-notes/`

### Design tokens and shared components
- [ ] Consolidate every visual value in `shared/constants/theme-tokens.ts` and the theme providers (`AppThemeProvider`, `useAppColorScheme`, `useFormTheme`, `useThemeColor`)
- [ ] Remove hardcoded colours from components and express every surface as token reads plus base style + variants
- [ ] Update `docs/project/development-notes/component-inventory.md` with the redesigned shared components and their variants

### Navigation and UX
- [ ] Align the tab bar, headers, page sheets/modals, forms, lists, cards, FABs, empty/loading/error states, filters and pickers with the references
- [ ] List every navigation or information-architecture change explicitly and get it approved before implementation

### Screen coverage
- [ ] Auth (login, verify-email)
- [ ] Dashboard
- [ ] Wallets
- [ ] Movements and history
- [ ] Transfers
- [ ] Categories
- [ ] Profile and Settings
- [ ] Notifications
- [ ] Social: friends, requests, add-friend and friend detail
- [ ] Shared-expense and settlement screens
- [ ] Groups: list, detail, join, group-expense and group-settlement
- [ ] Offline state (banner and cached/queued surfaces)

### Accessibility and i18n
- [ ] Keep contrast ratios compliant in both themes and targets at 44pt or more
- [ ] Keep screen-reader labels, hints and roles on every redesigned control
- [ ] Respect dynamic type and reduced-motion preferences
- [ ] Keep all copy in the translation namespaces with es/en parity and `npm run check:copy` green

### Quality
- [ ] Keep the 150-line soft limit, one component per file and no `any`
- [ ] Add colocated tests wherever behaviour changes
- [ ] Move styles into feature style modules as the composition grows

### Rollout
- [ ] Apply the redesign incrementally, one surface at a time
- [ ] Review each surface against the references in light and dark mode
- [ ] Keep the app usable at every step, without a long-lived broken branch

## Acceptance Criteria
- [ ] Every covered screen and shared component matches the approved references in light and dark mode
- [ ] No hardcoded colour remains outside the token layer
- [ ] Spanish and English copy stay at parity and `npm run check:copy` passes
- [ ] Contrast, 44pt+ targets, screen-reader labels/hints/roles, dynamic type and reduced motion are verified
- [ ] The offline banner and the cached/queued states still render correctly after the redesign
- [ ] Navigation and UX changes are limited to the ones explicitly approved
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy` pass
- [ ] `component-inventory.md` and `README.md` are updated
- [ ] Screenshot evidence per surface in light and dark mode is recorded in the session note

## Technical Notes
- Storybook (TICKET-040) comes after this ticket, so the catalog documents the final visual system instead of the pre-redesign one.
- Scope includes the approved UX/navigation changes, but no new features, business rules, data contracts, money math or offline internals.
- Rebranding assets, app icon and splash are included only if the references cover them; otherwise they are a follow-up.
- TICKET-014 dark mode and TICKET-037 shared components are the base to extend, not to replace: the two themes and the shared layer stay, with new tokens and variants on top.
- Visual references are pending; the design direction and rejected alternatives cannot be decided until they arrive.

## Validation Plan
- Review the redesign on a physical iOS and a physical Android device, in light and dark mode and in Spanish and English.
- Repeat the review in airplane mode to confirm the offline banner and the cached/queued states keep working.
- Walk every surface with the screen reader enabled and confirm labels, hints, roles and focus order.
- Compare each surface side by side with the approved references before marking it done.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` and `npm run check:copy`.

## Out of Scope
New features, business rules, data model changes, push or offline internals, the Storybook setup (TICKET-040) and the store listing screenshots.
