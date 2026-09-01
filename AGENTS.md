# AGENTS.md - All Season Flowers Project Guide

## Project Overview

This is a React-based web application for managing a flower business (All Season Flowers). The application includes modules for orders, returns, purchases, customers, products, varieties, grades, drivers, assistants, and suppliers. It uses Vite as the build tool, Tailwind CSS for styling, and communicates with a PHP backend API.

## Build, Lint, and Test Commands

### Development

```bash
npm run dev          # Start development server (Vite)
```

### Build

```bash
npm run build        # Build for production (Vite)
npm run preview      # Preview production build
```

### Linting

```bash
npm run lint         # Run ESLint on all files
```

### Testing

The project uses **Vitest** as the test runner with **jsdom** environment and **@testing-library/react**.

```bash
npm test              # Run all tests once (use before every build)
npm run test:watch    # Watch mode — re-runs on file save (use while developing)
npm run test:ui       # Visual browser UI for test results
```

**Current coverage:** 383 tests across 31 test files — all passing.

**Test files location:** `src/test/<module>/`

| Module              | Test file                                                                 |
| ------------------- | ------------------------------------------------------------------------- |
| pagosClientes       | `src/test/pagosClientes/validaciones.test.js`, `guardarPago.test.js`      |
| pagosProveedores    | `src/test/pagosProveedores/validaciones.test.js`, `servicioAsync.test.js` |
| devolucionesCompras | `src/test/devolucionesCompras/validaciones.test.js`                       |
| compras             | `src/test/compras/calcularTotales.test.js`, `servicioAsync.test.js`       |
| clientes            | `src/test/clientes/servicio.test.js`                                      |
| proveedores         | `src/test/proveedores/servicio.test.js`                                   |
| conductores         | `src/test/conductores/servicio.test.js`                                   |
| ayudantes           | `src/test/ayudantes/servicio.test.js`                                     |
| productos           | `src/test/productos/servicio.test.js`                                     |
| variedades          | `src/test/variedades/servicio.test.js`                                    |
| grados              | `src/test/grados/servicio.test.js`                                        |
| pedidos             | `src/test/pedidos/servicio.test.js`                                       |
| devoluciones        | `src/test/devoluciones/servicio.test.js`                                  |
| dashboard           | `src/test/dashboard/servicio.test.js`                                     |
| reportes            | `src/test/reportes/servicio.test.js` (consolidados ventas/compras, consolidados devoluciones clientes/proveedores, estado cuenta, planilla, muiscas) |
| reportes            | `src/test/reportes/ingresosRecibidos.test.js` (consolidado de ingresos recibidos) |
| bajas               | `src/test/bajas/servicio.test.js`                                         |
| inventarios         | `src/test/inventarios/servicio.test.js`                                   |
| permisos            | `src/test/permisos/servicio.test.js`                                      |
| ventasComision      | `src/test/ventasComision/pedidosComision.test.js`, `devolucionesComision.test.js`, `cuentaCobro.test.js` |

> **Nota:** El total actual de tests es 383 (31 archivos). Ver `/memories/repo/ayudantes-cedula-fix.md` para documentación de cambios en Ayudantes NoCedula. Ver [`docs/VENTAS_COMISION.md`](docs/VENTAS_COMISION.md) para documentación del módulo Ventas Comisión.

**Vitest configuration** (`vite.config.js`):

```js
test: {
  environment: "jsdom",
  globals: true,
  setupFiles: "./src/test/setup.js",
  singleFork: true,  // Required on Windows to avoid parallel fork timeout
}
```

**Test patterns used:**

- Pure/utility functions → direct unit tests (no mocks needed)
- Async service functions → `vi.stubGlobal('fetch', mockFetch(...))` pattern
- Each `afterEach` calls `vi.unstubAllGlobals()` to clean up

Example mock helper used across all service tests:

```js
function mockFetch(body, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}
```

**What each service test covers:**

- `getList` → success response returns data; API/network error returns fallback structure (no throw)
- `getById` → success returns entity; failure throws
- `guardar` → boolean fields normalized to 1/0; specific business error messages propagated
- `eliminar` → success/failure propagation
- `validar*` → returns `false` (never throws) on empty input or network error

