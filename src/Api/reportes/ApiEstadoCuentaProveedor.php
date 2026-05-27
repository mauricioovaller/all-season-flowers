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

    // 2. Obtener movimientos: un registro por compra
    $sqlMovimientos = "
        SELECT
            ec.IdEncabCompra,
            ec.FechaEntrega,
            ec.IdMoneda,
            COALESCE(m.Moneda, 'Sin moneda') AS moneda,
            COALESCE(ec.TRM, 1)              AS trm,
            COALESCE((
                SELECT SUM(dc.Tallos_Ramo * dc.Ramos_Caja * dc.Precio_Compra)
                FROM SAS_DetProductoCompra dc
                WHERE dc.IdEncabCompra = ec.IdEncabCompra
                  AND dc.Anulado = 0
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
            ), 0) AS valorPagado
        FROM SAS_EncabCompra ec
        LEFT JOIN GEN_Monedas m ON ec.IdMoneda = m.IdMoneda
        WHERE ec.IdProveedor   = ?
          AND ec.Anulado       = 0
          AND ec.FechaEntrega  BETWEEN ? AND ?
        ORDER BY ec.FechaEntrega ASC, ec.IdEncabCompra ASC
    ";

    $stmtMov = $enlace->prepare($sqlMovimientos);
    if (!$stmtMov) {
        throw new Exception("Error preparando consulta movimientos: " . $enlace->error);
    }
    $stmtMov->bind_param("iss", $idProveedor, $fechaInicio, $fechaFin);
    $stmtMov->execute();
    $stmtMov->bind_result(
        $idEncabCompra,
        $fechaEntrega,
        $idMoneda,
        $moneda,
        $trm,
        $valorCompra,
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
        $vBase  = floatval($valorCompra);
        $vDev   = floatval($valorDevolucion);
        $vPago  = floatval($valorPagado);
        $vTrm   = floatval($trm) > 0 ? floatval($trm) : 1;
        $saldo  = $vBase - $vDev - $vPago;

        $vBaseCOP  = round($vBase  * $vTrm, 2);
        $vDevCOP   = round($vDev   * $vTrm, 2);
        $vPagoCOP  = round($vPago  * $vTrm, 2);
        $saldoCOP  = round($saldo  * $vTrm, 2);

        $idComp = intval($idEncabCompra);

        $movimientos[] = [
            'idCompra'           => $idComp,
            'numeroCompra'       => 'COMP-' . str_pad($idComp, 6, '0', STR_PAD_LEFT),
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
        "proveedor"    => ["id" => intval($pId), "nombre" => $pNombre],
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
    error_log("Error en ApiEstadoCuentaProveedor.php: " . $e->getMessage());
    if (isset($enlace)) {
        $enlace->close();
    }
    echo json_encode(["success" => false, "message" => "Error interno: " . $e->getMessage()]);
}
