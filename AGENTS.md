# AGENTS.md

Instructions for AI agents (OpenCode, Claude, etc.) working on MisGastos.

## Read first
1. `docs/project/development-notes/roadmap.md` **Current Focus**
2. `docs/project/development-notes/project-memory.md`
3. `docs/project/guidelines/architecture-and-solid.md`
4. `docs/project/guidelines/security-and-validation.md`
5. `docs/project/testing/test-guide.md`
6. `docs/project/guidelines/agents-and-skills.md`

## Agents and skills
- The project OpenCode config lives in `.opencode/agents/` and `.opencode/skills/`; each agent file carries its instructions and its enforced permissions.
- Delegation belongs to the **primary** agent: every custom agent is `subagent` mode and cannot launch other subagents.
- Agents: `architect` (design spikes/ADRs, docs only), `mobile-ui` (screens, styles, a11y, i18n), `firebase-data` (repositories, operations, rules), `reviewer` (read-only), `docs-writer` (`docs/**`, `README.md`, `AGENTS.md`).
- Skills: `misgastos-feature`, `firestore-rules`, `money-and-balances`, `react-native-ui`, `jest-testing`, `docs-ticket`; `offline-sync` is deferred to roadmap Phase 7.
- Each task type maps to one agent. Routing by task, permission model and evolution rules live in `docs/project/guidelines/agents-and-skills.md`; do not duplicate them here.
- **Anti-sprawl**: create a new agent or skill only when a task repeats or a permission boundary is needed. Otherwise extend the existing one.

## Routing and delegation (mandatory)
- **Before implementing**, pick the agent and skills from the routing table and state the choice in one line (for example: "UI work → `mobile-ui` + `react-native-ui`, `misgastos-feature`").
- **Load the matching skill** with the `skill` tool before working; do not re-derive its rules from memory.
- **Delegate** when the core work belongs to a specialist: UI → `mobile-ui`; Firestore/data/money → `firebase-data`; design spike/ADR → `architect`; review → `reviewer`; ticket/roadmap/memory/README → `docs-writer`.
- **Chain specialists from the primary agent** (they cannot delegate): `firebase-data` then `reviewer`, or `architect` then `firebase-data`. Pass the ticket id, files in scope, decisions already taken and the expected output; subagents start with fresh context.
- **Small mechanical edits** (one file, a typo, a single line) may stay in the primary agent; say so when skipping delegation.
- **After a subagent returns**, review its changes and run the full verification yourself; delegation never replaces `tsc`/`lint`/`jest`/`check:copy`.

## Communication
- **Always ask clarifying questions in Spanish.** Whenever a doubt, ambiguity or decision needs the user's input, the question (and its options) must be written in Spanish, even when the code, docs or commits are in English.

## Ticket workflow
- **Before starting**: set the ticket `Status` to `🚧 In progress` and update the roadmap **Current Focus** with the phase, current ticket and status.
- **When fully done**:
  1. Tick every requirement and acceptance criterion and add an `Implemented` section.
  2. Set the ticket `Status` to `✅ Done (DD/MM/YYYY)`.
  3. Rename the ticket file with the `[DONE] ` prefix and update its H1, keeping the ticket id: `[DONE] TICKET-022-...md` and `# [DONE] TICKET-022 - ...`.
  4. Update `docs/project/development-notes/roadmap.md`: phase checkbox and **Current Focus** (next ticket).
  5. Update `README.md` with the change or progress (features, structure, scripts and roadmap).
  6. Update the session history in `project-memory.md`.
- **Never** rename or mark a ticket as done when any requirement or acceptance criterion is still open.

## Hard rules
- **File size**: soft limit of **150 lines** per `.ts`/`.tsx` file. Split before adding more behavior. Style files are exempt.
- **One component per file** (file = component + its `Props` interface).
- **One responsibility per function**: fetch, transform, validate or render — not several. UI side effects live in small dedicated helpers.
- **Screens orchestrate**: header, list header, section headers, footers, empty/loading/error states and modals are separate components. Derived data belongs to a hook or a pure util.
- **Styles**: when a screen has more than a handful of styles, move them to `features/<feature>/styles/<name>.styles.ts` exporting `<name>Styles` + a palette/token object. Reuse base style + variants (`[styles.chip, selected && styles.chipSelected]`), prefer `flex`/`gap` over magic margins, and never hardcode colors inside components.
- **Feature folders**: `components/`, `hooks/`, `services/`, `repositories/`, `schemas/`, `types/`, `utils/`, `styles/`.
- **Imports**: `@/` alias, named imports only, no default re-exports.
- **No `any`**: use `unknown` + type guards.
- **Copy**: every visible string (including accessibility labels/hints) comes from a translation namespace. Add keys to `features/<feature>/locales/{es,en}.json`; never import JSON from components. Domain errors return codes, not sentences. Run `npm run check:copy`.
- **Commits**: never commit unless the user explicitly asks.
- **README**: keep `README.md` updated with every change or progress, including features, structure, scripts and roadmap status.
- **Tests**: colocated in `__tests__/`; services and utils are expected to be tested.

## Verification before finishing
```powershell
npx tsc --noEmit
npx expo lint
npx jest
npm run check:copy
```
