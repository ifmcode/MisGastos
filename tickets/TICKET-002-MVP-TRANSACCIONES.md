# TICKET-002 - MVP: Gastos, ingresos e histórico

**Tipo:** Feature  
**Prioridad:** Alta  
**Estado:** ⏳ Pendiente  
**Relacionado:** MVP-003, MVP-005  
**Sprint:** MVP  

## Descripción
Crear transacciones (gasto/ingreso) asociadas a cartera, con histórico, filtros y ordenación.

## Criterios de aceptación
- [ ] Tipos Transaction (gasto/ingreso) definidos
- [ ] Crear transacción desde UI
- [ ] Actualizar saldo de cartera correctamente
- [ ] Histórico con FlatList
- [ ] Filtros: por cartera, tipo, categoría, rango fechas
- [ ] Ordenación: fecha asc/desc
- [ ] Validaciones (importe > 0, cartera obligatoria)
- [ ] Persistencia Firestore
- [ ] Tests reglas actualización saldos

## Notas técnicas
- Fecha por defecto hoy
- Concepto/descripcion
- Categorías básicas inicialmente
- Precaución con decimales
