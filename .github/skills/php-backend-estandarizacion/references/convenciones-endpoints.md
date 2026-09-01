# Convenciones de endpoints

## Inicio comun para JSON

Los endpoints JSON nuevos deben:

1. Enviar `Content-Type: application/json; charset=UTF-8`.
2. Aceptar `POST`; aceptar `OPTIONS` solo si el cliente y el servidor lo requieren.
3. Responder `405` para otros metodos.
4. Leer `php://input` una sola vez y validar `json_last_error()`.
5. Responder siempre un objeto con `success` y, cuando aplique, `message`.
6. Usar `400` para entrada invalida, `404` para entidad ausente, `409` para conflicto de negocio y `500` para error interno.
7. Registrar el detalle tecnico en `error_log`; no exponer credenciales ni trazas al cliente.

El CORS debe seguir la configuracion de despliegue existente. No ampliar ni restringir origenes en una migracion sin revisar el frontend, las sesiones y el servidor Apache.

## Carga de configuracion

Despues de validar el metodo y antes de acceder a la base:

```php
require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;
$enlace->set_charset('utf8mb4');
```

Ajustar la ruta relativa segun la profundidad real del modulo. Usar `empresa.php` para identidad, rutas y recursos multi-cliente.

## Lectura y validacion

- Convertir IDs con `intval` y rechazar valores menores o iguales a cero.
- Validar fechas como fechas y comprobar que inicio no sea posterior a fin.
- Distinguir campo ausente de valor opcional vacio.
- Validar enums contra una lista permitida.
- Aplicar limites de paginacion antes de usarlos en `LIMIT` y `OFFSET`.
- Normalizar booleanos a `1/0` al guardar y a `true/false` solo si ese es el contrato existente de salida.

## Respuesta y cierre

Cerrar cada statement despues de consumir sus resultados. Cerrar la conexion al final cuando el endpoint no genera una salida que lo impida. En `catch`, establecer el codigo HTTP antes de responder y devolver la estructura de fallback que espera el servicio React.

Antes de migrar un endpoint, conservar las claves existentes y revisar `src/services/` y `src/test/`. La estandarizacion mejora la implementacion interna, no cambia silenciosamente el contrato publico.
