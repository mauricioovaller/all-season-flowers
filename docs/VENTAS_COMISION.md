# Módulo Ventas Comisión

> **Nota:** Inicialmente implementado solo para **Flagracol SAS**.
> Para habilitarlo en otro cliente, agregar los registros en la tabla `Permisos` (ver sección _Permisos_).

---

## 1. Descripción General

Módulo independiente de pedidos, devoluciones y cuenta de cobro para una actividad comercial complementaria. No afecta los módulos existentes de pedidos, devoluciones, compras, inventarios ni ningún reporte.

### 1.1 Submódulos

| Submódulo | ID en Sidebar | Descripción |
|-----------|---------------|-------------|
| Pedidos | `pedidos-comision` | CRUD de pedidos (4 niveles: Encabezado > Empaques > Productos > Recetas) con % comisión y PDF |
| Devoluciones | `devoluciones-comision` | Devoluciones asociadas exclusivamente a estos pedidos |
| Cuenta de Cobro | `cuenta-cobro` | Consolidado de pedidos por rango de fechas (con o sin filtro por cliente), cálculo de comisiones, PDF |

### 1.2 Sidebar

Aparece como una sección independiente (color violeta) debajo de INFORMES:

```
VENTAS COMISIÓN
├── Pedidos
├── Devoluciones
└── Cuenta de Cobro
```

---

## 2. Arquitectura Multicliente

El módulo está disponible en el código para **todos los clientes**, pero solo visible mediante permisos:

- Los ítems del menú se agregan al `Sidebar.jsx` (código compartido)
- Solo se insertan filas en `Permisos` para los usuarios que deben tener acceso
- Clientes sin permisos → no ven la sección (el header también se oculta gracias al filtro condicional)

### 2.1 Insertar permisos para un usuario

```sql
INSERT INTO Permisos (IdUsuario, NombreOpcion, Ruta) VALUES
(123, 'Pedidos Comision',      '/pedidos-comision'),
(123, 'Devoluciones Comision', '/devoluciones-comision'),
(123, 'Cuenta de Cobro',       '/cuenta-cobro');
```

> Reemplazar `123` con el `IdUsuario` correspondiente.

---

## 3. Base de Datos

### 3.1 Tablas creadas

| Tabla | Propósito | PK | FK |
|-------|-----------|----|----|
| `SAS_EncabPedidoComision` | Encabezado del pedido | `IdEncabPedidoComision` | `IdCliente` → `GEN_Clientes` |
| `SAS_DetEmpaqueComision` | Empaques por pedido | `IdDetEmpaqueComision` | `IdEncabPedidoComision` |
| `SAS_DetProductoComision` | Productos dentro de empaques | `IdDetProductoComision` | `IdDetEmpaqueComision`, `IdEncabPedidoComision` |
| `SAS_DetRecetaComision` | Ingredientes de bouquets | `IdDetRecetaComision` | `IdDetProductoComision`, `IdDetEmpaqueComision`, `IdEncabPedidoComision` |

### 3.2 Campos de comisión

| Tabla | Campo | Tipo | Descripción |
|-------|-------|------|-------------|
| `SAS_EncabPedidoComision` | `PorcentajeComision` | DECIMAL(5,2) DEFAULT 0 | % comisión global del pedido |
| `SAS_DetProductoComision` | `PorcentajeComision` | DECIMAL(5,2) DEFAULT NULL | % comisión por ítem (anula el global si se define) |

**Lógica:** Al definir un % global en el encabezado, se replica a cada ítem del detalle. Cada ítem puede modificarse individualmente.

### 3.3 Campos de devolución (UPDATE-only)

Se almacenan en las mismas tablas (patrón idéntico al módulo de devoluciones existente):

**`SAS_EncabPedidoComision`:**
- `IdDevolucion` INT NULL
- `FechaDevolucion` DATE NULL
- `ObservacionesDevolucion` TEXT NULL

**`SAS_DetProductoComision`:**
- `TallosDevolucion` INT NULL
- `MotivoDevolucion` VARCHAR(255) NULL
- `Flete` DECIMAL(12,4) NULL
- `Fumigacion` DECIMAL(12,4) NULL
- `Otros` DECIMAL(12,4) NULL

### 3.4 SQL de migración

El script de creación está en:
```
src/Api/ventasComision/migracion.sql
```

Usa `CREATE TABLE IF NOT EXISTS` — se puede ejecutar múltiples veces sin riesgo.

---

## 4. Estructura de Archivos

### 4.1 Frontend (React)

