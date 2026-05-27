<?php
require_once __DIR__ . '/../config/empresa.php';
require_once FPDF_PATH;
require_once CONEXION_BD_PATH;
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

$input = json_decode(file_get_contents("php://input"), true);
if (!isset($input['idBaja']) || empty($input['idBaja'])) {
    die(json_encode(["error" => "ID de baja no válido."]));
}

$idBaja = intval($input['idBaja']);

// Consulta encabezado
$sqlEnc = "SELECT
    eb.IdEncabBaja,
    CONCAT('BAJA-', LPAD(eb.IdEncabBaja, 6, '0')) AS numero_baja,
    eb.Fecha,
    eb.MotivoGeneral,
    eb.Observaciones,
    eb.QuienAutoriza,
    eb.Anulado
FROM SAS_EncabBaja eb
WHERE eb.IdEncabBaja = ?";

$stmtEnc = $enlace->prepare($sqlEnc);
$stmtEnc->bind_param("i", $idBaja);
$stmtEnc->execute();
$stmtEnc->bind_result(
    $idEncabBaja,
    $numero_baja,
    $fecha,
    $motivoGeneral,
    $observaciones,
    $quienAutoriza,
    $anulado
);

if (!$stmtEnc->fetch()) {
    die(json_encode(["error" => "Baja no encontrada."]));
}
$stmtEnc->close();

// Consulta detalle
$sqlDet = "SELECT
    db.IdDetBaja,
    p.NOMPRODUCTO AS producto,
    v.NOMVARIEDAD AS variedad,
    g.NOMGRADO AS grado,
    db.Tallos,
    db.MotivoSalida
FROM SAS_DetBaja db
LEFT JOIN GEN_Productos p ON db.IdProducto = p.IdProducto
LEFT JOIN GEN_Variedades v ON db.IdVariedad = v.IdVariedad
LEFT JOIN GEN_Grados g ON db.IdGrado = g.IdGrado
WHERE db.IdEncabBaja = ?
ORDER BY db.IdDetBaja";

$stmtDet = $enlace->prepare($sqlDet);
$stmtDet->bind_param("i", $idBaja);
$stmtDet->execute();
$stmtDet->bind_result(
    $idDetBaja,
    $producto,
    $variedad,
    $grado,
    $tallos,
    $motivoSalida
);

$detalle = [];
$totalTallos = 0;
while ($stmtDet->fetch()) {
    $detalle[] = [
        'producto' => $producto,
        'variedad' => $variedad,
        'grado' => $grado,
        'tallos' => $tallos,
        'motivo' => $motivoSalida,
    ];
    $totalTallos += $tallos;
}
$stmtDet->close();

$fechaFormateada = date('d-M-y', strtotime($fecha));

