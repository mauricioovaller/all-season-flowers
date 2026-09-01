<?php
// src/Api/pagosProveedores/ApiGetPagoProveedorEspecifico.php - Obtener pago específico por ID
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

if (!$data || !isset($data['idPagoProveedor'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    exit;
}

$idPagoProveedor = intval($data['idPagoProveedor']);

try {
    // Obtener encabezado del pago
    $queryEncabezado = "
        SELECT 
            pp.IdEncabPagoProveedor,
            pp.FechaPago,
            pp.IdProveedor,
            pp.IdMoneda,
            pp.TRM,
            pp.MedioPago,
            mp.Medio as medioPago,
            pp.Observaciones,
            pp.Anulado,
            p.Proveedor as proveedor,
            m.Moneda as moneda,
            COALESCE((SELECT SUM(dpp_t.ValorPago) FROM SAS_DetPagoProveedor dpp_t
                      WHERE dpp_t.IdEncabPagoProveedor = pp.IdEncabPagoProveedor
                      AND dpp_t.Anulado = 0), 0) as valorTotal
        FROM SAS_EncabPagoProveedor pp
        INNER JOIN GEN_Proveedores p ON pp.IdProveedor = p.IdProveedor
        INNER JOIN GEN_Monedas m ON pp.IdMoneda = m.IdMoneda
        LEFT JOIN GEN_MedioPagos mp ON pp.MedioPago = mp.IdMedioPago
        WHERE pp.IdEncabPagoProveedor = ?
    ";

    $stmtEnc = $enlace->prepare($queryEncabezado);
    if (!$stmtEnc) {
        throw new Exception("Error preparando consulta de encabezado: " . $enlace->error);
    }

    $stmtEnc->bind_param("i", $idPagoProveedor);
    $stmtEnc->execute();

    // Vincular resultados del encabezado
    $stmtEnc->bind_result(
        $encIdPago,
        $encFechaPago,
        $encIdProveedor,
        $encIdMoneda,
        $encTRM,
        $encIdMedioPago,
        $encMedioPago,
        $encObservaciones,
        $encAnulado,
        $encProveedor,
        $encMoneda,
        $encValorTotal
    );

    if (!$stmtEnc->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'No se encontró el pago',
            'encabezado' => null,
            'compras' => []
        ]);
        $stmtEnc->close();
        exit;
    }

    $stmtEnc->close();

    // Obtener compras del pago (actuales + legacy)
    $queryCompras = "
        SELECT
            dpp.IdDetPagoProveedor,
            dpp.IdEncabCompra as idCompra,
            dpp.ValorPago as valorPago,
            COALESCE(
                CONCAT('COMP-', LPAD(ec.IdEncabCompra, 6, '0')),
                CONCAT('LEG-', (SELECT leg.NumeroDocumento FROM SAS_LegacyMovimientos leg WHERE leg.Tipo='P' AND leg.IdLegacyMovimiento = ABS(dpp.IdEncabCompra) LIMIT 1))
            ) as numeroCompraFormateado,
            COALESCE(ec.FechaEntrega,
                (SELECT leg.Fecha FROM SAS_LegacyMovimientos leg WHERE leg.Tipo='P' AND leg.IdLegacyMovimiento = ABS(dpp.IdEncabCompra) LIMIT 1)
            ) as fechaCompra,
            COALESCE(ec.IdMoneda,
                (SELECT leg.IdMoneda FROM SAS_LegacyMovimientos leg WHERE leg.Tipo='P' AND leg.IdLegacyMovimiento = ABS(dpp.IdEncabCompra) LIMIT 1)
            ) as idMoneda,
            COALESCE(m.Moneda,
                (SELECT m2.Moneda FROM SAS_LegacyMovimientos leg2 LEFT JOIN GEN_Monedas m2 ON leg2.IdMoneda = m2.IdMoneda WHERE leg2.Tipo='P' AND leg2.IdLegacyMovimiento = ABS(dpp.IdEncabCompra) LIMIT 1)
            ) as moneda,
            COALESCE(ec.TRM,
                (SELECT leg.TRM FROM SAS_LegacyMovimientos leg WHERE leg.Tipo='P' AND leg.IdLegacyMovimiento = ABS(dpp.IdEncabCompra) LIMIT 1)
            ) as trm,
            COALESCE(
                (SELECT SUM(dc.Tallos_Ramo * dc.Ramos_Caja * dc.Precio_Compra)
                 FROM SAS_DetProductoCompra dc WHERE dc.IdEncabCompra = ec.IdEncabCompra),
                (SELECT leg.Valor FROM SAS_LegacyMovimientos leg WHERE leg.Tipo='P' AND leg.IdLegacyMovimiento = ABS(dpp.IdEncabCompra) LIMIT 1)
            ) as totalCompra,
            COALESCE(
                (SELECT SUM(dc2.TallosDevolucion * dc2.Precio_Compra)
                 FROM SAS_DetProductoCompra dc2
                 WHERE dc2.IdEncabCompra = ec.IdEncabCompra AND dc2.TallosDevolucion > 0),
                (SELECT leg.Credito FROM SAS_LegacyMovimientos leg WHERE leg.Tipo='P' AND leg.IdLegacyMovimiento = ABS(dpp.IdEncabCompra) LIMIT 1)
            ) as totalDevolucion,
            COALESCE(
                (SELECT SUM(dpp2.ValorPago)
                 FROM SAS_DetPagoProveedor dpp2
                 INNER JOIN SAS_EncabPagoProveedor epp2 ON dpp2.IdEncabPagoProveedor = epp2.IdEncabPagoProveedor
                 WHERE dpp2.IdEncabCompra = ec.IdEncabCompra
                 AND dpp2.Anulado = 0 AND epp2.Anulado = 0
                 AND dpp2.IdEncabPagoProveedor != ?), 0
            ) as otrosPagos,
            CASE WHEN ec.IdEncabCompra IS NULL THEN 1 ELSE 0 END as esLegacy
        FROM SAS_DetPagoProveedor dpp
        LEFT JOIN SAS_EncabCompra ec ON dpp.IdEncabCompra = ec.IdEncabCompra
        LEFT JOIN GEN_Monedas m ON ec.IdMoneda = m.IdMoneda
        WHERE dpp.IdEncabPagoProveedor = ?
        AND dpp.Anulado = 0
        ORDER BY dpp.IdDetPagoProveedor
    ";

    $stmtDet = $enlace->prepare($queryCompras);
    if (!$stmtDet) {
        throw new Exception("Error preparando consulta de compras: " . $enlace->error);
    }

    $stmtDet->bind_param("ii", $idPagoProveedor, $idPagoProveedor);
    $stmtDet->execute();

    $stmtDet->bind_result(
        $detIdDetPago,
        $detIdCompra,
        $detValorPago,
        $detNumeroCompra,
        $detFechaCompra,
        $detIdMoneda,
        $detMoneda,
        $detTRM,
        $detTotalCompra,
        $detTotalDevolucion,
        $detOtrosPagos,
        $detEsLegacy
    );

    $compras = [];

    while ($stmtDet->fetch()) {
        $totalCompra   = floatval($detTotalCompra);
        $totalDevol    = floatval($detTotalDevolucion);
        $otrosPagos    = floatval($detOtrosPagos);
        $saldoCompra   = $totalCompra - $totalDevol - $otrosPagos;

        $compras[] = [
            'idDetPagoProveedor'     => intval($detIdDetPago),
            'idCompra'               => intval($detIdCompra),
            'numeroCompraFormateado'  => $detNumeroCompra,
            'fechaCompra'            => $detFechaCompra,
            'idMoneda'               => intval($detIdMoneda),
            'moneda'                 => $detMoneda,
            'trm'                    => floatval($detTRM),
            'totalCompra'            => $totalCompra,
            'saldoCompra'            => max(0, $saldoCompra),
            'valorPago'              => floatval($detValorPago),
            'esLegacy'               => (bool)$detEsLegacy
        ];
    }
    $stmtDet->close();

    $respuestaEncabezado = [
        'idPagoProveedor'    => intval($encIdPago),
        'numeroPago'         => 'PAG-PROV-' . str_pad($encIdPago, 6, '0', STR_PAD_LEFT),
        'fecha'              => $encFechaPago,
        'idProveedor'        => intval($encIdProveedor),
        'proveedor'          => $encProveedor,
        'idMoneda'           => intval($encIdMoneda),
        'moneda'             => $encMoneda,
        'trm'                => floatval($encTRM),
        'idMedioPago'        => intval($encIdMedioPago),
        'medioPago'          => $encMedioPago,
        'valorPago'          => floatval($encValorTotal),
        'observaciones'      => $encObservaciones,
        'anulado'            => intval($encAnulado)
    ];

    echo json_encode([
        'success'    => true,
        'message'    => 'Pago encontrado',
        'encabezado' => $respuestaEncabezado,
        'compras'    => $compras
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success'    => false,
        'message'    => $e->getMessage(),
        'encabezado' => null,
        'compras'    => []
    ]);
}

$enlace->close();
