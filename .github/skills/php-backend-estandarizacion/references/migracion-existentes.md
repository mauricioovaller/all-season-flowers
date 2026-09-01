# Migracion de PHP existentes

La normalizacion de endpoints existentes debe ser gradual. La prioridad es no romper servicios React, sesiones, PDFs ni procesos contables.

## Orden recomendado

1. Inventariar endpoint, servicio consumidor, tests, tablas y contrato actual.
2. Capturar una respuesta valida y los codigos HTTP de casos exitosos y fallidos.
3. Validar el SQL actual con `describe_table` y `query_db`; corregir primero errores comprobados.
4. Extraer o reemplazar una sola responsabilidad: errores HTTP, prepared statement, transaccion o configuracion.
5. Ejecutar tests del servicio, `php -l` y prueba manual del endpoint.
6. Comparar payload, totales, ordenamiento, mensajes y PDF con la version anterior.
7. Documentar excepciones que se mantienen por compatibilidad.

## Prioridad tecnica

- Primero: SQL interpolado en operaciones de escritura y filtros externos.
- Segundo: errores sin codigo HTTP, respuestas vacias y `display_errors` activo.
- Tercero: transacciones sin rollback completo o sin comprobar operaciones.
- Cuarto: contratos CORS, sesiones y respuestas JSON inconsistentes.
- Quinto: duplicacion de configuracion y rutas de logos en PDFs.

## Regla de compatibilidad

No renombrar claves, eliminar campos, cambiar tipos ni alterar mensajes consumidos sin actualizar el servicio y sus tests en la misma tarea. Un cambio de implementacion debe producir el mismo resultado observable, salvo que exista una correccion de bug aprobada y probada.

No combinar la migracion con cambios de esquema, nuevas funcionalidades o refactorizaciones visuales de PDF. Cada modulo debe poder revertirse de forma independiente.
