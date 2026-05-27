<?php
// src/Api/devoluciones/ApiGenerarPDFDevolucion.php
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
if (!isset($input['idFactura']) || empty($input['idFactura'])) {
    die(json_encode(["error" => "ID de factura no válido."]));
}

$idFactura = intval($input['idFactura']);

// 🔴 CONSULTA 1: ENCABEZADO DE DEVOLUCIÓN (desde la factura con datos de devolución)
$sqlEncabezado = "SELECT
                    enc.IdEncabPedido,
                    enc.IdDevolucion,
                    CONCAT('DEV-', LPAD(enc.IdDevolucion, 6, '0')) AS numero_devolucion,
                    enc.FechaDevolucion,
                    enc.ObservacionesDevolucion,
                    CONCAT('FACT-', LPAD(enc.Factura, 6, '0')) AS factura_asociada,
                    enc.Factura AS factura_numero,
                    enc.FechaSolicitud AS fecha_factura,
                    cli.NOMBRE AS cliente_nombre,
                    cli.Direc1 AS direccion_cliente,
                    cli.CIUDAD AS ciudad_cliente,
                    cli.TEL1 AS telefono_cliente,
                    enc.AWB,
                    enc.AWB_HIJA,
                    enc.AWB_NIETA,
                    COALESCE(aer.NOMAEROLINEA, 'UNITED PARCEL SERVICE') AS aerolinea,
                    enc.IVA AS tiene_iva,
                    enc.TRM,
                    m.Moneda AS moneda
                FROM SAS_EncabPedido enc
                INNER JOIN GEN_Clientes cli ON enc.IdCliente = cli.IdCliente
                LEFT JOIN GEN_Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
                LEFT JOIN GEN_Monedas m ON enc.IdMoneda = m.IdMoneda
                WHERE enc.IdEncabPedido = ? AND enc.IdDevolucion IS NOT NULL";

$stmtEnc = $enlace->prepare($sqlEncabezado);
$stmtEnc->bind_param("i", $idFactura);
$stmtEnc->execute();
$stmtEnc->bind_result(
    $idEncabPedido,
    $idDevolucion,
    $numero_devolucion,
    $fechaDevolucion,
    $observacionesDevolucion,
    $factura_asociada,
    $factura_numero,
    $fecha_factura,
    $cliente_nombre,
    $direccion_cliente,
    $ciudad_cliente,
    $telefono_cliente,
    $awb,
    $awb_hija,
    $awb_nieta,
    $aerolinea,
    $tiene_iva,
    $trm,
    $moneda
);

if (!$stmtEnc->fetch()) {
    die(json_encode(["error" => "Devolución no encontrada para esta factura."]));
}
$stmtEnc->close();

// 🔴 CONSULTA 2: DETALLE DE PRODUCTOS CON DATOS DE DEVOLUCIÓN
$sqlDetalle = "SELECT
                dp.IdDetProducto,
                p.NOMPRODUCTO AS producto,
                v.NOMVARIEDAD AS variedad,
                g.NOMGRADO AS grado,
                dp.TallosDevolucion,
                dp.Precio_Venta AS precio_unitario,
                dp.MotivoDevolucion,
                dp.Flete,
                dp.Fumigacion,
                dp.Otros,
                (dp.TallosDevolucion * dp.Precio_Venta) AS subtotal_producto,
                ((dp.TallosDevolucion * dp.Precio_Venta) + dp.Flete + dp.Fumigacion + dp.Otros) AS total_linea
            FROM SAS_DetProducto dp
            LEFT JOIN GEN_Productos p ON dp.IdProducto = p.IdProducto
            LEFT JOIN GEN_Variedades v ON dp.IdVariedad = v.IdVariedad
            LEFT JOIN GEN_Grados g ON dp.IdGrado = g.IdGrado
            WHERE dp.IdEncabPedido = ? AND dp.TallosDevolucion > 0
            ORDER BY dp.IdDetProducto";

$stmtDet = $enlace->prepare($sqlDetalle);
$stmtDet->bind_param("i", $idFactura);
$stmtDet->execute();
$stmtDet->bind_result(
    $idDetProducto,
    $producto,
    $variedad,
    $grado,
    $tallosDevueltos,
    $precioUnitario,
    $motivo,
    $flete,
    $fumigacion,
    $otros,
    $subtotalProducto,
    $totalLinea
);

$detalle = [];
$totalSubtotal = 0;
$totalFlete = 0;
$totalFumigacion = 0;
$totalOtros = 0;
$totalGeneral = 0;

while ($stmtDet->fetch()) {
    $item = [
        'producto' => $producto,
        'variedad' => $variedad,
        'grado' => $grado,
        'tallos' => $tallosDevueltos,
        'precio' => $precioUnitario,
        'motivo' => $motivo,
        'flete' => $flete,
        'fumigacion' => $fumigacion,
        'otros' => $otros,
        'subtotal' => $subtotalProducto,
        'total' => $totalLinea
    ];
    $detalle[] = $item;

    $totalSubtotal += $subtotalProducto;
    $totalFlete += $flete;
    $totalFumigacion += $fumigacion;
    $totalOtros += $otros;
    $totalGeneral += $totalLinea;
}
$stmtDet->close();

