<?php
// ApiEliminarCliente.php - VERSIÓN ULTRA SIMPLE
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || !isset($data["idCliente"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de cliente no proporcionado"]);
    exit;
}

$idCliente = intval($data["idCliente"]);

try {
    // Verificar si el cliente existe
    $sqlVerificar = "SELECT NOMBRE FROM GEN_Clientes WHERE IdCliente = $idCliente";
    $resultVerificar = $enlace->query($sqlVerificar);
    
    if (!$resultVerificar || $resultVerificar->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Cliente no encontrado"
        ]);
        exit;
    }
    
    $cliente = $resultVerificar->fetch_assoc();
    $nombreCliente = $cliente["NOMBRE"];
    
    // ELIMINACIÓN LÓGICA (marcar como inactivo)
    $sql = "UPDATE GEN_Clientes SET ACTIVO = 0 WHERE IdCliente = $idCliente";
    $result = $enlace->query($sql);
    
    if ($result) {
        echo json_encode([
            "success" => true,
            "message" => "Cliente '$nombreCliente' desactivado correctamente",
            "eliminacionLogica" => true
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No se pudo desactivar el cliente: " . $enlace->error
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al desactivar cliente: " . $e->getMessage()
    ]);
}

$enlace->close();
?>