## Code Style Guidelines

### File Structure

- **Components**: `src/components/` - Reusable UI components
- **Pages**: `src/pages/` - Page-level components
- **Modules**: `src/modules/` - Business logic modules (orders, returns, purchases)
- **Services**: `src/services/` - API service functions
- **API**: `src/Api/` - PHP backend API files
- **Layout**: `src/components/layout/` - Layout components (Header, Sidebar, Layout)

### Naming Conventions

- **Files**: Use PascalCase for React components (`ComponentName.jsx`), camelCase for utilities/services (`serviceName.js`)
- **Components**: PascalCase for component names (`ProductList`, `DashboardAllSeason`)
- **Variables/Functions**: camelCase (`getProductos`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `MAX_ITEMS`)
- **CSS Classes**: Use Tailwind CSS utility classes, custom classes in `kebab-case`

### Imports Order

1. React imports
2. External library imports
3. Internal component imports
4. Service/utility imports
5. Style imports
6. Type imports (if using TypeScript)

Example:

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import { getProductos } from "./services/productos/productosService";
import "./index.css";
```

### Component Structure

1. Import statements
2. Component function/class
3. State and hooks
4. Event handlers
5. JSX return
6. Export

Example:

```jsx
import React, { useState } from "react";

const ProductList = ({ products }) => {
  const [filter, setFilter] = useState("");

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const filteredProducts = products.filter((p) =>
    p.nombre.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <input
        type="text"
        value={filter}
        onChange={handleFilterChange}
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="Buscar productos..."
      />
      {/* Product list rendering */}
    </div>
  );
};

