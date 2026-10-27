# TICKET-003 - MVP: Transferencias entre carteras y dashboard

**Tipo:** Feature  
**Prioridad:** Alta  
**Estado:** ⏳ Pendiente  
**Relacionado:** MVP-004, MVP-006  
**Sprint:** MVP  

## Descripción
Transferencias entre carteras propias y vista resumen con totales filtrables.

## Criterios de aceptación
- [ ] Transferencia: origen, destino, importe, fecha, notas
- [ ] Validar saldo suficiente en origen
- [ ] Actualizar ambos saldos
- [ ] No permitir misma cartera
- [ ] Dashboard: total global, por cartera
- [ ] Filtro por cartera o "Todas"
- [ ] Mostrar resumen claro
- [ ] Tests atómicos/críticos

## Notas técnicas
- Considerar transacción tipo "transfer" o dos movimientos enlazados
- Mantener trazabilidad
- UI clara para evitar errores
