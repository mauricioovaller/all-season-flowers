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
    if (empty($data["Abreviatura"])) {
        throw new Exception("La abreviatura del empaque es obligatoria");
    }
    if (empty($data["Descripcion"])) {
        throw new Exception("La descripción del empaque es obligatoria");
    }
    if (!isset($data["EquivFull"]) || $data["EquivFull"] === '') {
        throw new Exception("El equivalente Full del empaque es obligatorio");
    }

    $Abreviatura = $enlace->real_escape_string(strtoupper(trim($data["Abreviatura"])));
    $Descripcion = $enlace->real_escape_string(trim($data["Descripcion"]));
    $EquivFull   = floatval($data["EquivFull"]);

    if (isset($data["IdTipoEmpaque"]) && !empty($data["IdTipoEmpaque"])) {
        // ACTUALIZAR
        $idTipoEmpaque = intval($data["IdTipoEmpaque"]);

        $sqlVerificar = "SELECT IdTipoEmpaque FROM GEN_TipoEmpaque WHERE UPPER(Abreviatura) = UPPER('$Abreviatura') AND IdTipoEmpaque != $idTipoEmpaque";
        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe un empaque con esa abreviatura");
        }

        $sql = "UPDATE GEN_TipoEmpaque SET
                Abreviatura = '$Abreviatura',
                Descripcion = '$Descripcion',
                EquivFull   = $EquivFull
                WHERE IdTipoEmpaque = $idTipoEmpaque";

        if (!$enlace->query($sql)) {
            throw new Exception("Error al actualizar: " . $enlace->error);
        }

        echo json_encode(["success" => true, "message" => "Empaque actualizado correctamente", "idTipoEmpaque" => $idTipoEmpaque]);
    } else {
        // INSERTAR
        $sqlVerificar = "SELECT IdTipoEmpaque FROM GEN_TipoEmpaque WHERE UPPER(Abreviatura) = UPPER('$Abreviatura')";
        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe un empaque con esa abreviatura");
        }

        $sql = "INSERT INTO GEN_TipoEmpaque (Abreviatura, Descripcion, EquivFull)
                VALUES ('$Abreviatura', '$Descripcion', $EquivFull)";

        if (!$enlace->query($sql)) {
            throw new Exception("Error al insertar: " . $enlace->error);
        }

        echo json_encode(["success" => true, "message" => "Empaque guardado correctamente", "idTipoEmpaque" => $enlace->insert_id]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
