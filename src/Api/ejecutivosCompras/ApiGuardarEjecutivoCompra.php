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
    if (empty($data["NomComprador"])) {
        throw new Exception("El nombre del ejecutivo de compras es obligatorio");
    }

    $NomComprador    = $enlace->real_escape_string(trim($data["NomComprador"]));
    $E_MAILComprador = $enlace->real_escape_string($data["E_MAILComprador"] ?? '');
    $IdentifComprador = $enlace->real_escape_string($data["IdentifComprador"] ?? '');
    $ACTIVO          = isset($data["ACTIVO"]) && $data["ACTIVO"] ? 1 : 0;

    if (isset($data["IdComprador"]) && !empty($data["IdComprador"])) {
        // ACTUALIZAR
        $idComprador = intval($data["IdComprador"]);

        $sqlVerificar = "SELECT IdComprador FROM GEN_Compradores WHERE UPPER(NomComprador) = UPPER('$NomComprador') AND IdComprador != $idComprador";
        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe un ejecutivo de compras con ese nombre");
        }

        $sql = "UPDATE GEN_Compradores SET
                NomComprador    = '$NomComprador',
                E_MAILComprador = '$E_MAILComprador',
                IdentifComprador = '$IdentifComprador',
                ACTIVO          = $ACTIVO
                WHERE IdComprador = $idComprador";

        if (!$enlace->query($sql)) {
            throw new Exception("Error al actualizar: " . $enlace->error);
        }

        echo json_encode(["success" => true, "message" => "Ejecutivo de compras actualizado correctamente", "idComprador" => $idComprador]);
    } else {
        // INSERTAR
        $sqlVerificar = "SELECT IdComprador FROM GEN_Compradores WHERE UPPER(NomComprador) = UPPER('$NomComprador')";
        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe un ejecutivo de compras con ese nombre");
        }

        $sql = "INSERT INTO GEN_Compradores (NomComprador, E_MAILComprador, IdentifComprador, ACTIVO)
                VALUES ('$NomComprador', '$E_MAILComprador', '$IdentifComprador', $ACTIVO)";

        if (!$enlace->query($sql)) {
            throw new Exception("Error al insertar: " . $enlace->error);
        }

        echo json_encode(["success" => true, "message" => "Ejecutivo de compras guardado correctamente", "idComprador" => $enlace->insert_id]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
