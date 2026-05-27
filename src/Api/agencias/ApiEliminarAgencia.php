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

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || !isset($data["idAgencia"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de agencia no proporcionado"]);
    exit;
}

$idAgencia = intval($data["idAgencia"]);

try {
    $sqlVerificar = "SELECT NOMAGENCIA FROM GEN_Agencias WHERE IdAgencia = $idAgencia";
    $resultVerificar = $enlace->query($sqlVerificar);

    if (!$resultVerificar || $resultVerificar->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Agencia no encontrada"]);
        exit;
    }

    $row    = $resultVerificar->fetch_assoc();
    $nombre = $row["NOMAGENCIA"];

    $sql    = "DELETE FROM GEN_Agencias WHERE IdAgencia = $idAgencia";
    $result = $enlace->query($sql);

    if ($result) {
        echo json_encode(["success" => true, "message" => "Agencia '$nombre' eliminada correctamente"]);
    } else {
        if ($enlace->errno == 1451) {
            throw new Exception("No se puede eliminar: la agencia está siendo usada en otros registros");
        }
        throw new Exception("Error al eliminar: " . $enlace->error);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
