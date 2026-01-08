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
if (!isset($input['numeroFactura']) || empty($input['numeroFactura'])) {
    die(json_encode(["error" => "Número de factura no válido."]));
}

$factura = intval($input['numeroFactura']);

// 🔴 CONSULTA 1: ENCABEZADO DE FACTURA
$sqlEncabezado = "SELECT
                    enc.IdEncabPedido,
                    CONCAT('ASF-', LPAD(enc.Factura, 6, '0')) AS numero_factura,
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
                    enc.PO_Cliente,
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
    $po_cliente,
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

// 🔴 CONSULTA 2: DETALLE DE FACTURA
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
                   (dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Venta)) AS total_venta,
                IF(enc.IVA <> 0 , IF(und.IdUnidades = 4, ( dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja * dpr.Precio_Venta), ( dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Venta)) * 0.19  , 0 ) as ValorIVA,
                ROW_NUMBER() OVER (PARTITION BY dem.IdDetEmpaque ORDER BY dpr.IdDetProducto) AS item_empaque
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
    $total_venta,
    $valor_iva,
    $item_empaque
);

// Procesar resultados de detalle
$detalles_por_empaque = [];
$item_global = 0;
$tot_piezas = 0;
$tot_full = 0;
$tot_tallos = 0;
$tot_IVA = 0;
$total_general = 0;
$empaques_contados = [];

while ($stmtDetalle->fetch()) {
    $detalle_item = [
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
        'total_venta' => $total_venta,
        'valor_iva' => $valor_iva,
        'item_empaque' => $item_empaque
    ];

    // Sumar piezas y fulls SOLO una vez por empaque
    if (!isset($empaques_contados[$idDetEmpaque])) {
        $tot_piezas += $piezas;
        $tot_full += $full;
        $empaques_contados[$idDetEmpaque] = true;
    }

    $tot_tallos += $total_tallos;
    $tot_IVA += $valor_iva;
    $total_general += $total_venta;

    // Agrupar por empaque
    if (!isset($detalles_por_empaque[$idDetEmpaque])) {
        $item_global++;
        $detalles_por_empaque[$idDetEmpaque] = [
            'empaque' => $empaque,
            'po_empaque' => $po_empaque,
            'piezas' => $piezas,
            'full' => $full,
            'item_global' => $item_global,
            'productos' => []
        ];
    }

    // Asignar número de ítem global SOLO al primer producto del empaque
    if ($item_empaque == 1) {
        $detalle_item['item_global'] = $item_global;
    } else {
        $detalle_item['item_global'] = '';
    }

    $detalles_por_empaque[$idDetEmpaque]['productos'][] = $detalle_item;
}

$stmtDetalle->close();

// Procesar dirección del cliente
$direccion_linea1 = $direccion_cliente;
$direccion_linea2 = '';

if (strlen($direccion_cliente) > 55) {
    if (strpos($direccion_cliente, ',') !== false) {
        $partes = explode(',', $direccion_cliente);
        $direccion_linea1 = trim($partes[0] . (isset($partes[1]) ? ',' . $partes[1] : ''));
        $direccion_linea2 = trim(implode(',', array_slice($partes, 2)));
    } else {
        $direccion_linea1 = substr($direccion_cliente, 0, 55);
        $direccion_linea2 = substr($direccion_cliente, 55);
    }
}

$partes_direccion = explode(',', $direccion_cliente);
$ciudad_cliente = isset($partes_direccion[1]) ? trim($partes_direccion[1]) : '';

// Clase PDF personalizada
class PDF extends FPDF
{
    private $currentY;

