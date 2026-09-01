<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;
require_once FPDF_PATH;

$input = json_decode(file_get_contents('php://input'), true);
$idFactura = intval($input['idFactura'] ?? 0);
if ($idFactura <= 0) { http_response_code(400); exit; }

$r = $enlace->query("SELECT e.*, c.NOMBRE, c.PAIS, m.Moneda
    FROM SAS_EncabPedidoComision e
    LEFT JOIN GEN_Clientes c ON e.IdCliente = c.IdCliente
    LEFT JOIN GEN_Monedas m ON e.IdMoneda = m.IdMoneda
    WHERE e.IdEncabPedidoComision = $idFactura");
$encab = $r->fetch_assoc();
if (!$encab) { http_response_code(404); exit; }

$r = $enlace->query("SELECT dp.*, pr.NOMPRODUCTO,
    v.NOMVARIEDAD, g.NOMGRADO,
    (dp.Tallos_Ramo * dp.Ramos_Caja * de.Cantidad) AS tallosFacturados
    FROM SAS_DetProductoComision dp
    INNER JOIN SAS_DetEmpaqueComision de ON dp.IdDetEmpaqueComision = de.IdDetEmpaqueComision
    LEFT JOIN GEN_Productos pr ON dp.IdProducto = pr.IdProducto
    LEFT JOIN GEN_Variedades v ON dp.IdVariedad = v.IdVariedad
    LEFT JOIN GEN_Grados g ON dp.IdGrado = g.IdGrado
    WHERE dp.IdEncabPedidoComision = $idFactura AND (dp.Anulado IS NULL OR dp.Anulado = 0)
    AND dp.TallosDevolucion IS NOT NULL AND dp.TallosDevolucion > 0");
$detalle = $r->fetch_all(MYSQLI_ASSOC);

$numDev = 'DEV-' . str_pad(intval($encab['IdDevolucion'] ?? 0), 6, '0', STR_PAD_LEFT);

class PDF_DC extends FPDF {
    function Header() {
        $this->SetFont('Helvetica', 'B', 14);
        $this->SetTextColor(50, 50, 50);
        $this->Cell(0, 10, utf8_decode('DEVOLUCIÓN - VENTAS COMISIÓN'), 0, 1, 'C');
        $this->SetTextColor(0, 0, 0);
        $this->Ln(2);
        $this->SetDrawColor(80, 80, 80);
        $this->SetLineWidth(0.4);
        $this->Line(10, $this->GetY(), 200, $this->GetY());
        $this->Ln(4);
    }
    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Helvetica', 'I', 7);
        $this->SetTextColor(128, 128, 128);
        $this->Cell(0, 10, utf8_decode('Página ') . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

$pdf = new PDF_DC('P', 'mm', 'Letter');
$pdf->SetMargins(10, 10, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 6, utf8_decode('N°: ' . $numDev), 0, 1, 'R');
$pdf->Ln(2);

$pdf->SetFont('Helvetica', 'B', 9);
$pdf->SetFillColor(235, 235, 235);
$pdf->Cell(0, 6, utf8_decode('DATOS DE LA DEVOLUCIÓN'), 0, 1, '', true);
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(95, 5, utf8_decode('Cliente: ' . ($encab['NOMBRE'] ?? '-')), 0, 0);
$pdf->Cell(95, 5, utf8_decode('Fecha Devolución: ' . ($encab['FechaDevolucion'] ?? '-')), 0, 1);
$pdf->Cell(95, 5, utf8_decode('Pedido: ' . ($encab['NumeroPedido'] ?? '-')), 0, 0);
$pdf->Cell(95, 5, utf8_decode('Moneda: ' . ($encab['Moneda'] ?? '-')), 0, 1);
$pdf->Ln(4);

if (!empty($encab['ObservacionesDevolucion'])) {
    $pdf->SetFont('Helvetica', 'I', 8);
    $pdf->MultiCell(0, 4, utf8_decode('Observaciones: ' . $encab['ObservacionesDevolucion']), 0, 1);
    $pdf->Ln(3);
}

// Tabla
$pdf->SetFont('Helvetica', 'B', 7);
$pdf->SetFillColor(220, 220, 220);
$w = [50, 22, 18, 18, 18, 18, 20, 26];
$headers = ['Producto', 'Variedad', 'Grado', 'Tallos Fact.', 'Tallos Dev.', 'Precio', 'Valor', 'Motivo'];
foreach ($headers as $i => $h) {
    $pdf->Cell($w[$i], 6, utf8_decode($h), 1, 0, 'C', true);
}
$pdf->Ln();

$pdf->SetFont('Helvetica', '', 7);
$totalValor = 0;
foreach ($detalle as $d) {
    $tallosDev = intval($d['TallosDevolucion'] ?? 0);
    $precio = floatval($d['Precio_Venta'] ?? 0);
    $valor = $tallosDev * $precio + floatval($d['Flete'] ?? 0) + floatval($d['Fumigacion'] ?? 0) + floatval($d['Otros'] ?? 0);
    $totalValor += $valor;

    $pdf->Cell($w[0], 5, utf8_decode(substr($d['NOMPRODUCTO'] ?? $d['Descripcion'] ?? '-', 0, 30)), 1);
    $pdf->Cell($w[1], 5, utf8_decode(substr($d['NOMVARIEDAD'] ?? '-', 0, 12)), 1);
    $pdf->Cell($w[2], 5, utf8_decode(substr($d['NOMGRADO'] ?? '-', 0, 10)), 1);
    $pdf->Cell($w[3], 5, intval($d['tallosFacturados'] ?? 0), 1, 0, 'C');
    $pdf->Cell($w[4], 5, $tallosDev, 1, 0, 'C');
    $pdf->Cell($w[5], 5, number_format($precio, 2), 1, 0, 'R');
    $pdf->Cell($w[6], 5, '$' . number_format($valor, 2), 1, 0, 'R');
    $pdf->Cell($w[7], 5, utf8_decode(substr($d['MotivoDevolucion'] ?? '', 0, 15)), 1, 1);
}

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->SetFillColor(235, 235, 235);
$pdf->Cell(162, 6, utf8_decode('TOTAL DEVOLUCIÓN:'), 1, 0, 'R', true);
$pdf->Cell(22, 6, '$' . number_format($totalValor, 2), 1, 1, 'R', true);

$pdf->Ln(8);
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(0, 5, '_________________________          _________________________', 0, 1, 'C');
$pdf->Cell(0, 5, utf8_decode('        Elaboró                              Recibí'), 0, 1, 'C');

header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="Devolucion_' . $numDev . '.pdf"');
$pdf->Output('I');
