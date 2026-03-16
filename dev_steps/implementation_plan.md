# Plan de Implementación - MisGastos

## Objetivo del Proyecto
Desarrollar una aplicación híbrida (Móvil, Web) para la gestión de fianzas personales llamada **MisGastos**. Permitirá el control de cuentas, categorías y registro de transacciones.

## Tecnologías Principales
- **Frontend**: React Native con Expo (Managed Workflow).
- **Lenguaje**: TypeScript.
- **Estilos**: NativeWind (TailwindCSS).
- **Navegación**: Expo Router (basado en pestañas: Inicio, Cuentas, Categorías, Configuración).
- **Backend/Persistencia**: **Supabase** (Recomendado) o Firebase.
    - *Motivo*: Se requiere "Login con email/password" y futuro "Login Google" y sincronización.

## Requisitos del MVP 

### 1. Autenticación y Usuario
- [ ] Registro e Inicio de sesión con Email y Contraseña.
- [ ] Persistencia de sesión.
- [ ] **Configuración**: Ver usuario actual y botón "Cerrar Sesión".

### 2. Gestión de Cuentas
- [ ] **Entidad Cuenta**: Nombre, Saldo Inicial, Divisa (EUR, USD, GBP, etc.), Icono, Color.
- [ ] **CRUD**: Crear, Editar, Eliminar y Listar Cuentas.
- [ ] **Validaciones**: Si no se asigna dinero inicial, inicia en 0.

### 3. Gestión de Categorías
- [ ] **Entidad Categoría**: Nombre, Tipo (Gasto/Ingreso), Icono, Color.
- [ ] **CRUD**: Crear, Editar, Eliminar y Listar.

### 4. Transacciones (Gastos e Ingresos)
- [ ] **Crear Transacción**: Seleccionar Cuenta, Categoría, Cantidad, Fecha, Comentario.
    - *Nota*: La divisa se hereda de la cuenta por defecto, pero debe ser seleccionable para poder cambiarla.
- [ ] **Historial**: Lista ordenada por fecha descendente.
- [ ] **CRUD**: Editar y Borrar transacciones (debe actualizar el saldo de la cuenta).

### 5. Dashboard (Inicio)
- [ ] **Resumen Total**: Suma del saldo de todas las cuentas (conversión de divisas simplificada o 1:1 para MVP si son distintas).
- [ ] **Historial Reciente**: Feed de últimos movimientos.

---

## Roadmap Futuro (Post-MVP)
- [ ] Adjuntar fotos a transacciones.
- [ ] Etiquetas (Tags) para gastos/ingresos.
- [ ] Transferencias entre cuentas (con conversión de divisa).
- [ ] Calculadora integrada en inputs numéricos.
- [ ] Login Social (Google).
- [ ] Filtros avanzados (Rangos de fecha, Transferencias).
- [ ] Seguridad (PIN / Huella).
- [ ] Gráficos y Reportes.
- [ ] Presupuestos.
- [ ] Toggle "Incluir en total" para cuentas.

## Estructura de Directorios (Expo Router)
```text
/app
  /_layout.tsx       (Provider de Auth y Configuración)
  /(auth)            (Rutas públicas)
    /login.tsx
    /register.tsx
  /(tabs)            (Rutas protegidas)
    /_layout.tsx     (Tab Bar: Inicio, Cuentas, Categorías, Config)
    /index.tsx       (Inicio - Dashboard)
    /accounts/       (Stack de Cuentas)
      /index.tsx
      /create.tsx
      /[id].tsx
    /categories/     (Stack de Categorías)
    /settings.tsx    (Configuración)
/components          (UI Reutilizable: Button, Input, IconPicker, ColorPicker)
/lib                 (Cliente Supabase, utilidades)
```

## Plan de Ejecución
1.  **Inicialización**: Setup Expo, NativeWind y Cliente Supabase.
2.  **Auth**: Implementar flujos de Login/Registro.
3.  **UI Kit**: Crear componentes base (Iconos, Colores).
4.  **Features**: Implementar Cuentas -> Categorías -> Transacciones.
5.  **Integración**: Conectar Dashboard con datos reales.
