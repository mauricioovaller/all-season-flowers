<?php
// src/Api/compras/ApiAnularCompra.php - Anular una compra (soft delete con Anulado = 1)
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

$idCompra = isset($data["idCompra"]) ? intval($data["idCompra"]) : 0;
$motivo = trim($data["motivo"] ?? "");

if ($idCompra <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de compra inválido"]);
    exit;
}

if ($motivo === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Debe indicar el motivo de la anulación"]);
    exit;
}

$enlace->begin_transaction();

try {
    // 1. Verificar que la compra existe y no está anulada
    $sqlCheck = "SELECT IdEncabCompra, Anulado, IdDevolucion FROM SAS_EncabCompra WHERE IdEncabCompra = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    if (!$stmtCheck) {
        throw new Exception("Error preparando consulta de verificación: " . $enlace->error);
    }
    $stmtCheck->bind_param("i", $idCompra);
    $stmtCheck->execute();
    $stmtCheck->bind_result($idExistente, $anulado, $idDevolucion);
    $stmtCheck->fetch();
    $stmtCheck->close();

    if (!$idExistente) {
        throw new Exception("Compra no encontrada");
    }

    if ($anulado == 1) {
        throw new Exception("La compra ya está anulada");
    }

    // 2. Bloquear si la compra tiene pagos a proveedores asociados
    $sqlPagos = "SELECT COUNT(*)
                 FROM SAS_DetPagoProveedor dpp
                 INNER JOIN SAS_EncabPagoProveedor epp ON dpp.IdEncabPagoProveedor = epp.IdEncabPagoProveedor
                 WHERE dpp.IdEncabCompra = ? AND dpp.Anulado = 0 AND epp.Anulado = 0";
    $stmtPagos = $enlace->prepare($sqlPagos);
    if (!$stmtPagos) {
        throw new Exception("Error preparando consulta de pagos: " . $enlace->error);
    }
    $stmtPagos->bind_param("i", $idCompra);
    $stmtPagos->execute();
    $stmtPagos->bind_result($cantidadPagos);
    $stmtPagos->fetch();
    $stmtPagos->close();

    if ($cantidadPagos > 0) {
        throw new Exception("No se puede anular: la compra tiene pagos a proveedores asociados. Anule primero los pagos.");
    }

    // 3. Bloquear si la compra tiene devoluciones asociadas
    if ($idDevolucion !== null && $idDevolucion > 0) {
        throw new Exception("No se puede anular: la compra tiene devoluciones asociadas. Elimine primero las devoluciones.");
    }

    $sqlDevDet = "SELECT COUNT(*)
                  FROM SAS_DetProductoCompra dpc
                  INNER JOIN SAS_DetEmpaqueCompra dek ON dpc.IdDetEmpaque = dek.IdDetEmpaque
                  WHERE dek.IdEncabCompra = ?
                    AND dpc.Anulado = 0
                    AND (dpc.TallosDevolucion > 0 OR dpc.Flete > 0 OR dpc.Fumigacion > 0 OR dpc.Otros > 0
                         OR (dpc.MotivoDevolucion IS NOT NULL AND dpc.MotivoDevolucion != ''))";
    $stmtDevDet = $enlace->prepare($sqlDevDet);
    if (!$stmtDevDet) {
        throw new Exception("Error preparando consulta de devoluciones de detalle: " . $enlace->error);
    }
    $stmtDevDet->bind_param("i", $idCompra);
    $stmtDevDet->execute();
    $stmtDevDet->bind_result($cantidadDevoluciones);
    $stmtDevDet->fetch();
    $stmtDevDet->close();

    if ($cantidadDevoluciones > 0) {
        throw new Exception("No se puede anular: la compra tiene devoluciones asociadas. Elimine primero las devoluciones.");
    }

    // 4. Marcar encabezado como anulado y guardar el motivo en Observaciones
    // (Los detalles NO se anulan: todos los reportes, estados de cuenta, pagos y
    //  devoluciones filtran por el Anulado del encabezado, y así la compra anulada
    //  sigue siendo visible en modo solo lectura con su detalle completo.)
    $sqlUpdate = "UPDATE SAS_EncabCompra
                  SET Anulado = 1,
                      Observaciones = CONCAT_WS('\n', NULLIF(TRIM(COALESCE(Observaciones, '')), ''),
                                                CONCAT('[ANULADO ', NOW(), '] ', ?))
                  WHERE IdEncabCompra = ?";
    $stmtUpdate = $enlace->prepare($sqlUpdate);
    if (!$stmtUpdate) {
        throw new Exception("Error preparando actualización de la compra: " . $enlace->error);
    }
    $stmtUpdate->bind_param("si", $motivo, $idCompra);
    $stmtUpdate->execute();

    if ($stmtUpdate->errno) {
        throw new Exception("Error al anular la compra: " . $stmtUpdate->error);
    }
    $stmtUpdate->close();

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "message" => "Compra anulada correctamente",
        "idEncabCompra" => $idCompra
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    $enlace->rollback();
    error_log("Error en ApiAnularCompra.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} finally {
    if (isset($enlace)) $enlace->close();
}
