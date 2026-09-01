# Diagnostico del backend PHP

Fecha de revision: 2026-08-24

## Alcance

Se reviso la estructura de `src/Api/` y una muestra de endpoints CRUD, reportes, pagos, devoluciones, Ventas Comision y generacion de PDFs. La primera fase crea la skill para PHP nuevo; no modifica endpoints existentes.

## Patrones consolidados

- La configuracion multi-cliente se centraliza en `src/Api/config/AllSeasonFlowers/empresa.php` y `src/Api/config/FlagracolSAS/empresa.php`.
- Los endpoints cargan `empresa.php` y `CONEXION_BD_PATH` mediante `require_once`.
- El contrato habitual es `POST` con JSON y respuesta `success`/`message`.
- Los reportes recientes usan `prepare`, `bind_param`, `bind_result` y conversion de tipos al construir la respuesta.
- Los procesos encabezado-detalle usan transacciones en varios endpoints del modulo Ventas Comision.
- Los PDFs usan FPDF y requieren salida binaria limpia.

## Divergencias y riesgos

### 1. SQL concatenado o interpolado

Hay endpoints que usan `real_escape_string` o interpolan IDs, fechas y filtros directamente en SQL. Ejemplos representativos:

- `src/Api/productos/ApiGuardarProducto.php`
- `src/Api/proveedores/ApiGuardarProveedor.php`
- `src/Api/ventasComision/pedidos/ApiGetPedidos.php`
- `src/Api/ventasComision/pedidos/ApiGetPedidoEspecifico.php`
- `src/Api/ventasComision/devoluciones/ApiGuardarDevolucion.php`
- `src/Api/ventasComision/cuentaCobro/ApiGetPedidosParaCobro.php`
- `src/Api/ventasComision/cuentaCobro/ApiMarcarPedidosFacturados.php`

Riesgo: mantenimiento dificil, filtros inconsistentes y mayor superficie para errores de consulta. La skill exige prepared statements en codigo nuevo y migracion gradual en existentes.

### 2. Contrato HTTP y JSON inconsistente

Se observan respuestas `die`, `echo` y `exit` con diferentes claves, mensajes, codigos HTTP y presencia de `success`. Algunos endpoints devuelven solo `error` y otros una estructura completa.

Riesgo: los servicios React pueden depender de un formato concreto. La skill exige conservar el contrato al migrar y comparar servicios/tests antes de cambiarlo.

### 3. CORS y sesiones

Muchos endpoints declaran `Access-Control-Allow-Origin: *`, algunos aceptan `OPTIONS` y otros no. `src/Api/permisos/ApiGetPermisos.php` depende de sesion externa y usa `credentials` desde React.

Riesgo: cambiar CORS sin revisar cookies de sesion puede romper autenticacion o despliegues. No se debe modificar automaticamente; requiere una decision de infraestructura.

### 4. Errores expuestos en produccion

Se encontro `error_reporting(E_ALL)` junto con `ini_set('display_errors', 1)` en endpoints de dashboard, pedidos y varios PDFs.

Riesgo: warnings o trazas pueden contaminar JSON y hacer invalido un PDF, ademas de revelar detalles internos. La skill prohibe `display_errors` en produccion y exige `error_log`.

### 5. Transacciones incompletamente comprobadas

`ApiGuardarPedidoCompleto.php` usa transaccion, pero varias operaciones `query` y `execute` no comprueban el resultado antes de continuar. El patron debe garantizar rollback si falla cualquier escritura.

Riesgo: encabezados sin detalle, detalles parciales o confirmaciones falsas.

### 6. PDFs con implementaciones diferentes

Los PDFs de pedidos y pagos usan variantes de rutas de logo, headers, manejo de errores y configuracion FPDF. Algunos cargan datos de empresa desde SQL y otros desde constantes. Hay archivos `.bak` y endpoints de prueba/debug en el backend.

Riesgo: salida corrupta, datos de cliente equivocados o diferencias entre clientes multi-cliente. Los nuevos PDFs deben usar constantes de `empresa.php` y emitir el PDF solo al final.

### 7. Validacion de esquema SQL

Los errores historicos documentados incluyen nombres de columnas o tablas incorrectos, por ejemplo `IdPagoProveedor` frente a `IdEncabPagoProveedor`, `FechaCompra` frente a `FechaEntrega` y `SAS_DetCompra` frente a `SAS_DetProductoCompra`.

Regla: toda sentencia SQL nueva o modificada debe pasar por `describe_table` y `query_db` del MCP antes de integrarse.

## Prioridad de normalizacion futura

1. Operaciones de escritura con SQL concatenado y transacciones.
2. Filtros externos concatenados en listados y reportes.
3. Codigos HTTP, respuestas JSON y manejo de JSON invalido.
4. `display_errors` y respuestas contaminadas por warnings.
5. Configuracion y salida de PDFs.
6. CORS y politicas de sesion, coordinadas con despliegue.

## Procedimiento por endpoint

- Identificar el servicio React y sus tests.
- Capturar contrato actual: payload, tipos, mensajes, status y ordenamiento.
- Describir tablas y validar SQL con MCP.
- Aplicar una sola categoria de cambio.
- Ejecutar `php -l`, tests del servicio y prueba manual.
- Comparar respuesta o PDF antes de pasar al siguiente endpoint.
- Documentar excepciones heredadas que se mantienen por compatibilidad.

## Fuera de alcance de esta fase

- No se modificaron PHP existentes.
- No se cambiaron tablas ni credenciales.
- No se cambio la politica CORS.
- No se alteraron contratos de los servicios React.
- No se hizo una reescritura masiva.

La skill aplicable a PHP nuevo esta en `.github/skills/php-backend-estandarizacion/`.
