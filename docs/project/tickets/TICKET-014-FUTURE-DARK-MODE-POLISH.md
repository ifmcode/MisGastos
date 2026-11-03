# TICKET-014 - Future: Dark Mode Polish

**Type:** Improvement  
**Priority:** Medium  
**Status:** ⏳ Pending  
**Related:** PM-013  
**Sprint:** Post-MVP  

## Description
Finish the dark theme across the whole app so every screen, form and component follows the system appearance without hardcoded light colours.

## Requirements
- [ ] Audit every screen for hardcoded light colours
- [ ] Fix the login screen, settings and any legacy components
- [ ] Apply theme tokens to inputs, placeholders, borders, chips, modals and empty states
- [ ] Ensure the status bar and navigation bar match the theme
- [ ] Verify contrast for text, disabled states and destructive actions
- [ ] Keep light mode unchanged
- [ ] Optionally add a manual preference (system, light, dark) persisted locally
- [ ] Add visual checks or screenshots for the main flows in both themes

## Acceptance Criteria
- [ ] No screen shows white cards or dark text on a dark background
- [ ] Forms, filters, calendars and modals are readable in both themes
- [ ] The theme changes immediately when the system appearance changes
- [ ] If a manual preference exists, it survives an app restart
- [ ] All new colours come from shared tokens instead of component literals

## Technical Notes
- `ThemedView`, `ThemedText` and `shared/hooks/use-form-theme.ts` already provide the base theme. Extend them or introduce a shared theme module instead of creating per-feature palettes.
- `features/auth/styles/login.styles.ts` currently uses fixed light colours (`surface`, `text`, `border`, `placeholder`). This is the clearest gap.
- Avoid raw hex values inside components. Palette/token files are the only place where colours should be declared.
- If adding a manual preference, use the existing storage approach and keep system mode as the default.

## Dependencies
- None
