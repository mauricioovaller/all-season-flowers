<?php
// src/Api/compras/ApiGenerarPDFOrdenCompra.php
require_once __DIR__ . '/../config/empresa.php';
require_once FPDF_PATH;
require_once CONEXION_BD_PATH;
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verificar si la petición es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

// Obtener los datos enviados en formato JSON
$input = json_decode(file_get_contents("php://input"), true);

// Verificar si se recibió el número de orden correctamente
if (!isset($input['numeroOrdenCompra']) || empty($input['numeroOrdenCompra'])) {
    die(json_encode(["error" => "Número de orden de compra no válido."]));
}

$numeroOrden = intval($input['numeroOrdenCompra']);
$conPrecio = isset($input['conPrecio']) ? (bool)$input['conPrecio'] : true;

// 🔴 CONSULTA 1: ENCABEZADO DE LA ORDEN DE COMPRA
$sqlEncabezado = "SELECT
                    ec.IdEncabCompra,
                    CONCAT('OC-', LPAD(ec.IdEncabCompra, 6, '0')) AS numero_orden,
                    DATE_FORMAT(ec.FechaSolicitud, '%d-%b-%y') AS fecha_orden,
                    '" . EMPRESA_NOMBRE . "' AS empresa_nombre,
                    '" . EMPRESA_NIT . "' AS nit,
                    '" . EMPRESA_DIRECCION . "' AS direccion_empresa,
                    '" . EMPRESA_TELEFONO . "' AS telefono_empresa,
                    '" . EMPRESA_CIUDAD . "' AS ciudad_empresa,
                    '" . EMPRESA_EMAIL . "' AS email_empresa,
                    p.Proveedor AS proveedor_nombre,
                    p.Nit AS proveedor_nit,
                    CONCAT(p.Direccion, ', ', p.Ciudad, ', ', p.Pais) AS direccion_proveedor,
                    p.Telefono AS telefono_proveedor,
                    p.Email AS email_proveedor,
                    c.NomComprador AS comprador_nombre,
                    ec.TipoCompra,
                    ec.PO_Proveedor,
                    ec.Observaciones,
                    ec.FechaEntrega AS fecha_entrega_esperada,
                    m.Moneda AS moneda
                FROM
                    SAS_EncabCompra ec
                INNER JOIN GEN_Proveedores p ON ec.IdProveedor = p.IdProveedor
                INNER JOIN GEN_Compradores c ON ec.IdComprador = c.IdComprador
                INNER JOIN GEN_Monedas m ON ec.IdMoneda = m.IdMoneda
                WHERE
                    ec.IdEncabCompra = ?";

$stmtEncabezado = $enlace->prepare($sqlEncabezado);
$stmtEncabezado->bind_param("i", $numeroOrden);
$stmtEncabezado->execute();
$stmtEncabezado->bind_result(
    $idEncabCompra,
    $numero_orden,
    $fecha_orden,
    $empresa_nombre,
    $nit,
    $direccion_empresa,
    $telefono_empresa,
    $ciudad_empresa,
    $email_empresa,
    $proveedor_nombre,
    $proveedor_nit,
    $direccion_proveedor,
    $telefono_proveedor,
    $email_proveedor,
    $comprador_nombre,
    $tipo_compra,
    $po_proveedor,
    $observaciones,
    $fecha_entrega_esperada,
    $moneda
);

if (!$stmtEncabezado->fetch()) {
    die(json_encode(["error" => "Orden de compra no encontrada."]));
}
$stmtEncabezado->close();

$esUSD = mb_stripos($moneda, 'dólar') !== false;
$decMoneda = $esUSD ? 3 : 2;

