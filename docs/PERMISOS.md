# Sistema de Permisos — All Season Flowers

## Descripción general

Sistema de control de acceso basado en menú. Un portal externo autentica al usuario y establece `$_SESSION['idUsuario']`. La SPA consulta una tabla `Permisos` para determinar qué opciones del menú puede ver y a qué rutas tiene acceso.

**Principios:**

- **Fail-closed**: si el API de permisos falla o el usuario no tiene registros, no ve ningún ítem.
- **Dashboard siempre accesible**: el módulo `dashboard` no requiere permiso.
- **Sin login propio**: la autenticación la maneja un portal externo.

---

## Tabla en base de datos

```sql
CREATE TABLE Permisos (
    IdPermiso    INT(11)      NOT NULL AUTO_INCREMENT,
    IdUsuario    INT(11)      NOT NULL,
    NombreOpcion VARCHAR(100) NOT NULL,
    Ruta         VARCHAR(255) NOT NULL,
    PRIMARY KEY (IdPermiso)
);
```

### Columnas

| Columna | Tipo | Descripción |
|---|---|---|
| `IdPermiso` | INT(11) PK | Auto-incremental |
| `IdUsuario` | INT(11) | ID del usuario (lo asigna el portal externo) |
| `NombreOpcion` | VARCHAR(100) | Nombre descriptivo de la opción (solo para referencia) |
| `Ruta` | VARCHAR(255) | Ruta del menú, ej: `/clientes`, `/pedidos` |

---

## Archivos del módulo

| Archivo | Propósito |
|---|---|
| `src/Api/permisos/ApiGetPermisos.php` | Endpoint PHP. Lee sesión, consulta BD, devuelve rutas. |
| `src/services/permisos/permisosService.js` | Función `getPermisos()` para el frontend. |
| `src/test/permisos/servicio.test.js` | 6 tests unitarios del servicio. |

---

## Convención de rutas

La columna `Ruta` en la tabla `Permisos` debe coincidir con `/${item.id}` del menú lateral.

### `item.id` disponibles en el Sidebar

| Categoría | `item.id` | Ruta esperada |
|---|---|---|
| Dashboard | `dashboard` | *(acceso libre)* |
| Tablas Maestras | `clientes` | `/clientes` |
| | `proveedores` | `/proveedores` |
| | `ejecutivos-venta` | `/ejecutivos-venta` |
| | `ejecutivos-compra` | `/ejecutivos-compra` |
| | `productos` | `/productos` |
| | `variedades` | `/variedades` |
| | `grados` | `/grados` |
| | `tipos-empaque` | `/tipos-empaque` |
| | `conductores` | `/conductores` |
| | `ayudantes` | `/ayudantes` |
| | `aerolineas` | `/aerolineas` |
| | `agencias` | `/agencias` |
| Módulos Operativos | `compras` | `/compras` |
| | `pedidos` | `/pedidos` |
| | `devolucion-venta` | `/devolucion-venta` |
| | `devolucion-compra` | `/devolucion-compra` |
| | `pago-cliente` | `/pago-cliente` |
| | `pago-proveedor` | `/pago-proveedor` |
| | `bajas` | `/bajas` |
| Informes | `estado-cuenta-proveedores` | `/estado-cuenta-proveedores` |
| | `estado-cuenta-clientes` | `/estado-cuenta-clientes` |
| | `consolidados-ventas` | `/consolidados-ventas` |
| | `consolidados-compras` | `/consolidados-compras` |
| | `consolidados-ingresos-recibidos` | `/consolidados-ingresos-recibidos` |
| | `exportacion-contable` | `/exportacion-contable` |
| | `tablero-control` | `/tablero-control` |
| | `inventario` | `/inventario` |

---

## Ejemplos de inserción

