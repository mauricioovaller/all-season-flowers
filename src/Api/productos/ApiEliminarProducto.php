<?php
// ApiEliminarProducto.php
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
$data = json_decode($json, true);

if (!$data || !isset($data["idProducto"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de producto no proporcionado"]);
    exit;
}

$idProducto = intval($data["idProducto"]);

try {
    // Verificar si el producto existe
    $sqlVerificar = "SELECT NOMPRODUCTO FROM GEN_Productos WHERE IdProducto = $idProducto";
    $resultVerificar = $enlace->query($sqlVerificar);
    
    if (!$resultVerificar || $resultVerificar->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Producto no encontrado"
        ]);
        exit;
    }
    
    $producto = $resultVerificar->fetch_assoc();
    $nombreProducto = $producto["NOMPRODUCTO"];
    
    // ELIMINACIÓN LÓGICA (marcar como inactivo)
    $sql = "UPDATE GEN_Productos SET ACTIVO = 0 WHERE IdProducto = $idProducto";
    $result = $enlace->query($sql);
    
    if ($result) {
        echo json_encode([
            "success" => true,
            "message" => "Producto '$nombreProducto' desactivado correctamente",
            "eliminacionLogica" => true
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No se pudo desactivar el producto: " . $enlace->error
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al desactivar producto: " . $e->getMessage()
    ]);
}

$enlace->close();
?>