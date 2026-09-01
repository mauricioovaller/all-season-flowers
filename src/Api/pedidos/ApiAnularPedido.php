<?php
// src/Api/pedidos/ApiAnularPedido.php - Anular un pedido (soft delete con Anulado = 1)
header("Content-Type: application/json; charset=UTF-8");

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

$idPedido = isset($data["idPedido"]) ? intval($data["idPedido"]) : 0;
$motivo = trim($data["motivo"] ?? "");

if ($idPedido <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de pedido inválido"]);
    exit;
}

if ($motivo === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Debe indicar el motivo de la anulación"]);
    exit;
}

$enlace->begin_transaction();

try {
    // 1. Verificar que el pedido existe y no está anulado
    $sqlCheck = "SELECT IdEncabPedido, Anulado, Factura FROM SAS_EncabPedido WHERE IdEncabPedido = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    if (!$stmtCheck) {
        throw new Exception("Error preparando consulta de verificación: " . $enlace->error);
    }
    $stmtCheck->bind_param("i", $idPedido);
    $stmtCheck->execute();
    $stmtCheck->bind_result($idExistente, $anulado, $factura);
    $stmtCheck->fetch();
    $stmtCheck->close();

    if (!$idExistente) {
        throw new Exception("Pedido no encontrado");
    }

    if ($anulado == 1) {
        throw new Exception("El pedido ya está anulado");
    }

    // 2. Bloquear si el pedido tiene pagos de clientes asociados (factura cobrada)
    if ($factura > 0) {
        $sqlPagos = "SELECT COUNT(*)
                     FROM SAS_DetPagoCliente dpc
                     INNER JOIN SAS_EncabPagoCliente epc ON dpc.IdEncabPagoCliente = epc.IdEncabPagoCliente
                     WHERE dpc.Invoice = ? AND dpc.Anulado = 0 AND epc.Anulado = 0";
        $stmtPagos = $enlace->prepare($sqlPagos);
        if (!$stmtPagos) {
            throw new Exception("Error preparando consulta de pagos: " . $enlace->error);
        }
        $stmtPagos->bind_param("i", $factura);
        $stmtPagos->execute();
        $stmtPagos->bind_result($cantidadPagos);
        $stmtPagos->fetch();
        $stmtPagos->close();

        if ($cantidadPagos > 0) {
            throw new Exception("No se puede anular: el pedido tiene pagos de clientes asociados. Anule primero los pagos.");
        }
    }

    // 3. Bloquear si el pedido tiene devoluciones asociadas
    $sqlDevEnc = "SELECT IdDevolucion FROM SAS_EncabPedido WHERE IdEncabPedido = ? AND IdDevolucion IS NOT NULL AND IdDevolucion > 0";
    $stmtDevEnc = $enlace->prepare($sqlDevEnc);
    if (!$stmtDevEnc) {
        throw new Exception("Error preparando consulta de devolución: " . $enlace->error);
    }
    $stmtDevEnc->bind_param("i", $idPedido);
    $stmtDevEnc->execute();
    $stmtDevEnc->store_result();
    $tieneDevolucionEnc = $stmtDevEnc->num_rows > 0;
    $stmtDevEnc->close();

    $sqlDevDet = "SELECT COUNT(*)
                  FROM SAS_DetProducto dp
                  INNER JOIN SAS_DetEmpaque de ON dp.IdDetEmpaque = de.IdDetEmpaque
                  WHERE de.IdEncabPedido = ?
                    AND dp.Anulado = 0
                    AND (dp.TallosDevolucion > 0 OR dp.Flete > 0 OR dp.Fumigacion > 0 OR dp.Otros > 0
                         OR (dp.MotivoDevolucion IS NOT NULL AND dp.MotivoDevolucion != ''))";
    $stmtDevDet = $enlace->prepare($sqlDevDet);
    if (!$stmtDevDet) {
        throw new Exception("Error preparando consulta de devoluciones de detalle: " . $enlace->error);
    }
    $stmtDevDet->bind_param("i", $idPedido);
    $stmtDevDet->execute();
    $stmtDevDet->bind_result($cantidadDevoluciones);
    $stmtDevDet->fetch();
    $stmtDevDet->close();

    if ($tieneDevolucionEnc || $cantidadDevoluciones > 0) {
        throw new Exception("No se puede anular: el pedido tiene devoluciones asociadas. Elimine primero las devoluciones.");
    }

    // 4. Marcar encabezado como anulado y guardar el motivo en Observaciones
    // (Los detalles NO se anulan: todos los reportes, estados de cuenta, pagos y
    //  devoluciones filtran por el Anulado del encabezado, y así el pedido anulado
    //  sigue siendo visible en modo solo lectura con su detalle completo.)
    $sqlUpdate = "UPDATE SAS_EncabPedido
                  SET Anulado = 1,
                      Observaciones = CONCAT_WS('\n', NULLIF(TRIM(COALESCE(Observaciones, '')), ''),
                                                CONCAT('[ANULADO ', NOW(), '] ', ?))
                  WHERE IdEncabPedido = ?";
    $stmtUpdate = $enlace->prepare($sqlUpdate);
    if (!$stmtUpdate) {
        throw new Exception("Error preparando actualización del pedido: " . $enlace->error);
    }
    $stmtUpdate->bind_param("si", $motivo, $idPedido);
    $stmtUpdate->execute();

    if ($stmtUpdate->errno) {
        throw new Exception("Error al anular el pedido: " . $stmtUpdate->error);
    }
    $stmtUpdate->close();

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "message" => "Pedido anulado correctamente",
        "idEncabPedido" => $idPedido
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    $enlace->rollback();
    error_log("Error en ApiAnularPedido.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} finally {
    if (isset($enlace)) $enlace->close();
}
