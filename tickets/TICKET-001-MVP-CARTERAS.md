# TICKET-001 - MVP: Crear y gestionar carteras

**Tipo:** Feature  
**Prioridad:** Alta  
**Estado:** ⏳ Pendiente  
**Relacionado:** MVP-002  
**Sprint:** MVP  

## Descripción
Permitir crear carteras donde irán asociados gastos/ingresos. Cada cartera debe tener: nombre, moneda, icono, saldo inicial, tipo (efectivo/banco/otro).

## Criterios de aceptación
- [ ] Modelo/tipos Wallet definidos
- [ ] Crear cartera desde UI
- [ ] Listar carteras
- [ ] Ver saldo por cartera
- [ ] Validaciones (nombre requerido, moneda, saldo inicial >= 0)
- [ ] Persistencia en Firestore (users/{uid}/wallets o wallets con ownerId)
- [ ] Seguir arquitectura features/wallets
- [ ] Tests para lógica crítica

## Notas técnicas
- Sin fotos inicialmente
- Icono desde set predefinido
- Monedas: empezar con las más comunes (EUR, USD, GBP...)
- Saldo inicial se refleja en balance
