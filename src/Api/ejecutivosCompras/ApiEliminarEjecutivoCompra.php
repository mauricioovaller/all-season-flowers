<?php
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

if (!$data || !isset($data["idComprador"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de comprador no proporcionado"]);
    exit;
}

$idComprador = intval($data["idComprador"]);

try {
    $sqlVerificar = "SELECT NomComprador FROM GEN_Compradores WHERE IdComprador = $idComprador";
    $resultVerificar = $enlace->query($sqlVerificar);

    if (!$resultVerificar || $resultVerificar->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Ejecutivo de compras no encontrado"]);
        exit;
    }

    $row    = $resultVerificar->fetch_assoc();
    $nombre = $row["NomComprador"];

    $sql    = "UPDATE GEN_Compradores SET ACTIVO = 0 WHERE IdComprador = $idComprador";
    $result = $enlace->query($sql);

    if ($result) {
        echo json_encode(["success" => true, "message" => "Ejecutivo de compras '$nombre' desactivado correctamente"]);
    } else {
        throw new Exception("Error al desactivar: " . $enlace->error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