// 🔴 CONSULTA 2: DETALLE DE LA ORDEN DE COMPRA
$sqlDetalle = "SELECT
                dek.IdDetEmpaque,
                tem.Abreviatura AS empaque,
                tem.Descripcion AS descripcion_empaque,
                dek.PO_Empaque,
                dek.Cantidad AS piezas,
                (dek.Cantidad * tem.EquivFull) AS full,
                dpc.Descripcion,
                und.DescripUnidad AS und_facturacion,
                (dpc.Tallos_Ramo * dpc.Ramos_Caja) AS tallos_caja,
                dpc.Ramos_Caja AS ramos_caja,
                (dek.Cantidad * dpc.Tallos_Ramo * dpc.Ramos_Caja) AS total_tallos,
                dpc.Precio_Compra AS precio_compra,
                IF(und.IdUnidades = 4, 
                   (dek.Cantidad * dpc.Tallos_Ramo * dpc.Ramos_Caja * dpc.Precio_Compra),
                   (dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Compra)) AS total_compra,
                ROW_NUMBER() OVER (PARTITION BY dek.IdDetEmpaque ORDER BY dpc.IdDetProducto) AS item_empaque
            FROM
                SAS_DetEmpaqueCompra dek 
            INNER JOIN SAS_EncabCompra ec ON dek.IdEncabCompra = ec.IdEncabCompra
            INNER JOIN GEN_TipoEmpaque tem ON dek.IdTipoEmpaque = tem.IdTipoEmpaque
            INNER JOIN SAS_DetProductoCompra dpc ON dek.IdDetEmpaque = dpc.IdDetEmpaque
            INNER JOIN GEN_Unidades und ON dpc.IdUnidad = und.IdUnidades
            WHERE
                ec.IdEncabCompra = ?
                AND dek.Anulado = 0
                AND dpc.Anulado = 0
            ORDER BY 
                dek.IdDetEmpaque, 
                dpc.IdDetProducto";

$stmtDetalle = $enlace->prepare($sqlDetalle);
$stmtDetalle->bind_param("i", $numeroOrden);
$stmtDetalle->execute();
$stmtDetalle->bind_result(
    $idDetEmpaque,
    $empaque,
    $descripcion_empaque,
    $po_empaque,
    $piezas,
    $full,
    $descripcion,
    $und_facturacion,
    $tallos_caja,
    $ramos_caja,
    $total_tallos,
    $precio_compra,
    $total_compra,
    $item_empaque
);

// Procesar resultados de detalle
$detalles_por_empaque = [];
$item_global = 0;
$tot_piezas = 0;
$tot_full = 0;
$tot_tallos = 0;
$total_general = 0;
$empaques_contados = [];