// Calcular IVA si aplica
$iva = 0;
if ($tiene_iva == 1) {
    $iva = $totalSubtotal * 0.19;
}
$totalFinal = $totalGeneral + $iva;

// Preparar fecha formateada
$fechaFormateada = date('d-M-y', strtotime($fechaDevolucion));

// Clase PDF personalizada (similar a la de factura)
class PDF_Devolucion extends FPDF
{
    function Header()
    {
        global $fechaFormateada, $numero_devolucion, $factura_asociada, $cliente_nombre, $direccion_cliente, $ciudad_cliente, $telefono_cliente, $awb, $awb_hija, $awb_nieta, $aerolinea, $observacionesDevolucion;

        // Logo
        $this->Image(EMPRESA_LOGO_PATH, 10, 8, 50);

        // Título
        $this->SetY(10);
        $this->SetX(70);
        $this->SetFont('Helvetica', 'B', 16);
        $this->Cell(0, 10, utf8_decode('DEVOLUCIÓN / NOTA CRÉDITO VENTA'), 0, 1, 'C');

        // Número de devolución y fecha
        $this->SetX(70);
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(25, 6, utf8_decode('No. Devolución:'), 0, 0, 'R');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(25, 6, $numero_devolucion, 0, 0, 'L');
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(25);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $fechaFormateada, 0, 1, 'L');

