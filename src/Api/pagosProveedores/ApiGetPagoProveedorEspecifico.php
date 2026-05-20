<?php
// src/Api/pagosProveedores/ApiGetPagoProveedorEspecifico.php - Obtener pago específico por ID
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

    // Obtener compras del pago (sistema nuevo: SAS_DetPagoProveedor)
    $queryComprasNuevo = "
        SELECT
            dpp.IdDetPagoProveedor,
            dpp.IdEncabCompra as idCompra,
            dpp.ValorPago as valorPago,
            CONCAT('COMP-', LPAD(ec.IdEncabCompra, 6, '0')) as numeroCompraFormateado,
            ec.FechaEntrega as fechaCompra,
            ec.IdMoneda as idMoneda,
            m.Moneda as moneda,
            ec.TRM as trm,
            COALESCE((SELECT SUM(dc.Tallos_Ramo * dc.Ramos_Caja * dc.Precio_Compra)
                      FROM SAS_DetProductoCompra dc
                      WHERE dc.IdEncabCompra = ec.IdEncabCompra), 0) as totalCompra,
            COALESCE((SELECT SUM(dc2.TallosDevolucion * dc2.Precio_Compra)
                      FROM SAS_DetProductoCompra dc2
                      WHERE dc2.IdEncabCompra = ec.IdEncabCompra
                      AND dc2.TallosDevolucion > 0), 0) as totalDevolucion,
            COALESCE((SELECT SUM(dpp2.ValorPago)
                      FROM SAS_DetPagoProveedor dpp2
                      INNER JOIN SAS_EncabPagoProveedor epp2 ON dpp2.IdEncabPagoProveedor = epp2.IdEncabPagoProveedor
                      WHERE dpp2.IdEncabCompra = ec.IdEncabCompra
                      AND dpp2.Anulado = 0
                      AND epp2.Anulado = 0
                      AND dpp2.IdEncabPagoProveedor != ?), 0) as otrosPagos
        FROM SAS_DetPagoProveedor dpp
        INNER JOIN SAS_EncabCompra ec ON dpp.IdEncabCompra = ec.IdEncabCompra
        LEFT JOIN GEN_Monedas m ON ec.IdMoneda = m.IdMoneda
        WHERE dpp.IdEncabPagoProveedor = ?
        AND dpp.Anulado = 0
        ORDER BY dpp.IdDetPagoProveedor
    ";

    $stmtDet = $enlace->prepare($queryComprasNuevo);
    if (!$stmtDet) {
        throw new Exception("Error preparando consulta de compras: " . $enlace->error);
    }

    $stmtDet->bind_param("ii", $idPagoProveedor, $idPagoProveedor);
    $stmtDet->execute();

    // Vincular resultados de compras
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
        $detOtrosPagos
    );

    $compras = [];

    // Obtener resultados de compras
    while ($stmtDet->fetch()) {
        $totalCompra   = floatval($detTotalCompra);
        $totalDevol    = floatval($detTotalDevolucion);
        $otrosPagos    = floatval($detOtrosPagos);
        $saldoCompra   = $totalCompra - $totalDevol - $otrosPagos;

        $compras[] = [
            'idDetPagoProveedor'    => intval($detIdDetPago),
            'idCompra'              => intval($detIdCompra),
            'numeroCompraFormateado' => $detNumeroCompra,
            'fechaCompra'           => $detFechaCompra,
            'idMoneda'              => intval($detIdMoneda),
            'moneda'                => $detMoneda,
            'trm'                   => floatval($detTRM),
            'totalCompra'           => $totalCompra,
            'saldoCompra'           => max(0, $saldoCompra),
            'valorPago'             => floatval($detValorPago)
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
