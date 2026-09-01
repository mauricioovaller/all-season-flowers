---
name: php-backend-estandarizacion
description: "Crear y revisar archivos PHP del backend de All Season Flowers: APIs JSON, endpoints CRUD, reportes SQL, transacciones y PDFs con FPDF. Usar al crear PHP nuevo, modificar SQL PHP, normalizar endpoints existentes o integrar un modulo multi-cliente. Exige mysqli preparado, contratos HTTP consistentes, empresa.php, validacion SQL con MCP y pruebas sin romper endpoints existentes."
argument-hint: "Describe el modulo, endpoint, tablas, entrada, salida y si genera JSON o PDF"
user-invocable: true
disable-model-invocation: false
---

# PHP Backend del Proyecto

## Objetivo

Crear PHP nuevo con el patron del proyecto y preparar migraciones graduales de endpoints existentes. Esta skill no autoriza reescrituras masivas: cada cambio debe preservar el contrato consumido por React o documentar una migracion compatible.

## Cuando usarla

- Crear un endpoint PHP nuevo en `src/Api/`.
- Crear o modificar un CRUD, reporte, consulta o proceso de guardado.
- Crear un PDF con FPDF.
- Agregar una transaccion de encabezado y detalle.
- Normalizar un PHP existente sin cambiar su comportamiento accidentalmente.
- Trabajar con las bases multi-cliente o con SQL que use tablas del proyecto.

## Flujo obligatorio

1. Identificar el modulo, el servicio React consumidor y el endpoint vecino mas parecido.
2. Clasificar el endpoint como JSON, PDF o transaccional. Si combina categorias, separar sus fases.
3. Confirmar tablas y columnas con `mcp_mysql-all-sea_describe_table`.
4. Escribir y probar cada SELECT, INSERT, UPDATE o DELETE con `mcp_mysql-all-sea_query_db` antes de integrarlo.
5. Usar `empresa.php` y `CONEXION_BD_PATH`; nunca incrustar credenciales, base de datos o identidad de una empresa.
6. Implementar validacion de metodo, JSON, campos obligatorios, errores HTTP y respuesta estable.
7. Usar prepared statements para valores. Solo interpolar listas numericas previamente convertidas a enteros y validadas.
8. Comprobar `prepare`, `bind_param`, `execute`, `query`, `commit` y `rollback`; cerrar statements y conexion cuando corresponda.
9. Validar con `php -l`, pruebas del servicio React y la prueba manual del endpoint. Para PDF, confirmar que la respuesta no contiene warnings antes de la salida binaria.
10. Si se modifica un endpoint existente, comparar payload, mensajes y codigos HTTP antes y despues. Registrar excepciones heredadas en vez de ocultarlas.

## Recursos

- [Convenciones de endpoints](./references/convenciones-endpoints.md)
- [SQL, mysqli y MCP](./references/sql-mysqli-mcp.md)
- [PDF con FPDF](./references/pdf-fpdf.md)
- [Migracion gradual](./references/migracion-existentes.md)
- [Plantilla JSON](./assets/endpoint-json.php)
- [Plantilla transaccional](./assets/endpoint-transaccional.php)
- [Plantilla PDF](./assets/endpoint-pdf.php)

## Restricciones

- No activar `display_errors` en produccion.
- No usar `SELECT *` en endpoints nuevos salvo una justificacion clara.
- No usar SQL concatenado para texto, fechas o numeros recibidos del cliente.
- No cambiar nombres de claves JSON ni codigos HTTP de un endpoint existente sin revisar sus servicios y tests.
- No ejecutar SQL nuevo contra una tabla no descrita previamente por MCP.
- No imprimir texto, espacios o warnings antes de un PDF.
- No crear una segunda configuracion de empresa o conexion para un modulo.