        // Factura asociada
        $this->SetX(70);
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(50, 6, 'Factura:', 0, 0, 'R');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $factura_asociada, 0, 1, 'L');

        $this->Ln(10);

        // Datos del cliente
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 5, 'Cliente:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, utf8_decode($cliente_nombre), 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 5, utf8_decode('Dirección:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, utf8_decode($direccion_cliente), 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 5, 'Ciudad:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, utf8_decode($ciudad_cliente), 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 5, utf8_decode('Teléfono:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $telefono_cliente, 0, 1, 'L');

        $this->Ln(3);

        // Información de envío
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(20, 5, 'AWB:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(50, 5, $awb, 0, 0, 'L');
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(25, 5, 'AWB Hija:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(50, 5, $awb_hija, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(20, 5, 'AWB Nieta:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(50, 5, $awb_nieta, 0, 0, 'L');
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(25, 5, utf8_decode('Aerolínea:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, utf8_decode($aerolinea), 0, 1, 'L');

        $this->Ln(5);

        // Observaciones de devolución
        if (!empty($observacionesDevolucion)) {
            $this->SetFont('Helvetica', 'B', 10);
            $this->Cell(30, 5, 'Observaciones:', 0, 0, 'L');
            $this->SetFont('Helvetica', '', 9);
            $this->MultiCell(0, 5, utf8_decode($observacionesDevolucion), 0, 'L');
            $this->Ln(2);
        }
    }

    function Footer()
    {
        $this->SetY(-15);
        $this->SetFont('Helvetica', 'I', 8);
        $this->Cell(0, 10, 'Página ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }

    function addSeparatorLine()
    {
        $this->SetLineWidth(0.1);
        $this->SetDrawColor(150, 150, 150);
        $this->Line($this->GetX(), $this->GetY(), $this->GetX() + 190, $this->GetY());
        $this->Ln(2);
    }
}

// Crear PDF
$pdf = new PDF_Devolucion('P', 'mm', 'Letter');
$pdf->SetMargins(10, 10, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

// Tabla de detalle - ENCABEZADOS
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->SetFillColor(220, 220, 220);

// Definir anchos de columnas (ajusta según necesidad)
$anchoProd = 30;
$anchoVar = 20;
$anchoGrado = 15;
$anchoTallos = 15;
$anchoPrecio = 15;
$anchoMotivo = 40;
$anchoFlete = 12;
$anchoFumi = 12;
$anchoOtros = 12;
$anchoTotal = 20;

$pdf->Cell($anchoProd, 6, 'Producto', 1, 0, 'C', true);
$pdf->Cell($anchoVar, 6, 'Variedad', 1, 0, 'C', true);
$pdf->Cell($anchoGrado, 6, 'Grado', 1, 0, 'C', true);
$pdf->Cell($anchoTallos, 6, 'Tallos', 1, 0, 'C', true);
$pdf->Cell($anchoPrecio, 6, 'Precio U', 1, 0, 'C', true);
$pdf->Cell($anchoMotivo, 6, 'Motivo', 1, 0, 'C', true);
$pdf->Cell($anchoFlete, 6, 'Flete', 1, 0, 'C', true);
$pdf->Cell($anchoFumi, 6, 'Fumig.', 1, 0, 'C', true);
$pdf->Cell($anchoOtros, 6, 'Otros', 1, 0, 'C', true);
$pdf->Cell($anchoTotal, 6, 'Total', 1, 1, 'C', true);

$pdf->SetFont('Helvetica', '', 7);
$pdf->SetFillColor(255, 255, 255);

foreach ($detalle as $item) {
    // Verificar salto de página
    if ($pdf->GetY() > 250) {
        $pdf->AddPage();
        // Redibujar encabezados
        $pdf->SetFont('Helvetica', 'B', 8);
        $pdf->SetFillColor(220, 220, 220);
        $pdf->Cell($anchoProd, 6, 'Producto', 1, 0, 'C', true);
        $pdf->Cell($anchoVar, 6, 'Variedad', 1, 0, 'C', true);
        $pdf->Cell($anchoGrado, 6, 'Grado', 1, 0, 'C', true);
        $pdf->Cell($anchoTallos, 6, 'Tallos', 1, 0, 'C', true);
        $pdf->Cell($anchoPrecio, 6, 'Precio U', 1, 0, 'C', true);
        $pdf->Cell($anchoMotivo, 6, 'Motivo', 1, 0, 'C', true);
        $pdf->Cell($anchoFlete, 6, 'Flete', 1, 0, 'C', true);
        $pdf->Cell($anchoFumi, 6, 'Fumig.', 1, 0, 'C', true);
        $pdf->Cell($anchoOtros, 6, 'Otros', 1, 0, 'C', true);
        $pdf->Cell($anchoTotal, 6, 'Total', 1, 1, 'C', true);
        $pdf->SetFont('Helvetica', '', 7);
    }

    $pdf->Cell($anchoProd, 5, utf8_decode(substr($item['producto'], 0, 15)), 1, 0, 'L');
    $pdf->Cell($anchoVar, 5, utf8_decode(substr($item['variedad'], 0, 10)), 1, 0, 'L');
    $pdf->Cell($anchoGrado, 5, utf8_decode($item['grado']), 1, 0, 'L');
    $pdf->Cell($anchoTallos, 5, $item['tallos'], 1, 0, 'C');
    $pdf->Cell($anchoPrecio, 5, '$' . number_format($item['precio'], 2), 1, 0, 'R');
    $pdf->Cell($anchoMotivo, 5, utf8_decode(substr($item['motivo'], 0, 12)), 1, 0, 'L');
    $pdf->Cell($anchoFlete, 5, '$' . number_format($item['flete'], 2), 1, 0, 'R');
    $pdf->Cell($anchoFumi, 5, '$' . number_format($item['fumigacion'], 2), 1, 0, 'R');
    $pdf->Cell($anchoOtros, 5, '$' . number_format($item['otros'], 2), 1, 0, 'R');
    $pdf->Cell($anchoTotal, 5, '$' . number_format($item['total'], 2), 1, 1, 'R');
}

// Línea separadora
$pdf->addSeparatorLine();

// Totales
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(135, 6, '', 0, 0, 'L');
$pdf->Cell(36, 6, 'Subtotal:', 0, 0, 'R');
$pdf->Cell(20, 6, '$' . number_format($totalSubtotal, 2), 0, 1, 'R');

$pdf->Cell(135, 6, '', 0, 0, 'L');
$pdf->Cell(36, 6, 'Flete:', 0, 0, 'R');
$pdf->Cell(20, 6, '$' . number_format($totalFlete, 2), 0, 1, 'R');

$pdf->Cell(135, 6, '', 0, 0, 'L');
$pdf->Cell(36, 6, utf8_decode('Fumigación:'), 0, 0, 'R');
$pdf->Cell(20, 6, '$' . number_format($totalFumigacion, 2), 0, 1, 'R');

$pdf->Cell(135, 6, '', 0, 0, 'L');
$pdf->Cell(36, 6, 'Otros:', 0, 0, 'R');
$pdf->Cell(20, 6, '$' . number_format($totalOtros, 2), 0, 1, 'R');

if ($tiene_iva == 1) {
    $pdf->Cell(135, 6, '', 0, 0, 'L');
    $pdf->Cell(36, 6, 'IVA (19%):', 0, 0, 'R');
    $pdf->Cell(20, 6, '$' . number_format($iva, 2), 0, 1, 'R');
}

$pdf->SetFont('Helvetica', 'B', 11);
$pdf->Cell(135, 8, '', 0, 0, 'L');
$pdf->Cell(36, 8, 'TOTAL:', 0, 0, 'R');
$pdf->Cell(20, 8, '$' . number_format($totalFinal, 2), 0, 1, 'R');

$pdf->Ln(5);
$pdf->SetFont('Helvetica', 'I', 8);
$pdf->Cell(0, 5, 'Moneda: ' . utf8_decode($moneda) . ' - TRM: ' . number_format($trm, 2), 0, 1, 'R');

// Salida del PDF
$pdf->Output('I', 'Devolucion_' . $numero_devolucion . '.pdf');
