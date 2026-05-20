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

if (!$data || !isset($data["idTipoEmpaque"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de empaque no proporcionado"]);
    exit;
}

$idTipoEmpaque = intval($data["idTipoEmpaque"]);

try {
    $sqlVerificar = "SELECT Descripcion FROM GEN_TipoEmpaque WHERE IdTipoEmpaque = $idTipoEmpaque";
    $resultVerificar = $enlace->query($sqlVerificar);

    if (!$resultVerificar || $resultVerificar->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Empaque no encontrado"]);
        exit;
    }

    $row         = $resultVerificar->fetch_assoc();
    $descripcion = $row["Descripcion"];

    $sql    = "DELETE FROM GEN_TipoEmpaque WHERE IdTipoEmpaque = $idTipoEmpaque";
    $result = $enlace->query($sql);

    if ($result) {
        echo json_encode(["success" => true, "message" => "Empaque '$descripcion' eliminado correctamente"]);
    } else {
        // Verificar si es un error de FK
        if ($enlace->errno == 1451) {
            throw new Exception("No se puede eliminar: el empaque está siendo usado en otros registros");
        }
        throw new Exception("Error al eliminar: " . $enlace->error);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