```
src/modules/ventasComision/
├── pedidos/
│   ├── PedidosComision.jsx              # Orquestador principal (620 líneas)
│   ├── PedidoComisionHeader.jsx         # Formulario de encabezado
│   ├── PedidoComisionEmpaque.jsx        # Contenedor de empaques
│   ├── EmpaqueComisionItem.jsx          # Productos dentro de empaques
│   └── ModalBuscarPedidosComision.jsx   # Modal de búsqueda
├── devoluciones/
│   ├── DevolucionesComision.jsx         # Orquestador principal
│   ├── DevolucionComisionHeader.jsx     # Encabezado de devolución
│   ├── DevolucionComisionDetalle.jsx    # Tabla de detalle editable
│   └── ModalBuscarDevolucionesComision.jsx
└── cuentaCobro/
    └── CuentaCobro.jsx                  # Consolidado y PDF
```

### 4.2 Servicios

```
src/services/ventasComision/
├── pedidosComisionService.js      # 7 funciones (getDatosSelect, guardar, buscar, etc.)
├── devolucionesComisionService.js # 8 funciones (obtenerUltimoNumero, guardar, PDF, etc.)
└── cuentaCobroService.js          # 2 funciones (getPedidosParaCobro, generarPDF)
```

### 4.3 APIs PHP

```
src/Api/ventasComision/
├── pedidos/         (7 PHP)
├── devoluciones/    (8 PHP)
└── cuentaCobro/     (2 PHP)
```

| PHP | Endpoint | Tablas involucradas |
|-----|----------|---------------------|
| `ApiGetDatosSelect.php` | POST → datos para selects | `GEN_Clientes`, `GEN_Ejecutivos`, `GEN_Monedas`, `GEN_Productos`, `GEN_Variedades`, `GEN_Grados`, `GEN_TipoEmpaque`, `GEN_Unidades`, `GEN_Predios`, `GEN_Aerolineas`, `GEN_Agencias` |
| `ApiGetSelecVariedGrado.php` | POST `{idProducto}` | `GEN_Variedades`, `GEN_Grados` |
| `ApiGuardarPedidoCompleto.php` | POST → guarda/actualiza pedido | `SAS_EncabPedidoComision`, `SAS_DetEmpaqueComision`, `SAS_DetProductoComision`, `SAS_DetRecetaComision` |
| `ApiGetPedidos.php` | POST `{filtros}` → lista paginada | `SAS_EncabPedidoComision` + `GEN_Clientes` |
| `ApiGetPedidoEspecifico.php` | POST `{idPedido}` → carga completa | Las 4 tablas + auxiliares |
| `ApiGetUltimoNumeroPedido.php` | POST → siguiente `PEC-XXXXXX` | `SAS_EncabPedidoComision` |
| `ApiGenerarPDFPedido.php` | POST `{idPedido}` → PDF | Las 4 tablas + auxiliares + FPDF |
| `ApiGetUltimoNumeroDevolucion.php` | POST | `SAS_EncabPedidoComision` |
| `ApiGetFacturasCliente.php` | POST `{idCliente}` | `SAS_EncabPedidoComision` + `GEN_Monedas` |
| `ApiGetDetalleFactura.php` | POST `{idFactura}` | `SAS_DetProductoComision` + `SAS_DetEmpaqueComision` + auxiliares |
| `ApiGuardarDevolucion.php` | POST → UPDATE devolución | `SAS_EncabPedidoComision`, `SAS_DetProductoComision` |
| `ApiGetDevolucionEspecifica.php` | POST `{idFactura}` | Las 4 tablas + auxiliares |
| `ApiBuscarDevoluciones.php` | POST `{filtros}` | `SAS_EncabPedidoComision` + `GEN_Clientes` |
| `ApiGenerarPDFDevolucion.php` | POST `{idFactura}` → PDF | Las 4 tablas + FPDF |
| `ApiEliminarDevolucion.php` | POST `{idDevolucion}` → NULL dev fields | `SAS_EncabPedidoComision`, `SAS_DetProductoComision` |
| `ApiGetPedidosParaCobro.php` | POST `{fechaInicio, fechaFin, idCliente?}` | `SAS_EncabPedidoComision` + `SAS_DetProductoComision` |
| `ApiGenerarPDFCuentaCobro.php` | POST → PDF consolidado | Datos recibidos (no consulta BD) + FPDF |

### 4.4 Tests

```
src/test/ventasComision/
├── pedidosComision.test.js       # 14 tests
├── devolucionesComision.test.js  # 15 tests
└── cuentaCobro.test.js           # 2 tests
```

Total: **31 tests** — siguen el patrón `vi.stubGlobal('fetch', mockFetch(...))`.

---

## 5. Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/App.jsx` | 3 nuevos imports + 3 nuevos `case` en el switch |
| `src/components/layout/Sidebar.jsx` | Nueva sección `VENTAS COMISIÓN` con header condicional + colores por categoría |
| `.vscode/mcp.json` | Segundo servidor `mysql-flagracol` |
| `mcp-mysql/index.js` | Soporte para `--env-file` |
| `mcp-mysql/.env-flagracol` | Credenciales FlagracolSAS para MCP (NUEVO) |

