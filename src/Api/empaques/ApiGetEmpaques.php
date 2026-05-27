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
    $sql = "SELECT * FROM GEN_TipoEmpaque WHERE 1=1";

    if (isset($filtros["busqueda"]) && !empty($filtros["busqueda"])) {
        $busqueda = $enlace->real_escape_string($filtros["busqueda"]);
        $sql .= " AND (Abreviatura LIKE '%$busqueda%' OR Descripcion LIKE '%$busqueda%')";
    }

    $sql .= " ORDER BY Descripcion ASC";

    $result = $enlace->query($sql);
    if (!$result) {
        throw new Exception("Error en consulta: " . $enlace->error);
    }

    $empaques = [];
    while ($row = $result->fetch_assoc()) {
        $row["EquivFull"] = floatval($row["EquivFull"]);
        $empaques[] = $row;
    }

    $sqlStats    = "SELECT COUNT(*) as total FROM GEN_TipoEmpaque";
    $resultStats = $enlace->query($sqlStats);
    $estadisticas = $resultStats ? $resultStats->fetch_assoc() : ["total" => 0];

    echo json_encode([
        "success"      => true,
        "empaques"     => $empaques,
        "estadisticas" => $estadisticas,
        "total"        => count($empaques)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error al obtener empaques: " . $e->getMessage()]);
}
