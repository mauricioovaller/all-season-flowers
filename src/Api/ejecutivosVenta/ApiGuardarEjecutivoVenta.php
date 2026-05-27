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

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos JSON no válidos"]);
    exit;
}

try {
    if (empty($data["NOMEJECUTIVO"])) {
        throw new Exception("El nombre del ejecutivo de venta es obligatorio");
    }

    $NOMEJECUTIVO    = $enlace->real_escape_string(trim($data["NOMEJECUTIVO"]));
    $E_MAILEJECUTIVO = $enlace->real_escape_string($data["E_MAILEJECUTIVO"] ?? '');
    $IdentifEjecutivo = $enlace->real_escape_string($data["IdentifEjecutivo"] ?? '');
    $ACTIVO          = isset($data["ACTIVO"]) && $data["ACTIVO"] ? 1 : 0;

    if (isset($data["IdEjecutivo"]) && !empty($data["IdEjecutivo"])) {
        // ACTUALIZAR
        $idEjecutivo = intval($data["IdEjecutivo"]);

        $sqlVerificar = "SELECT IdEjecutivo FROM GEN_Ejecutivos WHERE UPPER(NOMEJECUTIVO) = UPPER('$NOMEJECUTIVO') AND IdEjecutivo != $idEjecutivo";
        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe un ejecutivo de venta con ese nombre");
        }

        $sql = "UPDATE GEN_Ejecutivos SET
                NOMEJECUTIVO    = '$NOMEJECUTIVO',
                E_MAILEJECUTIVO = '$E_MAILEJECUTIVO',
                IdentifEjecutivo = '$IdentifEjecutivo',
                ACTIVO          = $ACTIVO
                WHERE IdEjecutivo = $idEjecutivo";

        if (!$enlace->query($sql)) {
            throw new Exception("Error al actualizar: " . $enlace->error);
        }

        echo json_encode(["success" => true, "message" => "Ejecutivo de venta actualizado correctamente", "idEjecutivo" => $idEjecutivo]);
    } else {
        // INSERTAR
        $sqlVerificar = "SELECT IdEjecutivo FROM GEN_Ejecutivos WHERE UPPER(NOMEJECUTIVO) = UPPER('$NOMEJECUTIVO')";
        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe un ejecutivo de venta con ese nombre");
        }

        $sql = "INSERT INTO GEN_Ejecutivos (NOMEJECUTIVO, E_MAILEJECUTIVO, IdentifEjecutivo, ACTIVO)
                VALUES ('$NOMEJECUTIVO', '$E_MAILEJECUTIVO', '$IdentifEjecutivo', $ACTIVO)";

        if (!$enlace->query($sql)) {
            throw new Exception("Error al insertar: " . $enlace->error);
        }

        echo json_encode(["success" => true, "message" => "Ejecutivo de venta guardado correctamente", "idEjecutivo" => $enlace->insert_id]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
