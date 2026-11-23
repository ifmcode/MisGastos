# Group expense form simplification (TICKET-071)

> Session note for TICKET-071, implemented on 23/11/2026. Triggered by user
> feedback after TICKET-069: the group-expense form carried a **Todos** shortcut
> that duplicates the per-row toggles and offered four split modes while the 1:1
> form already exposes only two.

## Changes

- The **Participantes** section no longer renders the **Todos** control. Every
  active member is still selected by default on create and each row toggles
  independently. The select-all state, handler, utils, copy and styles were
  removed (`toggleAllParticipants`, `toggleAllGroupExpenseParticipants`,
  `areAllGroupExpenseParticipantsSelected`, `form.selectAll*`,
  `participantsHeader`, `selectAllChip`, `selectAllText`).
- **Cómo dividir** now offers **Igual** and **Importe** through the new pure
  `getVisibleGroupSplitModes` (`utils/group-expense-split-modes.ts`). The list is
  `["equal", "fixed"]` for a normal create/edit and adds the stored
  `percentage`/`shares` mode, in canonical order, when an older expense is
  edited. That keeps a legacy expense editable and saveable without forcing a
  silent conversion, and it can still be switched to **Igual** or **Importe**.
- The four modes stay in the domain, schema, mapper, detail labels and stored
  documents: no migration, service, repository, rules, index or ledger change.

## Verification

- `npx tsc --noEmit` and `npx expo lint` clean.
- `npm run check:copy` passed (315 TSX files).
- `npx jest --coverage`: 344 suites / 2157 tests, coverage 98.96 % statements /
  94.74 % branches / 98.6 % functions / 99.52 % lines.
- New `utils/__tests__/group-expense-split-modes.test.ts` covers the visible
  list, both legacy modes and the stable reference.
- Manual device validation (light/dark, legacy percentage/shares edit) pending.