class PDF_Baja extends FPDF
{
    function Header()
    {
        global $numero_baja, $fechaFormateada, $motivoGeneral, $quienAutoriza, $observaciones, $anulado;

        // Logo
        $this->Image(EMPRESA_LOGO_PATH, 10, 8, 50);

        // Línea con nombre empresa
        $this->SetY(12);
        $this->SetX(65);
        $this->SetFont('Helvetica', 'B', 16);
        $this->SetTextColor(22, 101, 52);
        $this->Cell(0, 8, utf8_decode(EMPRESA_NOMBRE_TITULO), 0, 1, 'L');

        $this->SetX(65);
        $this->SetFont('Helvetica', '', 9);
        $this->SetTextColor(100, 100, 100);
        $this->Cell(0, 5, utf8_decode(EMPRESA_LEMA), 0, 1, 'L');

        // Título del reporte
        $this->SetY(28);
        $this->SetX(10);
        $this->SetFont('Helvetica', 'B', 14);
        $this->SetTextColor(0, 0, 0);

        $titulo = 'REPORTE DE BAJA - SALIDA DE PRODUCTO';
        if ($anulado == 1) {
            $titulo .= ' [ANULADO]';
            $this->SetTextColor(200, 0, 0);
        }
        $this->Cell(0, 8, utf8_decode($titulo), 0, 1, 'C');

        // Línea separadora
        $this->SetDrawColor(22, 101, 52);
        $this->SetLineWidth(0.5);
        $this->Line(10, $this->GetY() + 1, 200, $this->GetY() + 1);
        $this->Ln(5);

        // Datos del encabezado
        $this->SetFont('Helvetica', '', 9);
        $this->SetTextColor(0, 0, 0);

        // Columna izquierda
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(35, 5, utf8_decode('No. Baja:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(40, 5, $numero_baja, 0, 0, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(20, 5, 'Fecha:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 5, $fechaFormateada, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(35, 5, utf8_decode('Motivo General:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 5, utf8_decode($motivoGeneral), 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(35, 5, utf8_decode('Qui' . chr(0xA9) . 'n Autoriza:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 5, utf8_decode($quienAutoriza ?: 'N/A'), 0, 1, 'L');

        if (!empty($observaciones)) {
            $this->SetFont('Helvetica', 'B', 9);
            $this->Cell(35, 5, 'Observaciones:', 0, 0, 'L');
            $this->SetFont('Helvetica', '', 8);
            $this->MultiCell(0, 4, utf8_decode($observaciones), 0, 'L');
        }

        if ($anulado == 1) {
            $this->SetTextColor(200, 0, 0);
            $this->SetFont('Helvetica', 'B', 12);
            $this->Ln(2);
            $this->Cell(0, 6, '*** ESTA BAJA HA SIDO ANULADA ***', 0, 1, 'C');
            $this->SetTextColor(0, 0, 0);
        }

        $this->Ln(4);

        // Encabezado de tabla
        $this->SetDrawColor(0, 0, 0);
        $this->SetFont('Helvetica', 'B', 8);
        $this->SetFillColor(22, 101, 52);
        $this->SetTextColor(255, 255, 255);

        $wProd = 55;
        $wVar = 35;
        $wGra = 25;
        $wTallos = 20;
        $wMotivo = 55;

        $this->Cell($wProd, 6, 'Producto', 1, 0, 'C', true);
        $this->Cell($wVar, 6, utf8_decode('Variedad'), 1, 0, 'C', true);
        $this->Cell($wGra, 6, 'Grado', 1, 0, 'C', true);
        $this->Cell($wTallos, 6, 'Tallos', 1, 0, 'C', true);
        $this->Cell($wMotivo, 6, utf8_decode('Motivo Salida'), 1, 1, 'C', true);
    }

    function Footer()
    {
        $this->SetY(-15);
        $this->SetFont('Helvetica', 'I', 8);
        $this->SetTextColor(120, 120, 120);
        $this->Cell(0, 10, utf8_decode(EMPRESA_NOMBRE . ' | Página ') . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

$pdf = new PDF_Baja('P', 'mm', 'Letter');
$pdf->SetMargins(10, 10, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

$pdf->SetFont('Helvetica', '', 8);
$pdf->SetFillColor(255, 255, 255);
$pdf->SetTextColor(0, 0, 0);

$wProd = 55;
$wVar = 35;
$wGra = 25;
$wTallos = 20;
$wMotivo = 55;
$fila = 0;

foreach ($detalle as $item) {
    if ($pdf->GetY() > 255) {
        $pdf->AddPage();
        $pdf->SetFont('Helvetica', '', 8);
    }

    $fill = ($fila % 2 == 0);
    if ($fill) {
        $pdf->SetFillColor(240, 253, 244);
    } else {
        $pdf->SetFillColor(255, 255, 255);
    }

    $pdf->Cell($wProd, 5, utf8_decode(substr($item['producto'] ?: 'N/A', 0, 25)), 1, 0, 'L', $fill);
    $pdf->Cell($wVar, 5, utf8_decode(substr($item['variedad'] ?: 'N/A', 0, 18)), 1, 0, 'L', $fill);
    $pdf->Cell($wGra, 5, utf8_decode(substr($item['grado'] ?: 'N/A', 0, 12)), 1, 0, 'L', $fill);
    $pdf->Cell($wTallos, 5, number_format($item['tallos']), 1, 0, 'C', $fill);
    $pdf->Cell($wMotivo, 5, utf8_decode(substr($item['motivo'] ?: 'N/A', 0, 25)), 1, 1, 'L', $fill);

    $fila++;
}

// Línea separadora
$pdf->Ln(3);
$pdf->SetDrawColor(22, 101, 52);
$pdf->SetLineWidth(0.3);
$pdf->Line(10, $pdf->GetY(), 200, $pdf->GetY());
$pdf->Ln(3);

// Total tallos
$pdf->SetFont('Helvetica', 'B', 11);
$pdf->Cell(135, 7, '', 0, 0, 'L');
$pdf->Cell(25, 7, 'TOTAL TALLOS:', 0, 0, 'R');
$pdf->Cell(20, 7, number_format($totalTallos), 0, 1, 'R');

// Info de generación
$pdf->SetFont('Helvetica', 'I', 7);
$pdf->SetTextColor(120, 120, 120);
$pdf->Cell(0, 5, 'Generado: ' . date('Y-m-d H:i:s'), 0, 1, 'R');

$pdf->Output('I', 'Baja_' . $numero_baja . '.pdf');
?>
