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

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$filtros = json_decode($json, true) ?? [];

try {
    $sql = "SELECT * FROM GEN_Ejecutivos WHERE 1=1";

    if (isset($filtros["busqueda"]) && !empty($filtros["busqueda"])) {
        $busqueda = $enlace->real_escape_string($filtros["busqueda"]);
        $sql .= " AND (NOMEJECUTIVO LIKE '%$busqueda%' OR E_MAILEJECUTIVO LIKE '%$busqueda%' OR IdentifEjecutivo LIKE '%$busqueda%')";
    }

    if (isset($filtros["estado"]) && $filtros["estado"] !== "todos") {
        if ($filtros["estado"] === "activos") {
            $sql .= " AND ACTIVO != 0";
        } elseif ($filtros["estado"] === "inactivos") {
            $sql .= " AND ACTIVO = 0";
        }
    }

    $sql .= " ORDER BY NOMEJECUTIVO ASC";

    $result = $enlace->query($sql);
    if (!$result) {
        throw new Exception("Error en consulta: " . $enlace->error);
    }

    $ejecutivos = [];
    while ($row = $result->fetch_assoc()) {
        // ACTIVO tinyint: -1 = activo, 0 = inactivo
        $row["ACTIVO"] = ($row["ACTIVO"] != 0) ? 1 : 0;
        $ejecutivos[] = $row;
    }

    $sqlStats = "SELECT COUNT(*) as total, SUM(ACTIVO != 0) as activos, SUM(ACTIVO = 0) as inactivos FROM GEN_Ejecutivos";
    $resultStats = $enlace->query($sqlStats);
    $estadisticas = $resultStats ? $resultStats->fetch_assoc() : null;

    if (!$estadisticas) {
        $estadisticas = ["total" => 0, "activos" => 0, "inactivos" => 0];
    } else {
        $estadisticas["activos"]   = $estadisticas["activos"]   ?? 0;
        $estadisticas["inactivos"] = $estadisticas["inactivos"] ?? 0;
    }

    echo json_encode([
        "success"      => true,
        "ejecutivos"   => $ejecutivos,
        "estadisticas" => $estadisticas,
        "total"        => count($ejecutivos)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error al obtener ejecutivos de venta: " . $e->getMessage()]);
}
