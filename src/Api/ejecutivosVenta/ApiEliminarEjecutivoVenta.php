<?php
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

if (!$data || !isset($data["idEjecutivo"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de ejecutivo no proporcionado"]);
    exit;
}

$idEjecutivo = intval($data["idEjecutivo"]);

try {
    $sqlVerificar = "SELECT NOMEJECUTIVO FROM GEN_Ejecutivos WHERE IdEjecutivo = $idEjecutivo";
    $resultVerificar = $enlace->query($sqlVerificar);

    if (!$resultVerificar || $resultVerificar->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Ejecutivo no encontrado"]);
        exit;
    }

    $row    = $resultVerificar->fetch_assoc();
    $nombre = $row["NOMEJECUTIVO"];

    $sql    = "UPDATE GEN_Ejecutivos SET ACTIVO = 0 WHERE IdEjecutivo = $idEjecutivo";
    $result = $enlace->query($sql);

    if ($result) {
        echo json_encode(["success" => true, "message" => "Ejecutivo '$nombre' desactivado correctamente"]);
    } else {
        throw new Exception("Error al desactivar: " . $enlace->error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
