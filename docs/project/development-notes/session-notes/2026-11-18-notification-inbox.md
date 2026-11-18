# Bandeja de notificaciones in-app (TICKET-047)

> 18/11/2026 · Datos, reglas, UI y navegación · Relacionado: TICKET-007,
> TICKET-046, TICKET-052.

## 1. Decisión

La bandeja mantiene **dos sellos independientes** sobre el mismo documento:

- `seenAt` = primera presentación al dueño. Decide el segmento: `null` es
  **Pendiente**, con valor es **Vista**.
- `readAt` = apertura. Decide el marcador de no leída en ambos segmentos.

Un aviso descartado o caducado escribe **solo `seenAt`**, así que la fila pasa a
**Vistas** y sigue sin leer: presentar no es leer. Abrir escribe los dos sellos en
una única actualización. **Marcar todo como leído** se limita a **Pendientes**,
escribe los dos sellos en una actualización por fila y respeta un `readAt` que ya
existiera.

## 2. Modelo de datos

`notifications/{dedupeKey}` conserva la forma de TICKET-046 (`userId`, `type`,
`payload`, `createdAt`, `readAt`, `dedupeKey`) y añade `seenAt`:

| Campo | Tipo | Notas |
|---|---|---|
| `seenAt` | `string \| null` | `null` = Pendiente; se escribe la primera vez que se presenta |
| `readAt` | `string \| null` | `null` = no leída; se escribe al abrir |

Al crear, ambos sellos se guardan a `null`
(`repositories/notifications.data.ts`). Un documento antiguo sin `seenAt` se
mapea a `null`, es decir **Pendiente**, y se puede sellar sin migración
(`repositories/notifications.mapper.ts`).

Los tipos reservados `friend-request`, `friend-request-accepted`, `group-expense`
y `group-settlement` son **compatibles de lectura** con la misma forma —el
mapeador y la bandeja los resuelven— pero todavía no son escribibles: ninguna de
las reglas de `create` los acepta porque aún no existe productor. El contrato
para futuros productores es `NotificationEventInput`, el mismo DTO de escritura,
para no abrir una segunda colección.

La clave determinista no cambia: `${settlementId}:${event}:${userId}`, con
`updatedAt` añadido en las actualizaciones, de modo que un reintento resuelve el
mismo documento y una edición real notifica una sola vez.

## 3. Aviso flotante (banner)

- **Solo primer plano**: un `onSnapshot` sobre la consulta del dueño
  (`hooks/use-notification-arrivals.ts`). La primera instantánea solo memoriza los
  ids conocidos, así que el historial no aparece al arrancar.
- **Cola silenciosa**: un aviso a la vez, 4 segundos, en orden de llegada y sin
  contador ni indicador de "N más" (`hooks/use-notification-queue.ts`,
  `utils/notification-banner.ts`).
- **Supresión**: no se muestra en `/notifications`, `/login` ni `/verify-email`,
  ni con la app en segundo plano. Una llegada durante la supresión se descarta
  pero su id queda memorizado, de modo que nada desaparece en silencio de
  **Pendientes**.
- **Entrar en la bandeja** retira el aviso visible y el encolado sin sellar nada:
  son filas que siguen en **Pendientes**.
- **Accesibilidad**: región viva y un único anuncio por notificación, acción con
  rol y etiqueta para abrir, y botón de cierre etiquetado. El modelo del aviso es
  el mismo de la fila, así que texto e icono no pueden divergir.

El host (`components/notification-banner-host.tsx`) se monta en `app/_layout.tsx`
como hermano del navegador, por encima de cualquier ruta.

## 4. Navegación

`resolveNotificationTarget` y `buildNotificationTargetHref`
(`utils/notification-targets.ts`) son la **única** fuente de destino para la fila
y el aviso:

| Evento | Destino |
|---|---|
| `settlement-*` | `/social/settlements/[settlementId]` |
| `group-expense`, `group-settlement` | `/social/expenses/[expenseId]` |
| `friend-request` | `/social/requests` |
| `friend-request-accepted` | `/social/friends/[friendUid]` |

