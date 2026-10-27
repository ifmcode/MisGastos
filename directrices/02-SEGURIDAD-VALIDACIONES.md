# DIRECTRICES: Seguridad, Validaciones y Buenas Prácticas

## 1. Seguridad
- **Variables entorno**: Usar `EXPO_PUBLIC_*` solo lo necesario. Nunca commitear `.env`
- **Firebase**: Configurar reglas Firestore estrictas por usuario/grupo (pendiente)
- **Auth**: Verificar usuario autenticado antes de operaciones sensibles
- **Datos**: No loggear info sensible (tokens, contraseñas)
- **Errores**: Mostrar mensajes user-friendly, loggear detalles en dev
- **Permisos**: Verificar pertenencia a grupo/cartera antes de CRUD

## 2. Validaciones
- **Cliente**: Validar formularios (requeridos, formatos, importes > 0)
- **Negocio**: Validar en services (saldo suficiente para gasto, permisos)
- **Tipos**: Aprovechar TypeScript al máximo
- **Importes**: Usar números con cuidado. Para dinero considerar trabajar en céntimos (integer) o validación estricta
- **Fechas**: Válidas, no futuras si no tiene sentido

### Reglas importes
- > 0 para gastos/ingresos (según contexto)
- Transferencias entre carteras propias permitidas con validaciones
- No permitir importes negativos inesperados

## 3. Validación de inputs
```typescript
// Ejemplo patrón
function validateAmount(amount: number): {ok: boolean, error?: string} {
  if (isNaN(amount)) return {ok:false, error:'Importe inválido'}
  if (amount <= 0) return {ok:false, error:'Debe ser mayor a 0'}
  return {ok:true}
}
```

## 4. Firestore seguridad (guía)
- users/{uid}: solo propio usuario
- wallets/{id}: solo propietario o miembros según modelo
- transactions/{id}: validado por pertenencia
- groups/{id}: solo miembros
- friends/*: controlado por solicitud

*(Definir reglas reales antes de deploy)*

## 5. Checklist seguridad
- [ ] Sin datos sensibles en logs
- [ ] Validación cliente + negocio
- [ ] Comprobación de auth/permiso
- [ ] Reglas Firestore consideradas
- [ ] Sin `console.log` excesivos en producción
- [ ] Errores manejados sin exponer stack completo al usuario