    function Header()
    {
        global $fecha_factura, $numero_factura, $destino_pais, $po_cliente, $awb, $awb_hija, $awb_nieta;
        global $cliente_nombre, $direccion_linea1, $direccion_linea2, $telefono_cliente, $ciudad_cliente;
        global $aerolinea, $agencia;

        // Información de la empresa
        $this->SetFont('Helvetica', 'B', 12);
        $this->Cell(70, 8, 'Date: ' . $fecha_factura, 0, 0, 'C');
        $this->Cell(70, 8, 'Invoice No ' . $numero_factura, 0, 1, 'C');

        $this->Ln(3);

        // Logo
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg", 15, 18, 65);

        // Información de la empresa (derecha)
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(100, 5, '', 0, 0, 'L');
        $this->Cell(30, 5, 'Export:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(25, 5, 'ALL SEASON FLOWERS SAS', 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(100, 5, '', 0, 0, 'L');
        $this->Cell(30, 5, 'Nit:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(25, 5, '901.984.016-8', 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(100, 5, '', 0, 0, 'L');
        $this->Cell(30, 5, 'Address:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(25, 5, 'Finca Villa Clemencia Vrd. Prado', 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(100, 5, '', 0, 0, 'L');
        $this->Cell(30, 5, 'Phone Number:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(25, 5, '(+057) 3114677282 - 3023090940', 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(100, 5, '', 0, 0, 'L');
        $this->Cell(30, 5, 'City:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(25, 5, 'Facatativa, Cundinamarca', 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(100, 5, '', 0, 0, 'L');
        $this->Cell(30, 5, 'Country:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(25, 5, 'Colombia', 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(100, 5, '', 0, 0, 'L');
        $this->Cell(30, 5, 'Email:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(25, 5, 'freshfloral.erikajulie@gmail.com', 0, 1, 'L');

        $this->Ln(5);

        // Información de cliente y envío
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'Destination:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(90, 5, $destino_pais, 0, 0, 'L');
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'AWB:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(90, 5, $awb, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'Client:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(90, 5, $cliente_nombre, 0, 0, 'L');
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'SECOND AWB:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(90, 5, $awb_hija, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'Address:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(90, 5, $direccion_linea1, 0, 0, 'L');
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'THIRD AWB:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(90, 5, $awb_nieta, 0, 1, 'L');

        // Segunda línea de dirección si es necesaria
        if (!empty($direccion_linea2)) {
            $this->Cell(30, 5, '', 0, 0, 'L');
            $this->SetFont('Helvetica', '', 9);
            $this->Cell(90, 5, $direccion_linea2, 0, 0, 'L');
            $this->Cell(120, 5, '', 0, 1, 'L');
            $this->Ln(-1);
        }

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'Phone Number:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(90, 5, $telefono_cliente, 0, 0, 'L');
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'AIRLINE:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(90, 5, $aerolinea, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'City:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(90, 5, $ciudad_cliente, 0, 0, 'L');
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'FORWARDER:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(90, 5, $agencia, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'P.O.:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(90, 5, $po_cliente, 0, 1, 'L');

        $this->Ln(2);
    }

    function Footer()
    {
        $this->SetY(-30);

        // Declaración
        $this->SetFont('Helvetica', 'B', 10);
        $this->MultiCell(0, 5, utf8_decode('THE EXPORTER OF THE PRODUCTS COVERED BY THIS DOCUMENT DECLARES THAT EXCEPT WHERE OTHERWISE CLEARLY INDICATED, THESE PRODUCTS ARE OF COLOMBIAN ORIGIN.'), 0, 'C');

        $this->SetFont('Helvetica', 'I', 7);
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
$pdf->SetMargins(10, 10, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

// Tabla de detalle - ENCABEZADOS
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->SetFillColor(220, 220, 220);

// Definir anchos exactos de columnas
$anchoItm = 10;
$anchoPack = 10;
$anchoUPack = 10;
$anchoFull = 15;
$anchoDesc = 50;
$anchoPO = 15;
$anchoBillingU = 15;
$anchoSBox = 10;
$anchoBBox = 10;
$anchoTStem = 15;
$anchoPriceU = 15;
$anchoValTot = 15;

// Encabezados de la tabla
$pdf->Cell($anchoItm, 6, 'Itm.', 0, 0, 'C', true);
$pdf->Cell($anchoPack, 6, 'Pack.', 0, 0, 'C', true);
$pdf->Cell($anchoUPack, 6, 'U Pack', 0, 0, 'C', true);
$pdf->Cell($anchoFull, 6, 'Full', 0, 0, 'C', true);
$pdf->Cell($anchoDesc, 6, 'Description', 0, 0, 'C', true);
$pdf->Cell($anchoPO, 6, 'PO', 0, 0, 'C', true);
$pdf->Cell($anchoBillingU, 6, 'Billing U', 0, 0, 'C', true);
$pdf->Cell($anchoSBox, 6, 'S.Box', 0, 0, 'C', true);
$pdf->Cell($anchoBBox, 6, 'B. Box', 0, 0, 'C', true);
$pdf->Cell($anchoTStem, 6, 'T.Stem', 0, 0, 'C', true);
$pdf->Cell($anchoPriceU, 6, 'Price U', 0, 0, 'C', true);
$pdf->Cell($anchoValTot, 6, 'Val Tot', 0, 1, 'C', true);

$pdf->SetFont('Helvetica', '', 7);
$pdf->SetFillColor(255, 255, 255);

foreach ($detalles_por_empaque as $idEmpaque => $grupo) {
    $firstProduct = true;

    foreach ($grupo['productos'] as $detalle) {
        $startY = $pdf->GetY();
        $startX = $pdf->GetX();

        // Itm. (solo en primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell($anchoItm, 6, $detalle['item_global'], 0, 0, 'C');
        } else {
            $pdf->Cell($anchoItm, 6, '', 0, 0, 'C');
        }

        // Pack. (solo en primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell($anchoPack, 6, $detalle['empaque'], 0, 0, 'C');
        } else {
            $pdf->Cell($anchoPack, 6, '', 0, 0, 'C');
        }

        // U Pack (solo en primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell($anchoUPack, 6, $detalle['piezas'], 0, 0, 'C');
        } else {
            $pdf->Cell($anchoUPack, 6, '', 0, 0, 'C');
        }

        // Full (solo en primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell($anchoFull, 6, number_format($detalle['full'], 2), 0, 0, 'C');
        } else {
            $pdf->Cell($anchoFull, 6, '', 0, 0, 'C');
        }

        // GUARDAR POSICIÓN ACTUAL
        $xDespuesPrimerasColumnas = $pdf->GetX();
        $yDespuesPrimerasColumnas = $pdf->GetY();

        // VERIFICAR SI LA DESCRIPCIÓN NECESITA 2 LÍNEAS
        $descripcion = $detalle['descripcion'];
        $descripcionDecoded = utf8_decode($descripcion);
        $necesitaDosLineas = strlen($descripcionDecoded) > 30;

        if ($necesitaDosLineas) {
            // Dividir descripción
            $linea1 = substr($descripcionDecoded, 0, 30);
            $linea2 = substr($descripcionDecoded, 30, 32) . (strlen($descripcionDecoded) > 67 ? '...' : '');

            // Primera línea de descripción
            $pdf->Cell($anchoDesc, 6, $linea1, 0, 0, 'L');

            // Escribir PRIMERO todas las demás columnas en la PRIMERA línea
            $xPosicionColumnas = $xDespuesPrimerasColumnas + $anchoDesc;
            $pdf->SetXY($xPosicionColumnas, $yDespuesPrimerasColumnas);

            // PO (solo en primer producto del empaque)
            if ($firstProduct && !empty($detalle['po_empaque'])) {
                $po = utf8_decode($detalle['po_empaque']);
                if (strlen($po) > 8) {
                    $pdf->Cell($anchoPO, 6, substr($po, 0, 8), 0, 0, 'C');
                } else {
                    $pdf->Cell($anchoPO, 6, $po, 0, 0, 'C');
                }
            } else {
                $pdf->Cell($anchoPO, 6, '', 0, 0, 'C');
            }

            // Billing U
            $pdf->Cell($anchoBillingU, 6, utf8_decode($detalle['und_facturacion']), 0, 0, 'C');

            // S.Box
            $pdf->Cell($anchoSBox, 6, $detalle['tallos_caja'], 0, 0, 'C');

            // B. Box
            $pdf->Cell($anchoBBox, 6, $detalle['ramos_caja'], 0, 0, 'C');

            // T.Stem
            $pdf->Cell($anchoTStem, 6, $detalle['total_tallos'], 0, 0, 'C');

            // Price U
            $pdf->Cell($anchoPriceU, 6, '$' . number_format($detalle['precio_venta'], 2), 0, 0, 'R');

            // Val Tot
            $pdf->Cell($anchoValTot, 6, '$' . number_format($detalle['total_venta'], 2), 0, 0, 'R');

            // Ahora mover a la SEGUNDA línea para la segunda parte de la descripción
            $pdf->Ln(6);
            $pdf->SetX($xDespuesPrimerasColumnas);

            // Segunda línea de descripción
            $pdf->Cell($anchoDesc, 6, $linea2, 0, 0, 'L');

            // Las demás columnas en blanco en la segunda línea
            $pdf->SetX($xPosicionColumnas);
            $pdf->Cell($anchoPO, 6, '', 0, 0, 'C');
            $pdf->Cell($anchoBillingU, 6, '', 0, 0, 'C');
            $pdf->Cell($anchoSBox, 6, '', 0, 0, 'C');
            $pdf->Cell($anchoBBox, 6, '', 0, 0, 'C');
            $pdf->Cell($anchoTStem, 6, '', 0, 0, 'C');
            $pdf->Cell($anchoPriceU, 6, '', 0, 0, 'R');
            $pdf->Cell($anchoValTot, 6, '', 0, 1, 'R');
        } else {
            // DESCRIPCIÓN DE UNA SOLA LÍNEA
            $pdf->Cell($anchoDesc, 6, substr($descripcionDecoded, 0, 35), 0, 0, 'L');

            // PO (solo en primer producto del empaque)
            if ($firstProduct && !empty($detalle['po_empaque'])) {
                $po = utf8_decode($detalle['po_empaque']);
                if (strlen($po) > 8) {
                    $pdf->Cell($anchoPO, 6, substr($po, 0, 8), 0, 0, 'C');
                } else {
                    $pdf->Cell($anchoPO, 6, $po, 0, 0, 'C');
                }
            } else {
                $pdf->Cell($anchoPO, 6, '', 0, 0, 'C');
            }

            // Billing U
            $pdf->Cell($anchoBillingU, 6, utf8_decode($detalle['und_facturacion']), 0, 0, 'C');

            // S.Box
            $pdf->Cell($anchoSBox, 6, $detalle['tallos_caja'], 0, 0, 'C');

            // B. Box
            $pdf->Cell($anchoBBox, 6, $detalle['ramos_caja'], 0, 0, 'C');

            // T.Stem
            $pdf->Cell($anchoTStem, 6, $detalle['total_tallos'], 0, 0, 'C');

            // Price U
            $pdf->Cell($anchoPriceU, 6, '$' . number_format($detalle['precio_venta'], 2), 0, 0, 'R');

            // Val Tot
            $pdf->Cell($anchoValTot, 6, '$' . number_format($detalle['total_venta'], 2), 0, 1, 'R');
        }

        $firstProduct = false;

        // Control de página
        if ($pdf->GetY() > 250) {
            $pdf->AddPage();
            // Redibujar encabezados
            $pdf->SetFont('Helvetica', 'B', 8);
            $pdf->SetFillColor(220, 220, 220);
            $pdf->Cell($anchoItm, 6, 'Itm.', 0, 0, 'C', true);
            $pdf->Cell($anchoPack, 6, 'Pack.', 0, 0, 'C', true);
            $pdf->Cell($anchoUPack, 6, 'U Pack', 0, 0, 'C', true);
            $pdf->Cell($anchoFull, 6, 'Full', 0, 0, 'C', true);
            $pdf->Cell($anchoDesc, 6, 'Description', 0, 0, 'C', true);
            $pdf->Cell($anchoPO, 6, 'PO', 0, 0, 'C', true);
            $pdf->Cell($anchoBillingU, 6, 'Billing U', 0, 0, 'C', true);
            $pdf->Cell($anchoSBox, 6, 'S.Box', 0, 0, 'C', true);
            $pdf->Cell($anchoBBox, 6, 'B. Box', 0, 0, 'C', true);
            $pdf->Cell($anchoTStem, 6, 'T.Stem', 0, 0, 'C', true);
            $pdf->Cell($anchoPriceU, 6, 'Price U', 0, 0, 'C', true);
            $pdf->Cell($anchoValTot, 6, 'Val Tot', 0, 1, 'C', true);
            $pdf->SetFont('Helvetica', '', 8);
        }
    }

    // Línea separadora después de cada empaque
    $pdf->addSeparatorLine();
}

// Totales
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(20, 8, 'Total:', 0, 0, 'R');
$pdf->Cell(10, 8, $tot_piezas, 0, 0, 'C');
$pdf->Cell(15, 8, number_format($tot_full, 2), 0, 0, 'C');
$pdf->Cell(100, 8, '', 0, 0, 'C');
$pdf->Cell(15, 8, $tot_tallos, 0, 0, 'C');
$pdf->Cell(15, 8, '', 0, 0, 'C');
$pdf->Cell(15, 8, '$' . number_format($total_general, 2), 0, 1, 'R');

$pdf->Ln(3);

// Otros cargos
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(135, 6, '', 0, 0, 'R');
$pdf->Cell(40, 6, 'IVA:', 0, 0, 'L');
$pdf->Cell(15, 6, '$' . number_format($tot_IVA, 2), 0, 1, 'R');

$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(135, 6, '', 0, 0, 'R');
$pdf->Cell(40, 6, 'Other Charge:', 0, 0, 'L');
$pdf->Cell(15, 6, '$0.00', 0, 1, 'R');

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(135, 6, 'INCOTERMS FCA BOGOTA - COLOMBIA', 0, 0, 'C');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(40, 6, 'V/r Transport:', 0, 0, 'L');
$pdf->Cell(15, 6, '$0.00', 0, 1, 'R');

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(135, 6, '', 0, 0, 'R');
$pdf->Cell(40, 8, 'Invoice Total USD:', 0, 0, 'L');
$pdf->Cell(15, 8, '$' . number_format($total_general + $tot_IVA, 2), 0, 1, 'R');

$pdf->Ln(5);




// Generar PDF
$pdf->Output('I', $numero_factura . '.pdf');
