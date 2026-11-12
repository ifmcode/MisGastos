# Dark Mode Visual Checks

> Ticket: TICKET-014 - Dark Mode Polish  
> Date: 09/11/2026  
> Environment: Expo web (`npx expo start --web --port 8081`), Chromium, 1280x720 viewport

## Screenshots

Saved in `docs/project/testing/visual-checks/`:

| Screen | Light | Dark |
|---|---|---|
| Login | `login-light.png` | `login-dark.png` |
| Settings | `settings-light.png` | `settings-dark.png` |
| Dashboard | n/a (empty/loading state) | `dashboard-dark.png` |
| Wallets | n/a (empty/loading state) | `wallets-dark.png` |
| Transactions | n/a (empty/loading state) | `transactions-dark.png` |
| Categories | n/a (empty/loading state) | `categories-dark.png` |

Authenticated routes were opened with a temporary local-only mock auth flag
(`misgastos.dev.mockUser`) to reach Settings and the tab screens without
production credentials. The flag and the mock provider were removed before the
final verification.

## Computed style checks

Login, light preference (`misgastos.theme.preference = "light"`):

- Screen background: `#FFFFFF`
- Inputs: background `#FFFFFF`, text `#11181C`, border `#DCE6E9`
- Primary button: `#0A7EA4` with white text

Login, dark preference (`misgastos.theme.preference = "dark"`):

- Screen background: `#151718`
- Inputs: background `#1C2225`, text `#ECEDEE`, border `#2B3438`
- No white input or card surfaces

Settings toggle:

- Light: switch off, helper text `Desactivado`, background `#FFFFFF`
- Dark: switch on, helper text `Activado`, background `#151718`
- The switch updates the whole app immediately and writes `dark`/`light` to
  `misgastos.theme.preference`

Authenticated tab screens in dark mode:

- Dashboard, Wallets, Transactions and Categories all render with `#151718`
  screen backgrounds and `#ECEDEE` body text.
- Error/empty/loading states use the same dark background and do not render
  white cards.
- Error icons and banners use the dark danger tokens (`#EF5350` /
  `rgba(198, 40, 40, 0.18)` / `#FFB4B4`).

## Code audit coverage

The following flows use `useFormTheme` or `useThemeColor` for every surface,
text, border and placeholder token:

- Login and verify-email screens
- Wallet, category, transaction and transfer forms
- Transaction filters and date pickers/calendars
- Confirm dialog and form error banners
- Dashboard summaries, wallet cards, category cards, transaction/transfer items
- Settings menu, theme toggle and logout action

## Result

- [x] Login screen readable in both themes
- [x] Settings toggle switches the app immediately
- [x] Theme preference persists across reloads
- [x] No white card or dark-text-on-dark-background issue found in the checked screens
- [x] Forms, filters, calendars and modals audited against the shared theme tokens

## Wallet transfer entry audit (12/11/2026)

> Ticket: TICKET-032 - Move the transfer action to the wallets tab

- The **Transferir** / **Historial de transferencias** row above the wallet list
  takes the secondary border, surface and text from `useFormTheme`
  (`theme.border`, `theme.surface`, `theme.text`) and the primary fill from the
  brand `walletsPalette.primary` token already validated in dark mode. No screen
  surface or text color is hardcoded.
- Accessibility labels are set on both buttons (`Nueva transferencia` and
  `Ver historial de transferencias`).
- The row and the shared `TransferFormModal` render on web; the web bundle was
  verified with `npx expo export --platform web`.
