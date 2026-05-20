<?php
// src/Api/pagosClientes/ApiGenerarPDFPagoCliente.php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || !isset($data['idEncabPagoCliente'])) {
    echo json_encode(["success" => false, "message" => "No se recibió ID de pago"]);
    exit;
}

$idEncabPagoCliente = intval($data['idEncabPagoCliente']);

try {
    // Consulta para obtener datos del encabezado del pago
    $queryEncabezado = "
        SELECT 
            pc.IdEncabPagoCliente,
            pc.IdEncabPagoCliente AS NumeroPago,
            pc.Fecha,
            pc.IdCliente,
            c.NOMBRE as cliente,
            pc.IdMoneda,
            m.Moneda as moneda,
            pc.TRM,
            pc.MedioPago,
            mp.Medio as medioPago,
            pc.CostoTransferencia,
            pc.Observaciones,
            
            -- Información de la empresa
            'ALL SEASON FLOWERS' as empresa,
            'Nit: 900.123.456-7' as nit,
            'Dirección: Calle 123 #45-67' as direccion,
            'Teléfono: (601) 123-4567' as telefono
            
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

    $stmtEnc->bind_param("i", $idEncabPagoCliente);
    $stmtEnc->execute();

    // Vincular resultados del encabezado
    $stmtEnc->bind_result(
        $IdEncabPagoCliente,
        $NumeroPago,
        $Fecha,
        $IdCliente,
        $cliente,
        $IdMoneda,
        $moneda,
        $TRM,
        $IdMedioPago,
        $medioPago,
        $CostoTransferencia,
        $Observaciones,
        $empresa,
        $nit,
        $direccion,
        $telefono
    );

    if (!$stmtEnc->fetch()) {
        echo json_encode(["success" => false, "message" => "No se encontró el pago especificado"]);
        exit;
    }

    $encabezado = [
        'IdEncabPagoCliente' => $IdEncabPagoCliente,
        'NumeroPago' => $NumeroPago,
        'Fecha' => $Fecha,
        'IdCliente' => $IdCliente,
        'cliente' => $cliente,
        'IdMoneda' => $IdMoneda,
        'moneda' => $moneda,
        'TRM' => $TRM,
        'IdMedioPago' => $IdMedioPago,
        'medioPago' => $medioPago,
        'CostoTransferencia' => $CostoTransferencia,
        'Observaciones' => $Observaciones,
        'empresa' => $empresa,
        'nit' => $nit,
        'direccion' => $direccion,
        'telefono' => $telefono
    ];

    $stmtEnc->close();

    // Consulta para obtener las facturas asociadas al pago
    $queryFacturas = "
        SELECT 
            dpc.Invoice,
            dpc.ValorPago,
            ep.Factura as numeroFactura,
            ep.FechaEntrega as fechaFactura,
            -- Calcular total de la factura
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
            ), 0) as totalFactura,
            -- Calcular saldo pendiente (total - devoluciones - pagos realizados)
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
                WHERE dpc2.Invoice = ep.Factura
                AND dpc2.Anulado = 0
            ), 0) as saldoFactura,
            ep.IdMoneda as idMonedaFactura,
            mf.Moneda as monedaFactura
        FROM SAS_DetPagoCliente dpc
        INNER JOIN SAS_EncabPedido ep ON dpc.Invoice = ep.Factura
        INNER JOIN GEN_Monedas mf ON ep.IdMoneda = mf.IdMoneda
        WHERE dpc.IdEncabPagoCliente = ?
        AND dpc.Anulado = 0
        ORDER BY dpc.IdDetPagoCliente
    ";

    $stmtFact = $enlace->prepare($queryFacturas);
    if (!$stmtFact) {
        throw new Exception("Error preparando consulta de facturas: " . $enlace->error);
    }

    $stmtFact->bind_param("i", $idEncabPagoCliente);
    $stmtFact->execute();

    // Vincular resultados de facturas
    $stmtFact->bind_result(
        $Invoice,
        $ValorPago,
        $numeroFactura,
        $fechaFactura,
        $totalFactura,
        $saldoFactura,
        $idMonedaFactura,
        $monedaFactura
    );

    $facturas = [];
    $valorTotalPago = 0;

    while ($stmtFact->fetch()) {
        $facturas[] = [
            'invoice' => $Invoice,
            'numeroFactura' => $numeroFactura,
            'fechaFactura' => $fechaFactura,
            'valorPago' => floatval($ValorPago),
            'totalFactura' => floatval($totalFactura),
            'saldoFactura' => floatval($saldoFactura),
            'idMonedaFactura' => $idMonedaFactura,
            'monedaFactura' => $monedaFactura
        ];
        $valorTotalPago += floatval($ValorPago);
    }

    $stmtFact->close();

    // Agregar total al encabezado
    $encabezado['ValorTotalPago'] = $valorTotalPago;

    // Crear PDF
    $pdf = new FPDF('P', 'mm', 'Letter');
    $pdf->AddPage();
    $pdf->SetMargins(12, 10, 12);
    $pdf->SetAutoPageBreak(true, 20);

    // --- ENCABEZADO: Logo + Empresa ---
    $logoPath = $_SERVER['DOCUMENT_ROOT'] . '/DatenBankenApp/AllSeasonFlowers/assets/logos/LogoAllSeason.jpg';
    if (!file_exists($logoPath)) {
        $logoPath = $_SERVER['DOCUMENT_ROOT'] . '/DatenBankenApp/AllSeasonFlowers/public/assets/logos/LogoAllSeason.jpg';
    }
    if (file_exists($logoPath)) {
        $pdf->Image($logoPath, 12, 8, 38);
    }

    // Info empresa (derecha del logo)
    $pdf->SetFont('Helvetica', 'B', 13);
    $pdf->SetXY(55, 9);
    $pdf->Cell(145, 7, utf8_decode('ALL SEASON FLOWERS'), 0, 1, 'C');
    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetX(55);
    $pdf->Cell(145, 5, utf8_decode('NIT: 900.123.456-7'), 0, 1, 'C');
    $pdf->SetX(55);
    $pdf->Cell(145, 5, utf8_decode('Dirección: Calle 123 #45-67, Bogotá D.C.'), 0, 1, 'C');
    $pdf->SetX(55);
    $pdf->Cell(145, 5, utf8_decode('Teléfono: (601) 123-4567'), 0, 1, 'C');

    $pdf->SetY(42);

    // Linea separadora verde
    $pdf->SetDrawColor(34, 139, 34);
    $pdf->SetLineWidth(0.8);
    $pdf->Line(12, $pdf->GetY(), 200, $pdf->GetY());
    $pdf->Ln(4);

    // Titulo
    $pdf->SetFont('Helvetica', 'B', 14);
    $pdf->Cell(0, 8, utf8_decode('RECIBO DE PAGO'), 0, 1, 'C');

    $pdf->SetDrawColor(34, 139, 34);
    $pdf->Line(12, $pdf->GetY(), 200, $pdf->GetY());
    $pdf->SetDrawColor(0, 0, 0);
    $pdf->SetLineWidth(0.2);
    $pdf->Ln(6);

    // --- INFORMACION DEL PAGO ---
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->SetFillColor(210, 240, 210);
    $pdf->Cell(0, 7, utf8_decode('  INFORMACIÓN DEL PAGO'), 'B', 1, 'L', true);
    $pdf->Ln(2);

    $pdf->SetFont('Helvetica', '', 10);
    $etW = 52;
    $valW = 136;

    $pdf->Cell($etW, 6, utf8_decode('Número de Pago:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell($valW, 6, utf8_decode('PAG-CLI-' . str_pad($encabezado['IdEncabPagoCliente'], 6, '0', STR_PAD_LEFT)), 0, 1, 'L');
    $pdf->SetFont('Helvetica', '', 10);

    $pdf->Cell($etW, 6, utf8_decode('Fecha:'), 0, 0, 'L');
    $pdf->Cell($valW, 6, utf8_decode($encabezado['Fecha']), 0, 1, 'L');

    $pdf->Cell($etW, 6, utf8_decode('Cliente:'), 0, 0, 'L');
    $pdf->Cell($valW, 6, utf8_decode($encabezado['cliente']), 0, 1, 'L');

    $pdf->Cell($etW, 6, utf8_decode('Medio de Pago:'), 0, 0, 'L');
    $pdf->Cell($valW, 6, utf8_decode($encabezado['medioPago'] ?: 'No especificado'), 0, 1, 'L');

    $pdf->Cell($etW, 6, utf8_decode('Moneda:'), 0, 0, 'L');
    $pdf->Cell($valW, 6, utf8_decode($encabezado['moneda']), 0, 1, 'L');

    $pdf->Cell($etW, 6, utf8_decode('TRM:'), 0, 0, 'L');
    $pdf->Cell($valW, 6, '$' . number_format($encabezado['TRM'], 2), 0, 1, 'L');

    $pdf->Cell($etW, 6, utf8_decode('Observaciones:'), 0, 0, 'L');
    $pdf->Cell($valW, 6, utf8_decode($encabezado['Observaciones'] ?: 'Ninguna'), 0, 1, 'L');

    $pdf->Ln(6);

    // Tabla de facturas pagadas
    if (!empty($facturas)) {
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->SetFillColor(210, 240, 210);
        $pdf->Cell(0, 7, utf8_decode('  FACTURAS PAGADAS'), 'B', 1, 'L', true);
        $pdf->Ln(2);

        // Anchos de columna (total usable ~188mm)
        $cFactura   = 32;
        $cFecha     = 36;
        $cTotal     = 38;
        $cSaldo     = 40;
        $cPagado    = 42;

        // Encabezados de tabla
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->SetFillColor(180, 220, 180);
        $pdf->Cell($cFactura,  7, utf8_decode('Factura'),        1, 0, 'C', true);
        $pdf->Cell($cFecha,    7, utf8_decode('Fecha Factura'),  1, 0, 'C', true);
        $pdf->Cell($cTotal,    7, utf8_decode('Total Factura'),  1, 0, 'C', true);
        $pdf->Cell($cSaldo,    7, utf8_decode('Saldo Anterior'), 1, 0, 'C', true);
        $pdf->Cell($cPagado,   7, utf8_decode('Valor Pagado'),   1, 1, 'C', true);

        // Filas con colores alternados
        $pdf->SetFont('Helvetica', '', 9);
        $totalPagado = 0;
        $fila = 0;
        foreach ($facturas as $factura) {
            $fill = ($fila % 2 === 0);
            $pdf->SetFillColor(245, 252, 245);
            $pdf->Cell($cFactura,  7, utf8_decode('FACT-' . str_pad($factura['numeroFactura'], 6, '0', STR_PAD_LEFT)), 1, 0, 'C', $fill);
            $pdf->Cell($cFecha,    7, utf8_decode($factura['fechaFactura']),                                           1, 0, 'C', $fill);
            $pdf->Cell($cTotal,    7, '$' . number_format($factura['totalFactura'], 2),                                1, 0, 'R', $fill);
            $pdf->Cell($cSaldo,    7, '$' . number_format($factura['saldoFactura'] + $factura['valorPago'], 2),        1, 0, 'R', $fill);
            $pdf->Cell($cPagado,   7, '$' . number_format($factura['valorPago'], 2),                                   1, 1, 'R', $fill);
            $totalPagado += $factura['valorPago'];
            $fila++;
        }

        // Fila total
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->SetFillColor(210, 240, 210);
        $anchoEtiqueta = $cFactura + $cFecha + $cTotal + $cSaldo;
        $pdf->Cell($anchoEtiqueta, 8, utf8_decode('TOTAL PAGADO:'), 1, 0, 'R', true);
        $pdf->Cell($cPagado, 8, '$' . number_format($totalPagado, 2), 1, 1, 'R', true);

        // Costo de transferencia si aplica
        if ($encabezado['CostoTransferencia'] > 0) {
            $pdf->Cell($anchoEtiqueta, 8, utf8_decode('Costo Transferencia:'), 1, 0, 'R', true);
            $pdf->Cell($cPagado, 8, '$' . number_format($encabezado['CostoTransferencia'], 2), 1, 1, 'R', true);
            $pdf->Cell($anchoEtiqueta, 8, utf8_decode('TOTAL GENERAL:'), 1, 0, 'R', true);
            $pdf->Cell($cPagado, 8, '$' . number_format($totalPagado + $encabezado['CostoTransferencia'], 2), 1, 1, 'R', true);
        }
    }

    $pdf->Ln(18);

    // --- FIRMAS ---
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(94, 6, '_________________________', 0, 0, 'C');
    $pdf->Cell(94, 6, '_________________________', 0, 1, 'C');
    $pdf->Cell(94, 6, utf8_decode('Recibido por'), 0, 0, 'C');
    $pdf->Cell(94, 6, utf8_decode('Entregado por'), 0, 1, 'C');

    // Salida del PDF
    $pdf->Output('I', 'Pago_Cliente_' . $encabezado['IdEncabPagoCliente'] . '.pdf');
} catch (Exception $e) {
    error_log("Error en ApiGenerarPDFPagoCliente.php: " . $e->getMessage());
    // Si hay error, devolver JSON en lugar de PDF
    header("Content-Type: application/json");
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} finally {
    if (isset($enlace)) $enlace->close();
}
