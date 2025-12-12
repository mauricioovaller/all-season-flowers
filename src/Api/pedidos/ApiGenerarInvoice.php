<?php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verificar si la petición es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

// Obtener los datos enviados en formato JSON
$input = json_decode(file_get_contents("php://input"), true);

// Verificar si se recibió el número de factura correctamente
if (!isset($input['factura']) || empty($input['factura'])) {
    die(json_encode(["error" => "Número de factura no válido."]));
}

$factura = intval($input['factura']);

// 🔴 CONSULTA 1: ENCABEZADO DE FACTURA (OPTIMIZADA)
$sqlEncabezado = "SELECT
                    enc.IdEncabPedido,
                    CONCAT('PGI-', LPAD(enc.Factura, 6, '0')) AS numero_factura,
                    DATE_FORMAT(enc.FechaEntrega, '%d-%b-%y') AS fecha_factura,
                    'ALL SEASON FLOWERS SAS' AS empresa_nombre,
                    '901.984.016-8' AS nit,
                    'Finca Villa Clemencia Vrd. Prado' AS direccion_empresa,
                    '(+057) 3114677282 - 3023090940' AS telefono_empresa,
                    'Facatativa, Cundinamarca, Colombia' AS ciudad_empresa,
                    'freshfloral.erikajulie@gmail.com' AS email_empresa,
                    cli.NOMBRE AS cliente_nombre,
                    CONCAT(cli.Direc1, ', ', cli.CIUDAD, ', ', cli.ESTADO, ', ', cli.PAIS) AS direccion_cliente,
                    cli.TEL1 AS telefono_cliente,
                    enc.AWB,
                    enc.AWB_HIJA,
                    enc.AWB_NIETA,
                    COALESCE(aer.NOMAEROLINEA, 'UNITED PARCEL SERVICE') AS aerolinea,
                    COALESCE(age.NOMAGENCIA, 'K&M Handling') AS agencia,
                    'ESTADOS UNIDOS' AS destino_pais,
                    'FCA BOGOTA - COLOMBIA' AS incoterms
                FROM
                    SAS_EncabPedido enc 
                INNER JOIN GEN_Clientes cli ON enc.IdCliente = cli.IdCliente
                LEFT JOIN GEN_Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
                LEFT JOIN GEN_Agencias age ON enc.IdAgencia = age.IdAgencia
                WHERE
                    enc.Factura = ?";

$stmtEncabezado = $enlace->prepare($sqlEncabezado);
$stmtEncabezado->bind_param("i", $factura);
$stmtEncabezado->execute();
$stmtEncabezado->bind_result(
    $idEncabPedido,
    $numero_factura,
    $fecha_factura,
    $empresa_nombre,
    $nit,
    $direccion_empresa,
    $telefono_empresa,
    $ciudad_empresa,
    $email_empresa,
    $cliente_nombre,
    $direccion_cliente,
    $telefono_cliente,
    $awb,
    $awb_hija,
    $awb_nieta,
    $aerolinea,
    $agencia,
    $destino_pais,
    $incoterms
);

if (!$stmtEncabezado->fetch()) {
    die(json_encode(["error" => "Factura no encontrada."]));
}
$stmtEncabezado->close();

// 🔴 CONSULTA 2: DETALLE DE FACTURA (OPTIMIZADA)
$sqlDetalle = "SELECT
                dem.IdDetEmpaque,
                tem.Abreviatura AS empaque,
                dem.PO_Empaque,
                dem.Cantidad AS piezas,
                (dem.Cantidad * tem.EquivFull) AS full,
                dpr.Descripcion,
                und.DescripUnidad AS und_facturacion,
                (dpr.Tallos_Ramo * dpr.Ramos_Caja) AS tallos_caja,
                dpr.Ramos_Caja AS ramos_caja,
                (dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja) AS total_tallos,
                dpr.Precio_Venta AS precio_venta,
                IF(und.IdUnidades = 4, 
                   (dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja * dpr.Precio_Venta),
                   (dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Venta)) AS total_venta
            FROM
                SAS_DetEmpaque dem 
            INNER JOIN SAS_EncabPedido enc ON dem.IdEncabPedido = enc.IdEncabPedido
            INNER JOIN GEN_TipoEmpaque tem ON dem.IdTipoEmpaque = tem.IdTipoEmpaque
            INNER JOIN SAS_DetProducto dpr ON dem.IdDetEmpaque = dpr.IdDetEmpaque
            INNER JOIN GEN_Unidades und ON dpr.IdUnidad = und.IdUnidades
            WHERE
                enc.Factura = ?
            ORDER BY 
                dem.IdDetEmpaque, 
                dpr.IdDetProducto";

