# ShiftPay 2.0

Punto de venta y back office en español para **car wash, barberías y comercios**, con citas, membresías,
empleados, inventario y reportes anuales. Funciona en el navegador y como **app de escritorio para Windows**.

Toma como referencia los flujos de un POS existentes sin reutilizar su código, recursos, credenciales ni datos.
El diseño es propio, de inspiración macOS (títulos grandes, barra lateral translúcida, controles refinados), sin
logotipos ni recursos de Apple.

> **Datos ficticios.** Todo se guarda en este equipo (IndexedDB). Los cobros con tarjeta son simulados:
> la app nunca pide ni guarda datos de tarjetas.

## Instalar en Windows

El instalador está en `release/ShiftPay-Setup-2.0.0.exe` (después de `npm run dist:win`).

1. Ejecútalo y elige la carpeta de instalación. Crea accesos directos en el escritorio y en el menú Inicio.
2. **El instalador no tiene firma digital**, así que Windows SmartScreen mostrará «Windows protegió su PC».
   Pulsa **Más información → Ejecutar de todas formas**. Para distribuirlo sin aviso hace falta un certificado de firma de código.
3. Los datos se guardan en el perfil del usuario y se conservan al actualizar o desinstalar.

## Desarrollo

Requisitos: Node.js 18 o superior (probado con Node 26.13.1) y npm.

```bash
npm install
```

```bash
npm run dev
```

Abre <http://localhost:5173>.

| Comando | Qué hace |
|---|---|
| `npm run build` | Comprueba tipos y genera `dist/` |
| `npm test` | Pruebas unitarias (caja, totales con descuento, CSV, importes) |
| `npm run app` | Compila y abre la app de escritorio con Electron |
| `npm run dist:win` | Compila y genera el instalador NSIS en `release/` |
| `npm run icon` | Regenera `build/icon.png` desde `public/favicon.svg` |

**Notas para compilar el instalador en Windows**

- Si `npm install` deja Electron incompleto (error «Electron failed to install correctly»), extrae a mano el zip
  que quedó en `%LOCALAPPDATA%\electron\Cache` dentro de `node_modules/electron/dist` y crea
  `node_modules/electron/path.txt` con el texto `electron.exe`.
- Si electron-builder falla con «Cannot create symbolic link» al preparar `winCodeSign`, extrae
  `winCodeSign-2.6.0.7z` en `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0`
  (los dos errores de enlaces de macOS se pueden ignorar), o activa el *Modo de desarrollador* de Windows.

## Qué incluye

| Sección | Funciones |
|---|---|
| **Dashboard** | Ventas de hoy, transacciones, efectivo, tarjeta, impuesto, anulaciones, citas y membresías; acciones rápidas; estado del negocio (cajas abiertas, personal en turno, stock bajo, próximas citas con «Cobrar») y gráfico de 7 días |
| **Vender** | Catálogo por categoría, cliente con membresía (servicios incluidos a $0 y descuento del plan), descuentos, doble precio efectivo/tarjeta, cobro simulado e impresión de recibo de 80 mm |
| **Ventas** | Tarjetas de totales, periodos (hoy, ayer, 7 y 30 días, este mes, mes pasado, rango), búsqueda, filtros, detalle, recibo, anulación y CSV |
| **Caja y cierres** | Turnos por caja, entradas y salidas, cierre guiado con conteo por denominación |
| **Productos** | Productos y servicios, precio efectivo y tarjeta, stock, estado, interruptor Web, selección masiva, importar y exportar CSV |
| **Categorías** | Tarjetas de color, subcategorías, EBT, arrastrar para ordenar, activar y eliminar |
| **Inventario** | Existencias, stock bajo y agotados, entradas, conteo físico, mermas e historial |
| **Descuentos** | Porcentaje o monto fijo, activar/desactivar y uso del mes |
| **Clientes** | Fichas con vehículos y placas, membresías, citas y compras |
| **Membresías** | Planes mensuales o anuales (ilimitados o con usos), inscripción con cobro, renovación, pausa, cancelación, días de gracia y check-in por placa |
| **Citas** | Agenda diaria por profesional, estados (programada, confirmada, completada, no asistió, cancelada) y cobro de la cita |
| **Empleados** | Alta, edición, desactivación y baja; código de 4–6 dígitos; datos personales, documento y vencimiento, contacto de emergencia; adjuntos; reloj de entrada/salida; horas por periodo con jornadas editables; ventas, servicios y comisión |
| **Reportes** | Total anual por mes, detalle diario de cada mes, cierres de caja por mes y año (faltantes y sobrantes), ranking de productos y categorías, personal (horas, pago, comisiones) y membresías (MRR, cobros, visitas, altas y bajas). Todo exportable a CSV |
| **Ajustes** | Menú por secciones: negocio, módulos, apariencia, impuestos y pagos, cajas y turnos, recibos, citas, membresías, datos y respaldo (exportar/restaurar JSON, restablecer, borrar operaciones), próximamente y acerca de |

Fórmulas de caja (`src/domain/cash.ts`):

```
esperado   = fondo inicial + ventas en efectivo + entradas − salidas
diferencia = contado − esperado      (0 → cuadró, > 0 → sobrante, < 0 → faltante)
```

Comisión (`src/domain/staff.ts`): porcentaje del empleado × importe (sin impuesto) de las citas que atendió y se cobraron.

Códigos de empleado de la demo: **1000 a 1006** (reloj de entrada/salida y apertura de caja).

## Estructura

```
electron/    Proceso principal de escritorio y generador del icono
src/
  domain/    Reglas puras: caja, totales, membresías, horas, personal, reportes (+ pruebas)
  data/      Datos de demostración ficticios (~14 meses, generador determinista)
  store/     Estado y persistencia (IndexedDB); único punto a sustituir por una API
  payments/  Capa de pagos: contrato, proveedor simulado y plantilla para uno autorizado
  pages/     Una página por sección
  components/ Layout, búsqueda Ctrl+K, reloj, diálogos, UI base, iconos propios
  lib/       Formato, CSV, recibos, IndexedDB
docs/        Análisis de GCR y registro de progreso
```

## Conectar un proveedor de pagos

1. Implementa `chargeCard` (y `voidCharge`) en `src/payments/providers/authorized.ts` siguiendo `PaymentProvider`.
2. Usa un terminal o SDK **semi‑integrado y certificado**: la tarjeta la lee el dispositivo del proveedor y ShiftPay sólo recibe referencia, autorización, marca y últimos 4 dígitos.
3. Guarda credenciales fuera del frontend.
4. Actívalo con `VITE_PAYMENT_PROVIDER=autorizado` (ver `.env.example`).

## Pendiente para producción

- **Servidor y base de datos** para varias cajas o sucursales, sincronización y copias automáticas.
- **Inicio de sesión, roles y permisos** (autorización de gerente para anular, dar salidas o editar horas) y auditoría.
- **Pagos reales** certificados (reembolsos, propinas, conciliación), cumplimiento PCI DSS y cobro recurrente automático de membresías.
- **Firma de código** del instalador y actualizaciones automáticas.
- **Documentos de empleados** cifrados y con control de acceso; hoy se guardan localmente.
- **Periféricos**: impresora térmica directa, cajón de dinero, lector de código de barras y pantalla de cliente.
- **Recordatorios** de citas por SMS o email, reservas en línea y tienda web.
- Modificadores, mesas, estaciones de impresión y ofertas (marcados como «Próximamente» en Ajustes).
- Pruebas end‑to‑end (Playwright) y de accesibilidad.
