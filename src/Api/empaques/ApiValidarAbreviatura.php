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
    echo json_encode(["existe" => false]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || !isset($data["abreviatura"])) {
    echo json_encode(["existe" => false]);
    exit;
}

$abreviatura = strtoupper(trim($data["abreviatura"]));
$idExcluir   = isset($data["idExcluir"]) ? intval($data["idExcluir"]) : 0;

try {
    if (empty($abreviatura)) {
        echo json_encode(["existe" => false]);
        exit;
    }

    $abreviatura = $enlace->real_escape_string($abreviatura);
    $sql         = "SELECT IdTipoEmpaque FROM GEN_TipoEmpaque WHERE UPPER(Abreviatura) = UPPER('$abreviatura')";

    if ($idExcluir > 0) {
        $sql .= " AND IdTipoEmpaque != $idExcluir";
    }

    $result = $enlace->query($sql);
    echo json_encode(["existe" => ($result && $result->num_rows > 0)]);
} catch (Exception $e) {
    echo json_encode(["existe" => false]);
}
