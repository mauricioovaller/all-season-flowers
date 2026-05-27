<?php
// src/Api/conductores/ApiGetConductorById.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || !isset($data["idConductor"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de conductor no proporcionado"]);
    exit;
}

$idConductor = intval($data["idConductor"]);

try {
    $sql = "SELECT * FROM GEN_Conductores WHERE IdConductor = $idConductor";
    $result = $enlace->query($sql);
    
    if (!$result || $result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Conductor no encontrado"
        ]);
        exit;
    }
    
    $conductor = $result->fetch_assoc();
    $conductor["ACTIVO"] = $conductor["ACTIVO"] == 1;
    
    echo json_encode([
        "success" => true,
        "conductor" => $conductor
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener conductor: " . $e->getMessage()
    ]);
}

$enlace->close();
?>