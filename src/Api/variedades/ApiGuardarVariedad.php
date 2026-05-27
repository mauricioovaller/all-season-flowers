<?php
// src/Api/variedades/ApiGuardarVariedad.php
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
    // Validar campos obligatorios
    if (empty($data["NOMVARIEDAD"])) {
        throw new Exception("El nombre de la variedad es obligatorio");
    }
    
    if (empty($data["IdProducto"])) {
        throw new Exception("Debe seleccionar un producto");
    }

    // Escapar datos
    $IdProducto = intval($data["IdProducto"]);
    $NOMVARIEDAD = $enlace->real_escape_string(trim($data["NOMVARIEDAD"]));
    $COLOR = $enlace->real_escape_string($data["COLOR"] ?? '');
    $ACTIVO = isset($data["ACTIVO"]) && $data["ACTIVO"] ? 1 : 0;

    // Validar longitud máxima
    if (strlen($NOMVARIEDAD) > 30) {
        throw new Exception("El nombre de la variedad no puede exceder 30 caracteres");
    }
    
    if (strlen($COLOR) > 5) {
        throw new Exception("El color no puede exceder 5 caracteres");
    }

    // Validar que el producto exista y esté activo
    $sqlVerificarProducto = "SELECT IdProducto FROM GEN_Productos WHERE IdProducto = $IdProducto AND ACTIVO = 1";
    $resultProducto = $enlace->query($sqlVerificarProducto);
    if (!$resultProducto || $resultProducto->num_rows === 0) {
        throw new Exception("El producto seleccionado no existe o está inactivo");
    }

    // Validar nombre único POR PRODUCTO
    $idExcluir = isset($data["IdVariedad"]) ? intval($data["IdVariedad"]) : 0;
    $sqlVerificar = "SELECT IdVariedad FROM GEN_Variedades 
                     WHERE UPPER(NOMVARIEDAD) = UPPER('$NOMVARIEDAD') 
                     AND IdProducto = $IdProducto";

    if ($idExcluir > 0) {
        $sqlVerificar .= " AND IdVariedad != $idExcluir";
    }

    $result = $enlace->query($sqlVerificar);
    if ($result && $result->num_rows > 0) {
        throw new Exception("Ya existe una variedad con ese nombre para este producto");
    }

    if (isset($data["IdVariedad"]) && !empty($data["IdVariedad"])) {
        // ACTUALIZAR
        $idVariedad = intval($data["IdVariedad"]);

        $sql = "UPDATE GEN_Variedades SET 
                IdProducto = $IdProducto,
                NOMVARIEDAD = '$NOMVARIEDAD',
                COLOR = '$COLOR',
                ACTIVO = $ACTIVO
                WHERE IdVariedad = $idVariedad";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al actualizar variedad: " . $enlace->error);
        }

        $idVariedadResultado = $idVariedad;
    } else {
        // CREAR
        $sql = "INSERT INTO GEN_Variedades 
                (IdProducto, NOMVARIEDAD, COLOR, ACTIVO) 
                VALUES (
                $IdProducto,
                '$NOMVARIEDAD',
                '$COLOR',
                $ACTIVO)";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al crear variedad: " . $enlace->error);
        }

        $idVariedadResultado = $enlace->insert_id;
    }

    echo json_encode([
        "success" => true,
        "message" => isset($data["IdVariedad"]) ? "Variedad actualizada correctamente" : "Variedad creada correctamente",
        "idVariedad" => $idVariedadResultado
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