Los destinos anidados llevan `from=notification` y `friendUid`.
`shared/hooks/use-detail-close-navigation.ts` sustituye el detalle por el detalle
del amigo (o por el hub Social si no hay amigo), de modo que la pila queda tabs →
`/notifications` → `/social/friends/[uid]`: la bandeja nunca es el padre de un
detalle y un destino que ya no existe sigue aterrizando en una ruta válida.

## 5. Reglas

`firestore.rules` para `notifications`:

- `list` y lectura solo del dueño, más un `get` puntual y determinista para el
  participante que escribe la notificación en la transacción de la liquidación;
  un id inexistente resuelve `not-found` en lugar de `permission-denied`.
- `create` solo por un participante de la liquidación referenciada y para el otro
  participante, con `getAfter` (sin autonotificarse) y con importe y moneda del
  payload coincidiendo con la liquidación.
- `update` solo del dueño y solo de `readAt`/`seenAt`, de forma **monótona**: de
  `null` a cadena, nunca se borra ni se reescribe. `get(key, null)` trata un
  documento de TICKET-046 sin `seenAt` como `null`, y el `create` acepta que falte
  `seenAt` durante un despliegue escalonado.
- `delete` denegado.

Las reglas **no están desplegadas**. El usuario debe ejecutar
`npm run firebase-deploy:rules`.

## 6. UI

- **`/notifications`** (`app/notifications.tsx` → `NotificationsScreen`, registrada
  en `auth-navigator.tsx` dentro de los segmentos privados): dos segmentos con
  contador (**Pendientes** / **Vistas**), **Pendientes** por defecto, estado vacío
  propio por segmento, orden de más reciente a más antiguo con el id como
  desempate y fecha relativa.
- **Copy**: se resuelve solo de `type` + payload en el namespace `notifications`;
  las liquidaciones usan las variantes `.full`/`.partial` y los tipos reservados
  una frase plana. El payload nunca guarda una oración.
- **Marcar todo como leído** solo aparece en **Pendientes** y solo cuando hay al
  menos una fila sin leer.
- **Estados**: carga, error con reintento y pull-to-refresh; el fallo de un sello
  se anuncia en un `ErrorBanner` sin romper la lista.
- **Campana**: el badge sale de `countUnreadNotifications`, se oculta en 0 y se
  refresca al volver a la pestaña y al regresar de la bandeja.

## 7. Verificación

- `npx tsc --noEmit`: OK.
- `npx expo lint`: OK.
- `npx jest`: 252 suites / 1471 tests.
- `npm run test:coverage`: 98,70 % sentencias, 94,12 % ramas, 98,13 % funciones,
  99,13 % líneas (umbral 90 %).
- `npm run check:copy`: 250 archivos TSX.

## 8. Pendiente

- Desplegar las reglas (manual).
- Validación en dispositivo con dos cuentas: crear, editar y borrar una
  liquidación genera una notificación por evento, y un reintento no genera
  ninguna.
- Aviso, descarte y cola en dispositivo.
- Emulador de reglas (exige JDK ≥ 21) para la denegación al tercer usuario.
- Revisión visual manual en claro/oscuro y en español/inglés.

## 9. Fuera de alcance y límites

- **Sin paginación y sin índice compuesto**: la consulta filtra solo por `userId`
  y el filtro de segmento y el orden se resuelven en cliente. El volumen por
  usuario todavía no lo justifica; queda documentado aquí y en las reglas.
- **Solo in-app**: push, email, preferencias, horas de silencio, bloqueo, cola
  offline, notificaciones de marketing y deep links quedan fuera de V1 (push es
  TICKET-052, post-V1).
- **Limitación conocida, sin adornos**: una llegada que ocurre con `/notifications`
  enfocada o con la app en segundo plano **no se muestra después** como aviso, su
  id solo queda memorizado. Un aviso visible al entrar en la bandeja se retira sin
  sellar, así que la fila sigue en **Pendientes**.
