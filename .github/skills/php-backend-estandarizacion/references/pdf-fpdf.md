# Endpoints PDF con FPDF

## Separacion de responsabilidades

Un endpoint PDF puede consultar y preparar datos, pero su salida final es binaria. No debe emitir JSON, warnings, HTML, espacios fuera de `<?php`, ni mensajes de depuracion antes de `$pdf->Output()`.

Flujo:

1. Validar metodo y entrada.
2. Cargar `empresa.php`, conexion y `FPDF_PATH`.
3. Consultar datos con prepared statements y validar ausencia de registros.
4. Verificar logo con las constantes de configuracion multi-cliente.
5. Crear el documento, configurar margenes y salto de pagina.
6. Enviar `Content-Type: application/pdf` y, cuando corresponda, `Content-Disposition`.
7. Emitir el PDF como ultima operacion.

## Configuracion

Usar `EMPRESA_LOGO_PATH`, `EMPRESA_LOGO_PATH_ASSETS` o `EMPRESA_LOGO_PATH_ASSETS_ALT` segun el tipo de documento. No hardcodear `LogoAllSeason`, rutas de servidor, NIT, nombre o datos de contacto.

Usar `EMPRESA_NOMBRE`, `EMPRESA_NOMBRE_CORTO`, `EMPRESA_NOMBRE_TITULO` y las constantes de contacto segun el documento. Mantener la codificacion esperada por FPDF y aplicar `utf8_decode` solo de forma consistente con la version instalada y el texto usado.

## Errores

Antes de generar el PDF, los errores deben responder con JSON y codigo HTTP apropiado. Despues de iniciar la salida binaria, no intentar cambiar a JSON. No activar `display_errors` en produccion; registrar diagnostico con `error_log`.

Validar manualmente al menos: registro inexistente, detalle vacio, logo ausente, texto largo, varias paginas y caracteres espanoles. Comparar el PDF con el contrato visual actual antes de migrar un endpoint existente.
