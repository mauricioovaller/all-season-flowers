<?php
// src/Api/ayudantes/ApiGuardarAyudante.php
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
    // Validar campo obligatorio
    if (empty($data["NomAyudante"])) {
        throw new Exception("El nombre del ayudante es obligatorio");
    }

    // Escapar datos
    $NomAyudante = $enlace->real_escape_string(trim($data["NomAyudante"]));
    $NoCedula = isset($data["NoCedula"]) && !empty($data["NoCedula"]) 
        ? intval($data["NoCedula"]) 
        : null;
    $ACTIVO = isset($data["ACTIVO"]) && $data["ACTIVO"] ? 1 : 0;

    // Validar longitud máxima
    if (strlen($NomAyudante) > 50) {
        throw new Exception("El nombre del ayudante no puede exceder 50 caracteres");
    }

    // Validar unicidad de NomAyudante
    $idExcluir = isset($data["IdAyudante"]) ? intval($data["IdAyudante"]) : 0;
    
    // Validar NomAyudante único
    $sqlVerificarNombre = "SELECT IdAyudante FROM GEN_Ayudantes 
                          WHERE UPPER(NomAyudante) = UPPER('$NomAyudante')";
    if ($idExcluir > 0) {
        $sqlVerificarNombre .= " AND IdAyudante != $idExcluir";
    }
    $result = $enlace->query($sqlVerificarNombre);
    if ($result && $result->num_rows > 0) {
        throw new Exception("Ya existe un ayudante con ese nombre");
    }    

    if (isset($data["IdAyudante"]) && !empty($data["IdAyudante"])) {
        // ACTUALIZAR
        $idAyudante = intval($data["IdAyudante"]);

        // Construir SET dinámico para NoCedula (puede ser NULL)
        $setCedula = $NoCedula !== null ? "NoCedula = $NoCedula" : "NoCedula = NULL";

        $sql = "UPDATE GEN_Ayudantes SET 
                NomAyudante = '$NomAyudante',
                $setCedula,
                ACTIVO = $ACTIVO
                WHERE IdAyudante = $idAyudante";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al actualizar ayudante: " . $enlace->error);
        }

        $idAyudanteResultado = $idAyudante;
    } else {
        // CREAR
        // Preparar valores para NoCedula (puede ser NULL)
        $valorCedula = $NoCedula !== null ? $NoCedula : "NULL";
        
        $sql = "INSERT INTO GEN_Ayudantes 
                (NomAyudante, NoCedula, ACTIVO) 
                VALUES (
                '$NomAyudante',
                $valorCedula,
                $ACTIVO)";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al crear ayudante: " . $enlace->error);
        }

        $idAyudanteResultado = $enlace->insert_id;
    }

    echo json_encode([
        "success" => true,
        "message" => isset($data["IdAyudante"]) ? "Ayudante actualizado correctamente" : "Ayudante creado correctamente",
        "idAyudante" => $idAyudanteResultado
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}

$enlace->close();
?>