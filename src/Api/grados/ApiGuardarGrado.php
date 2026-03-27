<?php
// src/Api/grados/ApiGuardarGrado.php
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
    // Validar campos obligatorios
    if (empty($data["NOMGRADO"])) {
        throw new Exception("El nombre del grado es obligatorio");
    }
    
    if (empty($data["TAMGRADO"])) {
        throw new Exception("El tamaño del grado es obligatorio");
    }
    
    if (empty($data["IdProducto"])) {
        throw new Exception("Debe seleccionar un producto");
    }

    // Escapar datos
    $IdProducto = intval($data["IdProducto"]);
    $NOMGRADO = $enlace->real_escape_string(trim($data["NOMGRADO"]));
    $TAMGRADO = $enlace->real_escape_string(trim($data["TAMGRADO"]));
    $ACTIVO = isset($data["ACTIVO"]) && $data["ACTIVO"] ? 1 : 0;

    // Validar longitud máxima
    if (strlen($NOMGRADO) > 20) {
        throw new Exception("El nombre del grado no puede exceder 20 caracteres");
    }
    
    if (strlen($TAMGRADO) > 10) {
        throw new Exception("El tamaño no puede exceder 10 caracteres");
    }

    // Validar que el producto exista y esté activo
    $sqlVerificarProducto = "SELECT IdProducto FROM GEN_Productos WHERE IdProducto = $IdProducto AND ACTIVO = 1";
    $resultProducto = $enlace->query($sqlVerificarProducto);
    if (!$resultProducto || $resultProducto->num_rows === 0) {
        throw new Exception("El producto seleccionado no existe o está inactivo");
    }

    // Validar nombre único POR PRODUCTO
    $idExcluir = isset($data["IdGrado"]) ? intval($data["IdGrado"]) : 0;
    $sqlVerificar = "SELECT IdGrado FROM GEN_Grados 
                     WHERE UPPER(NOMGRADO) = UPPER('$NOMGRADO') 
                     AND IdProducto = $IdProducto";

    if ($idExcluir > 0) {
        $sqlVerificar .= " AND IdGrado != $idExcluir";
    }

    $result = $enlace->query($sqlVerificar);
    if ($result && $result->num_rows > 0) {
        throw new Exception("Ya existe un grado con ese nombre para este producto");
    }

    if (isset($data["IdGrado"]) && !empty($data["IdGrado"])) {
        // ACTUALIZAR
        $idGrado = intval($data["IdGrado"]);

        $sql = "UPDATE GEN_Grados SET 
                IdProducto = $IdProducto,
                NOMGRADO = '$NOMGRADO',
                TAMGRADO = '$TAMGRADO',
                ACTIVO = $ACTIVO
                WHERE IdGrado = $idGrado";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al actualizar grado: " . $enlace->error);
        }

        $idGradoResultado = $idGrado;
    } else {
        // CREAR
        $sql = "INSERT INTO GEN_Grados 
                (IdProducto, NOMGRADO, TAMGRADO, ACTIVO) 
                VALUES (
                $IdProducto,
                '$NOMGRADO',
                '$TAMGRADO',
                $ACTIVO)";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al crear grado: " . $enlace->error);
        }

        $idGradoResultado = $enlace->insert_id;
    }

    echo json_encode([
        "success" => true,
        "message" => isset($data["IdGrado"]) ? "Grado actualizado correctamente" : "Grado creado correctamente",
        "idGrado" => $idGradoResultado
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