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
    if (empty($data["NOMAGENCIA"])) {
        throw new Exception("El nombre de la agencia es obligatorio");
    }

    $NOMAGENCIA     = $enlace->real_escape_string(trim($data["NOMAGENCIA"]));
    $DIRAGENCIA     = $enlace->real_escape_string($data["DIRAGENCIA"] ?? '');
    $TELAGENCIA     = $enlace->real_escape_string($data["TELAGENCIA"] ?? '');
    $E_MAILAGENCIA  = $enlace->real_escape_string($data["E_MAILAGENCIA"] ?? '');
    $CONTACTOAGENCIA = $enlace->real_escape_string($data["CONTACTOAGENCIA"] ?? '');

    if (isset($data["IdAgencia"]) && !empty($data["IdAgencia"])) {
        // ACTUALIZAR
        $idAgencia = intval($data["IdAgencia"]);

        $sqlVerificar = "SELECT IdAgencia FROM GEN_Agencias WHERE UPPER(NOMAGENCIA) = UPPER('$NOMAGENCIA') AND IdAgencia != $idAgencia";
        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe una agencia con ese nombre");
        }

        $sql = "UPDATE GEN_Agencias SET
                NOMAGENCIA      = '$NOMAGENCIA',
                DIRAGENCIA      = '$DIRAGENCIA',
                TELAGENCIA      = '$TELAGENCIA',
                E_MAILAGENCIA   = '$E_MAILAGENCIA',
                CONTACTOAGENCIA = '$CONTACTOAGENCIA'
                WHERE IdAgencia = $idAgencia";

        if (!$enlace->query($sql)) {
            throw new Exception("Error al actualizar: " . $enlace->error);
        }

        echo json_encode(["success" => true, "message" => "Agencia actualizada correctamente", "idAgencia" => $idAgencia]);
    } else {
        // INSERTAR
        $sqlVerificar = "SELECT IdAgencia FROM GEN_Agencias WHERE UPPER(NOMAGENCIA) = UPPER('$NOMAGENCIA')";
        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe una agencia con ese nombre");
        }

        $sql = "INSERT INTO GEN_Agencias (NOMAGENCIA, DIRAGENCIA, TELAGENCIA, E_MAILAGENCIA, CONTACTOAGENCIA)
                VALUES ('$NOMAGENCIA', '$DIRAGENCIA', '$TELAGENCIA', '$E_MAILAGENCIA', '$CONTACTOAGENCIA')";

        if (!$enlace->query($sql)) {
            throw new Exception("Error al insertar: " . $enlace->error);
        }

        echo json_encode(["success" => true, "message" => "Agencia guardada correctamente", "idAgencia" => $enlace->insert_id]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
