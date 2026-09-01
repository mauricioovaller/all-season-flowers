<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

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
$destinoFinal = isset($input['destinoFinal']) ? $enlace->real_escape_string(trim($input['destinoFinal'])) : '';

$fechaPlanilla = date('Y-m-d H:i:s');

try {
    // Si destinoFinal llega vacío, calcular desde la dirección del cliente como fallback
    if (empty($destinoFinal)) {
        $queryDestino = "SELECT CONCAT(cli.Direc1, ', ', cli.CIUDAD, ', ', cli.ESTADO, ', ', cli.PAIS) AS destino_completo
                         FROM SAS_EncabPedido enc
                         LEFT JOIN GEN_Clientes cli ON enc.IdCliente = cli.IdCliente
                         WHERE enc.IdEncabPedido = ?";
        $stmtDest = $enlace->prepare($queryDestino);
        if ($stmtDest) {
            $stmtDest->bind_param("i", $idPedido);
            $stmtDest->execute();
            $stmtDest->bind_result($destinoCalc);
            if ($stmtDest->fetch() && !empty($destinoCalc)) {
                $destinoFinal = $enlace->real_escape_string($destinoCalc);
            }
            $stmtDest->close();
        }
    }

    // Iniciar transacción
    $enlace->begin_transaction();

    // 0. Guard: no planillar pedidos anulados
    $sqlAnulado = "SELECT Anulado FROM SAS_EncabPedido WHERE IdEncabPedido = ?";
    $stmtAnulado = $enlace->prepare($sqlAnulado);
    if (!$stmtAnulado) {
        throw new Exception("Error preparando consulta de anulación: " . $enlace->error);
    }
    $stmtAnulado->bind_param("i", $idPedido);
    $stmtAnulado->execute();
    $stmtAnulado->bind_result($anuladoPedido);
    $stmtAnulado->fetch();
    $stmtAnulado->close();

    if ($anuladoPedido == 1) {
        throw new Exception("No se puede planillar: el pedido está anulado");
    }

    // 1. Actualizar el pedido con el número de planilla y datos adicionales
    $query1 = "UPDATE SAS_EncabPedido 
               SET NoPlanilla = ?, 
                   IdConductor = ?,
                   IdAyudante = ?,
                   Placa = ?,
                   Precinto = ?,
                   DestinoFinal = ?,
                   Estado = CASE WHEN Estado = 'Facturado' THEN 'Planillado' ELSE Estado END
               WHERE IdEncabPedido = ?";

    $stmt1 = $enlace->prepare($query1);
    $stmt1->bind_param(
        "iiisssi",
        $numeroPlanilla,
        $conductorId,
        $ayudanteId,
        $placa,
        $precinto,
        $destinoFinal,
        $idPedido
    );

    if (!$stmt1->execute()) {
        throw new Exception("Error al actualizar pedido: " . $stmt1->error);
    }

    // Nota: affected_rows puede ser 0 si los datos no cambiaron (UPDATE sin cambios reales).
    // Si execute() fue exitoso, la fila existe. No validamos affected_rows aquí.

    // 2. Insertar registro en tabla de planillas (si existe)
    // Primero verificar si existe la tabla SAS_Planillas
    $checkTable = "SHOW TABLES LIKE 'SAS_Planillas'";
    $tableResult = $enlace->query($checkTable);

    if ($tableResult && $tableResult->num_rows > 0) {
        // La tabla existe, insertar registro
        $query2 = "INSERT INTO SAS_Planillas 
                   (IdEncabPedido, NumeroPlanilla, IdConductor, IdAyudante, Placa, Precinto, DestinoFinal, FechaGeneracion)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                   ON DUPLICATE KEY UPDATE
                   IdConductor = VALUES(IdConductor),
                   IdAyudante = VALUES(IdAyudante),
                   Placa = VALUES(Placa),
                   Precinto = VALUES(Precinto),
                   DestinoFinal = VALUES(DestinoFinal),
                   FechaGeneracion = VALUES(FechaGeneracion)";

        $stmt2 = $enlace->prepare($query2);
        $stmt2->bind_param(
            "iiiissss",
            $idPedido,
            $numeroPlanilla,
            $conductorId,
            $ayudanteId,
            $placa,
            $precinto,
            $destinoFinal,
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
