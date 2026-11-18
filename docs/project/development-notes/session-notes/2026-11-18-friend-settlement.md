# Amistades: liquidación directa de deudas 1:1 (TICKET-046)

> 18/11/2026 · Feature, datos, reglas, UI y notificaciones · Relacionado: TICKET-007,
> TICKET-009, TICKET-042, TICKET-044, TICKET-047, TICKET-051.

## 1. Decisión

La liquidación 1:1 deja de ser bilateral. Cualquiera de los dos amigos puede
liquidar la deuda que deriva TICKET-009 y **se aplica al instante**, sin que el
otro confirme. El modelo anterior (`pending`/`accepted`/`rejected`/`cancelled`)
se sustituye por un único documento activo o borrado lógicamente.

Decisiones cerradas con el usuario:

- **Total o parcial**: el formulario ofrece `total` (bloquea el importe al saldo
  pendiente) y `parcial` (importe > 0 y <= deuda).
- **Una moneda por liquidación**: solo se ofrecen las monedas con deuda real. La
  dirección no se elige: sale del signo del saldo neto (**Yo pago** / **Me paga**).
- **Solo el acreedor enlaza cartera, y es opcional**: registra un ingreso en una
  cartera activa de la misma moneda, con categoría de ingreso obligatoria si
  enlaza. El deudor nunca enlaza cartera ni crea movimiento personal.
- **El otro amigo puede enlazar después**: la notificación abre el detalle de la
  liquidación, donde el acreedor tiene la acción **Elegir cartera**. También
  puede quitarla; el ingreso se revierte exactamente una vez.
- **Mensaje único**: el detalle del amigo muestra la última liquidación activa
  encima de los gastos compartidos. Al pulsarla se abre su detalle.- **Deuda saldada**: si la deuda neta del par es 0 en todas las monedas y existe
  al menos una liquidación activa, la lista de gastos se oculta y se sustituye
  por **Ver gastos anteriores**; el botón la vuelve a mostrar y permite ocultarla
  otra vez.
- **Edición**: importe solo mientras el acreedor no haya enlazado movimiento;
  fecha, nota y la cartera/categoría del propio acreedor siempre. Moneda, pareja
  y dirección son inmutables.
- **Borrado**: lógico. Revierte el ingreso del acreedor una vez. Si el deudor
  intenta borrar con un movimiento del acreedor enlazado, se bloquea
  (`SETTLEMENT_HAS_RECEIVER_MOVEMENT`) porque las reglas no permiten escribir la
  cartera del otro; el acreedor debe quitarla primero.

## 2. Modelo de datos

`settlements/{settlementId}` (colección raíz, id generado en cliente):

| Campo | Tipo | Notas |
|---|---|---|
| `participantIds` | `string[]` | Pareja ordenada; `pairId` es su unión con `__` |
| `pairId` | `string` | Inmutable; valida la amistad existente al crear |
| `fromUserId` | `string` | Deudor/pagador, derivado del saldo |
| `toUserId` | `string` | Acreedor/receptor, derivado del saldo |
| `amountCents` | `int` | Entero, > 0, máximo 100.000.000 |
| `currency` | `CurrencyCode` | Una por liquidación |
| `date` / `note` | `string` | Fecha ISO y nota opcional (máx. 500) |
| `createdBy` / `createdAt` | `string` | Inmutables |
| `updatedAt` / `deletedAt` | `string \| null` | `deletedAt: null` = aplicada |
| `receiverWalletId` | `string \| null` | Solo acreedor |
| `receiverCategoryId` | `string \| null` | Solo acreedor |
| `receiverTransactionId` | `string \| null` | Solo acreedor |

Los tres campos `receiver*` son todo-o-nada (null/null/null o los tres con
valor). El mapper descarta documentos mal formados para que un registro corrupto
no rompa la lista ni el ledger.

### Ledger

`features/settlements/utils/settlement-ledger.ts` emite **la arista inversa**:

```ts
{ id: `settlement:${id}`, fromUserId: toUserId, toUserId: fromUserId, ... }
```

`FriendLedgerEntry` significa "`fromUserId` debe a `toUserId`", así que una
liquidación que cancela deuda debe restar. Con la arista inversa,
`calculateFriendBalances` y la agrupación por moneda no cambian. El prefijo del
id permite excluir la propia liquidación al editar el importe.

`ComposedFriendLedgerRepository` concatena gastos compartidos y liquidaciones y
`getFriendLedgerRepository()` lo comparte entre `FriendsService` y
`SettlementsService`.

## 3. Operaciones atómicas

Todo ocurre en un `runTransaction` con lecturas antes de escrituras:

- **Crear**: `settlement` + ingreso opcional (`income`, `settlementId`,
  `receiverWalletId`, `receiverCategoryId`) + saldo de la cartera + notificación
  para el otro participante. El importe en céntimos se convierte una sola vez en
  el puerto (`FirebaseSettlementMovementPort`).
