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

    // 2. Obtener movimientos: un registro por invoice
    $sqlMovimientos = "
        SELECT
            enc.Factura,
            enc.FechaEntrega,
            enc.IdMoneda,
            COALESCE(m.Moneda, 'Sin moneda') AS moneda,
            COALESCE(enc.TRM, 1)             AS trm,
            COALESCE((
                SELECT SUM(dp.Tallos_Ramo * dp.Ramos_Caja * dp.Precio_Venta)
                FROM SAS_DetProducto dp
                WHERE dp.IdEncabPedido = enc.IdEncabPedido
                  AND dp.Anulado = 0
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
            ), 0) AS valorPagado
        FROM SAS_EncabPedido enc
        LEFT JOIN GEN_Monedas m ON enc.IdMoneda = m.IdMoneda
        WHERE enc.IdCliente    = ?
          AND enc.Anulado      = 0
          AND enc.Factura      > 0
          AND enc.FechaEntrega BETWEEN ? AND ?
        ORDER BY enc.FechaEntrega ASC, enc.Factura ASC
    ";

    $stmtMov = $enlace->prepare($sqlMovimientos);
    if (!$stmtMov) {
        throw new Exception("Error preparando consulta movimientos: " . $enlace->error);
    }
    $stmtMov->bind_param("iss", $idCliente, $fechaInicio, $fechaFin);
    $stmtMov->execute();
    $stmtMov->bind_result(
        $factura,
        $fechaEntrega,
        $idMoneda,
        $moneda,
        $trm,
        $valorBase,
        $valorDevolucion,
        $valorPagado
    );

    $movimientos        = [];
    $totValorBase       = 0;
    $totValorDevolucion = 0;
    $totValorPagado     = 0;
    $totValorBaseCOP    = 0;
    $totValorDevCOP     = 0;
    $totValorPagCOP     = 0;

    while ($stmtMov->fetch()) {
        $vBase  = floatval($valorBase);
        $vDev   = floatval($valorDevolucion);
        $vPago  = floatval($valorPagado);
        $vTrm   = floatval($trm) > 0 ? floatval($trm) : 1;
        $saldo  = $vBase - $vDev - $vPago;

        $vBaseCOP  = round($vBase  * $vTrm, 2);
        $vDevCOP   = round($vDev   * $vTrm, 2);
        $vPagoCOP  = round($vPago  * $vTrm, 2);
        $saldoCOP  = round($saldo  * $vTrm, 2);

        $movimientos[] = [
            'factura'            => intval($factura),
            'fechaEntrega'       => $fechaEntrega ? substr($fechaEntrega, 0, 10) : '',
            'idMoneda'           => intval($idMoneda),
            'moneda'             => $moneda,
            'valorBase'          => $vBase,
            'valorBaseCOP'       => $vBaseCOP,
            'valorDevolucion'    => $vDev,
            'valorDevolucionCOP' => $vDevCOP,
            'valorPagado'        => $vPago,
            'valorPagadoCOP'     => $vPagoCOP,
            'saldo'              => round($saldo, 4),
            'saldoCOP'           => $saldoCOP,
        ];

        $totValorBase       += $vBase;
        $totValorDevolucion += $vDev;
        $totValorPagado     += $vPago;
        $totValorBaseCOP    += $vBaseCOP;
        $totValorDevCOP     += $vDevCOP;
        $totValorPagCOP     += $vPagoCOP;
    }
    $stmtMov->close();

    $totSaldo    = $totValorBase - $totValorDevolucion - $totValorPagado;
    $totSaldoCOP = $totValorBaseCOP - $totValorDevCOP - $totValorPagCOP;

    echo json_encode([
        "success"      => true,
        "cliente"      => ["id" => intval($cId), "nombre" => $cNombre],
        "movimientos"  => $movimientos,
        "totales"      => [
            "valorBase"          => round($totValorBase, 4),
            "valorBaseCOP"       => round($totValorBaseCOP, 2),
            "valorDevolucion"    => round($totValorDevolucion, 4),
            "valorDevolucionCOP" => round($totValorDevCOP, 2),
            "valorPagado"        => round($totValorPagado, 4),
            "valorPagadoCOP"     => round($totValorPagCOP, 2),
            "saldo"              => round($totSaldo, 4),
            "saldoCOP"           => round($totSaldoCOP, 2),
        ],
    ]);
} catch (Exception $e) {
    error_log("Error en ApiEstadoCuentaCliente.php: " . $e->getMessage());
    if (isset($enlace)) {
        $enlace->close();
    }
    echo json_encode(["success" => false, "message" => "Error interno: " . $e->getMessage()]);
}
