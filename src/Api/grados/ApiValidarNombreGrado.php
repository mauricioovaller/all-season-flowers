<?php
// src/Api/grados/ApiValidarNombreGrado.php
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

if (!$data || !isset($data["nombre"]) || !isset($data["idProducto"])) {
    echo json_encode(["existe" => false]);
    exit;
}

$nombre = trim($data["nombre"]);
$idProducto = intval($data["idProducto"]);
$idExcluir = isset($data["idExcluir"]) ? intval($data["idExcluir"]) : 0;

try {
    if (empty($nombre) || $idProducto <= 0) {
        echo json_encode(["existe" => false]);
        exit;
    }
    
    $nombre = $enlace->real_escape_string($nombre);
    $sql = "SELECT IdGrado FROM GEN_Grados 
            WHERE UPPER(NOMGRADO) = UPPER('$nombre') 
            AND IdProducto = $idProducto";
    
    if ($idExcluir > 0) {
        $sql .= " AND IdGrado != $idExcluir";
    }
    
    $result = $enlace->query($sql);
    $existe = ($result && $result->num_rows > 0);
    
    echo json_encode([
        "existe" => $existe,
        "nombre" => $nombre,
        "idProducto" => $idProducto
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "existe" => false,
        "error" => $e->getMessage()
    ]);
}

$enlace->close();
?>