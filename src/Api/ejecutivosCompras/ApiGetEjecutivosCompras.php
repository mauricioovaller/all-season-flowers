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
    // Usar (ACTIVO+0) para convertir bit(1) a entero sin problemas de codificación binaria
    $sql = "SELECT IdComprador, NomComprador, E_MAILComprador, IdentifComprador, (ACTIVO+0) AS ACTIVO FROM GEN_Compradores WHERE 1=1";

    if (isset($filtros["busqueda"]) && !empty($filtros["busqueda"])) {
        $busqueda = $enlace->real_escape_string($filtros["busqueda"]);
        $sql .= " AND (NomComprador LIKE '%$busqueda%' OR E_MAILComprador LIKE '%$busqueda%' OR IdentifComprador LIKE '%$busqueda%')";
    }

    if (isset($filtros["estado"]) && $filtros["estado"] !== "todos") {
        if ($filtros["estado"] === "activos") {
            $sql .= " AND (ACTIVO+0) = 1";
        } elseif ($filtros["estado"] === "inactivos") {
            $sql .= " AND (ACTIVO+0) = 0";
        }
    }

    $sql .= " ORDER BY NomComprador ASC";

    $result = $enlace->query($sql);
    if (!$result) {
        throw new Exception("Error en consulta: " . $enlace->error);
    }

    $compradores = [];
    while ($row = $result->fetch_assoc()) {
        $row["ACTIVO"] = intval($row["ACTIVO"]);
        $compradores[] = $row;
    }

    $sqlStats = "SELECT COUNT(*) as total, SUM(ACTIVO+0) as activos, SUM((ACTIVO+0)=0) as inactivos FROM GEN_Compradores";
    $resultStats = $enlace->query($sqlStats);
    $estadisticas = $resultStats ? $resultStats->fetch_assoc() : null;

    if (!$estadisticas) {
        $estadisticas = ["total" => 0, "activos" => 0, "inactivos" => 0];
    } else {
        $estadisticas["activos"]   = intval($estadisticas["activos"]   ?? 0);
        $estadisticas["inactivos"] = intval($estadisticas["inactivos"] ?? 0);
    }

    echo json_encode([
        "success"      => true,
        "compradores"  => $compradores,
        "estadisticas" => $estadisticas,
        "total"        => count($compradores)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error al obtener ejecutivos de compras: " . $e->getMessage()]);
}