---

## 6. Datos de Tablas Auxiliares (FlagracolSAS)

Nombres de columnas verificados contra `datenban_FlagracolSAS`:

| Tabla | Columnas clave usadas |
|-------|-----------------------|
| `GEN_Clientes` | `IdCliente`, `NOMBRE`, `PAIS`, `Direc1`, `CIUDAD`, `ESTADO`, `IVA` |
| `GEN_Ejecutivos` | `IdEjecutivo`, `NOMEJECUTIVO`, `ACTIVO` |
| `GEN_Monedas` | `IdMoneda`, `Moneda` |
| `GEN_Productos` | `IdProducto`, `NOMPRODUCTO`, `CODPRODUCTO` |
| `GEN_Variedades` | `IdVariedad`, `NOMVARIEDAD`, `IdProducto`, `ACTIVO` |
| `GEN_Grados` | `IdGrado`, `NOMGRADO`, `IdProducto`, `ACTIVO` |
| `GEN_TipoEmpaque` | `IdTipoEmpaque`, `Descripcion`, `EquivFull` |
| `GEN_Unidades` | `IdUnidades`, `DescripUnidad` |
| `GEN_Predios` | `IdPredio`, `NombrePredio` |
| `GEN_Aerolineas` | `IdAerolinea`, `NOMAEROLINEA` |
| `GEN_Agencias` | `IdAgencia`, `NOMAGENCIA` |

> **Importante:** Si se replica a otro cliente, verificar que los nombres de columna coincidan. La API PHP usa SQL con `AS` alias para normalizar al formato del frontend (`id`, `nombre`, etc.).

---

## 7. Funcionamiento de la Comisión

### 7.1 Niveles de comisión

1. **Global** (encabezado): `PorcentajeComision` en `SAS_EncabPedidoComision`
   - Se replica automáticamente a cada ítem del detalle al crear el pedido
2. **Por ítem** (detalle): `PorcentajeComision` en `SAS_DetProductoComision`
   - Si se define, anula el global para ese producto específico
   - Si es NULL, usa el porcentaje global

### 7.2 Cálculo en Cuenta de Cobro

Para cada pedido:
- Se calcula el valor total por ítem: `Tallos_Ramo × Ramos_Caja × CantidadEmpaque × Precio_Venta`
- Se calcula la comisión por ítem: `valorTotal × (PorcentajeComision / 100)`
- Si el ítem tiene `PorcentajeComision` NULL, se usa el global del encabezado
- La suma de comisiones de todos los ítems es la comisión del pedido

---

## 8. PDFs Generados

| Tipo | Generado por | Formato |
|------|-------------|---------|
| Pedido | `ApiGenerarPDFPedido.php` | PDF con logo, datos del pedido, empaques, productos, subtotales, comisiones |
| Devolución | `ApiGenerarPDFDevolucion.php` | PDF con logo, datos del cliente, productos devueltos, valores |
| Cuenta de Cobro | `ApiGenerarPDFCuentaCobro.php` | PDF consolidado con todos los pedidos del rango, totales y comisión a cobrar |

Todos usan **FPDF** (librería compartida en `fpdf/`) con datos de empresa desde `empresa.php`.

---

## 9. Sidebar — Sistema de colores por sección

| Sección | Color borde | Color texto/texto |
|---------|------------|-------------------|
| TABLAS MAESTRAS | `border-emerald-400` | `text-emerald-400` |
| MÓDULOS OPERATIVOS | `border-blue-400` | `text-blue-400` |
| INFORMES | `border-amber-400` | `text-amber-400` |
| VENTAS COMISIÓN | `border-violet-400` | `text-violet-400` |

El filtro condicional asegura que un header solo se muestre si su categoría tiene al menos un ítem con permiso. Si ningún usuario de un cliente tiene permisos para `ventasComision`, la sección completa (header + ítems) se oculta.

---

## 10. Pruebas

```bash
npm test              # 363 tests — todos deben pasar
npm run lint          # Sin errores en archivos del módulo
npm run build:flagracol  # Build para Flagracol SAS
```

### Para agregar un nuevo cliente

Seguir `scripts/PLANTILLA_NUEVO_CLIENTE.md` más:
1. Ejecutar `src/Api/ventasComision/migracion.sql` en la nueva BD
2. Insertar permisos en `Permisos` para los usuarios correspondientes
3. `npm run build:nuevocliente` (con las variables de entorno correctas)
4. Desplegar `dist/` + `src/Api/ventasComision/` al servidor
