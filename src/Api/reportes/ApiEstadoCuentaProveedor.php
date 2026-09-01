<?php
// src/Api/reportes/ApiEstadoCuentaProveedor.php - Estado de cuenta por proveedor
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

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['idProveedor']) || !isset($data['fechaInicio']) || !isset($data['fechaFin'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos. Se requiere idProveedor, fechaInicio y fechaFin"]);
    exit;
}

$idProveedor = intval($data['idProveedor']);
$fechaInicio = $data['fechaInicio'];
$fechaFin    = $data['fechaFin'];

if ($idProveedor <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "idProveedor inválido"]);
    exit;
}

try {
    // 1. Obtener nombre del proveedor
    $sqlProveedor = "SELECT IdProveedor, Proveedor FROM GEN_Proveedores WHERE IdProveedor = ? LIMIT 1";
    $stmtProv = $enlace->prepare($sqlProveedor);
    if (!$stmtProv) {
        throw new Exception("Error preparando consulta proveedor: " . $enlace->error);
    }
    $stmtProv->bind_param("i", $idProveedor);
    $stmtProv->execute();
    $stmtProv->bind_result($pId, $pNombre);
    if (!$stmtProv->fetch()) {
        $stmtProv->close();
        echo json_encode(["success" => false, "message" => "Proveedor no encontrado"]);
        exit;
    }
    $stmtProv->close();

    // 2. Obtener movimientos: un registro por compra (actuales + legacy)
    $sqlMovimientos = "
        (
            SELECT
                ec.IdEncabCompra AS documento,
                ec.FechaEntrega,
                ec.IdMoneda,
                COALESCE(m.Moneda, 'Sin moneda') AS moneda,
                COALESCE(ec.TRM, 1)              AS trm,
                COALESCE((
                    SELECT SUM(
                        IF(dpc.IdUnidad = 4,
                           dek.Cantidad * dpc.Tallos_Ramo * dpc.Ramos_Caja * dpc.Precio_Compra,
                           dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Compra)
                    )
                    FROM SAS_DetEmpaqueCompra dek
                    INNER JOIN SAS_DetProductoCompra dpc ON dek.IdDetEmpaque = dpc.IdDetEmpaque
                    WHERE dek.IdEncabCompra = ec.IdEncabCompra
                      AND dek.Anulado = 0
                      AND dpc.Anulado = 0
                ), 0) AS valorCompra,
                COALESCE((
                    SELECT SUM(dc2.TallosDevolucion * dc2.Precio_Compra)
                    FROM SAS_DetProductoCompra dc2
                    WHERE dc2.IdEncabCompra = ec.IdEncabCompra
                      AND dc2.TallosDevolucion > 0
                      AND dc2.Anulado = 0
                ), 0) AS valorDevolucion,
                COALESCE((
                    SELECT SUM(dpago.ValorPago)
                    FROM SAS_DetPagoProveedor dpago
                    WHERE dpago.IdEncabCompra = ec.IdEncabCompra
                      AND dpago.Anulado = 0
                ), 0) AS valorPagado,
                0 AS esLegacy
            FROM SAS_EncabCompra ec
            LEFT JOIN GEN_Monedas m ON ec.IdMoneda = m.IdMoneda
            WHERE ec.IdProveedor   = ?
              AND ec.Anulado       = 0
              AND ec.FechaEntrega  BETWEEN ? AND ?
        )
        UNION ALL
        (
            SELECT
                CAST(leg.NumeroDocumento AS UNSIGNED) AS documento,
                leg.Fecha AS FechaEntrega,
                COALESCE(leg.IdMoneda, 1) AS IdMoneda,
                COALESCE(m.Moneda, 'Sin moneda') AS moneda,
                COALESCE(leg.TRM, 1) AS trm,
                leg.Valor AS valorCompra,
                leg.Credito AS valorDevolucion,
                leg.Pago AS valorPagado,
                1 AS esLegacy
            FROM SAS_LegacyMovimientos leg
            LEFT JOIN GEN_Monedas m ON leg.IdMoneda = m.IdMoneda
            WHERE leg.Tipo = 'P'
              AND leg.IdEntidad = ?
              AND leg.Anulado = 0
              AND leg.Fecha BETWEEN ? AND ?
        )
        ORDER BY FechaEntrega ASC, documento ASC
    ";

    $stmtMov = $enlace->prepare($sqlMovimientos);
    if (!$stmtMov) {
        throw new Exception("Error preparando consulta movimientos: " . $enlace->error);
    }
    $stmtMov->bind_param("ississ", $idProveedor, $fechaInicio, $fechaFin, $idProveedor, $fechaInicio, $fechaFin);
    $stmtMov->execute();
    $stmtMov->bind_result(
        $idEncabCompra,
        $fechaEntrega,
        $idMoneda,
        $moneda,
        $trm,
        $valorCompra,
        $valorDevolucion,
        $valorPagado,
        $esLegacy
    );

    $movimientos      = [];
    $totValorUSD      = 0;
    $totValorCOP      = 0;
    $totDevUSD        = 0;
    $totDevCOP        = 0;
    $totPagUSD        = 0;
    $totPagCOP        = 0;

    while ($stmtMov->fetch()) {
        $vBase  = floatval($valorCompra);
        $vDev   = floatval($valorDevolucion);
        $vPago  = floatval($valorPagado);
        $vTrm   = floatval($trm) > 0 ? floatval($trm) : 1;
        $esCOP  = mb_stripos($moneda, 'peso colombiano') !== false;

        if ($esCOP) {
            $vUSD  = $vTrm > 0 ? round($vBase / $vTrm, 4) : 0;
            $vCOP  = $vBase;
            $dUSD  = $vTrm > 0 ? round($vDev  / $vTrm, 4) : 0;
            $dCOP  = $vDev;
            $pUSD  = $vTrm > 0 ? round($vPago / $vTrm, 4) : 0;
            $pCOP  = $vPago;
            $sCOP  = round($vBase - $vDev - $vPago, 4);
            $sUSD  = $vTrm > 0 ? round($sCOP / $vTrm, 4) : 0;
        } else {
            $vUSD  = $vBase;
            $vCOP  = round($vBase  * $vTrm, 2);
            $dUSD  = $vDev;
            $dCOP  = round($vDev   * $vTrm, 2);
            $pUSD  = $vPago;
            $pCOP  = round($vPago  * $vTrm, 2);
            $sUSD  = round($vBase - $vDev - $vPago, 4);
            $sCOP  = round($sUSD  * $vTrm, 2);
        }

        $idComp = intval($idEncabCompra);

        $movimientos[] = [
            'idCompra'       => $idComp,
            'numeroCompra'   => 'COMP-' . str_pad($idComp, 6, '0', STR_PAD_LEFT),
            'fechaEntrega'   => $fechaEntrega ? substr($fechaEntrega, 0, 10) : '',
            'idMoneda'       => intval($idMoneda),
            'moneda'         => $moneda,
            'trm'            => $vTrm,
            'esCOP'          => $esCOP,
            'esLegacy'       => (bool)$esLegacy,
            'valorUSD'       => $vUSD,
            'valorCOP'       => $vCOP,
            'devolucionUSD'  => $dUSD,
            'devolucionCOP'  => $dCOP,
            'pagadoUSD'      => $pUSD,
            'pagadoCOP'      => $pCOP,
            'saldoUSD'       => $sUSD,
            'saldoCOP'       => $sCOP,
        ];

        $totValorUSD += $vUSD;
        $totValorCOP += $vCOP;
        $totDevUSD   += $dUSD;
        $totDevCOP   += $dCOP;
        $totPagUSD   += $pUSD;
        $totPagCOP   += $pCOP;
    }
    $stmtMov->close();

    $totSaldoUSD = $totValorUSD - $totDevUSD - $totPagUSD;
    $totSaldoCOP = $totValorCOP - $totDevCOP - $totPagCOP;

    echo json_encode([
        "success"      => true,
        "empresa"      => [
            "nombre"    => EMPRESA_NOMBRE,
            "nombreLargo" => EMPRESA_NOMBRE,
            "titulo"    => EMPRESA_NOMBRE_TITULO,
            "lema"      => EMPRESA_LEMA,
            "iniciales" => EMPRESA_INICIALES,
            "nit"       => EMPRESA_NIT,
            "logoPath"  => APP_BASE_PATH . 'img/' . basename(EMPRESA_LOGO_PATH),
            "direccion" => EMPRESA_DIRECCION,
            "telefono"  => EMPRESA_TELEFONO,
            "email"     => EMPRESA_EMAIL,
        ],
        "proveedor"    => ["id" => intval($pId), "nombre" => $pNombre],
        "movimientos"  => $movimientos,
        "totales"      => [
            "valorUSD"      => round($totValorUSD, 4),
            "valorCOP"      => round($totValorCOP, 2),
            "devolucionUSD" => round($totDevUSD, 4),
            "devolucionCOP" => round($totDevCOP, 2),
            "pagadoUSD"     => round($totPagUSD, 4),
            "pagadoCOP"     => round($totPagCOP, 2),
            "saldoUSD"      => round($totSaldoUSD, 4),
            "saldoCOP"      => round($totSaldoCOP, 2),
        ],
    ]);
} catch (Exception $e) {
    error_log("Error en ApiEstadoCuentaProveedor.php: " . $e->getMessage());
    if (isset($enlace)) {
        $enlace->close();
    }
    echo json_encode(["success" => false, "message" => "Error interno: " . $e->getMessage()]);
}
