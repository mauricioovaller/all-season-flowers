<?php
// src/Api/variedades/ApiGetProductosParaSelector.php
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

try {
    // Solo productos activos para selector
    $sql = "SELECT IdProducto, NOMPRODUCTO 
            FROM GEN_Productos 
            WHERE ACTIVO = 1 
            ORDER BY NOMPRODUCTO ASC";
    
    $result = $enlace->query($sql);
    
    if (!$result) {
        throw new Exception("Error en consulta: " . $enlace->error);
    }
    
    $productos = [];
    while ($row = $result->fetch_assoc()) {
        $productos[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "productos" => $productos
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