# NativeWind JSX interop broke every Pressable style

> Date: 27/11/2026
> Status: Delivered — visual regression fixed, no ticket opened.
> Related: `babel.config.js`, `metro.config.js`, `global.css`,
> `shared/components/molecules/fab-action-menu.tsx`.

## Context

The native build looked broken on the phone while the web build looked correct:
the Social segmented control had no selected pill, friend and group lists
rendered as raw text, the FAB bottom menu showed icons with no labels, the group
timeline stacked its date/icon/text columns, the sync "Reintentar ahora" button
lost its frame, the Settings header was clipped and the category cards painted a
dark box behind their text.

## Root cause

`babel.config.js` loaded `nativewind` as the JSX import source
(`jsxImportSource: "nativewind"` plus the `nativewind/babel` preset). That
rewrote every JSX element through `react-native-css-interop`, which wraps
`Pressable` with a `className` mapping. With the wrapper in place, a **function
`style` prop is dropped on native**:

```tsx
<Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} />
```

on web it resolved normally; on native only the children were painted, so cards
lost their padding, borders and `flexDirection: "row"`, and press feedback never
applied. 73 call sites used that pattern, which explains the scattered look.

Reproduced with a throwaway screen: the same `styles.card` rendered correctly as
`<View style={[styles.card]}>` and was ignored as
`<Pressable style={({pressed}) => [styles.card, ...]}>`; adding
`cssInterop={false}` to the `Pressable` restored the style. No component uses
`className` anywhere, so the interop provided nothing.

## Decision

Drop the JSX interop and keep the rest of the pipeline untouched:

- `babel.config.js` uses only `babel-preset-expo`. It already adds
  `react-native-worklets/plugin` when the package is installed, so Reanimated 4
  keeps working without `nativewind/babel`.
- `metro.config.js`, `tailwind.config.js` and `global.css` stay as they are, so
  the web CSS entry is unchanged.
- Do **not** reintroduce `jsxImportSource: "nativewind"` unless every
  `Pressable` stops using the function form of `style`.

## Delivered

- `babel.config.js`: single `babel-preset-expo` preset.
- `features/settings/components/settings-screen.tsx` and its styles: safe-area
  top inset plus a `ScrollView`, so the title is not clipped by the status bar
  and "Cerrar sesión" is reachable.
- `features/categories/components/category-card.tsx`: the icon tile and the text
  block are plain `View`s. `ThemedView` painted the app background over the card
  surface, which was the dark box behind the category name.
- `features/groups/components/group-member-row.tsx`: the non-owner role badge is
  transparent instead of painting the app background.
- `features/groups/styles/groups.styles.ts`: the invitees header wraps and the
  counter shrinks, so the capacity hint no longer overflows the right edge.
- `shared/components/molecules/fab-action-menu.tsx` and its styles: the bottom
  inset moves to the overlay and the card keeps a fixed inner padding, so the
  last action is fully visible above the tab bar.
- `features/sync/components/sync-status-block.tsx`: the Settings block only
  renders "Reintentar ahora" while there is something pending to upload; with
  zero pending changes the block keeps just the sync-center link.

## Verification

- Android device screenshots of Inicio, Movimientos, Carteras, Social (friends
  and groups), Crear grupo, Detalle de grupo, Detalle de grupo (hoja), Unirse a
  grupo, Añadir amigo, Peticiones, Liquidar deudas, Categorías, Configuración,
  Sincronización, Perfil, Notificaciones, Historial de transferencias and the
  FAB menu.
- `npx tsc --noEmit`, `npx expo lint`, `npx jest` (3245 tests) and
  `npm run check:copy` pass.
