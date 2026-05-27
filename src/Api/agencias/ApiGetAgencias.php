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

$json    = file_get_contents("php://input");
$filtros = json_decode($json, true) ?? [];

try {
    $sql = "SELECT * FROM GEN_Agencias WHERE 1=1";

    if (isset($filtros["busqueda"]) && !empty($filtros["busqueda"])) {
        $busqueda = $enlace->real_escape_string($filtros["busqueda"]);
        $sql .= " AND (NOMAGENCIA LIKE '%$busqueda%' OR CONTACTOAGENCIA LIKE '%$busqueda%' OR E_MAILAGENCIA LIKE '%$busqueda%')";
    }

    $sql .= " ORDER BY NOMAGENCIA ASC";

    $result = $enlace->query($sql);
    if (!$result) {
        throw new Exception("Error en consulta: " . $enlace->error);
    }

    $agencias = [];
    while ($row = $result->fetch_assoc()) {
        $agencias[] = $row;
    }

    $sqlStats     = "SELECT COUNT(*) as total FROM GEN_Agencias";
    $resultStats  = $enlace->query($sqlStats);
    $estadisticas = $resultStats ? $resultStats->fetch_assoc() : ["total" => 0];

    echo json_encode([
        "success"      => true,
        "agencias"     => $agencias,
        "estadisticas" => $estadisticas,
        "total"        => count($agencias)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error al obtener agencias: " . $e->getMessage()]);
}
