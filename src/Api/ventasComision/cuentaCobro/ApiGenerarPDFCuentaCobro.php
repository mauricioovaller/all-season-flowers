<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

require_once __DIR__ . '/../../config/empresa.php';
require_once FPDF_PATH;

$input = json_decode(file_get_contents('php://input'), true);
$fechaInicio = $input['fechaInicio'] ?? '';
$fechaFin = $input['fechaFin'] ?? '';
$clienteNombre = $input['clienteNombre'] ?? 'Todos los clientes';
$pedidos = $input['pedidos'] ?? [];
$totales = $input['totales'] ?? [];

class PDF_CC extends FPDF {
    function Header() {
        $this->SetFont('Helvetica', 'B', 14);
        $this->SetTextColor(50, 50, 50);
        $this->Cell(0, 10, utf8_decode('CUENTA DE COBRO'), 0, 1, 'C');
        $this->SetFont('Helvetica', '', 8);
        $this->SetTextColor(100, 100, 100);
        $this->Cell(0, 5, utf8_decode('Comisiones por Ventas'), 0, 1, 'C');
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

$pdf = new PDF_CC('P', 'mm', 'Letter');
$pdf->SetMargins(10, 10, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

// --- PERIODO Y CLIENTE ---
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 5, utf8_decode('Período: ' . $fechaInicio . ' al ' . $fechaFin), 0, 1, 'C');
$pdf->Cell(0, 5, utf8_decode('Cliente: ' . $clienteNombre), 0, 1, 'C');
$pdf->Ln(6);

// --- DETALLE DE PEDIDOS ---
$pdf->SetFont('Helvetica', 'B', 7);
$pdf->SetFillColor(220, 220, 220);

$w = [45, 30, 35, 25, 25, 30];
$headers = ['N° Pedido', 'Fecha', 'Valor Total', '% Comision', 'Valor Comision', 'Total a Cobrar'];
foreach ($headers as $i => $h) {
    $pdf->Cell($w[$i], 6, utf8_decode($h), 1, 0, 'C', true);
}
$pdf->Ln();

$pdf->SetFont('Helvetica', '', 7);
$totalValor = 0;
$totalComision = 0;

foreach ($pedidos as $p) {
    $val = floatval($p['valorTotal'] ?? 0);
    $com = floatval($p['comision'] ?? 0);
    $pct = floatval($p['PorcentajeComision'] ?? 0);
    $totalValor += $val;
    $totalComision += $com;

    $pdf->Cell($w[0], 5, $p['numeroPedido'] ?? ('ID: ' . $p['idPedido']), 1, 0, 'L');
    $pdf->Cell($w[1], 5, $p['fecha'] ?? '-', 1, 0, 'C');
    $pdf->Cell($w[2], 5, '$' . number_format($val, 2), 1, 0, 'R');
    $pdf->Cell($w[3], 5, number_format($pct, 2) . '%', 1, 0, 'C');
    $pdf->Cell($w[4], 5, '$' . number_format($com, 2), 1, 0, 'R');
    $pdf->Cell($w[5], 5, '$' . number_format($com, 2), 1, 1, 'R');
}

// --- TOTALES ---
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->SetFillColor(235, 235, 235);
$pdf->Cell($w[0] + $w[1], 6, utf8_decode('TOTALES'), 1, 0, 'R', true);
$pdf->Cell($w[2], 6, '$' . number_format($totalValor, 2), 1, 0, 'R', true);
$pdf->Cell($w[3], 6, '', 1, 0, 'C', true);
$pdf->Cell($w[4], 6, '$' . number_format($totalComision, 2), 1, 0, 'R', true);
$pdf->Cell($w[5], 6, '$' . number_format($totalComision, 2), 1, 1, 'R', true);

$pdf->Ln(8);

// --- RESUMEN ---
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->SetFillColor(240, 240, 240);
$pdf->Cell(0, 7, utf8_decode('RESUMEN'), 1, 1, 'C', true);
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(90, 6, utf8_decode('Cantidad de Pedidos:'), 1, 0);
$pdf->Cell(100, 6, count($pedidos), 1, 1, 'R');
$pdf->Cell(90, 6, utf8_decode('Valor Total de Productos:'), 1, 0);
$pdf->Cell(100, 6, '$' . number_format($totalValor, 2), 1, 1, 'R');
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->SetFillColor(230, 240, 230);
$pdf->Cell(90, 7, utf8_decode('TOTAL COMISIÓN A COBRAR:'), 1, 0, '', true);
$pdf->Cell(100, 7, '$' . number_format($totalComision, 2), 1, 1, 'R', true);

$pdf->Ln(15);
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(0, 5, '_________________________          _________________________', 0, 1, 'C');
$pdf->Cell(0, 5, utf8_decode('        Elaboró                              Recibí'), 0, 1, 'C');

header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="CuentaCobro_' . $fechaInicio . '_' . $fechaFin . '.pdf"');
$pdf->Output('I');
