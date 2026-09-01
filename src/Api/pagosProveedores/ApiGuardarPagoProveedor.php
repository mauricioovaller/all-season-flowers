<?php
// src/Api/pagosProveedores/ApiGuardarPagoProveedor.php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "MÃ©todo no permitido"]);
    exit;
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexiÃ³n"]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || !isset($data['encabezado']) || !isset($data['compras'])) {
    echo json_encode(["success" => false, "message" => "No se recibieron datos"]);
    exit;
}

$enc     = $data['encabezado'];
$compras = $data['compras'];

// Campos que existen realmente en SAS_EncabPagoProveedor
$idEncabPagoProveedor = isset($enc['idPagoProveedor']) ? intval($enc['idPagoProveedor']) : 0;
$fechaPago            = $enc['fecha'] ?? "";
$idProveedor          = isset($enc['idProveedor']) ? intval($enc['idProveedor']) : 0;
$medioPago            = isset($enc['idMedioPago']) ? intval($enc['idMedioPago']) : 0;
$idMoneda             = isset($enc['idMoneda']) ? intval($enc['idMoneda']) : 0;
$trm                  = isset($enc['trm']) ? floatval($enc['trm']) : 1;
$observaciones        = $enc['observaciones'] ?? "";

if (empty($fechaPago) || !$idProveedor || !$idMoneda || !$medioPago || empty($compras)) {
    echo json_encode(["success" => false, "message" => "Faltan datos requeridos"]);
    exit;
}

$valorTotalPago = 0;
foreach ($compras as $c) {
    $valorTotalPago += floatval($c['valorPago'] ?? 0);
}

if ($valorTotalPago <= 0) {
    echo json_encode(["success" => false, "message" => "El valor total del pago debe ser mayor a cero"]);
    exit;
}

$enlace->begin_transaction();

