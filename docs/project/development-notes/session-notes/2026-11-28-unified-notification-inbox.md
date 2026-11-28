# Bandeja única de notificaciones y peticiones

> Date: 28/11/2026
> Status: Delivered — decisión de producto, sin ticket.
> Related: `features/notifications`, `features/social`,
> `features/groups`, `firestore.rules`,
> `session-notes/2026-11-27-nativewind-style-regression.md`.

## Context

Había dos accesos que parecían dos bandejas: la campana de Inicio
(`/notifications`, avisos con **Pendientes**/**Vistas**) y el sobre de Social
(`/social/requests`, cola de acciones: solicitudes de amistad, invitaciones a
grupo y peticiones para unirse). Una misma invitación a grupo producía a la vez
una notificación `group-invite` y una tarjeta accionable, y subía los dos
badges; con las peticiones de entrada pasaba lo mismo. El usuario prefirió la
bandeja de Inicio por sus pestañas de visto/pendiente.

## Decision

**Una sola bandeja** en `/notifications`, y una sola entrada: la campana de
Inicio.

- **Pendientes** empieza por lo que espera respuesta (solicitudes entrantes y
  enviadas, invitaciones a grupo, peticiones de entrada del propietario) y
  debajo van los avisos sin presentar.
- **Vistas** es el historial de avisos.
- Un **badge único**: avisos informativos sin leer + acciones pendientes.
- Las notificaciones de tipo acción (`group-invite`, `group-join-request`,
  `friend-request`) **no se pintan como filas**: su única representación es la
  tarjeta accionable, para no contarlas dos veces.
- Se retiran los productores `group-invite` y `group-join-request`. Siguen
  existiendo `group-join-accepted`/`group-join-rejected` (resultados, sin
  acción) y `group-settlement`.
- El sobre de Social desaparece. La cabecera de Social se queda con el título y
  el botón de sincronización.
- `/social/requests` se mantiene como ruta de compatibilidad para documentos
  antiguos, pero ya no es un punto de entrada.

## Delivered

### UI

- `features/notifications/components/inbox-requests-block.tsx`: reutiliza
  `OwnerJoinRequestsSection`, `GroupInvitationsSection` y `FriendRequestSection`
  sin duplicar estilos ni copy.
- `notifications-list.tsx`: `header` y `showEmpty`.
- `notifications-screen.tsx`: el bloque solo en **Pendientes**; el estado vacío
  se oculta cuando la cola tiene algo que mostrar.
- `features/notifications/utils/`: `inbox-badge.ts` (tipos de acción,
  `countInboxBadge`), `notification-stamps.ts` (los dos sellos, movidos para no
  pasar de 150 líneas) e `inbox-requests-content.ts` (condición compartida entre
  el bloque y el estado vacío).
- `social-header.tsx` sin sobre ni contador; `use-social-screen` sin
  `pendingCount`.
- `use-dashboard-notifications`: `inboxCount` con `countInboxBadge`.
- `/social/requests` reutiliza `useInboxRequests`; los componentes de la cola del
  propietario se movieron a `features/groups` (su dominio).

### Datos

- `group-notification.port.ts`, `firebase-group-notification.port.ts` y
  `group-notify.ts` conservan solo resultados y liquidaciones de grupo.
- `group-create.ts`, `group-invite.ts` y `group-join-request.ts` ya no escriben
  notificación.
- `firestore.rules`: `group-invite` y `group-join-request` fuera de
  `isNotificationType` y del create; se retiraron sus validadores, sus grants de
  actor y la rama de la petición en el target. Las lecturas y los documentos
  antiguos siguen funcionando. **Pendiente de despliegue**
  (`npm run firebase-deploy:rules`).

## Verification

- `npx tsc --noEmit`, `npx expo lint`, `npx jest` (479 suites / 3242 tests) y
  `npm run check:copy` (359 TSX) en verde.
- `firebase deploy --only firestore:rules --dry-run` compila las reglas.
- Validación en dispositivo pendiente al cerrar la sesión.

## Accepted debt

- `useNotificationsScreen` y `useInboxRequests` montan cada uno su propia
  `useFriendsOverview`, así que la bandeja lee el overview dos veces por foco.
  Se acepta hasta que haya un store compartido de peticiones.
- El badge de Inicio ahora carga también invitaciones y peticiones de entrada
  (tres lecturas más al enfocar la pestaña), a cambio de una única insignia.
