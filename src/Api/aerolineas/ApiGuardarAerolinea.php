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

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos JSON no válidos"]);
    exit;
}

try {
    if (empty($data["NOMAEROLINEA"])) {
        throw new Exception("El nombre de la aerolínea es obligatorio");
    }

    $NOMAEROLINEA      = $enlace->real_escape_string(trim($data["NOMAEROLINEA"]));
    $CODAEROLINEA      = $enlace->real_escape_string(strtoupper(trim($data["CODAEROLINEA"] ?? '')));
    $DIRAEROLINEA      = $enlace->real_escape_string($data["DIRAEROLINEA"] ?? '');
    $TELAEROLINEA      = $enlace->real_escape_string($data["TELAEROLINEA"] ?? '');
    $E_MAILAEROLINEA   = $enlace->real_escape_string($data["E_MAILAEROLINEA"] ?? '');
    $CONTACTOAEROLINEA = $enlace->real_escape_string($data["CONTACTOAEROLINEA"] ?? '');

    if (isset($data["IdAerolinea"]) && !empty($data["IdAerolinea"])) {
        // ACTUALIZAR
        $idAerolinea = intval($data["IdAerolinea"]);

        $sqlVerificar = "SELECT IdAerolinea FROM GEN_Aerolineas WHERE UPPER(NOMAEROLINEA) = UPPER('$NOMAEROLINEA') AND IdAerolinea != $idAerolinea";
        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe una aerolínea con ese nombre");
        }

        $sql = "UPDATE GEN_Aerolineas SET
                NOMAEROLINEA      = '$NOMAEROLINEA',
                CODAEROLINEA      = '$CODAEROLINEA',
                DIRAEROLINEA      = '$DIRAEROLINEA',
                TELAEROLINEA      = '$TELAEROLINEA',
                E_MAILAEROLINEA   = '$E_MAILAEROLINEA',
                CONTACTOAEROLINEA = '$CONTACTOAEROLINEA'
                WHERE IdAerolinea = $idAerolinea";

        if (!$enlace->query($sql)) {
            throw new Exception("Error al actualizar: " . $enlace->error);
        }

        echo json_encode(["success" => true, "message" => "Aerolínea actualizada correctamente", "idAerolinea" => $idAerolinea]);
    } else {
        // INSERTAR
        $sqlVerificar = "SELECT IdAerolinea FROM GEN_Aerolineas WHERE UPPER(NOMAEROLINEA) = UPPER('$NOMAEROLINEA')";
        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe una aerolínea con ese nombre");
        }

        $sql = "INSERT INTO GEN_Aerolineas (NOMAEROLINEA, CODAEROLINEA, DIRAEROLINEA, TELAEROLINEA, E_MAILAEROLINEA, CONTACTOAEROLINEA)
                VALUES ('$NOMAEROLINEA', '$CODAEROLINEA', '$DIRAEROLINEA', '$TELAEROLINEA', '$E_MAILAEROLINEA', '$CONTACTOAEROLINEA')";

        if (!$enlace->query($sql)) {
            throw new Exception("Error al insertar: " . $enlace->error);
        }

        echo json_encode(["success" => true, "message" => "Aerolínea guardada correctamente", "idAerolinea" => $enlace->insert_id]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
