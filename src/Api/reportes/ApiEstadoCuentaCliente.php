<?php
// src/Api/reportes/ApiEstadoCuentaCliente.php - Estado de cuenta por cliente
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

if (!$data || !isset($data['idCliente']) || !isset($data['fechaInicio']) || !isset($data['fechaFin'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos. Se requiere idCliente, fechaInicio y fechaFin"]);
    exit;
}

$idCliente   = intval($data['idCliente']);
$fechaInicio = $data['fechaInicio'];
$fechaFin    = $data['fechaFin'];

if ($idCliente <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "idCliente inválido"]);
    exit;
}

try {
    // 1. Obtener nombre del cliente
    $sqlCliente = "SELECT IdCliente, Nombre FROM GEN_Clientes WHERE IdCliente = ? LIMIT 1";
    $stmtCliente = $enlace->prepare($sqlCliente);
    if (!$stmtCliente) {
        throw new Exception("Error preparando consulta cliente: " . $enlace->error);
    }
    $stmtCliente->bind_param("i", $idCliente);
    $stmtCliente->execute();
    $stmtCliente->bind_result($cId, $cNombre);
    if (!$stmtCliente->fetch()) {
        $stmtCliente->close();
        echo json_encode(["success" => false, "message" => "Cliente no encontrado"]);
        exit;
    }
    $stmtCliente->close();

    // 2. Obtener movimientos: un registro por invoice (actuales + legacy)
    $sqlMovimientos = "
        (
            SELECT
                enc.Factura AS documento,
                enc.FechaEntrega,
                enc.IdMoneda,
                COALESCE(m.Moneda, 'Sin moneda') AS moneda,
                COALESCE(enc.TRM, 1)             AS trm,
                COALESCE((
                    SELECT SUM(
                        IF(dpr.IdUnidad = 4,
                           dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja * dpr.Precio_Venta,
                           dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Venta)
                    )
                    FROM SAS_DetEmpaque dem
                    INNER JOIN SAS_DetProducto dpr ON dem.IdDetEmpaque = dpr.IdDetEmpaque
                    WHERE dem.IdEncabPedido = enc.IdEncabPedido
                      AND dem.Anulado = 0
                      AND dpr.Anulado = 0
                ), 0) AS valorBase,
                COALESCE((
                    SELECT SUM(dp2.TallosDevolucion * dp2.Precio_Venta)
                    FROM SAS_DetProducto dp2
                    WHERE dp2.IdEncabPedido = enc.IdEncabPedido
                      AND dp2.TallosDevolucion > 0
                      AND dp2.Anulado = 0
                ), 0) AS valorDevolucion,
                COALESCE((
                    SELECT SUM(dpago.ValorPago)
                    FROM SAS_DetPagoCliente dpago
                    INNER JOIN SAS_EncabPagoCliente epago
                        ON dpago.IdEncabPagoCliente = epago.IdEncabPagoCliente
                    WHERE dpago.Invoice = enc.Factura
                      AND dpago.Anulado  = 0
                      AND epago.Anulado  = 0
                ), 0) AS valorPagado,
                0 AS esLegacy
            FROM SAS_EncabPedido enc
            LEFT JOIN GEN_Monedas m ON enc.IdMoneda = m.IdMoneda
            WHERE enc.IdCliente    = ?
              AND enc.Anulado      = 0
              AND enc.Factura      > 0
              AND enc.FechaEntrega BETWEEN ? AND ?
        )
        UNION ALL
        (
            SELECT
                CAST(leg.NumeroDocumento AS UNSIGNED) AS documento,
                leg.Fecha AS FechaEntrega,
                COALESCE(leg.IdMoneda, 1) AS IdMoneda,
                COALESCE(m.Moneda, 'Sin moneda') AS moneda,
                COALESCE(leg.TRM, 1) AS trm,
                leg.Valor AS valorBase,
                leg.Credito AS valorDevolucion,
                leg.Pago AS valorPagado,
                1 AS esLegacy
            FROM SAS_LegacyMovimientos leg
            LEFT JOIN GEN_Monedas m ON leg.IdMoneda = m.IdMoneda
            WHERE leg.Tipo = 'C'
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
    $stmtMov->bind_param("ississ", $idCliente, $fechaInicio, $fechaFin, $idCliente, $fechaInicio, $fechaFin);
    $stmtMov->execute();
    $stmtMov->bind_result(
        $factura,
        $fechaEntrega,
        $idMoneda,
        $moneda,
        $trm,
        $valorBase,
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
        $vBase  = floatval($valorBase);
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

        $movimientos[] = [
            'factura'       => intval($factura),
            'fechaEntrega'  => $fechaEntrega ? substr($fechaEntrega, 0, 10) : '',
            'idMoneda'      => intval($idMoneda),
            'moneda'        => $moneda,
            'trm'           => $vTrm,
            'esCOP'         => $esCOP,
            'esLegacy'      => (bool)$esLegacy,
            'valorUSD'      => $vUSD,
            'valorCOP'      => $vCOP,
            'devolucionUSD' => $dUSD,
            'devolucionCOP' => $dCOP,
            'pagadoUSD'     => $pUSD,
            'pagadoCOP'     => $pCOP,
            'saldoUSD'      => $sUSD,
            'saldoCOP'      => $sCOP,
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
        "cliente"      => ["id" => intval($cId), "nombre" => $cNombre],
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
    error_log("Error en ApiEstadoCuentaCliente.php: " . $e->getMessage());
    if (isset($enlace)) {
        $enlace->close();
    }
    echo json_encode(["success" => false, "message" => "Error interno: " . $e->getMessage()]);
}
