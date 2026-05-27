<?php
// src/Api/pagosClientes/ApiGetUltimoNumeroPagoCliente.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

try {
    // Consulta para obtener el último número de pago de cliente
    $query = "SELECT MAX(IdEncabPagoCliente) as ultimoNumero FROM SAS_EncabPagoCliente WHERE IdEncabPagoCliente IS NOT NULL AND IdEncabPagoCliente > 0";
    
    $result = $enlace->query($query);
    
    if (!$result) {
        throw new Exception("Error en la consulta: " . $enlace->error);
    }
    
    $row = $result->fetch_assoc();
    $ultimoNumero = $row['ultimoNumero'] ? (int)$row['ultimoNumero'] : 0;
    $siguienteNumero = $ultimoNumero + 1;
    
    echo json_encode([
        'success' => true,
        'ultimoNumero' => $ultimoNumero,
        'ultimoNumeroFormateado' => $ultimoNumero > 0 ? 'PAG-CLI-' . str_pad($ultimoNumero, 6, '0', STR_PAD_LEFT) : 'Ninguna',
        'prefijo' => 'PAG-CLI-',
        'siguienteNumero' => $siguienteNumero,
        'siguienteNumeroFormateado' => 'PAG-CLI-' . str_pad($siguienteNumero, 6, '0', STR_PAD_LEFT)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'ultimoNumero' => 0,
        'prefijo' => 'PAG-CLI-',
        'siguienteNumeroFormateado' => 'PAG-CLI-000001'
    ]);
}

$enlace->close();
?>