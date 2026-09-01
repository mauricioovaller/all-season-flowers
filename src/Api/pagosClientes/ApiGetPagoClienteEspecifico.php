<?php
// src/Api/pagosClientes/ApiGetPagoClienteEspecifico.php
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

if (!$data || !isset($data['idPagoCliente'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos. Se requiere idPagoCliente"]);
    exit;
}

$idPagoCliente = intval($data['idPagoCliente']);

try {
    // Consulta para obtener el encabezado del pago
    $queryEncabezado = "
        SELECT 
            pc.IdEncabPagoCliente,
            pc.IdEncabPagoCliente AS NumeroPago,
            pc.Fecha,
            pc.IdCliente,
            pc.IdMoneda,
            pc.TRM,
            pc.MedioPago,
            mp.Medio as medioPago,
            pc.CostoTransferencia,
            pc.Observaciones,
            pc.Anulado,
            c.NOMBRE as cliente,
            m.Moneda as moneda
        FROM SAS_EncabPagoCliente pc
        INNER JOIN GEN_Clientes c ON pc.IdCliente = c.IdCliente
        INNER JOIN GEN_Monedas m ON pc.IdMoneda = m.IdMoneda
        LEFT JOIN GEN_MedioPagos mp ON pc.MedioPago = mp.IdMedioPago
        WHERE pc.IdEncabPagoCliente = ?
        AND pc.Anulado = 0
    ";

    $stmtEnc = $enlace->prepare($queryEncabezado);
    if (!$stmtEnc) {
        throw new Exception("Error preparando consulta de encabezado: " . $enlace->error);
    }

    $stmtEnc->bind_param("i", $idPagoCliente);
    $stmtEnc->execute();

    // Vincular resultados del encabezado
    $stmtEnc->bind_result(
        $IdEncabPagoCliente,
        $NumeroPago,
        $Fecha,
        $IdCliente,
        $IdMoneda,
        $TRM,
        $IdMedioPago,
        $medioPago,
        $CostoTransferencia,
        $Observaciones,
        $Anulado,
        $cliente,
        $moneda
    );

    if (!$stmtEnc->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'No se encontró el pago especificado',
            'encabezado' => null,
            'facturas' => []
        ]);
        exit;
    }

    $encabezado = [
        'IdEncabPagoCliente' => $IdEncabPagoCliente,
        'NumeroPago' => $NumeroPago,
        'Fecha' => $Fecha,
        'IdCliente' => $IdCliente,
        'IdMoneda' => $IdMoneda,
        'TRM' => $TRM,
        'IdMedioPago' => $IdMedioPago,
        'medioPago' => $medioPago,
        'CostoTransferencia' => $CostoTransferencia,
        'Observaciones' => $Observaciones,
        'Anulado' => $Anulado,
        'cliente' => $cliente,
        'moneda' => $moneda
    ];

    $stmtEnc->close();

    // Consulta para obtener las facturas asociadas al pago
    $queryFacturas = "
        SELECT 
            dpc.IdDetPagoCliente,
            dpc.Invoice,
            dpc.ValorPago,
            dpc.Anulado,
            COALESCE(ep.Factura, CAST(dpc.Invoice AS UNSIGNED)) as numeroFactura,
            COALESCE((
                SELECT SUM(
                    CASE 
                        WHEN dp.IdUnidad = 4 THEN de.Cantidad * (dp.Tallos_Ramo * dp.Ramos_Caja) * dp.Precio_Venta
                        ELSE de.Cantidad * dp.Ramos_Caja * dp.Precio_Venta
                    END
                )
                FROM SAS_DetEmpaque de
                INNER JOIN SAS_DetProducto dp ON de.IdDetEmpaque = dp.IdDetEmpaque
                WHERE de.IdEncabPedido = ep.IdEncabPedido
            ), 
            -- Fallback legacy: usar datos de SAS_LegacyMovimientos
            (SELECT leg.Valor FROM SAS_LegacyMovimientos leg 
             WHERE leg.Tipo = 'C' AND CAST(leg.NumeroDocumento AS UNSIGNED) = dpc.Invoice AND leg.Anulado = 0 LIMIT 1)
            ) as totalFactura,
            COALESCE((
                SELECT SUM(
                    CASE 
                        WHEN dp.IdUnidad = 4 THEN de.Cantidad * (dp.Tallos_Ramo * dp.Ramos_Caja) * dp.Precio_Venta
                        ELSE de.Cantidad * dp.Ramos_Caja * dp.Precio_Venta
                    END
                )
                FROM SAS_DetEmpaque de
                INNER JOIN SAS_DetProducto dp ON de.IdDetEmpaque = dp.IdDetEmpaque
                WHERE de.IdEncabPedido = ep.IdEncabPedido
            ), 0)
            - COALESCE((
                SELECT SUM(
                    (COALESCE(dp2.TallosDevolucion, 0) * COALESCE(dp2.Precio_Venta, 0)) +
                    COALESCE(dp2.Flete, 0) +
                    COALESCE(dp2.Fumigacion, 0) +
                    COALESCE(dp2.Otros, 0)
                )
                FROM SAS_DetEmpaque de2
                INNER JOIN SAS_DetProducto dp2 ON de2.IdDetEmpaque = dp2.IdDetEmpaque
                WHERE de2.IdEncabPedido = ep.IdEncabPedido
                AND COALESCE(dp2.TallosDevolucion, 0) > 0
            ), 0)
            - COALESCE((
                SELECT SUM(dpc2.ValorPago)
                FROM SAS_DetPagoCliente dpc2
                WHERE dpc2.Invoice = COALESCE(ep.Factura, dpc.Invoice)
                AND dpc2.Anulado = 0
            ), 0) as saldoFactura,
            COALESCE(ep.IdMoneda, (SELECT leg.IdMoneda FROM SAS_LegacyMovimientos leg 
             WHERE leg.Tipo = 'C' AND CAST(leg.NumeroDocumento AS UNSIGNED) = dpc.Invoice AND leg.Anulado = 0 LIMIT 1)) as idMonedaFactura,
            COALESCE(mf.Moneda, (SELECT m2.Moneda FROM SAS_LegacyMovimientos leg2 
             LEFT JOIN GEN_Monedas m2 ON leg2.IdMoneda = m2.IdMoneda
             WHERE leg2.Tipo = 'C' AND CAST(leg2.NumeroDocumento AS UNSIGNED) = dpc.Invoice AND leg2.Anulado = 0 LIMIT 1)) as monedaFactura,
            CASE WHEN ep.Factura IS NULL THEN 1 ELSE 0 END as esLegacy
        FROM SAS_DetPagoCliente dpc
        LEFT JOIN SAS_EncabPedido ep ON dpc.Invoice = ep.Factura
        LEFT JOIN GEN_Monedas mf ON ep.IdMoneda = mf.IdMoneda
        WHERE dpc.IdEncabPagoCliente = ?
        AND dpc.Anulado = 0
        ORDER BY dpc.IdDetPagoCliente
    ";

    $stmtFact = $enlace->prepare($queryFacturas);
    if (!$stmtFact) {
        throw new Exception("Error preparando consulta de facturas: " . $enlace->error);
    }

    $stmtFact->bind_param("i", $idPagoCliente);
    $stmtFact->execute();

    // Vincular resultados de facturas
    $stmtFact->bind_result(
        $IdDetPagoCliente,
        $Invoice,
        $ValorPago,
        $Anulado,
        $numeroFactura,
        $totalFactura,
        $saldoFactura,
        $idMonedaFactura,
        $monedaFactura,
        $esLegacy
    );

    $facturas = [];
    $valorTotalPago = 0;

    while ($stmtFact->fetch()) {
        $facturas[] = [
            'idDetPagoCliente' => $IdDetPagoCliente,
            'invoice' => $Invoice,
            'numeroFactura' => $numeroFactura,
            'valorPago' => floatval($ValorPago),
            'totalFactura' => floatval($totalFactura),
            'saldoFactura' => floatval($saldoFactura),
            'idMonedaFactura' => $idMonedaFactura,
            'monedaFactura' => $monedaFactura,
            'anulado' => $Anulado,
            'esLegacy' => (bool)$esLegacy
        ];
        $valorTotalPago += floatval($ValorPago);
    }

    $stmtFact->close();

    // Formatear respuesta
    $respuestaEncabezado = [
        'idEncabPagoCliente' => $encabezado['IdEncabPagoCliente'],
        'numeroPago' => $encabezado['NumeroPago'],
        'fecha' => $encabezado['Fecha'],
        'idCliente' => $encabezado['IdCliente'],
        'cliente' => $encabezado['cliente'],
        'idMoneda' => $encabezado['IdMoneda'],
        'moneda' => $encabezado['moneda'],
        'trm' => floatval($encabezado['TRM']),
        'idMedioPago' => $encabezado['IdMedioPago'],
        'medioPago' => $encabezado['medioPago'],
        'valorTotalPago' => $valorTotalPago,
        'costoTransferencia' => floatval($encabezado['CostoTransferencia']),
        'observaciones' => $encabezado['Observaciones'],
        'anulado' => $encabezado['Anulado']
    ];

    echo json_encode([
        'success' => true,
        'message' => 'Pago encontrado',
        'encabezado' => $respuestaEncabezado,
        'facturas' => $facturas
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'encabezado' => null,
        'facturas' => []
    ]);
}

$enlace->close();
