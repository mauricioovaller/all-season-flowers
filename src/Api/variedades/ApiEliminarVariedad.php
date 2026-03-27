<?php
// src/Api/variedades/ApiEliminarVariedad.php
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

if (!$data || !isset($data["idVariedad"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de variedad no proporcionado"]);
    exit;
}

$idVariedad = intval($data["idVariedad"]);

try {
    // Verificar si la variedad existe
    $sqlVerificar = "SELECT v.NOMVARIEDAD, p.NOMPRODUCTO 
                     FROM GEN_Variedades v
                     LEFT JOIN GEN_Productos p ON v.IdProducto = p.IdProducto
                     WHERE v.IdVariedad = $idVariedad";
    
    $resultVerificar = $enlace->query($sqlVerificar);
    
    if (!$resultVerificar || $resultVerificar->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Variedad no encontrada"
        ]);
        exit;
    }
    
    $variedad = $resultVerificar->fetch_assoc();
    $nombreVariedad = $variedad["NOMVARIEDAD"];
    $nombreProducto = $variedad["NOMPRODUCTO"];
    
    // ELIMINACIÓN LÓGICA (marcar como inactivo)
    $sql = "UPDATE GEN_Variedades SET ACTIVO = 0 WHERE IdVariedad = $idVariedad";
    $result = $enlace->query($sql);
    
    if ($result) {
        echo json_encode([
            "success" => true,
            "message" => "Variedad '$nombreVariedad' (Producto: $nombreProducto) desactivada correctamente",
            "eliminacionLogica" => true
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No se pudo desactivar la variedad: " . $enlace->error
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al desactivar variedad: " . $e->getMessage()
    ]);
}

$enlace->close();
?>