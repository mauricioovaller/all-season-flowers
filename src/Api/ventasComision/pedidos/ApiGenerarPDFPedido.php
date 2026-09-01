<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;
require_once FPDF_PATH;
$enlace->set_charset("utf8mb4");

$input = json_decode(file_get_contents('php://input'), true);
$idPedido = intval($input['idPedido'] ?? 0);
if ($idPedido <= 0) { http_response_code(400); exit; }

// --- OBTENER DATOS DEL PEDIDO ---
$r = $enlace->query("SELECT e.*, c.NOMBRE, c.PAIS,
    CONCAT(c.Direc1, ', ', c.CIUDAD, ', ', c.ESTADO, ', ', c.PAIS) AS direccion,
    m.Moneda, ev.NOMEJECUTIVO
    FROM SAS_EncabPedidoComision e
    LEFT JOIN GEN_Clientes c ON e.IdCliente = c.IdCliente
    LEFT JOIN GEN_Monedas m ON e.IdMoneda = m.IdMoneda
    LEFT JOIN GEN_Ejecutivos ev ON e.IdEjecutivo = ev.IdEjecutivo
    WHERE e.IdEncabPedidoComision = $idPedido");
$encab = $r->fetch_assoc();
if (!$encab) { http_response_code(404); exit; }

// Dirección en dos líneas
$direccion = $encab['direccion'] ?? '';
$dirLinea1 = $direccion;
$dirLinea2 = '';
if (strlen($direccion) > 55) {
    $partes = explode(',', $direccion);
    $dirLinea1 = trim($partes[0] . (isset($partes[1]) ? ',' . $partes[1] : ''));
    $dirLinea2 = trim(implode(',', array_slice($partes, 2)));
}

// --- OBTENER DETALLE ---
$r = $enlace->query("SELECT de.IdDetEmpaqueComision, te.Descripcion AS empaque,
    de.Cantidad AS piezas, te.EquivFull, de.PO_Empaque,
    dp.Descripcion, pr.NOMPRODUCTO, v.NOMVARIEDAD, g.NOMGRADO,
    u.DescripUnidad AS unidad,
    dp.Tallos_Ramo, dp.Ramos_Caja, dp.Precio_Venta,
    (dp.Tallos_Ramo * dp.Ramos_Caja) AS tallos_caja,
    (de.Cantidad * dp.Tallos_Ramo * dp.Ramos_Caja * dp.Precio_Venta) AS total_venta
    FROM SAS_DetEmpaqueComision de
    INNER JOIN SAS_DetProductoComision dp ON de.IdDetEmpaqueComision = dp.IdDetEmpaqueComision
    LEFT JOIN GEN_TipoEmpaque te ON de.IdTipoEmpaque = te.IdTipoEmpaque
    LEFT JOIN GEN_Productos pr ON dp.IdProducto = pr.IdProducto
    LEFT JOIN GEN_Variedades v ON dp.IdVariedad = v.IdVariedad
    LEFT JOIN GEN_Grados g ON dp.IdGrado = g.IdGrado
    LEFT JOIN GEN_Unidades u ON dp.IdUnidad = u.IdUnidades
    WHERE de.IdEncabPedidoComision = $idPedido
    AND (de.Anulado IS NULL OR de.Anulado = 0)
    AND (dp.Anulado IS NULL OR dp.Anulado = 0)
    ORDER BY de.IdDetEmpaqueComision, dp.IdDetProductoComision");

$items = [];
$tot_piezas = 0;
$tot_full = 0;
$tot_tallos = 0;
$tot_general = 0;
$empaques_contados = [];

while ($row = $r->fetch_assoc()) {
    $idDet = $row['IdDetEmpaqueComision'];
    $piezas = intval($row['piezas']);
    $full = $piezas * floatval($row['EquivFull'] ?? 1);
    $tallos = intval($row['Tallos_Ramo']) * intval($row['Ramos_Caja']);
    $total = floatval($row['total_venta']);

    if (!isset($empaques_contados[$idDet])) {
        $tot_piezas += $piezas;
        $tot_full += $full;
        $empaques_contados[$idDet] = true;
    }
    $tot_tallos += $tallos * $piezas;
    $tot_general += $total;
    $items[] = $row;
}

// --- CLASE PDF ---
class PDF_SP extends FPDF {
    function Header() {
        $this->SetFont('Helvetica', 'B', 14);
        $this->SetTextColor(50, 50, 50);
        $this->Cell(0, 10, utf8_decode('SOLICITUD PEDIDO'), 0, 1, 'C');
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

$pdf = new PDF_SP('P', 'mm', 'Letter');
$pdf->SetMargins(10, 10, 10);
$pdf->AliasNbPages();
$pdf->AddPage();
$pdf->SetAutoPageBreak(true, 20);

// --- DATOS DEL PEDIDO ---
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(0, 6, utf8_decode('N°: ' . $encab['NumeroPedido']), 0, 1, 'R');
$pdf->Ln(2);

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->SetFillColor(235, 235, 235);
$pdf->Cell(0, 5, utf8_decode('DATOS DEL PEDIDO'), 0, 1, '', true);
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(95, 4, utf8_decode('Cliente: ' . ($encab['NOMBRE'] ?? '-')), 0, 0);
$pdf->Cell(95, 4, utf8_decode('Fecha Solicitud: ' . ($encab['FechaSolicitud'] ?? '-')), 0, 1);
$pdf->Cell(95, 4, utf8_decode('País: ' . ($encab['PAIS'] ?? '-')), 0, 0);
$pdf->Cell(95, 4, utf8_decode('Fecha Entrega: ' . ($encab['FechaEntrega'] ?? '-')), 0, 1);
$pdf->Cell(95, 4, utf8_decode('Dirección: ' . $dirLinea1), 0, 0);
$pdf->Cell(95, 4, utf8_decode('Ejecutivo: ' . ($encab['NOMEJECUTIVO'] ?? '-')), 0, 1);
if (!empty($dirLinea2)) {
    $pdf->Cell(95, 4, utf8_decode($dirLinea2), 0, 0);
    $pdf->Cell(95, 4, '', 0, 1);
}
$pdf->Cell(95, 4, utf8_decode('Moneda: ' . ($encab['Moneda'] ?? '-') . ' - TRM: ' . number_format(floatval($encab['TRM'] ?? 0), 2)), 0, 0);
$pdf->Cell(95, 4, utf8_decode('Estado: ' . ($encab['Estado'] ?? 'Activo')), 0, 1);
$pdf->Ln(4);

// --- TABLA DE DETALLE ---
$pdf->SetFont('Helvetica', 'B', 6.5);
$pdf->SetFillColor(220, 220, 220);

$w = [7, 18, 8, 12, 50, 18, 18, 8, 8, 12, 12, 19];
$headers = ['#', 'Empaque', 'Pz', 'Full', 'Descripcion', 'Variedad', 'Grado', 'T/R', 'R/C', 'Tallos', 'Precio', 'Total'];
foreach ($headers as $i => $h) {
    $pdf->Cell($w[$i], 5, utf8_decode($h), 1, 0, 'C', true);
}
$pdf->Ln();

$pdf->SetFont('Helvetica', '', 6.5);
$itemGlobal = 0;
$ultimoEmpaque = null;

foreach ($items as $row) {
    $idDet = $row['IdDetEmpaqueComision'];
    $piezas = intval($row['piezas']);
    $full = $piezas * floatval($row['EquivFull'] ?? 1);
    $tallosRamo = intval($row['Tallos_Ramo']);
    $ramosCaja = intval($row['Ramos_Caja']);
    $tallosCaja = $tallosRamo * $ramosCaja;
    $precio = floatval($row['Precio_Venta']);
    $total = floatval($row['total_venta']);

    if ($ultimoEmpaque !== $idDet) {
        $ultimoEmpaque = $idDet;
        $itemGlobal++;
        $pdf->SetFont('Helvetica', 'B', 6.5);
        $pdf->Cell($w[0], 4, $itemGlobal, 1, 0, 'C');
        $pdf->SetFont('Helvetica', '', 6.5);
    } else {
        $pdf->Cell($w[0], 4, '', 1, 0, 'C');
    }

    $pdf->Cell($w[1], 4, utf8_decode(substr($row['empaque'] ?? '', 0, 14)), 1, 0, 'C');
    $pdf->Cell($w[2], 4, $piezas, 1, 0, 'C');
    $pdf->Cell($w[3], 4, number_format($full, 2), 1, 0, 'C');
    $pdf->Cell($w[4], 4, utf8_decode(substr($row['NOMPRODUCTO'] ?? $row['Descripcion'] ?? '-', 0, 38)), 1, 0, 'L');
    $pdf->Cell($w[5], 4, utf8_decode(substr($row['NOMVARIEDAD'] ?? '-', 0, 14)), 1, 0, 'L');
    $pdf->Cell($w[6], 4, utf8_decode(substr($row['NOMGRADO'] ?? '-', 0, 14)), 1, 0, 'L');
    $pdf->Cell($w[7], 4, $tallosRamo, 1, 0, 'C');
    $pdf->Cell($w[8], 4, $ramosCaja, 1, 0, 'C');
    $pdf->Cell($w[9], 4, $tallosCaja, 1, 0, 'C');
    $pdf->Cell($w[10], 4, number_format($precio, 2), 1, 0, 'R');
    $pdf->Cell($w[11], 4, number_format($total, 2), 1, 1, 'R');
}

// --- TOTALES ---
$pdf->Ln(4);
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->SetFillColor(235, 235, 235);
$pdf->Cell(135, 6, utf8_decode('Piezas: ' . $tot_piezas . ' | Fulles: ' . number_format($tot_full, 2) . ' | Tallos: ' . number_format($tot_tallos)), 1, 0, 'L', true);
$pdf->Cell(25, 6, utf8_decode('TOTAL'), 1, 0, 'R', true);
$pdf->Cell(30, 6, number_format($tot_general, 2), 1, 1, 'R', true);

if ($encab['IVA']) {
    $iva = $tot_general * 0.19;
    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->SetFillColor(250, 250, 230);
    $pdf->Cell(160, 5, utf8_decode('IVA 19%'), 1, 0, 'R', true);
    $pdf->Cell(30, 5, number_format($iva, 2), 1, 1, 'R', true);
}

if (!empty($encab['Observaciones'])) {
    $pdf->Ln(3);
    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->Cell(0, 5, utf8_decode('Observaciones:'), 0, 1);
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->MultiCell(0, 4, utf8_decode($encab['Observaciones']), 0, 1);
}

$pdf->Ln(6);
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(0, 5, '_________________________          _________________________', 0, 1, 'C');
$pdf->Cell(0, 5, utf8_decode('        Elaboró                              Aprobó'), 0, 1, 'C');

header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="Solicitud_' . $encab['NumeroPedido'] . '.pdf"');
$pdf->Output('I');
