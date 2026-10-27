# PLAN DE IMPLEMENTACIÓN: MisGastos (Gestor + Splitwise)

> Documento vivo. Actualizar con cada funcionalidad nueva acordada. Siempre partir del MVP.

## 1. Inspiración: Gestor de gastos + Splitwise
**Referencias:** `ui-references/gestor-gastos-referencia.png` y `ui-references/splitwise-referencia.png`

**Gestor de gastos (tipo):** Control personal, cuentas/carteras, categorías, ingresos/gastos, saldo, gráficos, historial, presupuestos.
**Splitwise:** Grupos, división de gastos (equitable, porcentajes, importes), saldos entre amigos, "quién debe a quién", liquidaciones, actividad grupal.

Objetivo: fusionar ambos mundos - finanzas personales + compartidas sin complejidad innecesaria.

### Análisis de capturas
**Gestor de gastos (vista):** Enfoque en resumen/saldo, movimientos recientes, acceso rápido a añadir gasto/ingreso, organización por cuentas/carteras. UI limpia con totales destacados.
**Splitwise (vista):** Enfoque social - grupos, balance con amigos ("te deben"/"debes"), actividad, división de gastos, saldos simplificados. Énfasis en "quién debe a quién".

## 2. MVP (Mínimo Viable)
Prioritario para tener una versión usable.

| ID | Funcionalidad | Descripción | Estado | Notas |
|---|---|---|---|---|
| MVP-001 | Autenticación | Login/registro email+pass y Google (ya existe) | ✅ Hecho | Mejorar validaciones y manejo errores |
| MVP-002 | Cartera/Cuenta | Crear cartera con: nombre, moneda, icono, color, saldo inicial, tipo (efectivo/banco/otro). Opción **"Incluir en total"** (toggle). Si no se indica saldo inicial -> 0 | ⏳ Pendiente | Entidad principal |
| MVP-003 | Crear gasto/ingreso | Añadir transacción con importe, fecha, concepto/categoría, cartera, notas, tipo (ingreso/gasto). Divisa heredada de cartera por defecto pero **seleccionable**. Al crear/editar/eliminar debe actualizarse el saldo de la cartera | ⏳ Pendiente | CRUD básico |
| MVP-004 | Transferencia entre carteras | Mover dinero entre carteras propias (actualiza saldos) | ⏳ Pendiente | Debe ser atómico |
| MVP-005 | Histórico con filtros/ordenación | Listado por fecha, filtrar por cartera/tipo/categoría, ordenar asc/desc | ⏳ Pendiente | FlatList eficiente |
| MVP-006 | Dashboard/Resumen total | Ver balance total, por cartera, filtrar por cartera o todas | ⏳ Pendiente | Vista principal clara |

## 3. Post-MVP / Funcionalidades futuras
Ordenadas por valor/prioridad razonable.

### 3.1 Perfil y configuración
| ID | Funcionalidad | Descripción | Estado |
|---|---|---|---|
| PM-001 | Perfil de usuario | Editar nombre, moneda preferida (por defecto), configuraciones | ⏳ Pendiente |
| PM-002 | Moneda preferida | Selector de moneda, conversión opcional más adelante | ⏳ Pendiente |

### 3.2 Amigos
| ID | Funcionalidad | Descripción | Estado |
|---|---|---|---|
| PM-003 | Gestión de amigos | Buscar usuario por email/ID, enviar/aceptar/rechazar solicitud | ⏳ Pendiente |
| PM-004 | Lista de amigos | Ver amigos, acceder a balance con cada uno | ⏳ Pendiente |

### 3.3 Grupos (estilo Splitwise)
| ID | Funcionalidad | Descripción | Estado |
|---|---|---|---|
| PM-005 | Crear grupo | Nombre, miembros (amigos), moneda del grupo, descripción | ⏳ Pendiente |
| PM-006 | Gasto compartido | Añadir gasto, dividir entre miembros (a partes iguales / por porcentaje / por importes / por acciones) | ⏳ Pendiente |
| PM-007 | Saldos del grupo | Ver "quién debe a quién", deudas simplificadas | ⏳ Pendiente |
| PM-008 | Liquidaciones | Registrar pago entre miembros para saldar deuda | ⏳ Pendiente |
| PM-009 | Histórico grupo | Actividad, gastos, liquidaciones | ⏳ Pendiente |

### 3.4 Mejoras generales
| ID | Funcionalidad | Descripción | Estado |
|---|---|---|---|
| PM-010 | Categorías | Crear/editar categorías con icono/color, tipo (gasto/ingreso), CRUD completo | ⏳ Pendiente |
| PM-011 | Presupuestos | Presupuesto por categoría/cartera con alertas | ⏳ Pendiente |
| PM-012 | Exportar datos | CSV/PDF (evaluar más adelante) | ⏳ Pendiente |
| PM-013 | Modo oscuro | Ya hay soporte base, pulir | ⏳ Pendiente |
| PM-014 | Búsqueda avanzada | Por texto/concepto, rango fechas, múltiples filtros | ⏳ Pendiente |

## 4. Reglas clave de negocio
- **Sin fotos inicialmente**: No subir avatares/fotos. Usar iniciales/iconos por defecto
- **Multi-cartera**: Todo gasto/ingreso debe ir asociado a una cartera
- **Transferencias propias**: No afectan balance neto global pero sí saldos por cartera
- **Gastos compartidos**: Cálculo preciso de saldos. Evitar floats sin cuidado (usar cents/integers o Decimal)
- **Moneda**: Guardar moneda por cartera y por grupo. Conversión fuera de MVP
- **Timestamps**: createdAt/updatedAt con serverTimestamp o Date ISO
- **Soft deletes**: Considerar `deletedAt` antes de borrado físico

## 5. Investigación funcionalidades Splitwise/Gestor gastos
**Splitwise típico:** grupos, gastos con pagador, división flexible, saldos simplificados, actividad, liquidaciones, categorías, multi-moneda parcial.
**Gestor gastos típico:** cuentas, transacciones, categorías, balance diario/mensual, gráficos, presupuestos, transferencias.

**Añadidos recomendados:**
- "Pagar todo" / liquidación rápida
- Mostrar balance neto: "Te deben X / Debes Y"
- Histórico con agrupación por día/mes
- Iconos por categoría/cartera
- Validaciones fuertes de importes (>0)

## 6. Checklist antes de cada feature
- [ ] Actualizar `plan-implementacion/PLAN-MVP-Y-POSTMVP.md` con estado
- [ ] Crear/actualizar ticket en `tickets/`
- [ ] Seguir directrices arquitectura/SOLID
- [ ] Añadir tests si lógica de negocio
- [ ] Documentar en `dev_steps/` resumen sesión
- [ ] Actualizar memoria si decisión importante