```sql
-- Usuario 1: Acceso completo
INSERT INTO Permisos (IdUsuario, NombreOpcion, Ruta) VALUES
(1, 'Clientes',           '/clientes'),
(1, 'Proveedores',        '/proveedores'),
(1, 'Productos',          '/productos'),
(1, 'Variedades',         '/variedades'),
(1, 'Grados',             '/grados'),
(1, 'Conductores',        '/conductores'),
(1, 'Ayudantes',          '/ayudantes'),
(1, 'Pedidos',            '/pedidos'),
(1, 'Compras',            '/compras'),
(1, 'Devolucion Ventas',  '/devolucion-venta'),
(1, 'Devolucion Compras', '/devolucion-compra'),
(1, 'Pago Clientes',      '/pago-cliente'),
(1, 'Pago Proveedores',   '/pago-proveedor'),
(1, 'Bajas',              '/bajas'),
(1, 'Cta. Proveedores',   '/estado-cuenta-proveedores'),
(1, 'Cta. Clientes',      '/estado-cuenta-clientes'),
(1, 'Cons. Ingresos Recibidos', '/consolidados-ingresos-recibidos'),
(1, 'Tablero Control',    '/tablero-control'),
(1, 'Inventarios',        '/inventario');

-- Usuario 2: Solo pedidos y clientes
INSERT INTO Permisos (IdUsuario, NombreOpcion, Ruta) VALUES
(2, 'Clientes', '/clientes'),
(2, 'Pedidos',  '/pedidos');
```

---

## Flujo de autenticación

```
1. Portal externo autentica al usuario
   └─ Establece $_SESSION['idUsuario'] en el servidor PHP
   └─ Redirige al navegador a la SPA

2. SPA carga (App.jsx)
   ├─ useEffect llama a getPermisos()
   ├─ fetch POST a ApiGetPermisos.php (credentials: 'include')
   │
3. PHP (ApiGetPermisos.php)
   ├─ session_start() → lee $_SESSION['idUsuario']
   ├─ Si no hay sesión → HTTP 401 (frontend retorna [])
   ├─ Consulta: SELECT Ruta FROM Permisos WHERE IdUsuario = ?
   └─ Devuelve: { success: true, permisos: [{ ruta: "/clientes", ... }] }

4. Frontend recibe rutas
   ├─ App.jsx pasa rutasPermitidas + cargandoPermisos al Sidebar
   ├─ Sidebar filtra menuItems con useMemo
   │   └─ Solo muestra items cuya ruta `/${item.id}` esté en rutasPermitidas
   │   └─ Headers siempre visibles si hay items en su sección
   ├─ App.jsx protege el switch de módulos
   │   └─ Si currentModule no tiene permiso → redirige a Dashboard
   └─ Mientras carga: spinner en sidebar y área de contenido

5. Logout
   └─ Limpia localStorage / sessionStorage
   └─ Redirige al portal externo
```

---

## Comportamiento ante errores

| Escenario | Sidebar | Contenido |
|---|---|---|
| Permisos cargando | Spinner "Cargando..." | Spinner "Cargando permisos..." |
| API retorna 401 (sin sesión) | Sin acceso | Dashboard |
| API retorna `success: false` | Sin acceso | Dashboard |
| Error de red | Sin acceso | Dashboard |
| Usuario sin registros en Permisos | Sin acceso | Dashboard |
| Usuario con permisos parciales | Solo items permitidos | Módulos permitidos |

---

## Tests

Archivo: `src/test/permisos/servicio.test.js` — 6 tests:

1. `retorna rutas en respuesta exitosa` — verifica que extrae `ruta` de cada permiso
2. `retorna arreglo vacío cuando success es false` — fallback
3. `retorna arreglo vacío ante error HTTP` — 500 no revienta
4. `retorna arreglo vacío ante error de red` — fetch falla pero no lanza
5. `retorna arreglo vacío cuando permisos no es un arreglo` — tipo incorrecto
6. `envía POST con credentials include` — verifica método y credenciales

Ejecutar:

```bash
npx vitest run src/test/permisos/servicio.test.js
```
