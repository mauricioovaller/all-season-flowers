<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

// Validar datos requeridos
if (!isset($input['idPedido']) || !isset($input['numeroPlanilla'])) {
    http_response_code(400);
    echo json_encode(["error" => "Datos incompletos: idPedido y numeroPlanilla son requeridos"]);
    exit;
}

$idPedido = (int) $input['idPedido'];
$numeroPlanillaStr = $input['numeroPlanilla'];

// Extraer solo los números de "PLAN-0001"
if (is_string($numeroPlanillaStr)) {
    preg_match('/\d+/', $numeroPlanillaStr, $matches);
    $numeroPlanilla = isset($matches[0]) ? (int)$matches[0] : 0;
} else {
    $numeroPlanilla = (int) $numeroPlanillaStr;
}

// Validar que tenemos un número válido
if ($numeroPlanilla <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Número de planilla inválido"]);
    exit;
}

// Datos opcionales de la planilla
$conductorId = isset($input['conductorId']) ? (int)$input['conductorId'] : 0;
$ayudanteId = isset($input['ayudanteId']) ? (int)$input['ayudanteId'] : 0;
$placa = isset($input['placa']) ? $enlace->real_escape_string(trim($input['placa'])) : '';
$precinto = isset($input['precinto']) ? $enlace->real_escape_string(trim($input['precinto'])) : '0';

$fechaPlanilla = date('Y-m-d H:i:s');

try {
    // Iniciar transacción
    $enlace->begin_transaction();

    // 1. Actualizar el pedido con el número de planilla y datos adicionales
    $query1 = "UPDATE SAS_EncabPedido 
               SET NoPlanilla = ?, 
                   IdConductor = ?,
                   IdAyudante = ?,
                   Placa = ?,
                   Precinto = ?,
                   Estado = CASE WHEN Estado = 'Facturado' THEN 'Planillado' ELSE Estado END
               WHERE IdEncabPedido = ?";

    $stmt1 = $enlace->prepare($query1);
    $stmt1->bind_param(
        "iiissi",
        $numeroPlanilla,
        $conductorId,
        $ayudanteId,
        $placa,
        $precinto,
        $idPedido
    );

    if (!$stmt1->execute()) {
        throw new Exception("Error al actualizar pedido: " . $stmt1->error);
    }

    // Verificar si se actualizó alguna fila
    if ($stmt1->affected_rows === 0) {
        throw new Exception("No se encontró el pedido con ID: $idPedido");
    }

    // 2. Insertar registro en tabla de planillas (si existe)
    // Primero verificar si existe la tabla SAS_Planillas
    $checkTable = "SHOW TABLES LIKE 'SAS_Planillas'";
    $tableResult = $enlace->query($checkTable);

    if ($tableResult && $tableResult->num_rows > 0) {
        // La tabla existe, insertar registro
        $query2 = "INSERT INTO SAS_Planillas 
                   (IdEncabPedido, NumeroPlanilla, IdConductor, IdAyudante, Placa, Precinto, FechaGeneracion)
                   VALUES (?, ?, ?, ?, ?, ?, ?)
                   ON DUPLICATE KEY UPDATE
                   IdConductor = VALUES(IdConductor),
                   IdAyudante = VALUES(IdAyudante),
                   Placa = VALUES(Placa),
                   Precinto = VALUES(Precinto),
                   FechaGeneracion = VALUES(FechaGeneracion)";

        $stmt2 = $enlace->prepare($query2);
        $stmt2->bind_param(
            "iiiisss",
            $idPedido,
            $numeroPlanilla,
            $conductorId,
            $ayudanteId,
            $placa,
            $precinto,
            $fechaPlanilla
        );

        if (!$stmt2->execute()) {
            throw new Exception("Error al insertar en SAS_Planillas: " . $stmt2->error);
        }
    }

    // Confirmar transacción
    $enlace->commit();

    // Formatear el número para la respuesta
    $numeroPlanillaFormateado = "PLAN-" . str_pad($numeroPlanilla, 4, '0', STR_PAD_LEFT);

    echo json_encode([
        'success' => true,
        'message' => 'Planilla generada correctamente',
        'numeroPlanilla' => $numeroPlanillaFormateado,
        'numeroPlanillaInt' => $numeroPlanilla,
        'fechaPlanilla' => $fechaPlanilla,
        'idPedido' => $idPedido,
        'conductorId' => $conductorId,
        'ayudanteId' => $ayudanteId,
        'placa' => $placa,
        'precinto' => $precinto,
        'affectedRows' => $stmt1->affected_rows
    ]);
} catch (Exception $e) {
    // Revertir transacción en caso de error
    if (isset($enlace) && $enlace) {
        $enlace->rollback();
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'queryError' => isset($stmt1) ? $stmt1->error : null
    ]);
}

if (isset($enlace) && $enlace) {
    $enlace->close();
}
