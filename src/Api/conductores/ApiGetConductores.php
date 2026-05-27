<?php
// src/Api/conductores/ApiGetConductores.php
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
$filtros = json_decode($json, true) ?? [];

try {
    $sql = "SELECT * FROM GEN_Conductores WHERE 1=1";
    
    // Aplicar filtros
    if (isset($filtros["busqueda"]) && !empty($filtros["busqueda"])) {
        $busqueda = $enlace->real_escape_string($filtros["busqueda"]);
        $sql .= " AND (NombreConductor LIKE '%$busqueda%' 
                      OR NoCedula LIKE '%$busqueda%' 
                      OR Telefono LIKE '%$busqueda%'
                      OR Placas LIKE '%$busqueda%'
                      OR TipoVehiculo LIKE '%$busqueda%'
                      OR Marca LIKE '%$busqueda%')";
    }
    
    if (isset($filtros["estado"]) && $filtros["estado"] !== "todos") {
        if ($filtros["estado"] === "activos") {
            $sql .= " AND ACTIVO = 1";
        } elseif ($filtros["estado"] === "inactivos") {
            $sql .= " AND ACTIVO = 0";
        }
    }
    
    $sql .= " ORDER BY NombreConductor ASC";
    
    $result = $enlace->query($sql);
    
    if (!$result) {
        throw new Exception("Error en consulta: " . $enlace->error);
    }
    
    $conductores = [];
    while ($row = $result->fetch_assoc()) {
        $row["ACTIVO"] = $row["ACTIVO"] == 1;
        $conductores[] = $row;
    }
    
    // Estadísticas
    $sqlStats = "SELECT 
        COUNT(*) as total,
        SUM(ACTIVO = 1) as activos,
        SUM(ACTIVO = 0) as inactivos
        FROM GEN_Conductores";
    
    $resultStats = $enlace->query($sqlStats);
    $estadisticas = $resultStats->fetch_assoc() ?? ["total" => 0, "activos" => 0, "inactivos" => 0];
    
    echo json_encode([
        "success" => true,
        "conductores" => $conductores,
        "estadisticas" => $estadisticas,
        "total" => count($conductores)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener conductores: " . $e->getMessage()
    ]);
}

$enlace->close();
?>