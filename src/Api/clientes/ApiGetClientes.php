<?php
// ApiGetClientes.php - VERSIÓN ULTRA SIMPLE
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

// Leer JSON
$json = file_get_contents("php://input");
$filtros = json_decode($json, true) ?? [];

try {
    // Construir consulta SQL directamente
    $sql = "SELECT * FROM GEN_Clientes WHERE 1=1";
    
    // Aplicar filtros de forma segura
    if (isset($filtros["busqueda"]) && !empty($filtros["busqueda"])) {
        $busqueda = $enlace->real_escape_string($filtros["busqueda"]);
        $sql .= " AND (NOMBRE LIKE '%$busqueda%' 
                      OR CodCliente LIKE '%$busqueda%' 
                      OR NIT LIKE '%$busqueda%' 
                      OR Contaco LIKE '%$busqueda%')";
    }
    
    if (isset($filtros["estado"]) && $filtros["estado"] !== "todos") {
        if ($filtros["estado"] === "activos") {
            $sql .= " AND ACTIVO = 1";
        } elseif ($filtros["estado"] === "inactivos") {
            $sql .= " AND ACTIVO = 0";
        }
    }
    
    if (isset($filtros["conIVA"]) && $filtros["conIVA"] === true) {
        $sql .= " AND IVA = 1";
    }
    
    $sql .= " ORDER BY NOMBRE ASC";
    
    // Ejecutar consulta
    $result = $enlace->query($sql);
    
    if (!$result) {
        throw new Exception("Error en consulta: " . $enlace->error);
    }
    
    $clientes = [];
    while ($row = $result->fetch_assoc()) {
        // Convertir bits a booleanos
        $row["ACTIVO"] = $row["ACTIVO"] == 1;
        $row["IVA"] = $row["IVA"] == 1;
        $clientes[] = $row;
    }
    
    // Estadísticas
    $sqlStats = "SELECT 
        COUNT(*) as total,
        SUM(ACTIVO = 1) as activos,
        SUM(IVA = 1) as conIVA,
        SUM(ACTIVO = 0) as inactivos
        FROM GEN_Clientes";
    
    $resultStats = $enlace->query($sqlStats);
    $estadisticas = $resultStats->fetch_assoc();
    
    // Asegurar que no haya NULL
    if (!$estadisticas) {
        $estadisticas = ["total" => 0, "activos" => 0, "conIVA" => 0, "inactivos" => 0];
    } else {
        $estadisticas["activos"] = $estadisticas["activos"] ?? 0;
        $estadisticas["conIVA"] = $estadisticas["conIVA"] ?? 0;
        $estadisticas["inactivos"] = $estadisticas["inactivos"] ?? 0;
    }
    
    echo json_encode([
        "success" => true,
        "clientes" => $clientes,
        "estadisticas" => $estadisticas,
        "total" => count($clientes)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener clientes: " . $e->getMessage()
    ]);
}

$enlace->close();
?>