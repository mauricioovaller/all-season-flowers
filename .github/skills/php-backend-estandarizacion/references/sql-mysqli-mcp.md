# SQL, mysqli y MCP

## Regla obligatoria

Toda sentencia SQL nueva o modificada se valida contra la base real antes de integrarla en PHP:

1. Ejecutar `mcp_mysql-all-sea_describe_table` para cada tabla involucrada.
2. Confirmar nombres, tipos, nulabilidad, claves y columnas de anulacion.
3. Probar el SELECT o una operacion segura con `mcp_mysql-all-sea_query_db` y datos representativos.
4. Integrar el SQL usando `prepare`, `bind_param` y comprobacion de errores.
5. Si se usa `bind_result`, contar columnas del SELECT y variables en el mismo orden.

No usar credenciales del MCP en PHP ni copiar valores de `.env` al endpoint.

## Consultas

Usar placeholders para valores:

```php
$stmt = $enlace->prepare($sql);
if (!$stmt) {
    throw new Exception('Error preparando consulta: ' . $enlace->error);
}
$stmt->bind_param('i', $id);
if (!$stmt->execute()) {
    throw new Exception('Error ejecutando consulta: ' . $stmt->error);
}
```

Para filtros dinamicos, construir solo fragmentos de columnas y operadores constantes. Los valores siempre van en `$params` y `$types`. Una lista para `IN` solo puede componerse despues de convertir y validar todos sus elementos como enteros.

Preferir columnas explicitas y filtros de negocio (`Anulado = 0`) cuando el modulo lo requiera. Evitar `real_escape_string` como sustituto de prepared statements en codigo nuevo.

## Transacciones

Usar transaccion cuando una operacion modifica encabezado y detalle:

- Comenzar antes de la primera escritura.
- Comprobar cada `prepare` y `execute`.
- Usar IDs generados por `insert_id`, nunca valores enviados por el cliente.
- Hacer `commit` solo cuando todas las operaciones terminan.
- Hacer `rollback` en toda excepcion.
- No ocultar el error original al construir la respuesta.

Los endpoints existentes pueden usar actualizacion logica; conservar ese comportamiento durante una migracion y registrar cualquier cambio de semantica.

## Seguridad y diagnostico

Nunca interpolar texto, fechas, floats o IDs sin parametrizar. No devolver `$enlace->error` en produccion si revela estructura sensible; usar un mensaje funcional y `error_log` con el detalle. Probar tambien entidad inexistente, lista vacia, duplicados, rollback y error de SQL.
