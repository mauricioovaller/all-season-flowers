# Particularidades por Cliente

Registro central de las **funcionalidades y ajustes específicos por cliente** del proyecto multi-cliente (un solo codebase, builds separados).

> **Regla de oro:** Toda implementación que aplique a un solo cliente debe quedar registrada aquí, con su script SQL (si aplica) y la referencia a la sección de `AGENTS.md`. No cerrar una implementación por cliente sin actualizar este registro.

## Cómo se registra una particularidad

1. Añadir una fila en la tabla del cliente correspondiente con: **funcionalidad**, **descripción breve**, **script SQL** (si requiere DDL/DML) y **referencia** (sección de AGENTS.md o documento).
2. Si el código PHP es compartido con otros clientes, usar el patrón **esquema-dirigido** (ver `src/Api/pedidos/helpers/razon_social.php`): detectar en runtime si la tabla/columna existe y, si no, caer al comportamiento genérico de `empresa.php`. Así un ajuste de un cliente nunca rompe a los demás.
3. Aplicar las reglas de oro: validar SQL contra la BD real (MCP), `php -l`, tests y build antes de cerrar.

---

## All Season Flowers (datenban_AllSeasonFlowers)

| Funcionalidad | Descripción | Script SQL | Referencia |
| --- | --- | --- | --- |
| **Razones Sociales ("Empresa Emisora")** en Pedidos | Selector de razón social en el encabezado del pedido; se guarda en `SAS_EncabPedido.IdRazonSocial`. Factura, Planilla, Etiqueta y Fitosanitario usan los datos, logo, prefijo de factura (ASF-/FFL-) y país del exportador de la razón social elegida. **En clientes sin la tabla (Flagracol) el campo se oculta por completo del formulario** (el API devuelve lista vacía y el frontend no lo renderiza; la validación de obligatoriedad también queda desactivada). | `scripts/SQL_RazonesSociales_AllSeason.sql` (solo AllSeason) | AGENTS.md → "Razones Sociales (Empresa Emisora) — Pedidos (solo AllSeason)" |
| **Consolidado de Ingresos Recibidos** | Reporte en Informes con el neto recibido de pagos de clientes (valor pagado − costo de transferencia prorrateado), por factura y totales por moneda (USD/COP). Implementado como funcionalidad compartida (las tablas de pagos existen en todas las bases). | — | AGENTS.md → sección de tests (reportes) y `src/pages/Reportes/ConsolidadoIngresosRecibidos.jsx` |
| **Costo de Transferencia en Recibo de Pago** | El PDF de pago de cliente resta el costo de transferencia del total (TOTAL RECIBIDO). Implementado como funcionalidad compartida. | — | `src/Api/pagosClientes/ApiGenerarPDFPagoCliente.php` |
| **Ayudantes: NoCedula múltiple** | El campo `NoCedula` acepta múltiples identificadores separados por `/` o `-` (formato texto, no numérico). Compartido. | ALTER `GEN_Ayudantes.NoCedula` a VARCHAR(150) (aplicado) | AGENTS.md → "Ayudantes (Drivers/Assistants Module)" |

## Flagracol SAS (datenban_FlagracolSAS)

Sin particularidades registradas hasta la fecha. **Completar esta sección** cuando se implementen ajustes específicos para Flagracol (recordar el patrón esquema-dirigido para no afectar a AllSeason).

> ⚠️ Las funcionalidades marcadas como "solo AllSeason" (p. ej. Razones Sociales) **no deben ejecutarse ni configurarse en Flagracol**: los PHP compartidos detectan la ausencia de `GEN_RazonesSociales` / `IdRazonSocial` y usan automáticamente las constantes de `empresa.php` de Flagracol. En el frontend, el campo **"Empresa Emisora" no aparece** en el formulario de pedidos de Flagracol (se oculta en runtime cuando el API devuelve lista vacía).