- **Editar**: revierte y reaplica el efecto de cartera solo cuando cambia el
  importe o la cartera; un cambio de fecha/nota no toca saldos. El deudor nunca
  lee ni escribe el movimiento del acreedor. La notificación de actualización usa
  `updatedAt` en la clave para que un reintento no duplique pero una edición real
  sí notifique.
- **Borrar**: idempotente. Revierte el ingreso, lo borra lógicamente y limpia los
  campos `receiver*` cuando el que borra es el acreedor. Una cartera archivada
  después del enlace se puede revertir; enlazar una cartera archivada nueva sigue
  rechazado (`WALLET_ARCHIVED`).

La deuda se valida contra el ledger compuesto. En edición se excluye
`settlement:{id}`. Las reglas no pueden sumar listas, así que el límite es una
invariante de schema/servicio, igual que en TICKET-009. Una escritura concurrente
puede mover la deuda entre la lectura y la escritura hasta TICKET-023.

## 4. UX

- **Detalle del amigo**: botón **Liquidar deudas** solo con deuda, mensaje de la
  última liquidación encima de los gastos, y colapso con **Ver gastos anteriores**
  / **Ocultar gastos anteriores** cuando el par queda a cero.
- **`/social/settlements/new?friendUid=`**: formulario con deuda pendiente,
  monedas con deuda, total/parcial, **fecha de la transferencia** (hoy o pasada;
  nunca futura), nota y bloque de cartera opcional solo para el acreedor.
- **`/social/settlements/[settlementId]`**: `DetailView` con editar/eliminar
  arriba a la derecha; el acreedor ve **Elegir cartera** o **Quitar cartera**.
- **Movimientos**: el ingreso enlazado muestra la etiqueta **Liquidación** y abre
  el detalle de la liquidación, nunca la edición personal.
- **Notificaciones**: campana con badge en el dashboard y `/notifications`
  (`PRIVATE_SEGMENTS`). La fila resuelve el texto de `type` + payload, marca como
  leída al abrir y navega a la liquidación. La bandeja mínima incluye carga,
  error con reintento, vacío y pull-to-refresh; el resto queda en TICKET-047.

Copy en `features/settlements/locales/{es,en}.json` y
`features/notifications/locales/{es,en}.json`, registrados en
`shared/i18n/resources.ts`.

## 5. Reglas Firestore

- `settlements`: lectura de participantes; creación validada (creador,
  pareja ordenada, deudor/acreedor dentro, importe, moneda, fecha, nota, enlace
  todo-o-nada, `deletedAt: null`, amistad existente); el deudor no puede crear un
  enlace. Actualización con identidad inmutable, cambios de enlace solo del
  acreedor, importe bloqueado al deudor si ya existe movimiento, borrado lógico
  dedicado y `delete: false`.
- `notifications`: listado y lectura solo del dueño, más un `get` puntual para
  el participante que escribe la notificación (la transacción lee el `dedupeKey`
  para ser idempotente) y un id inexistente resuelve `not-found`; actualización
  solo de `readAt`, sin borrado; creación solo por un participante para el otro,
  con id = `dedupeKey`, tres tipos y payload tipado, validando la liquidación con
  `getAfter` (misma transacción). El actor ya conoce la liquidación; lo único que
  expone es el `readAt` del destinatario. Sin este `get`, el alta fallaba con
  `PERMISSION_DENIED`.
- `transactions`: `settlementId` solo en `income`, inmutable, propiedad del
  acreedor, misma moneda y liquidación activa; `sharedExpenseId` y `settlementId`
  nunca conviven; borrado físico denegado.

Las reglas **no están desplegadas**. El usuario debe ejecutar
`npm run firebase-deploy:rules`.

## 6. Verificación

- `npx tsc --noEmit`: OK.
- `npx expo lint`: OK (exit 0).
- `npx jest`: 241 suites / 1410 tests.
- `npm run check:copy`: OK (245 TSX).
- `npm run test:coverage`: 98,71 % statements, 93,96 % branches, 98,06 %
  functions, 99,13 % lines (gate 90 %).
- Validación manual en dispositivo pendiente (sin dispositivo en la sesión).
- Emulador de reglas no ejecutado: `firebase-tools` exige JDK ≥ 21 y la máquina
  tiene 17/11/8. Revisión línea a línea de `firestore.rules`.

## 7. Límites y seguimiento

- La bandeja completa (pestañas **Pendientes**/**Vistas**, aviso flotante,
  marcar todo como leído, tipos de amigos/grupos) queda en TICKET-047.
- El detalle del amigo muestra solo la última liquidación, por decisión de
  producto; las anteriores siguen accesibles desde su notificación o el enlace
  directo.
- El deudor no puede borrar mientras el acreedor tenga un movimiento enlazado.
- La edición del importe se bloquea en cuanto el acreedor enlaza su cartera.
- No hay conversión de moneda, transferencias cartera-a-cartera, movimientos del
  deudor, push ni outbox offline.
- TICKET-010 debe reutilizar este modelo de aplicación directa, el patrón de
  movimiento del acreedor y los eventos de notificación.
