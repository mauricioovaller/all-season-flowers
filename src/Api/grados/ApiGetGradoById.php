<?php
// src/Api/grados/ApiGetGradoById.php
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

if (!$data || !isset($data["idGrado"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de grado no proporcionado"]);
    exit;
}

$idGrado = intval($data["idGrado"]);

try {
    $sql = "SELECT g.*, p.NOMPRODUCTO 
            FROM GEN_Grados g
            LEFT JOIN GEN_Productos p ON g.IdProducto = p.IdProducto
            WHERE g.IdGrado = $idGrado";
    
    $result = $enlace->query($sql);
    
    if (!$result || $result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Grado no encontrado"
        ]);
        exit;
    }
    
    $grado = $result->fetch_assoc();
    $grado["ACTIVO"] = $grado["ACTIVO"] == 1;
    
    echo json_encode([
        "success" => true,
        "grado" => $grado
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener grado: " . $e->getMessage()
    ]);
}

$enlace->close();
?>