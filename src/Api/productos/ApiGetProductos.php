<?php
// ApiGetProductos.php
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
    // Construir consulta SQL
    $sql = "SELECT * FROM GEN_Productos WHERE 1=1";
    
    // Aplicar filtros
    if (isset($filtros["busqueda"]) && !empty($filtros["busqueda"])) {
        $busqueda = $enlace->real_escape_string($filtros["busqueda"]);
        $sql .= " AND (NOMPRODUCTO LIKE '%$busqueda%' 
                      OR NOMIMPRESION LIKE '%$busqueda%' 
                      OR TAXRECORD LIKE '%$busqueda%')";
    }
    
    if (isset($filtros["estado"]) && $filtros["estado"] !== "todos") {
        if ($filtros["estado"] === "activos") {
            $sql .= " AND ACTIVO = 1";
        } elseif ($filtros["estado"] === "inactivos") {
            $sql .= " AND ACTIVO = 0";
        }
    }
    
    $sql .= " ORDER BY NOMPRODUCTO ASC";
    
    // Ejecutar consulta
    $result = $enlace->query($sql);
    
    if (!$result) {
        throw new Exception("Error en consulta: " . $enlace->error);
    }
    
    $productos = [];
    while ($row = $result->fetch_assoc()) {
        // Convertir bit a booleano
        $row["ACTIVO"] = $row["ACTIVO"] == 1;
        $productos[] = $row;
    }
    
    // Estadísticas
    $sqlStats = "SELECT 
        COUNT(*) as total,
        SUM(ACTIVO = 1) as activos,
        SUM(ACTIVO = 0) as inactivos
        FROM GEN_Productos";
    
    $resultStats = $enlace->query($sqlStats);
    $estadisticas = $resultStats->fetch_assoc() ?? ["total" => 0, "activos" => 0, "inactivos" => 0];
    
    echo json_encode([
        "success" => true,
        "productos" => $productos,
        "estadisticas" => $estadisticas,
        "total" => count($productos)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener productos: " . $e->getMessage()
    ]);
}

$enlace->close();
?>