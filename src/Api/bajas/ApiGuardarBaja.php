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

function limpiar_texto($txt) { return trim($txt); }
function validar_entero($valor) {
    if ($valor === null || $valor === '') return 0;
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : 0;
}
function validar_tinyint($valor) {
    return ($valor === true || $valor === 1 || $valor === '1') ? 1 : 0;
}

$encabezado = $data["encabezado"] ?? [];
$detalles = $data["detalles"] ?? [];

if (empty($encabezado) || empty($detalles)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios"]);
    exit;
}

try {
    $enlace->begin_transaction();

    $esActualizacion = isset($encabezado["IdEncabBaja"]) && !empty($encabezado["IdEncabBaja"]);

    if ($esActualizacion) {
        $idEncabBaja = validar_entero($encabezado["IdEncabBaja"]);

        $sqlEnc = "UPDATE SAS_EncabBaja SET
            Fecha = ?,
            MotivoGeneral = ?,
            Observaciones = ?,
            QuienAutoriza = ?,
            Anulado = ?
            WHERE IdEncabBaja = ?";

        $stmtEnc = $enlace->prepare($sqlEnc);
        $Fecha = limpiar_texto($encabezado["Fecha"]);
        $MotivoGeneral = limpiar_texto($encabezado["MotivoGeneral"]);
        $Observaciones = limpiar_texto($encabezado["Observaciones"] ?? "");
        $QuienAutoriza = limpiar_texto($encabezado["QuienAutoriza"] ?? "");
        $Anulado = validar_tinyint($encabezado["Anulado"] ?? 0);

        $stmtEnc->bind_param("ssssii", $Fecha, $MotivoGeneral, $Observaciones, $QuienAutoriza, $Anulado, $idEncabBaja);
        $stmtEnc->execute();

        if ($stmtEnc->errno) {
            throw new Exception("Error al actualizar encabezado: " . $stmtEnc->error);
        }

        $sqlDelete = "DELETE FROM SAS_DetBaja WHERE IdEncabBaja = ?";
        $stmtDelete = $enlace->prepare($sqlDelete);
        $stmtDelete->bind_param("i", $idEncabBaja);
        $stmtDelete->execute();
        $stmtDelete->close();

    } else {
        $sqlEnc = "INSERT INTO SAS_EncabBaja (Fecha, MotivoGeneral, Observaciones, QuienAutoriza, Anulado)
            VALUES (?, ?, ?, ?, 0)";

        $stmtEnc = $enlace->prepare($sqlEnc);
        $Fecha = limpiar_texto($encabezado["Fecha"]);
        $MotivoGeneral = limpiar_texto($encabezado["MotivoGeneral"]);
        $Observaciones = limpiar_texto($encabezado["Observaciones"] ?? "");
        $QuienAutoriza = limpiar_texto($encabezado["QuienAutoriza"] ?? "");

        $stmtEnc->bind_param("ssss", $Fecha, $MotivoGeneral, $Observaciones, $QuienAutoriza);
        $stmtEnc->execute();

        if ($stmtEnc->affected_rows <= 0) {
            throw new Exception("Error al insertar el encabezado de baja");
        }

        $idEncabBaja = $enlace->insert_id;
    }

    $sqlDet = "INSERT INTO SAS_DetBaja (IdEncabBaja, IdProducto, IdVariedad, IdGrado, Tallos, MotivoSalida)
        VALUES (?, ?, ?, ?, ?, ?)";

    $stmtDet = $enlace->prepare($sqlDet);

    foreach ($detalles as $det) {
        $IdProducto = validar_entero($det["IdProducto"]);
        $IdVariedad = !empty($det["IdVariedad"]) ? validar_entero($det["IdVariedad"]) : null;
        $IdGrado = !empty($det["IdGrado"]) ? validar_entero($det["IdGrado"]) : null;
        $Tallos = validar_entero($det["Tallos"]);
        $MotivoSalida = limpiar_texto($det["MotivoSalida"] ?? "");

        if ($IdProducto <= 0 || $Tallos <= 0) {
            throw new Exception("Producto inválido o tallos deben ser mayores a 0");
        }

        $stmtDet->bind_param("iiiiis", $idEncabBaja, $IdProducto, $IdVariedad, $IdGrado, $Tallos, $MotivoSalida);
        $stmtDet->execute();

        if ($stmtDet->affected_rows <= 0) {
            throw new Exception("Error al insertar detalle de baja");
        }
    }

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "message" => "Baja guardada correctamente",
        "idEncabBaja" => $idEncabBaja,
        "fechaRegistro" => date("Y-m-d H:i:s")
    ]);

} catch (Exception $e) {
    $enlace->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
