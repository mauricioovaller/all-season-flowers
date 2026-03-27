<?php
// ApiValidarNombreCliente.php
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

if (!$data || !isset($data["nombre"])) {
    echo json_encode(["existe" => false]);
    exit;
}

$nombre = trim($data["nombre"]);
$idExcluir = isset($data["idExcluir"]) ? intval($data["idExcluir"]) : 0;

try {
    if (empty($nombre)) {
        echo json_encode(["existe" => false]);
        exit;
    }
    
    $nombre = $enlace->real_escape_string($nombre);
    $sql = "SELECT IdCliente FROM GEN_Clientes WHERE UPPER(NOMBRE) = UPPER('$nombre')";
    
    if ($idExcluir > 0) {
        $sql .= " AND IdCliente != $idExcluir";
    }
    
    $result = $enlace->query($sql);
    $existe = ($result && $result->num_rows > 0);
    
    echo json_encode([
        "existe" => $existe,
        "nombre" => $nombre
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "existe" => false,
        "error" => $e->getMessage()
    ]);
}

$enlace->close();
?>