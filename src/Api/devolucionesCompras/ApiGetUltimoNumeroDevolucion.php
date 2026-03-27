<?php
// src/Api/pedidos/ApiGetUltimoNumeroDevolucion.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

try {
    // Consulta para obtener el último número de devolución (campo IdDevolucion)
    $query = "SELECT MAX(IdDevolucion) as ultimoNumero FROM SAS_EncabPedido WHERE IdDevolucion IS NOT NULL AND IdDevolucion > 0";
    
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
        'ultimoNumeroFormateado' => $ultimoNumero > 0 ? 'DEV-' . str_pad($ultimoNumero, 6, '0', STR_PAD_LEFT) : 'Ninguna',
        'prefijo' => 'DEV-',
        'siguienteNumero' => $siguienteNumero,
        'siguienteNumeroFormateado' => 'DEV-' . str_pad($siguienteNumero, 6, '0', STR_PAD_LEFT)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'ultimoNumero' => 0,
        'prefijo' => 'DEV-',
        'siguienteNumeroFormateado' => 'DEV-000001'
    ]);
}

$enlace->close();
?>