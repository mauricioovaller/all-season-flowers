<?php
// src/Api/conductores/ApiEliminarConductor.php
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
    // Verificar si el conductor existe
    $sqlVerificar = "SELECT NombreConductor FROM GEN_Conductores WHERE IdConductor = $idConductor";
    $resultVerificar = $enlace->query($sqlVerificar);
    
    if (!$resultVerificar || $resultVerificar->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Conductor no encontrado"
        ]);
        exit;
    }
    
    $conductor = $resultVerificar->fetch_assoc();
    $nombreConductor = $conductor["NombreConductor"];
    
    // ELIMINACIÓN LÓGICA (marcar como inactivo)
    $sql = "UPDATE GEN_Conductores SET ACTIVO = 0 WHERE IdConductor = $idConductor";
    $result = $enlace->query($sql);
    
    if ($result) {
        echo json_encode([
            "success" => true,
            "message" => "Conductor '$nombreConductor' desactivado correctamente",
            "eliminacionLogica" => true
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No se pudo desactivar el conductor: " . $enlace->error
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al desactivar conductor: " . $e->getMessage()
    ]);
}

$enlace->close();
?>