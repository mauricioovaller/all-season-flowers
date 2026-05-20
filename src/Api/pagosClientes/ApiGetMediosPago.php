<?php
// src/Api/pagosClientes/ApiGetMediosPago.php
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
    // Consulta para obtener medios de pago
    $query = "SELECT IdMedioPago, Medio FROM GEN_MedioPagos ORDER BY Medio";
    
    $result = $enlace->query($query);
    
    if (!$result) {
        throw new Exception("Error en la consulta: " . $enlace->error);
    }
    
    $mediosPago = [];
    while ($row = $result->fetch_assoc()) {
        $mediosPago[] = [
            'id' => $row['IdMedioPago'],
            'nombre' => $row['Medio']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'mediosPago' => $mediosPago,
        'total' => count($mediosPago)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'mediosPago' => [],
        'total' => 0
    ]);
}

$enlace->close();
?>