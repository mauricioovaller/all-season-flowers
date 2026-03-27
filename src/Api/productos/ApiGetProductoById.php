<?php
// ApiGetProductoById.php
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
$data = json_decode($json, true);

if (!$data || !isset($data["idProducto"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de producto no proporcionado"]);
    exit;
}

$idProducto = intval($data["idProducto"]);

try {
    $sql = "SELECT * FROM GEN_Productos WHERE IdProducto = $idProducto";
    $result = $enlace->query($sql);
    
    if (!$result || $result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Producto no encontrado"
        ]);
        exit;
    }
    
    $producto = $result->fetch_assoc();
    
    // Convertir bit a booleano
    $producto["ACTIVO"] = $producto["ACTIVO"] == 1;
    
    echo json_encode([
        "success" => true,
        "producto" => $producto
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener producto: " . $e->getMessage()
    ]);
}

$enlace->close();
?>