$stmtDetalle = $enlace->prepare($sqlDetalle);
$stmtDetalle->bind_param("i", $factura);
$stmtDetalle->execute();
$stmtDetalle->bind_result(
    $idDetEmpaque,
    $empaque,
    $po_empaque,
    $piezas,
    $full,
    $descripcion,
    $und_facturacion,
    $tallos_caja,
    $ramos_caja,
    $total_tallos,
    $precio_venta,
    $total_venta
);

$detalles = [];
$detalles_por_empaque = [];
$current_empaque = null;
$item = 0;
$total_general = 0;
$tot_piezas = 0;
$tot_full = 0;
$tot_cajas = 0;
$tot_tallos = 0;

while ($stmtDetalle->fetch()) {
    $item++;
    
    // Si cambia el empaque, guardamos el anterior
    if ($current_empaque !== $idDetEmpaque && $current_empaque !== null) {
        $detalles_por_empaque[] = [
            'empaque' => $detalles[count($detalles)-1]['empaque'],
            'productos' => array_filter($detalles, function($d) use ($current_empaque) {
                return $d['idDetEmpaque'] == $current_empaque;
            })
        ];
    }
    
    $detalle_item = [
        'item' => $item,
        'idDetEmpaque' => $idDetEmpaque,
        'empaque' => $empaque,
        'po_empaque' => $po_empaque,
        'piezas' => $piezas,
        'full' => $full,
        'descripcion' => $descripcion,
        'und_facturacion' => $und_facturacion,
        'tallos_caja' => $tallos_caja,
        'ramos_caja' => $ramos_caja,
        'total_tallos' => $total_tallos,
        'precio_venta' => $precio_venta,
        'total_venta' => $total_venta
    ];
    
    $detalles[] = $detalle_item;
    $current_empaque = $idDetEmpaque;
    
    $total_general += $total_venta;
    $tot_piezas += $piezas;
    $tot_full += $full;
    $tot_cajas += $ramos_caja;
    $tot_tallos += $total_tallos;
}

// Agregar el último empaque
if (!empty($detalles)) {
    $detalles_por_empaque[] = [
        'empaque' => $detalles[count($detalles)-1]['empaque'],
        'productos' => array_filter($detalles, function($d) use ($current_empaque) {
            return $d['idDetEmpaque'] == $current_empaque;
        })
    ];
}

$stmtDetalle->close();

// Clase PDF personalizada
class PDF extends FPDF
{
    private $currentY;
    
    function Header()
    {
        // Información de la empresa (como en el PDF ejemplo)
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 5, 'ALL SEASON FLOWERS SAS', 0, 1, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 4, 'Nit: 901.984.016-8', 0, 1, 'L');
        $this->Cell(0, 4, 'Address: Finca Villa Clemencia Vrd. Prado', 0, 1, 'L');
        $this->Cell(0, 4, 'Phone Number: (+057) 3114677282 - 3023090940', 0, 1, 'L');
        $this->Cell(0, 4, 'City: Facatativa, Cundinamarca', 0, 1, 'L');
        $this->Cell(0, 4, 'Country: Colombia', 0, 1, 'L');
        $this->Cell(0, 4, 'Email: freshfloral.erikajulie@gmail.com', 0, 1, 'L');
        
        $this->Ln(5);
        
        // Número de factura y fecha
        $this->SetFont('Helvetica', 'B', 12);
        $this->Cell(100, 8, 'Date: ' . $GLOBALS['fecha_factura'], 0, 0, 'L');
        $this->Cell(90, 8, 'Invoice No ' . $GLOBALS['numero_factura'], 0, 1, 'R');
        
        $this->Ln(3);
        
