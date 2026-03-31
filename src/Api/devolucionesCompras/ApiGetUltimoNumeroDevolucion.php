<?php
/**
 * ApiGetUltimoNumeroDevolucion.php - API para obtener el último número de devolución de compras
 * 
 * Este endpoint obtiene el último número de devolución utilizado en compras
 * para generar el siguiente número secuencial.
 * 
 * @package AllSeasonFlowers
 * @category API
 * @subpackage DevolucionesCompras
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Incluir conexión a base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

// Validar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

try {
    // Consulta para obtener el último número de devolución de compras
    $query = "SELECT MAX(IdDevolucion) as ultimoNumero 
              FROM SAS_EncabCompra 
              WHERE IdDevolucion IS NOT NULL 
                AND IdDevolucion > 0
                AND Anulado = 0";
    
    $result = $enlace->query($query);
    
    if (!$result) {
        throw new Exception("Error en la consulta: " . $enlace->error);
    }
    
    $row = $result->fetch_assoc();
    $ultimoNumero = $row['ultimoNumero'] ? (int)$row['ultimoNumero'] : 0;
    $siguienteNumero = $ultimoNumero + 1;
    
    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'ultimoNumero' => $ultimoNumero,
        'ultimoNumeroFormateado' => $ultimoNumero > 0 ? 'DEV-' . str_pad($ultimoNumero, 6, '0', STR_PAD_LEFT) : 'Ninguna',
        'prefijo' => 'DEV-',
        'siguienteNumero' => $siguienteNumero,
        'siguienteNumeroFormateado' => 'DEV-' . str_pad($siguienteNumero, 6, '0', STR_PAD_LEFT),
        'tablaOrigen' => 'SAS_EncabCompra',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    // Respuesta de error con valores por defecto
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'ultimoNumero' => 0,
        'prefijo' => 'DEV-',
        'siguienteNumeroFormateado' => 'DEV-000001',
        'fallback' => true
    ]);
} finally {
    // Cerrar conexión
    if (isset($enlace)) {
        $enlace->close();
    }
}
?>