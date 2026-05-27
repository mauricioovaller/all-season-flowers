<?php
// ApiGuardarProducto.php
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
    // Validar campo obligatorio
    if (empty($data["NOMPRODUCTO"])) {
        throw new Exception("El nombre del producto es obligatorio");
    }

    // Escapar datos
    $NOMPRODUCTO = $enlace->real_escape_string(trim($data["NOMPRODUCTO"]));
    $TAXRECORD = $enlace->real_escape_string($data["TAXRECORD"] ?? '');
    $NOMIMPRESION = $enlace->real_escape_string($data["NOMIMPRESION"] ?? '');
    $ACTIVO = isset($data["ACTIVO"]) && $data["ACTIVO"] ? 1 : 0;

    // Validar longitud máxima
    if (strlen($NOMPRODUCTO) > 20) {
        throw new Exception("El nombre del producto no puede exceder 20 caracteres");
    }
    
    if (strlen($TAXRECORD) > 10) {
        throw new Exception("El registro tributario no puede exceder 10 caracteres");
    }
    
    if (strlen($NOMIMPRESION) > 20) {
        throw new Exception("El nombre para impresión no puede exceder 20 caracteres");
    }

    // Validar nombre único
    $idExcluir = isset($data["IdProducto"]) ? intval($data["IdProducto"]) : 0;
    $sqlVerificar = "SELECT IdProducto FROM GEN_Productos WHERE UPPER(NOMPRODUCTO) = UPPER('$NOMPRODUCTO')";

    if ($idExcluir > 0) {
        $sqlVerificar .= " AND IdProducto != $idExcluir";
    }

    $result = $enlace->query($sqlVerificar);
    if ($result && $result->num_rows > 0) {
        throw new Exception("Ya existe un producto con ese nombre");
    }

    if (isset($data["IdProducto"]) && !empty($data["IdProducto"])) {
        // ACTUALIZAR
        $idProducto = intval($data["IdProducto"]);

        $sql = "UPDATE GEN_Productos SET 
                NOMPRODUCTO = '$NOMPRODUCTO',
                TAXRECORD = '$TAXRECORD',
                NOMIMPRESION = '$NOMIMPRESION',
                ACTIVO = $ACTIVO
                WHERE IdProducto = $idProducto";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al actualizar producto: " . $enlace->error);
        }

        $idProductoResultado = $idProducto;
    } else {
        // CREAR
        $sql = "INSERT INTO GEN_Productos 
                (NOMPRODUCTO, TAXRECORD, NOMIMPRESION, ACTIVO) 
                VALUES (
                '$NOMPRODUCTO',
                '$TAXRECORD',
                '$NOMIMPRESION',
                $ACTIVO)";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al crear producto: " . $enlace->error);
        }

        $idProductoResultado = $enlace->insert_id;
    }

    echo json_encode([
        "success" => true,
        "message" => isset($data["IdProducto"]) ? "Producto actualizado correctamente" : "Producto creado correctamente",
        "idProducto" => $idProductoResultado
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