export default ProductList;
```

### Error Handling

- Use try-catch blocks in async functions
- Provide fallback data when API calls fail
- Show user-friendly error messages
- Log errors to console for debugging

Example from `productosService.js`:

```javascript
try {
  const res = await fetch(`${API_URL}/ApiGetProductos.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filtros),
  });

  if (!res.ok) {
    throw new Error(`Error HTTP: ${res.status}`);
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message || "Error al obtener productos");
  }

  return data;
} catch (err) {
  console.error("Error al obtener productos:", err);

  // Fallback: Return valid empty structure
  return {
    success: false,
    productos: [],
    estadisticas: { total: 0, activos: 0, inactivos: 0 },
    total: 0,
    message: err.message,
  };
}
```

### State Management

- Use React hooks (`useState`, `useEffect`, `useContext`) for state management
- Keep state as local as possible
- Lift state up when multiple components need access
- Consider using Context API for global state if needed

### Styling

- Use Tailwind CSS utility classes primarily
- Custom CSS should be in `src/index.css` or component-specific CSS files
- Follow responsive design patterns with Tailwind breakpoints
- Use consistent spacing (multiples of 4px)

### API Integration

- Service functions are in `src/services/` directory
- **La URL base de API NO está hardcodeada en los servicios.** Se lee de `src/config/api.js`, que a su vez lee `VITE_API_BASE` del `.env`.
- Usar siempre `import { apiUrl } from '../../config/api.js'` en nuevos servicios JS: `const API_URL = apiUrl('nombreModulo');`
- Use POST requests with JSON body for data operations
- Handle loading states and errors in components
- Validate responses before using data

### Comments and Documentation

- Use JSDoc comments for service functions
- Add comments for complex business logic
- Keep comments up-to-date with code changes
- Use Spanish comments (matching existing codebase)

Example JSDoc:

```javascript
/**
 * Obtiene la lista de productos con filtros
 * @param {Object} filtros - Filtros opcionales {busqueda, estado}
 * @returns {Promise<Object>} {productos, estadisticas, total}
 */
```

### Codificación de texto (tildes, ñ y caracteres especiales) — REGLA DE ORO

Todo campo de texto que se muestre o imprima debe manejar correctamente tildes, `ñ` y caracteres especiales:

- **PHP con FPDF:** las fuentes internas de FPDF (Helvetica, Times, Courier) son **Latin-1**, NO UTF-8. Todo texto con tildes/ñ que se pase a `Cell`/`MultiCell` debe convertirse con `utf8_decode((string)$valor)` (el cast evita deprecación con `null`). Nunca imprimir texto UTF-8 crudo en un PDF.
- **Conexión a BD:** siempre `$enlace->set_charset('utf8mb4')` después de conectar (los datos se almacenan en UTF-8).
- **APIs JSON:** responder con `json_encode($payload, JSON_UNESCAPED_UNICODE)` para no escapar tildes/ñ.
- **Frontend (React):** la app y la BD ya usan UTF-8; **no** convertir texto en el frontend (el navegador renderiza UTF-8 nativamente).
- **Verificación:** al tocar un PDF, revisar campos con tildes/ñ (nombres de cliente, aerolínea, agencia, ciudad, dirección, razón social, etc.) y confirmar que se ven correctos. Si un campo muestra caracteres raros, falta el `utf8_decode`.

### ESLint Rules

The project uses ESLint with these key rules:

- `no-unused-vars`: Error (except variables starting with uppercase)
- React Hooks rules enforced
- React Refresh rules for Vite
- JavaScript ES2020+ features allowed

### Git Conventions

- Use descriptive commit messages in Spanish or English
- Follow conventional commits if possible
- Keep commits focused on single changes
- Test changes before committing

## Development Workflow

1. **Start development**: `npm run dev`
2. **Make changes**: Follow code style guidelines
3. **Run tests**: `npm test` — verify all 290 tests still pass
4. **Check linting**: `npm run lint` (fix any issues)
5. **Test manually**: Verify functionality in browser
6. **Build for production**: `npm run build` (verify no errors)
7. **Preview**: `npm run preview` (test production build)

> **Rule:** `npm test` must pass before every `npm run build`. A failing test means something broke.

## Project-Specific Notes

### Global Configuration

- Base path: leído de `VITE_BASE_PATH` en `.env` (fallback: `/DatenBankenApp/AllSeasonFlowers/`)
- URL base de API: leída de `VITE_API_BASE` en `.env` (centralizada en `src/config/api.js`)
- Datos de empresa (nombre, NIT, logo, etc.): centralizados en `src/Api/config/empresa.php`
- jsPDF is made available globally via `window.jspdf`
- Tailwind CSS is configured with default theme

### Module Structure

- **Pedidos**: Order management module
- **Devoluciones**: Returns management module
- **Compras**: Purchases management module
- **Bajas**: Write-offs management module (daño, pérdida, obsequio). Header/detail structure: `SAS_EncabBaja` + `SAS_DetBaja`. Flexible levels: permite registrar solo producto, producto+variedad, o producto+variedad+grado.
- **Inventarios**: Inventory report with 3 levels of aggregation (Producto, Producto+Variedad, Producto+Variedad+Grado). Calculates entries from Compras + Devoluciones Ventas (Colombia only) and exits from Pedidos + Devoluciones Compras + Bajas.
- **Ventas Comisión**: Módulo independiente de pedidos, devoluciones y cuenta de cobro para actividad comercial complementaria. Solo visible mediante permisos. Ver [`docs/VENTAS_COMISION.md`](docs/VENTAS_COMISION.md).
- Each module has its own services and API endpoints

### Ayudantes (Drivers/Assistants Module)

**Campo NoCedula - Múltiples IDs:**
El campo `NoCedula` en la tabla `GEN_Ayudantes` permite registrar múltiples números de identificación separados por "/" o "-" para identificar a conductores, ayudantes u otros asistentes con múltiples documentos válidos.

**Características implementadas (junio 2026):**

- ✅ Acepta formato: números, "/", "-", y espacios (ej: `123456/789012` o `123-456-789`)
- ✅ Máximo 150 caracteres (actualizado de 100 a 150)
- ✅ Se almacena como string en la BD (no se convierte a número)
- ✅ Validación en frontend y backend permite separadores
- ✅ Test validación: `src/test/ayudantes/servicio.test.js` línea 78-89

**Base de datos:**

```sql
-- Verificar que NoCedula sea VARCHAR (no INT)
ALTER TABLE GEN_Ayudantes MODIFY COLUMN NoCedula VARCHAR(150) NULL;
```

**Archivos del módulo:**
| Archivo | Rol |
|---------|-----|
| `src/pages/Ayudantes/AyudantesForm.jsx` | Validación regex `/^[0-9\/\-\s]+$/`, maxLength 150 |
| `src/Api/ayudantes/ApiGuardarAyudante.php` | Línea 43-44: `real_escape_string()` preserva string completo |
| `src/services/ayudantes/ayudantesService.js` | Línea 72-73: Se envía como string (sin parseInt) |

> 📋 **Referencia:** Ver `/memories/repo/ayudantes-cedula-fix.md` para detalles técnicos de la implementación.

### Razones Sociales ("Empresa Emisora") — Pedidos (solo AllSeason)

En el módulo de **Pedidos**, el campo **"Empresa Emisora"** permite elegir entre varias razones sociales. La selección se guarda en `SAS_EncabPedido.IdRazonSocial` (histórico) y los documentos **Factura, Planilla, Etiqueta y Fitosanitario** se generan con el nombre, NIT, dirección, ciudad, país, teléfono, email, logo, registro ICA y representante/inspector de la razón social elegida.

**Multi-cliente (regla de oro):** esta funcionalidad **solo aplica a AllSeason**. Los PHP son compartidos con Flagracol, por eso el código es **esquema-dirigido**: las funciones del helper detectan si la tabla `GEN_RazonesSociales` y la columna `SAS_EncabPedido.IdRazonSocial` existen en la base activa; si no existen (Flagracol), todo cae a las constantes de `empresa.php` (comportamiento original intacto). No se requiere ejecutar nada en Flagracol.

**Base de datos (ejecutar solo en `datenban_AllSeasonFlowers`):** `scripts/SQL_RazonesSociales_AllSeason.sql`
- Crea `GEN_RazonesSociales` (con logo, prefijo de factura, registro ICA y representante/inspector por razón social).
- Inserta All Season Flowers (`PrefijoInvoice='ASF'`, `Pais='Colombia'`, PorDefecto=1) y Fresh Floral LLC (`PrefijoInvoice='FFL'`, `Pais='Estados Unidos'`, con placeholders `<<...>>` en el resto).
- Agrega `IdRazonSocial INT(11) NULL DEFAULT NULL` a `SAS_EncabPedido` (idempotente; NULL = pedido antiguo → All Season).

**Comportamiento de documentos:**
- La **Factura** usa el `PrefijoInvoice` de la razón social (ASF- / FFL-) y el campo **Country** del exportador sale de `Pais` (no hardcodeado).
- Si la razón social no existe o el pedido es antiguo, cae a `EMPRESA_PREFIJO_INVOICE` y `Colombia` (comportamiento original).

**Archivos del módulo:**

| Archivo | Rol |
|---------|-----|
| `scripts/SQL_RazonesSociales_AllSeason.sql` | DDL + seed (solo AllSeason) |
| `src/Api/pedidos/helpers/razon_social.php` | Helper multi-cliente: `razon_social_disponible()`, `razon_social_obtener()`, `razon_social_de_pedido()`, `razon_social_logo_absoluto()` |
| `src/Api/pedidos/ApiGetRazonesSociales.php` | Endpoint JSON que lista las razones sociales activas ([] si no hay tabla) |
| `src/Api/pedidos/ApiGetDatosSelect.php` | Incluye `razonesSociales` en los selects (guard por tabla) |
| `src/Api/pedidos/ApiGuardarPedidoCompleto.php` | Persiste `IdRazonSocial` con UPDATE adicional condicional (no altera SQL original) |
| `src/Api/pedidos/ApiGetPedidoEspecifico.php` | Devuelve `IdRazonSocial` del pedido (columna condicional) |
| `src/Api/pedidos/ApiGenerarPDFFactura.php`, `ApiGenerarPDFPlanilla.php`, `ApiGenerarPDFEtiqueta.php`, `ApiGenerarPDFFitosanitario.php` | Usan la razón social del pedido (datos + logo) con fallback a `empresa.php` |
| `src/modules/pedidos/PedidoHeader.jsx` | Select "Empresa Emisora" |
| `src/modules/pedidos/Pedidos.jsx` | Estado `idRazonSocial`, mapeo, default, guardado y carga |
| `src/services/pedidos/pedidosService.js` | `getRazonesSociales()`, `razonSocialPorDefecto()` |

> 📖 **Referencia completa:** [`docs/PERMISOS.md`](docs/PERMISOS.md) — contiene especificación de la tabla, ejemplos de INSERT, flujo de autenticación detallado y comportamiento ante errores.

### Sistema de Permisos

El proyecto implementa un sistema de control de acceso por menú (sin login propio). La autenticación la realiza un **portal externo** que establece `$_SESSION['idUsuario']` en el servidor antes de que el usuario llegue a la SPA.

**Tabla en base de datos:**

```sql
CREATE TABLE Permisos (
    IdPermiso    INT(11)      NOT NULL AUTO_INCREMENT,
    IdUsuario    INT(11)      NOT NULL,
    NombreOpcion VARCHAR(100) NOT NULL,
    Ruta         VARCHAR(255) NOT NULL,
    PRIMARY KEY (IdPermiso)
);
```

**Archivos del módulo:**

| Archivo                                    | Rol                                                                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/Api/permisos/ApiGetPermisos.php`      | Endpoint PHP. Lee `$_SESSION['idUsuario']`, consulta `Permisos`, devuelve rutas permitidas. Si no hay sesión retorna 401.         |
| `src/services/permisos/permisosService.js` | Función `getPermisos()` → fetch POST con `credentials: 'include'`. Devuelve `string[]` de rutas (ej: `['/clientes','/pedidos']`). |
| `src/test/permisos/servicio.test.js`       | 6 tests: éxito, error HTTP, error red, success=false, permisos no-array, verifica POST+credentials.                               |

**Flujo de funcionamiento:**

1. Portal externo autentica al usuario y establece `$_SESSION['idUsuario']`
2. `App.jsx` monta → llama `getPermisos()` → POST a `ApiGetPermisos.php` con `credentials: 'include'`
3. PHP lee `session_start()`, verifica `$_SESSION['idUsuario']`, consulta `Permisos WHERE IdUsuario = ?`
4. Frontend recibe las rutas permitidas → `App.jsx` las pasa como props `rutasPermitidas` al `Sidebar`
5. **Sidebar**: filtra `menuItems` con `useMemo`. Solo muestra ítems cuya ruta `/${item.id}` esté en `rutasPermitidas`. Los headers (`type: 'header'`) siempre se muestran. Mientras carga permisos, muestra spinner.
6. **App.jsx**: protege rutas en el `switch`. Si el módulo actual no tiene permiso y no es `dashboard`, redirige a Dashboard. Mientras carga permisos, muestra spinner en el área de contenido.
7. Si el API falla o el usuario no tiene permisos → menú vacío (fail-closed). Dashboard siempre accesible.

**Convención de rutas en la tabla Permisos:**

La columna `Ruta` debe coincidir con `/${item.id}` del menú. Ejemplos:

```sql
INSERT INTO Permisos (IdUsuario, NombreOpcion, Ruta) VALUES
(1, 'Clientes',   '/clientes'),
(1, 'Pedidos',    '/pedidos'),
(1, 'Proveedores','/proveedores');
```

Los `item.id` disponibles en el Sidebar son: `dashboard`, `clientes`, `proveedores`, `ejecutivos-venta`, `ejecutivos-compra`, `productos`, `variedades`, `grados`, `tipos-empaque`, `conductores`, `ayudantes`, `aerolineas`, `agencias`, `compras`, `pedidos`, `devolucion-venta`, `devolucion-compra`, `pago-cliente`, `pago-proveedor`, `bajas`, `estado-cuenta-proveedores`, `estado-cuenta-clientes`, `consolidados-ventas`, `consolidados-compras`, `consolidados-devoluciones-clientes`, `consolidados-devoluciones-proveedores`, `consolidados-ingresos-recibidos`, `exportacion-contable`, `tablero-control`, `inventario`.

### Backend Integration

- PHP backend API endpoints are in `src/Api/` directory
- Each entity has its own API directory (productos, pedidos, etc.)
- API responses follow `{success: boolean, message: string, data: any}` pattern

### Validación de sentencias SQL con MCP

> **Regla obligatoria:** Toda sentencia SQL nueva o modificada debe probarse contra la base de datos real usando el servidor MCP antes de integrarla en el PHP.

El proyecto tiene un servidor MCP configurado en `.vscode/mcp.json` que conecta directamente a `datenban_AllSeasonFlowers`. Las herramientas disponibles son:

- `mcp_mysql-all-sea_query_db` — ejecutar cualquier SELECT para verificar resultados y que los campos existan
- `mcp_mysql-all-sea_describe_table` — obtener el esquema exacto de una tabla (nombres de columnas, tipos)

**Por qué es necesario:**  
Los errores más comunes en los PHP del proyecto han sido columnas inexistentes o con nombre incorrecto (`IdPagoProveedor` en lugar de `IdEncabPagoProveedor`, `FechaCompra` en lugar de `FechaEntrega`, etc.). Estos errores causan HTTP 500 silenciosos que son difíciles de depurar.

**Flujo recomendado al escribir un PHP con SQL:**

1. Usar `mcp_mysql-all-sea_describe_table` para confirmar los nombres exactos de columnas de cada tabla involucrada
2. Escribir el SELECT/INSERT/UPDATE
3. Ejecutarlo con `mcp_mysql-all-sea_query_db` usando datos reales de prueba
4. Verificar que los resultados sean los esperados
5. Recién entonces escribir el PHP con `prepare()` / `bind_param()` / `bind_result()`
6. Asegurarse de que el número de variables en `bind_result()` coincida exactamente con el número de columnas del SELECT

## When Adding New Features

1. **Check existing patterns**: Look at similar features in the codebase
2. **Follow naming conventions**: Use consistent naming with existing code
3. **Add service functions**: Create service files in appropriate directory
4. **Add API endpoints**: If needed, add PHP API files in `src/Api/`
   - **Validar SQL con MCP antes de escribir el PHP** (ver sección _Validación de sentencias SQL con MCP_)
5. **Write tests**: Create `src/test/<module>/servicio.test.js` following existing patterns
   - Test the happy path (success response)
   - Test fallback behavior (network error / API error)
   - Test data normalization (boolean → 1/0, string → int, etc.)
   - Test specific business error messages
6. **Run tests**: `npm test` — all tests must pass before proceeding
7. **Test manually**: Verify functionality in browser
8. **Update this guide**: Add the new module to the test table in the Testing section

## When Modifying Existing Functionality

1. Make the code change
2. Run `npm test` immediately — if any test fails, the change broke something
3. If the behavior intentionally changed (e.g. new error message), update the corresponding test file
4. Do not ship if tests are failing

## Arquitectura multi-cliente

El proyecto está preparado para distribuirse a múltiples floristas.  
**Un solo codebase, builds separados por cliente.**

### Documentación de referencia (léame primero)

| Documento                                   | Propósito                                                                                                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📋 **`scripts/PLANTILLA_NUEVO_CLIENTE.md`** | **→ EMPEZAR AQUÍ ←** Formulario para recolectar datos + paso a paso para crear o modificar un cliente. Incluye tabla con datos de los clientes existentes. |
| 📖 **`scripts/DEPLOY_MULTICLIENTE.md`**     | Guía detallada de despliegue (soporte técnico, comandos, solución de problemas).                                                                           |
| 📄 **`AGENTS.md`**                          | (este archivo) Biblia del proyecto con toda la arquitectura.                                                                                               |
| 🧩 **`docs/PARTICULARIDADES_POR_CLIENTE.md`** | Registro central de funcionalidades y ajustes específicos por cliente. **Obligatorio:** toda implementación que aplique a un solo cliente debe registrarse aquí (regla de oro). |

**Regla de oro:** Toda funcionalidad específica de un cliente (no compartida) debe quedar documentada en `docs/PARTICULARIDADES_POR_CLIENTE.md`, con su script SQL (si aplica) y referencia a la sección de AGENTS.md. No cerrar una implementación por cliente sin actualizar este registro.

**Regla de oro:** Si va a crear un nuevo cliente o modificar uno existente → abra `scripts/PLANTILLA_NUEVO_CLIENTE.md` y siga las instrucciones.

### Archivos clave de la arquitectura

| Archivo                                      | Rol                                                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src/config/api.js`                          | Lee `VITE_API_BASE` del `.env` para que el frontend sepa a qué servidor PHP llamar                   |
| `src/config/cliente.js`                      | Lee `VITE_EMPRESA_*` del `.env` y exporta objeto `CLIENTE` con nombre, lema, iniciales, logo, título |
| `vite.config.js`                             | Usa `VITE_BASE_PATH` del `.env` como `base` del build                                                |
| `src/main.jsx`                               | Lee `import.meta.env.VITE_BASE_PATH` para el `basename` del Router                                   |
| `src/Api/config/empresa.php`                 | Contiene **todos los datos del cliente** para los PHP: nombre, NIT, logo, rutas BD, FPDF             |
| `.env` / `.env-allseason` / `.env-flagracol` | Variables de entorno por cliente (ver sección "Archivos .env")                                       |
| `.gitignore`                                 | Excluye `.env` y `.env-*` — NUNCA subir credenciales al repo                                         |

### Archivos .env

Cada cliente tiene su propio `.env-*` con TODAS las variables necesarias:

| Variable                    | Descripción                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `VITE_BASE_PATH`            | Ruta base de la SPA en el servidor (ej: `/DatenBankenApp/AllSeasonFlowers/`)         |
| `VITE_API_BASE`             | URL base de las APIs PHP                                                             |
| `VITE_EMPRESA_NOMBRE`       | Nombre legal completo (ej: `ALL SEASON FLOWERS SAS`)                                 |
| `VITE_EMPRESA_NOMBRE_CORTO` | Nombre corto (ej: `ALL SEASON FLOWERS`)                                              |
| `VITE_EMPRESA_NOMBRE_LARGO` | Nombre con sufijo legal (ej: `ALL SEASON FLOWERS S.A.S`)                             |
| `VITE_EMPRESA_TITLE`        | Nombre para mostrar en pestaña, header y sidebar                                     |
| `VITE_EMPRESA_LEMA`         | Eslogan o lema del cliente                                                           |
| `VITE_EMPRESA_INICIALES`    | Iniciales para el sidebar (ej: `AS`)                                                 |
| `VITE_EMPRESA_LOGO`         | Ruta pública del logo (ej: `/DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg`) |

Archivos actuales:

| Archivo          | Contiene                                    |
| ---------------- | ------------------------------------------- |
| `.env`           | Activo (usado por `npm run dev`)            |
| `.env-allseason` | Variables completas para All Season Flowers |
| `.env-flagracol` | Variables completas para FlagracolSAS       |
| `.env.example`   | Plantilla sin datos reales para referencia  |

> **Regla:** Todos los `.env-*` están en `.gitignore`. Cada desarrollador los crea localmente con las credenciales reales.

### Comandos de build por cliente

| Comando                   | Tests              | Destino                              |
| ------------------------- | ------------------ | ------------------------------------ |
| `npm run build:allseason` | ✅ Corre 290 tests | Genera `dist/` para AllSeasonFlowers |
| `npm run build:flagracol` | ✅ Corre 290 tests | Genera `dist/` para FlagracolSAS     |
| `npm run build`           | ✅ Corre 290 tests | Usa el `.env` actual (genérico)      |
| `npm run build:no-test`   | ❌ Solo compila    | Útil para pruebas rápidas            |

> **Siempre correr `npm test` antes de cada build.** Si un test falla, algo se rompió.

### Componentes que ahora son dinámicos por cliente

| Componente/Archivo                                     | Qué muestra ahora dinámico                             |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `index.html`                                           | Título de pestaña (`%VITE_EMPRESA_TITLE%`)             |
| `src/main.jsx`                                         | Basename del Router (`VITE_BASE_PATH`)                 |
| `src/config/api.js`                                    | URL base de APIs (`VITE_API_BASE`)                     |
| `src/config/cliente.js`                                | Objeto `CLIENTE` con todos los datos de la empresa     |
| `Header.jsx`                                           | Logo, nombre, lema, iniciales                          |
| `Sidebar.jsx`                                          | Iniciales, nombre, lema (expandido, colapsado y móvil) |
| `Dashboard.jsx`                                        | Nombre y lema                                          |
| 12 páginas (Clientes, Proveedores, Productos, etc.)    | Descripciones con nombre del cliente                   |
| 6 módulos (Pedidos, Compras, Devoluciones, Pagos)      | Footers con nombre del cliente                         |
| 5 modales (Factura, Fitosanitario, Etiqueta, Planilla) | URLs de API centralizadas                              |

### Textos en PHP (backend) que ahora son dinámicos

| Archivo PHP                                                                                         | Qué usa                                                                             |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `config/AllSeasonFlowers/empresa.php`                                                               | Constantes `EMPRESA_NOMBRE_TITULO`, `EMPRESA_LEMA`, `EMPRESA_INICIALES` (agregadas) |
| `ApiGenerarPDFOrdenCompra.php`                                                                      | `EMPRESA_NOMBRE_CORTO` en términos y condiciones                                    |
| Los 9 PDFs ya usaban `EMPRESA_NOMBRE`, `EMPRESA_NIT`, `EMPRESA_LOGO_PATH`, etc. desde `empresa.php` |

### Clientes activos

| Dato                    | All Season Flowers                    | Flagracol SAS                     |
| ----------------------- | ------------------------------------- | --------------------------------- |
| **Ruta servidor**       | `/DatenBankenApp/AllSeasonFlowers/`   | `/DatenBankenApp/FlagracolSAS/`   |
| **URL API**             | `.../AllSeasonFlowers/Api`            | `.../FlagracolSAS/Api`            |
| **Script build**        | `npm run build:allseason`             | `npm run build:flagracol`         |
| **Archivo .env**        | `.env-allseason`                      | `.env-flagracol`                  |
| **Archivo empresa.php** | `config/AllSeasonFlowers/empresa.php` | `config/FlagracolSAS/empresa.php` |
| **Base de datos**       | `datenban_AllSeasonFlowers`           | `datenban_FlagracolSAS`           |
| **Nombre legal**        | ALL SEASON FLOWERS SAS                | FLAGRACOL SAS                     |
| **Nombre corto**        | ALL SEASON FLOWERS                    | FLAGRACOL                         |
| **Título frontend**     | All Season Flowers                    | Flagracol SAS                     |
| **Lema**                | Flowers & Ornamentals                 | Flores de Colombia                |
| **Iniciales**           | AS                                    | FS                                |
| **Logo**                | `img/LogoAllSeason.jpg`               | `img/LogoFlagracol.jpg`           |
| **NIT**                 | 901.984.016-8                         | 901.104.002-0                     |
| **Dirección**           | Finca Villa Clemencia Vrd. Prado      | CALLE 163 N 50-80 INT 10 OF 233   |
| **Teléfono**            | (+057) 3114677282 - 3023090940        | (+057) 316 507 95 27              |
| **Email**               | freshfloral.erikajuley@gmail.com      | logística@flagracol.com.co        |

### Pendiente (fuera del alcance)

- [ ] Migrar credenciales de `conexionbd.php` a variables de entorno PHP.
- [ ] Tests automatizados para los PHP de PDFs.

## Troubleshooting

### Common Issues

- **CORS errors**: Check API endpoint URLs and server configuration
- **Build errors**: Run `npm run lint` to check for ESLint issues
- **Routing issues**: Verify base path configuration matches deployment
- **API connection**: Check network tab in dev tools for failed requests

### Performance Considerations

- Use React.memo for expensive component re-renders
- Implement pagination for large data sets
- Optimize images and assets
- Use code splitting if the bundle grows large