while ($stmtDetalle->fetch()) {
    $detalle_item = [
        'idDetEmpaque' => $idDetEmpaque,
        'empaque' => $empaque,
        'descripcion_empaque' => $descripcion_empaque,
        'po_empaque' => $po_empaque,
        'piezas' => $piezas,
        'full' => $full,
        'descripcion' => $descripcion,
        'und_facturacion' => $und_facturacion,
        'tallos_caja' => $tallos_caja,
        'ramos_caja' => $ramos_caja,
        'total_tallos' => $total_tallos,
        'precio_compra' => $precio_compra,
        'total_compra' => $total_compra,
        'item_empaque' => $item_empaque
    ];

    // Sumar piezas y fulls SOLO una vez por empaque
    if (!isset($empaques_contados[$idDetEmpaque])) {
        $tot_piezas += $piezas;
        $tot_full += $full;
        $empaques_contados[$idDetEmpaque] = true;
    }

    $tot_tallos += $total_tallos;
    $total_general += $total_compra;

    // Agrupar por empaque
    if (!isset($detalles_por_empaque[$idDetEmpaque])) {
        $item_global++;
        $detalles_por_empaque[$idDetEmpaque] = [
            'empaque' => $empaque,
            'descripcion_empaque' => $descripcion_empaque,
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

// Procesar dirección del proveedor
$direccion_linea1 = $direccion_proveedor;
$direccion_linea2 = '';

if (strlen($direccion_proveedor) > 55) {
    if (strpos($direccion_proveedor, ',') !== false) {
        $partes = explode(',', $direccion_proveedor);
        $direccion_linea1 = trim($partes[0] . (isset($partes[1]) ? ',' . $partes[1] : ''));
        $direccion_linea2 = trim(implode(',', array_slice($partes, 2)));
    } else {
        $direccion_linea1 = substr($direccion_proveedor, 0, 55);
        $direccion_linea2 = substr($direccion_proveedor, 55);
    }
}

// Clase PDF personalizada para orden de compra
class PDF_OrdenCompra extends FPDF
{
    function Header()
    {
        global $numero_orden, $fecha_orden, $tipo_compra, $fecha_entrega_esperada;
        global $proveedor_nombre, $proveedor_nit, $direccion_linea1, $direccion_linea2;
        global $telefono_proveedor, $email_proveedor, $comprador_nombre, $po_proveedor;

        // Título
        $this->SetFont('Helvetica', 'B', 16);
        $this->Cell(0, 8, 'ORDEN DE COMPRA', 0, 1, 'C');

        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 4, 'No. ' . $numero_orden, 0, 1, 'C');
        $this->Cell(0, 4, 'Fecha: ' . $fecha_orden, 0, 1, 'C');

        $this->Ln(3);

        // Logo
        $this->Image(EMPRESA_LOGO_PATH, 15, 30, 60);

        // Información de la empresa (derecha)
        $this->SetY(30);
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(100, 4, '', 0, 0, 'L');
        $this->Cell(30, 4, 'Solicitante:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 4, EMPRESA_NOMBRE, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(100, 4, '', 0, 0, 'L');
        $this->Cell(30, 4, 'NIT:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 4, EMPRESA_NIT, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(100, 4, '', 0, 0, 'L');
        $this->Cell(30, 4, utf8_decode('Dirección:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 4, utf8_decode(EMPRESA_DIRECCION), 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(100, 4, '', 0, 0, 'L');
        $this->Cell(30, 4, 'Ciudad:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 4, utf8_decode(EMPRESA_CIUDAD), 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(100, 4, '', 0, 0, 'L');
        $this->Cell(30, 4, utf8_decode('Teléfono:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 4, utf8_decode(EMPRESA_TELEFONO), 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(100, 4, '', 0, 0, 'L');
        $this->Cell(30, 4, utf8_decode('Email:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 4, utf8_decode(EMPRESA_EMAIL), 0, 1, 'L');

        $this->Ln(2);

        // Información del proveedor
        $this->SetFont('Helvetica', 'B', 11);
        $this->Cell(0, 5, 'PROVEEDOR', 0, 1, 'L');
        $this->SetLineWidth(0.5);
        $this->Line(10, $this->GetY(), 200, $this->GetY());
        $this->Ln(1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 3.5, 'Nombre:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 3.5, $proveedor_nombre, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 3.5, 'NIT:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 3.5, $proveedor_nit, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 3.5, utf8_decode('Dirección:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 3.5, utf8_decode($direccion_linea1), 0, 1, 'L');

        if (!empty($direccion_linea2)) {
            $this->Cell(30, 3.5, '', 0, 0, 'L');
            $this->SetFont('Helvetica', '', 10);
            $this->Cell(0, 3.5, $direccion_linea2, 0, 1, 'L');
        }

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 3.5, utf8_decode('Teléfono:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 3.5, $telefono_proveedor, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 3.5, 'Email:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 3.5, $email_proveedor, 0, 1, 'L');

        $this->Ln(1);

        // Información adicional
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(40, 3.5, 'Comprador:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(60, 3.5, $comprador_nombre, 0, 0, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(40, 3.5, 'Tipo Compra:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 3.5, $tipo_compra, 0, 1, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(40, 3.5, 'PO Proveedor:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(60, 3.5, $po_proveedor, 0, 0, 'L');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(40, 3.5, 'Entrega Esperada:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 3.5, $fecha_entrega_esperada, 0, 1, 'L');

        $this->Ln(6);
    }

    function Footer()
    {
        $this->SetY(-20);

        // Observaciones
        global $observaciones;
        if (!empty($observaciones)) {
            $this->SetFont('Helvetica', 'B', 9);
            $this->Cell(0, 5, 'Observaciones:', 0, 1, 'L');
            $this->SetFont('Helvetica', '', 9);
            $this->MultiCell(0, 4, utf8_decode($observaciones), 0, 'L');
        }

        $this->SetY(-10);
        $this->SetFont('Helvetica', 'I', 8);
        $this->Cell(0, 10, utf8_decode('Página ' . $this->PageNo() . '/{nb}'), 0, 0, 'C');
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
$pdf = new PDF_OrdenCompra('P', 'mm', 'Letter');
$pdf->SetMargins(10, 10, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

// Tabla de detalle - ENCABEZADOS
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->SetFillColor(220, 220, 220);

// Definir anchos de columnas
$anchoItm = 10;
$anchoPack = 10;
$anchoUPack = 10;
$anchoFull = 12;
$anchoDesc = $conPrecio ? 50 : 88; // sin precio: absorbe los 38mm liberados
$anchoPO = 15;
$anchoUnidad = 15;
$anchoSBox = 10;
$anchoBBox = 10;
$anchoTStem = 15;
$anchoPrecio = 19;
$anchoTotal = 19;

// Encabezados de la tabla
$pdf->Cell($anchoItm, 5, utf8_decode('Ítem'), 0, 0, 'C', true);
$pdf->Cell($anchoPack, 5, 'Empaque', 0, 0, 'C', true);
$pdf->Cell($anchoUPack, 5, 'Cant.', 0, 0, 'C', true);
$pdf->Cell($anchoFull, 5, 'Full', 0, 0, 'C', true);
$pdf->Cell($anchoDesc, 5, utf8_decode('Descripción'), 0, 0, 'C', true);
$pdf->Cell($anchoPO, 5, 'PO', 0, 0, 'C', true);
$pdf->Cell($anchoUnidad, 5, 'Unidad', 0, 0, 'C', true);
$pdf->Cell($anchoSBox, 5, 'T/Caja', 0, 0, 'C', true);
$pdf->Cell($anchoBBox, 5, 'R/Caja', 0, 0, 'C', true);
$pdf->Cell($anchoTStem, 5, 'T.Tallos', 0, $conPrecio ? 0 : 1, 'C', true);
if ($conPrecio) {
    $pdf->Cell($anchoPrecio, 5, 'Precio', 0, 0, 'C', true);
    $pdf->Cell($anchoTotal, 5, 'Total', 0, 1, 'C', true);
}

$pdf->SetFont('Helvetica', '', 8);
$pdf->SetFillColor(255, 255, 255);

// Variables para control de página
$altura_fila = 5;
$max_y = 250;

foreach ($detalles_por_empaque as $idEmpaque => $grupo) {
    $firstProduct = true;

    foreach ($grupo['productos'] as $detalle) {
        // Verificar si necesitamos nueva página
        if ($pdf->GetY() > $max_y) {
            $pdf->AddPage();
            // Redibujar encabezados
            $pdf->SetFont('Helvetica', 'B', 8);
            $pdf->SetFillColor(220, 220, 220);
            $pdf->Cell($anchoItm, 5, utf8_decode('Ítem'), 0, 0, 'C', true);
            $pdf->Cell($anchoPack, 5, 'Empaque', 0, 0, 'C', true);
            $pdf->Cell($anchoUPack, 5, 'Cant.', 0, 0, 'C', true);
            $pdf->Cell($anchoFull, 5, 'Full', 0, 0, 'C', true);
            $pdf->Cell($anchoDesc, 5, utf8_decode('Descripción'), 0, 0, 'C', true);
            $pdf->Cell($anchoPO, 5, 'PO', 0, 0, 'C', true);
            $pdf->Cell($anchoUnidad, 5, 'Unidad', 0, 0, 'C', true);
            $pdf->Cell($anchoSBox, 5, 'T/Caja', 0, 0, 'C', true);
            $pdf->Cell($anchoBBox, 5, 'R/Caja', 0, 0, 'C', true);
            $pdf->Cell($anchoTStem, 5, 'T.Tallos', 0, $conPrecio ? 0 : 1, 'C', true);
            if ($conPrecio) {
                $pdf->Cell($anchoPrecio, 5, 'Precio', 0, 0, 'C', true);
                $pdf->Cell($anchoTotal, 5, 'Total', 0, 1, 'C', true);
            }
            $pdf->SetFont('Helvetica', '', 8);
        }

        // Ítem (solo en primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell($anchoItm, $altura_fila, $detalle['item_global'], 0, 0, 'C');
        } else {
            $pdf->Cell($anchoItm, $altura_fila, '', 0, 0, 'C');
        }

        // Empaque (solo en primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell($anchoPack, $altura_fila, $detalle['empaque'], 0, 0, 'C');
        } else {
            $pdf->Cell($anchoPack, $altura_fila, '', 0, 0, 'C');
        }

        // Cantidad (solo en primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell($anchoUPack, $altura_fila, $detalle['piezas'], 0, 0, 'C');
        } else {
            $pdf->Cell($anchoUPack, $altura_fila, '', 0, 0, 'C');
        }

        // Full (solo en primer producto del empaque)
        if ($firstProduct) {
            $pdf->Cell($anchoFull, $altura_fila, number_format($detalle['full'], 2), 0, 0, 'C');
        } else {
            $pdf->Cell($anchoFull, $altura_fila, '', 0, 0, 'C');
        }

        // Descripción
        $descripcion = utf8_decode($detalle['descripcion']);
        $maxDesc = $conPrecio ? 35 : 60;
        if (strlen($descripcion) > $maxDesc) {
            $descripcion = substr($descripcion, 0, $maxDesc - 3) . '...';
        }
        $pdf->Cell($anchoDesc, $altura_fila, $descripcion, 0, 0, 'L');

        // PO (solo en primer producto del empaque)
        if ($firstProduct && !empty($detalle['po_empaque'])) {
            $po = utf8_decode($detalle['po_empaque']);
            if (strlen($po) > 8) {
                $pdf->Cell($anchoPO, $altura_fila, substr($po, 0, 8), 0, 0, 'C');
            } else {
                $pdf->Cell($anchoPO, $altura_fila, $po, 0, 0, 'C');
            }
        } else {
            $pdf->Cell($anchoPO, $altura_fila, '', 0, 0, 'C');
        }

        // Unidad
        $pdf->Cell($anchoUnidad, $altura_fila, utf8_decode($detalle['und_facturacion']), 0, 0, 'C');

        // Tallos por Caja
        $pdf->Cell($anchoSBox, $altura_fila, $detalle['tallos_caja'], 0, 0, 'C');

        // Ramos por Caja
        $pdf->Cell($anchoBBox, $altura_fila, $detalle['ramos_caja'], 0, 0, 'C');

        // Total Tallos
        $pdf->Cell($anchoTStem, $altura_fila, $detalle['total_tallos'], 0, $conPrecio ? 0 : 1, 'C');

        // Precio Compra y Total (solo si conPrecio)
        if ($conPrecio) {
            $pdf->Cell($anchoPrecio, $altura_fila, '$' . number_format($detalle['precio_compra'], $decMoneda), 0, 0, 'R');
            $pdf->Cell($anchoTotal, $altura_fila, '$' . number_format($detalle['total_compra'], $decMoneda), 0, 1, 'R');
        }
        $firstProduct = false;
    }

    // Línea separadora después de cada empaque
    $pdf->addSeparatorLine();
}

// Totales
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(20, 6, 'Total:', 0, 0, 'R');
$pdf->Cell(10, 6, $tot_piezas, 0, 0, 'C');
$pdf->Cell(12, 6, number_format($tot_full, 2), 0, 0, 'C');
if ($conPrecio) {
    $pdf->Cell(100, 6, '', 0, 0, 'C'); // Desc(50)+PO(15)+Unidad(15)+SBox(10)+BBox(10)
    $pdf->Cell(15, 6, $tot_tallos, 0, 0, 'C');
    $pdf->Cell(19, 6, '', 0, 0, 'C');
    $pdf->Cell(19, 6, '$' . number_format($total_general, $decMoneda), 0, 1, 'R');
} else {
    $pdf->Cell(138, 6, '', 0, 0, 'C'); // Desc(88)+PO(15)+Unidad(15)+SBox(10)+BBox(10)
    $pdf->Cell(15, 6, $tot_tallos, 0, 1, 'C');
}

$pdf->Ln(5);

// Términos y condiciones
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 6, utf8_decode('TÉRMINOS Y CONDICIONES:'), 0, 1, 'L');
$pdf->SetFont('Helvetica', '', 9);

$terminos = [
    "1. Los productos deben cumplir con los estándares de calidad establecidos por " . EMPRESA_NOMBRE_CORTO . ".",
    "2. El proveedor se responsabiliza por el transporte hasta nuestras instalaciones.",
    "3. Cualquier producto que no cumpla con los estándares será rechazado y devuelto a cargo del proveedor.",
    "4. El proveedor debe entregar factura de venta con el detalle completo de los productos.",
    "5. Esta orden de compra es válida solo para la fecha de entrega especificada."
];

foreach ($terminos as $termino) {
    $pdf->Cell(5, 5, '', 0, 0, 'L');
    $pdf->MultiCell(0, 4, utf8_decode($termino), 0, 'L');
}

$pdf->Ln(5);

// Firma
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(0, 6, 'FIRMA Y SELLO:', 0, 1, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(0, 5, '___________________________', 0, 1, 'L');
$pdf->Cell(0, 3, $comprador_nombre, 0, 1, 'L');
$pdf->Cell(0, 3, 'Comprador - ' . EMPRESA_NOMBRE_CORTO, 0, 1, 'L');

// Generar PDF
$pdf->Output('I', 'Orden_Compra_' . $numero_orden . '.pdf');

$enlace->close();
