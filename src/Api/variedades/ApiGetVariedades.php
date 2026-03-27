
<?php
// src/Api/variedades/ApiGetVariedades.php
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
    // Consulta con JOIN para obtener nombre del producto
    $sql = "SELECT v.*, p.NOMPRODUCTO 
            FROM GEN_Variedades v 
            LEFT JOIN GEN_Productos p ON v.IdProducto = p.IdProducto 
            WHERE 1=1";
    
    // Aplicar filtros
    if (isset($filtros["busqueda"]) && !empty($filtros["busqueda"])) {
        $busqueda = $enlace->real_escape_string($filtros["busqueda"]);
        $sql .= " AND (v.NOMVARIEDAD LIKE '%$busqueda%' 
                      OR v.COLOR LIKE '%$busqueda%'
                      OR p.NOMPRODUCTO LIKE '%$busqueda%')";
    }
    
    if (isset($filtros["idProducto"]) && $filtros["idProducto"] > 0) {
        $idProducto = intval($filtros["idProducto"]);
        $sql .= " AND v.IdProducto = $idProducto";
    }
    
    if (isset($filtros["estado"]) && $filtros["estado"] !== "todos") {
        if ($filtros["estado"] === "activos") {
            $sql .= " AND v.ACTIVO = 1";
        } elseif ($filtros["estado"] === "inactivos") {
            $sql .= " AND v.ACTIVO = 0";
        }
    }
    
    $sql .= " ORDER BY p.NOMPRODUCTO, v.NOMVARIEDAD ASC";
    
    // Ejecutar consulta
    $result = $enlace->query($sql);
    
    if (!$result) {
        throw new Exception("Error en consulta: " . $enlace->error);
    }
    
    $variedades = [];
    while ($row = $result->fetch_assoc()) {
        $row["ACTIVO"] = $row["ACTIVO"] == 1;
        $variedades[] = $row;
    }
    
    // Estadísticas
    $sqlStats = "SELECT 
        COUNT(*) as total,
        SUM(v.ACTIVO = 1) as activos,
        SUM(v.ACTIVO = 0) as inactivos
        FROM GEN_Variedades v";
    
    $resultStats = $enlace->query($sqlStats);
    $estadisticas = $resultStats->fetch_assoc() ?? ["total" => 0, "activos" => 0, "inactivos" => 0];
    
    echo json_encode([
        "success" => true,
        "variedades" => $variedades,
        "estadisticas" => $estadisticas,
        "total" => count($variedades)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener variedades: " . $e->getMessage()
    ]);
}

$enlace->close();
?>