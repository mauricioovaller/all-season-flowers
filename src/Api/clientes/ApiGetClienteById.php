<?php
// ApiGetClienteById.php - VERSIÓN ULTRA SIMPLE
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
    $sql = "SELECT * FROM GEN_Clientes WHERE IdCliente = $idCliente";
    $result = $enlace->query($sql);
    
    if (!$result || $result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Cliente no encontrado"
        ]);
        exit;
    }
    
    $cliente = $result->fetch_assoc();
    
    // Convertir bits a booleanos
    $cliente["ACTIVO"] = $cliente["ACTIVO"] == 1;
    $cliente["IVA"] = $cliente["IVA"] == 1;
    
    echo json_encode([
        "success" => true,
        "cliente" => $cliente
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener cliente: " . $e->getMessage()
    ]);
}

$enlace->close();
?>