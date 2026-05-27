<?php
// src/Api/variedades/ApiGetVariedadById.php
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

if (!$data || !isset($data["idVariedad"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de variedad no proporcionado"]);
    exit;
}

$idVariedad = intval($data["idVariedad"]);

try {
    $sql = "SELECT v.*, p.NOMPRODUCTO 
            FROM GEN_Variedades v
            LEFT JOIN GEN_Productos p ON v.IdProducto = p.IdProducto
            WHERE v.IdVariedad = $idVariedad";
    
    $result = $enlace->query($sql);
    
    if (!$result || $result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Variedad no encontrada"
        ]);
        exit;
    }
    
    $variedad = $result->fetch_assoc();
    $variedad["ACTIVO"] = $variedad["ACTIVO"] == 1;
    
    echo json_encode([
        "success" => true,
        "variedad" => $variedad
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener variedad: " . $e->getMessage()
    ]);
}

$enlace->close();
?>