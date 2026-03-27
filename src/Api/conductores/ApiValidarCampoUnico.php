<?php
// src/Api/conductores/ApiValidarCampoUnico.php
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

if (!$data || !isset($data["campo"]) || !isset($data["valor"])) {
    echo json_encode(["existe" => false]);
    exit;
}

$campo = $enlace->real_escape_string($data["campo"]);
$valor = $enlace->real_escape_string(trim($data["valor"]));
$idExcluir = isset($data["idExcluir"]) ? intval($data["idExcluir"]) : 0;

// SOLO PERMITIR VALIDAR NOMBRE
if ($campo !== "NombreConductor") {
    echo json_encode(["existe" => false]);
    exit;
}

try {
    if (empty($valor)) {
        echo json_encode(["existe" => false]);
        exit;
    }
    
    $sql = "SELECT IdConductor FROM GEN_Conductores WHERE UPPER(NombreConductor) = UPPER('$valor')";
    
    if ($idExcluir > 0) {
        $sql .= " AND IdConductor != $idExcluir";
    }
    
    $result = $enlace->query($sql);
    $existe = ($result && $result->num_rows > 0);
    
    echo json_encode([
        "existe" => $existe
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "existe" => false
    ]);
}

$enlace->close();
?>