        // Información del destino y cliente
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 5, 'Destination: ' . $GLOBALS['destino_pais'], 0, 1, 'L');
        $this->Cell(0, 5, 'Client: ' . $GLOBALS['cliente_nombre'], 0, 1, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 4, 'Address: ' . $GLOBALS['direccion_cliente'], 0, 1, 'L');
        $this->Cell(0, 4, 'Phone Number: ' . $GLOBALS['telefono_cliente'], 0, 1, 'L');
        $this->Cell(0, 4, 'City: ' . (explode(',', $GLOBALS['direccion_cliente'])[1] ?? ''), 0, 1, 'L');
        
        $this->Ln(3);
        
        // Información de envío
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(40, 5, 'AWB:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(50, 5, $GLOBALS['awb'], 0, 0, 'L');
        
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(40, 5, 'SECOND AWB:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(50, 5, $GLOBALS['awb_hija'], 0, 1, 'L');
        
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(40, 5, 'THIRD AWB:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(50, 5, $GLOBALS['awb_nieta'], 0, 0, 'L');
        
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(40, 5, 'AIRLINE:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(50, 5, $GLOBALS['aerolinea'], 0, 1, 'L');
        
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(40, 5, 'FORWARDER:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(50, 5, $GLOBALS['agencia'], 0, 1, 'L');
        
        $this->Ln(5);
    }
    
    function Footer()
    {
        $this->SetY(-20);
        $this->SetFont('Helvetica', 'I', 8);
        $this->Cell(0, 10, 'Page ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
    
    // Método para agregar línea separadora
    function addSeparatorLine()
    {
        $this->SetLineWidth(0.1);
        $this->SetDrawColor(150, 150, 150);
        $this->Line($this->GetX(), $this->GetY(), $this->GetX() + 190, $this->GetY());
        $this->Ln(1);
    }
}

// Crear PDF
$pdf = new PDF('P', 'mm', 'Letter');
$pdf->SetMargins(15, 15, 15);
$pdf->AliasNbPages();
$pdf->AddPage();

// Tabla de detalle
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->SetFillColor(220, 220, 220);

// Encabezados de la tabla
$pdf->Cell(10, 8, 'Itm.', 1, 0, 'C', true);
$pdf->Cell(10, 8, 'Pack.', 1, 0, 'C', true);
$pdf->Cell(10, 8, 'U Pack', 1, 0, 'C', true);
$pdf->Cell(15, 8, 'Full', 1, 0, 'C', true);
$pdf->Cell(50, 8, 'Description', 1, 0, 'C', true);
$pdf->Cell(15, 8, 'PO', 1, 0, 'C', true);
$pdf->Cell(15, 8, 'Billing U', 1, 0, 'C', true);
$pdf->Cell(10, 8, 'S.Box', 1, 0, 'C', true);
$pdf->Cell(10, 8, 'B. Box', 1, 0, 'C', true);
$pdf->Cell(15, 8, 'T.Stem', 1, 0, 'C', true);
$pdf->Cell(15, 8, 'Price U', 1, 0, 'C', true);
$pdf->Cell(15, 8, 'Val Tot', 1, 1, 'C', true);

$pdf->SetFont('Helvetica', '', 8);
$pdf->SetFillColor(255, 255, 255);

$lastEmpaqueId = null;
$rowCount = 0;

foreach ($detalles_por_empaque as $grupo) {
    $firstProduct = true;
    
    foreach ($grupo['productos'] as $detalle) {
        // Agregar línea separadora si cambió de empaque
        if ($lastEmpaqueId !== null && $lastEmpaqueId != $detalle['idDetEmpaque']) {
            $pdf->addSeparatorLine();
        }
        
        // Itm. (siempre visible)
        $pdf->Cell(10, 6, $detalle['item'], 1, 0, 'C');
        
        // Pack. (solo visible en el primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell(10, 6, $detalle['empaque'], 1, 0, 'C');
        } else {
            $pdf->Cell(10, 6, '', 1, 0, 'C');
        }
        
        // U Pack (solo visible en el primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell(10, 6, $detalle['piezas'], 1, 0, 'C');
        } else {
            $pdf->Cell(10, 6, '', 1, 0, 'C');
        }
        
        // Full (solo visible en el primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell(15, 6, number_format($detalle['full'], 2), 1, 0, 'C');
        } else {
            $pdf->Cell(15, 6, '', 1, 0, 'C');
        }
        
        // Description (siempre visible)
        $pdf->Cell(50, 6, utf8_decode(substr($detalle['descripcion'], 0, 40)), 1, 0, 'L');
        
        // PO (solo visible en el primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell(15, 6, $detalle['po_empaque'], 1, 0, 'C');
        } else {
            $pdf->Cell(15, 6, '', 1, 0, 'C');
        }
        
        // Billing U (siempre visible)
        $pdf->Cell(15, 6, $detalle['und_facturacion'], 1, 0, 'C');
        
        // S.Box (siempre visible)
        $pdf->Cell(10, 6, $detalle['tallos_caja'], 1, 0, 'C');
        
        // B. Box (siempre visible)
        $pdf->Cell(10, 6, $detalle['ramos_caja'], 1, 0, 'C');
        
        // T.Stem (siempre visible)
        $pdf->Cell(15, 6, $detalle['total_tallos'], 1, 0, 'C');
        
        // Price U (siempre visible)
        $pdf->Cell(15, 6, '$' . number_format($detalle['precio_venta'], 2), 1, 0, 'R');
        
        // Val Tot (siempre visible)
        $pdf->Cell(15, 6, '$' . number_format($detalle['total_venta'], 2), 1, 1, 'R');
        
        $firstProduct = false;
        $lastEmpaqueId = $detalle['idDetEmpaque'];
        $rowCount++;
        
        // Control de página
        if ($rowCount > 20) {
            $pdf->AddPage();
            // Volver a dibujar encabezados
            $pdf->SetFont('Helvetica', 'B', 8);
            $pdf->SetFillColor(220, 220, 220);
            $pdf->Cell(10, 8, 'Itm.', 1, 0, 'C', true);
            $pdf->Cell(10, 8, 'Pack.', 1, 0, 'C', true);
            $pdf->Cell(10, 8, 'U Pack', 1, 0, 'C', true);
            $pdf->Cell(15, 8, 'Full', 1, 0, 'C', true);
            $pdf->Cell(50, 8, 'Description', 1, 0, 'C', true);
            $pdf->Cell(15, 8, 'PO', 1, 0, 'C', true);
            $pdf->Cell(15, 8, 'Billing U', 1, 0, 'C', true);
            $pdf->Cell(10, 8, 'S.Box', 1, 0, 'C', true);
            $pdf->Cell(10, 8, 'B. Box', 1, 0, 'C', true);
            $pdf->Cell(15, 8, 'T.Stem', 1, 0, 'C', true);
            $pdf->Cell(15, 8, 'Price U', 1, 0, 'C', true);
            $pdf->Cell(15, 8, 'Val Tot', 1, 1, 'C', true);
            $pdf->SetFont('Helvetica', '', 8);
            $rowCount = 0;
        }
    }
    
    // Agregar línea separadora después de cada empaque
    if (count($grupo['productos']) > 0) {
        $pdf->addSeparatorLine();
    }
}

// Totales
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(45, 8, 'Total:', 0, 0, 'R');
$pdf->Cell(10, 8, $tot_piezas, 0, 0, 'C');
$pdf->Cell(15, 8, number_format($tot_full, 2), 0, 0, 'C');
$pdf->Cell(110, 8, '', 0, 0, 'C');
$pdf->Cell(15, 8, $tot_tallos, 0, 0, 'C');
$pdf->Cell(30, 8, '$' . number_format($total_general, 2), 0, 1, 'R');

$pdf->Ln(3);

// Otros cargos
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(40, 6, 'Other Charge:', 0, 0, 'R');
$pdf->Cell(150, 6, '$0.00', 0, 1, 'L');

$pdf->Cell(40, 6, 'V/r Transport:', 0, 0, 'R');
$pdf->Cell(150, 6, '$0.00', 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(40, 8, 'Invoice Total USD:', 0, 0, 'R');
$pdf->Cell(150, 8, '$' . number_format($total_general, 2), 0, 1, 'L');

$pdf->Ln(5);

// INCOTERMS
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 8, 'INCOTERMS ' . $incoterms, 0, 1, 'C');

$pdf->Ln(5);

// Declaración
$pdf->SetFont('Helvetica', '', 9);
$pdf->MultiCell(0, 5, utf8_decode('THE EXPORTER OF THE PRODUCTS COVERED BY THIS DOCUMENT DECLARES THAT EXCEPT WHERE OTHERWISE CLEARLY INDICATED, THESE PRODUCTS ARE OF COLOMBIAN ORIGIN.'), 0, 'L');

// Generar PDF
$pdf->Output('I', $numero_factura . '.pdf');