try {
    // Validar saldo disponible por cada compra
    $idLegacyActualizados = [];

    foreach ($compras as $c) {
        $idC        = intval($c['idCompra'] ?? 0);
        $valorPagoC = floatval($c['valorPago'] ?? 0);
        $esLegacy   = !empty($c['esLegacy']);

        if ($idC <= 0 || $valorPagoC <= 0) continue;

        if ($esLegacy) {
            // ── COMPRA LEGACY ──
            $sqlLegacy = "SELECT leg.IdLegacyMovimiento, leg.IdMoneda, leg.IdEntidad,
                                 leg.Valor, leg.Credito, leg.Pago,
                                 (leg.Valor - leg.Credito - leg.Pago) as saldoPendiente
                          FROM SAS_LegacyMovimientos leg
                          WHERE leg.Tipo = 'P'
                            AND leg.IdLegacyMovimiento = ?
                            AND leg.Anulado = 0
                          LIMIT 1";
            $stmtLeg = $enlace->prepare($sqlLegacy);
            if (!$stmtLeg) throw new Exception("Error preparando consulta legacy: " . $enlace->error);
            $stmtLeg->bind_param("i", $idC);
            $stmtLeg->execute();
            $stmtLeg->bind_result($idLegMov, $idMonedaLeg, $idProvLeg, $valorLeg, $creditoLeg, $pagoLeg, $saldoLeg);
            if (!$stmtLeg->fetch()) {
                $stmtLeg->close();
                throw new Exception("Compra legacy $idC no encontrada");
            }
            $stmtLeg->close();
            $saldo = floatval($saldoLeg);

            if ($idProvLeg != $idProveedor) {
                throw new Exception("La compra legacy no pertenece al proveedor seleccionado");
            }
            if ($idMonedaLeg != $idMoneda) {
                throw new Exception("La compra legacy tiene moneda diferente a la seleccionada para el pago");
            }
            if ($valorPagoC > ($saldo + 0.01)) {
                throw new Exception("Compra legacy: el pago ($valorPagoC) excede el saldo pendiente ($saldo)");
            }

            $idLegacyActualizados[] = $idLegMov;
        } else {
            // ── COMPRA ACTUAL ──
            $sqlSaldo = "
                SELECT
                    COALESCE((SELECT SUM(dc.Tallos_Ramo * dc.Ramos_Caja * dc.Precio_Compra)
                              FROM SAS_DetProductoCompra dc WHERE dc.IdEncabCompra = ?), 0)
                    - COALESCE((SELECT SUM(dc2.TallosDevolucion * dc2.Precio_Compra)
                                FROM SAS_DetProductoCompra dc2
                                WHERE dc2.IdEncabCompra = ? AND dc2.TallosDevolucion > 0), 0)
                    - COALESCE((SELECT SUM(dpp.ValorPago)
                                FROM SAS_DetPagoProveedor dpp
                                WHERE dpp.IdEncabCompra = ? AND dpp.Anulado = 0
                                AND dpp.IdEncabPagoProveedor != ?), 0)
                    as saldo
            ";

            $stmtS = $enlace->prepare($sqlSaldo);
            if (!$stmtS) throw new Exception("Error preparando saldo: " . $enlace->error);
            $stmtS->bind_param("iiii", $idC, $idC, $idC, $idEncabPagoProveedor);
            $stmtS->execute();
            $stmtS->bind_result($saldo);
            $stmtS->fetch();
            $stmtS->close();

            if ($valorPagoC > ($saldo + 0.01)) {
                $numCompra = "COMP-" . str_pad($idC, 6, "0", STR_PAD_LEFT);
                throw new Exception("Compra $numCompra: el pago (" . number_format($valorPagoC, 2) . ") excede el saldo pendiente (" . number_format($saldo, 2) . ")");
            }
        }
    }

    if ($idEncabPagoProveedor > 0) {
        // ACTUALIZAR pago existente
        // Columnas reales: FechaPago, IdProveedor, MedioPago, IdMoneda, TRM, Observaciones
        $sqlUpdate = "UPDATE SAS_EncabPagoProveedor
                      SET FechaPago=?, IdProveedor=?, MedioPago=?, IdMoneda=?, TRM=?, Observaciones=?
                      WHERE IdEncabPagoProveedor=?";
        $stmtU = $enlace->prepare($sqlUpdate);
        if (!$stmtU) throw new Exception("Error preparando actualizaciÃ³n: " . $enlace->error);
        $stmtU->bind_param(
            "siiidsi",
            $fechaPago,
            $idProveedor,
            $medioPago,
            $idMoneda,
            $trm,
            $observaciones,
            $idEncabPagoProveedor
        );
        $stmtU->execute();
        if ($stmtU->errno) throw new Exception("Error actualizando encabezado: " . $stmtU->error);
        $stmtU->close();

        // Anular detalles anteriores
        $sqlAnular = "UPDATE SAS_DetPagoProveedor SET Anulado=1 WHERE IdEncabPagoProveedor=?";
        $stmtA = $enlace->prepare($sqlAnular);
        if (!$stmtA) throw new Exception("Error preparando anulaciÃ³n de detalles: " . $enlace->error);
        $stmtA->bind_param("i", $idEncabPagoProveedor);
        $stmtA->execute();
        $stmtA->close();
    } else {
        // INSERTAR nuevo pago â€” IdEncabPagoProveedor es auto_increment
        // Columnas reales: IdProveedor, FechaPago, MedioPago, IdMoneda, TRM, Observaciones, Anulado
        $sqlInsert = "INSERT INTO SAS_EncabPagoProveedor
                      (IdProveedor, FechaPago, MedioPago, IdMoneda, TRM, Observaciones, Anulado)
                      VALUES (?,?,?,?,?,?,0)";
        $stmtI = $enlace->prepare($sqlInsert);
        if (!$stmtI) throw new Exception("Error preparando inserciÃ³n: " . $enlace->error);
        $stmtI->bind_param(
            "isiids",
            $idProveedor,
            $fechaPago,
            $medioPago,
            $idMoneda,
            $trm,
            $observaciones
        );
        $stmtI->execute();
        if ($stmtI->errno) throw new Exception("Error insertando encabezado: " . $stmtI->error);
        $idEncabPagoProveedor = $enlace->insert_id;
        $stmtI->close();
    }

    $numeroPago = "PAG-PROV-" . str_pad($idEncabPagoProveedor, 6, "0", STR_PAD_LEFT);

    // Insertar una fila en SAS_DetPagoProveedor por cada compra
    // Columnas reales: IdEncabPagoProveedor, IdEncabCompra, ValorPago, Anulado
    foreach ($compras as $c) {
        $idC        = intval($c['idCompra'] ?? 0);
        $valorPagoC = floatval($c['valorPago'] ?? 0);
        $esLegacy   = !empty($c['esLegacy']);
        if ($idC <= 0 || $valorPagoC <= 0) continue;

        // Para compras legacy, usar ID negativo para evitar conflicto con compras reales
        $idCompraAlmacenar = $esLegacy ? (-$idC) : $idC;

        $sqlDet = "INSERT INTO SAS_DetPagoProveedor (IdEncabPagoProveedor, IdEncabCompra, ValorPago, Anulado)
                   VALUES (?,?,?,0)";
        $stmtDet = $enlace->prepare($sqlDet);
        if (!$stmtDet) throw new Exception("Error preparando detalle: " . $enlace->error);
        $stmtDet->bind_param("iid", $idEncabPagoProveedor, $idCompraAlmacenar, $valorPagoC);
        $stmtDet->execute();
        if ($stmtDet->errno) throw new Exception("Error insertando detalle: " . $stmtDet->error);
        $stmtDet->close();
    }

    // 5. Actualizar Pago en SAS_LegacyMovimientos para compras legacy
    foreach ($idLegacyActualizados as $idLegMov) {
        $sqlRecalcPago = "
            UPDATE SAS_LegacyMovimientos leg
            SET leg.Pago = COALESCE((
                SELECT SUM(dpp.ValorPago)
                FROM SAS_DetPagoProveedor dpp
                WHERE dpp.IdEncabCompra = (-leg.IdLegacyMovimiento)
                  AND dpp.Anulado = 0
            ), 0)
            WHERE leg.IdLegacyMovimiento = ?";
        $stmtRecalc = $enlace->prepare($sqlRecalcPago);
        if (!$stmtRecalc) throw new Exception("Error preparando actualización pago legacy: " . $enlace->error);
        $stmtRecalc->bind_param("i", $idLegMov);
        $stmtRecalc->execute();
        if ($stmtRecalc->errno) throw new Exception("Error actualizando pago legacy: " . $stmtRecalc->error);
        $stmtRecalc->close();
    }

    $enlace->commit();

    echo json_encode([
        "success"         => true,
        "message"         => isset($data['encabezado']['idPagoProveedor']) && $data['encabezado']['idPagoProveedor'] > 0
            ? "Pago actualizado correctamente"
            : "Pago guardado correctamente",
        "idPagoProveedor" => $idEncabPagoProveedor,
        "numeroPago"      => $numeroPago
    ]);
} catch (Exception $e) {
    $enlace->rollback();
    error_log("Error en ApiGuardarPagoProveedor.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} finally {
    if (isset($enlace)) $enlace->close();
}
