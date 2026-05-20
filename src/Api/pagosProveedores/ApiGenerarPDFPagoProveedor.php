<?php
// src/Api/pagosProveedores/ApiGenerarPDFPagoProveedor.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";
require_once $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Content-Type: application/json");
    http_response_code(405);
    echo json_encode(["error" => "Metodo no permitido"]);
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['idPagoProveedor'])) {
    header("Content-Type: application/json");
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos: se requiere idPagoProveedor"]);
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
            p.Proveedor as proveedor,
            m.Moneda as moneda
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
        $encProveedor,
        $encMoneda
    );

    if (!$stmtEnc->fetch()) {
        header("Content-Type: application/json");
        echo json_encode(["success" => false, "message" => "No se encontro el pago con ID " . $idPagoProveedor]);
        exit;
    }

    $stmtEnc->close();

    // Obtener compras del pago desde SAS_DetPagoProveedor
    $queryCompras = "
        SELECT
            dpp.IdEncabCompra as idCompra,
            dpp.ValorPago as valorPago,
            CONCAT('COMP-', LPAD(ec.IdEncabCompra, 6, '0')) as numeroCompra,
            ec.FechaEntrega as fechaCompra,
            COALESCE((
                SELECT SUM(dc.Tallos_Ramo * dc.Ramos_Caja * dc.Precio_Compra)
                FROM SAS_DetProductoCompra dc
                WHERE dc.IdEncabCompra = ec.IdEncabCompra
            ), 0) as totalCompra,
            COALESCE((
                SELECT SUM(dc2.TallosDevolucion * dc2.Precio_Compra)
                FROM SAS_DetProductoCompra dc2
                WHERE dc2.IdEncabCompra = ec.IdEncabCompra
                AND dc2.TallosDevolucion > 0
            ), 0) as totalDevolucion
        FROM SAS_DetPagoProveedor dpp
        INNER JOIN SAS_EncabCompra ec ON dpp.IdEncabCompra = ec.IdEncabCompra
        WHERE dpp.IdEncabPagoProveedor = ?
        AND dpp.Anulado = 0
        ORDER BY dpp.IdDetPagoProveedor
    ";

    $stmtComp = $enlace->prepare($queryCompras);
    if (!$stmtComp) {
        throw new Exception("Error preparando consulta de compras: " . $enlace->error);
    }
    $stmtComp->bind_param("i", $idPagoProveedor);
    $stmtComp->execute();

    // Vincular resultados de compras
    $stmtComp->bind_result(
        $compIdCompra,
        $compValorPago,
        $compNumeroCompra,
        $compFechaCompra,
        $compTotalCompra,
        $compTotalDevolucion
    );

    $compras = [];
    $valorTotalPago = 0;
    while ($stmtComp->fetch()) {
        $compras[] = [
            'numeroCompra'    => $compNumeroCompra,
            'fechaCompra'     => $compFechaCompra,
            'totalCompra'     => floatval($compTotalCompra),
            'totalDevolucion' => floatval($compTotalDevolucion),
            'valorPago'       => floatval($compValorPago)
        ];
        $valorTotalPago += floatval($compValorPago);
    }
    $stmtComp->close();

    // Generar PDF con FPDF
    header("Content-Type: application/pdf");

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
    $pdf->Cell(145, 5, utf8_decode('Direccion: Calle 123 #45-67, Bogota D.C.'), 0, 1, 'C');
    $pdf->SetX(55);
    $pdf->Cell(145, 5, utf8_decode('Telefono: (601) 123-4567'), 0, 1, 'C');

    $pdf->SetY(42);

    // Linea separadora verde
    $pdf->SetDrawColor(34, 139, 34);
    $pdf->SetLineWidth(0.8);
    $pdf->Line(12, $pdf->GetY(), 200, $pdf->GetY());
    $pdf->Ln(4);

    // Titulo
    $pdf->SetFont('Helvetica', 'B', 14);
    $pdf->Cell(0, 8, utf8_decode('RECIBO DE PAGO A PROVEEDOR'), 0, 1, 'C');

    $pdf->SetDrawColor(34, 139, 34);
    $pdf->Line(12, $pdf->GetY(), 200, $pdf->GetY());
    $pdf->SetDrawColor(0, 0, 0);
    $pdf->SetLineWidth(0.2);
    $pdf->Ln(6);

    // --- INFORMACION DEL PAGO ---
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->SetFillColor(210, 240, 210);
    $pdf->Cell(0, 7, utf8_decode('  INFORMACION DEL PAGO'), 'B', 1, 'L', true);
    $pdf->Ln(2);

    $pdf->SetFont('Helvetica', '', 10);
    $etW = 52;
    $valW = 136;

    $pdf->Cell($etW, 6, utf8_decode('Numero de Pago:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell($valW, 6, utf8_decode('PAG-PROV-' . str_pad($encIdPago, 6, '0', STR_PAD_LEFT)), 0, 1, 'L');
    $pdf->SetFont('Helvetica', '', 10);

    $fechaFormateada = date('d/m/Y', strtotime($encFechaPago));
    $pdf->Cell($etW, 6, utf8_decode('Fecha:'), 0, 0, 'L');
    $pdf->Cell($valW, 6, $fechaFormateada, 0, 1, 'L');

    $pdf->Cell($etW, 6, utf8_decode('Proveedor:'), 0, 0, 'L');
    $pdf->Cell($valW, 6, utf8_decode($encProveedor), 0, 1, 'L');

    $pdf->Cell($etW, 6, utf8_decode('Medio de Pago:'), 0, 0, 'L');
    $pdf->Cell($valW, 6, utf8_decode($encMedioPago ?: 'No especificado'), 0, 1, 'L');

    $pdf->Cell($etW, 6, utf8_decode('Moneda:'), 0, 0, 'L');
    $pdf->Cell($valW, 6, utf8_decode($encMoneda), 0, 1, 'L');

    $pdf->Cell($etW, 6, utf8_decode('TRM:'), 0, 0, 'L');
    $pdf->Cell($valW, 6, '$' . number_format(floatval($encTRM), 2), 0, 1, 'L');

    if (!empty($encObservaciones)) {
        $pdf->Cell($etW, 6, utf8_decode('Observaciones:'), 0, 0, 'L');
        $pdf->Cell($valW, 6, utf8_decode($encObservaciones), 0, 1, 'L');
    }

    $pdf->Ln(6);

    // --- TABLA DE COMPRAS PAGADAS ---
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->SetFillColor(210, 240, 210);
    $pdf->Cell(0, 7, utf8_decode('  COMPRAS PAGADAS'), 'B', 1, 'L', true);
    $pdf->Ln(2);

    // Anchos de columna (total usable ~188mm)
    $cCompra  = 38;
    $cFecha   = 32;
    $cTotal   = 38;
    $cDevol   = 38;
    $cPagado  = 42;

    // Encabezados de tabla
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->SetFillColor(180, 220, 180);
    $pdf->Cell($cCompra,  7, utf8_decode('No. Compra'),   1, 0, 'C', true);
    $pdf->Cell($cFecha,   7, utf8_decode('Fecha'),        1, 0, 'C', true);
    $pdf->Cell($cTotal,   7, utf8_decode('Total Compra'), 1, 0, 'C', true);
    $pdf->Cell($cDevol,   7, utf8_decode('Devolucion'),   1, 0, 'C', true);
    $pdf->Cell($cPagado,  7, utf8_decode('Valor Pagado'), 1, 1, 'C', true);

    // Filas con colores alternados
    $pdf->SetFont('Helvetica', '', 9);
    $fila = 0;
    foreach ($compras as $compra) {
        $fill = ($fila % 2 === 0);
        $pdf->SetFillColor(245, 252, 245);
        $fechaC = date('d/m/Y', strtotime($compra['fechaCompra']));
        $pdf->Cell($cCompra,  7, utf8_decode($compra['numeroCompra']),               1, 0, 'C', $fill);
        $pdf->Cell($cFecha,   7, $fechaC,                                            1, 0, 'C', $fill);
        $pdf->Cell($cTotal,   7, '$' . number_format($compra['totalCompra'], 2),     1, 0, 'R', $fill);
        $pdf->Cell($cDevol,   7, '$' . number_format($compra['totalDevolucion'], 2), 1, 0, 'R', $fill);
        $pdf->Cell($cPagado,  7, '$' . number_format($compra['valorPago'], 2),       1, 1, 'R', $fill);
        $fila++;
    }

    // Fila total
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->SetFillColor(210, 240, 210);
    $anchoEtiqueta = $cCompra + $cFecha + $cTotal + $cDevol;
    $pdf->Cell($anchoEtiqueta, 8, utf8_decode('TOTAL PAGADO:'), 1, 0, 'R', true);
    $pdf->Cell($cPagado, 8, '$' . number_format($valorTotalPago, 2), 1, 1, 'R', true);

    $pdf->Ln(18);

    // --- FIRMAS ---
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(94, 6, '_________________________', 0, 0, 'C');
    $pdf->Cell(94, 6, '_________________________', 0, 1, 'C');
    $pdf->Cell(94, 6, utf8_decode('Recibido por'), 0, 0, 'C');
    $pdf->Cell(94, 6, utf8_decode('Entregado por'), 0, 1, 'C');

    $pdf->Output('I', 'Pago_Proveedor_' . $encIdPago . '.pdf');
} catch (Exception $e) {
    error_log("Error en ApiGenerarPDFPagoProveedor.php: " . $e->getMessage());
    header("Content-Type: application/json");
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} finally {
    if (isset($enlace)) $enlace->close();
}
