<?php
/**
 * ApiGenerarPDFDevolucion.php - API para generar PDF de devolución de compras
 * 
 * Este endpoint genera un PDF con los detalles de una devolución de compra,
 * incluyendo información del proveedor, productos devueltos y totales.
 * 
 * @package AllSeasonFlowers
 * @category API
 * @subpackage DevolucionesCompras
 */

require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

// Configuración de errores y charset
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Validar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(["success" => false, "message" => "Método no permitido. Usa POST."]));
}

// Obtener y validar datos de entrada
$input = json_decode(file_get_contents("php://input"), true);
if (!isset($input['idCompra']) || empty($input['idCompra'])) {
    http_response_code(400);
    die(json_encode(["success" => false, "message" => "ID de compra no válido."]));
}

$idCompra = intval($input['idCompra']);

// CONSULTA 1: ENCABEZADO DE DEVOLUCIÓN (desde la compra con datos de devolución)
$sqlEncabezado = "SELECT
                    ec.IdEncabCompra,
                    ec.IdDevolucion,
                    CONCAT('DEV-', LPAD(ec.IdDevolucion, 6, '0')) AS numero_devolucion,
                    ec.FechaDevolucion,
                    ec.ObservacionesDevolucion,
                    CONCAT('COMP-', LPAD(ec.IdEncabCompra, 6, '0')) AS compra_asociada,
                    ec.IdEncabCompra AS compra_numero,
                    ec.FechaEntrega AS fecha_compra,
                    p.Proveedor AS proveedor_nombre,
                    p.Direccion AS direccion_proveedor,
                    p.CIUDAD AS ciudad_proveedor,
                    p.Telefono AS telefono_proveedor,
                    ec.IVA AS tiene_iva,
                    ec.TRM,
                    m.Moneda AS moneda,
                    c.NomComprador AS nombre_comprador
                FROM SAS_EncabCompra ec
                INNER JOIN GEN_Proveedores p ON ec.IdProveedor = p.IdProveedor
                LEFT JOIN GEN_Monedas m ON ec.IdMoneda = m.IdMoneda
                LEFT JOIN GEN_Compradores c ON ec.IdComprador = c.IdComprador
                WHERE ec.IdEncabCompra = ? AND ec.IdDevolucion IS NOT NULL AND ec.Anulado = 0";

$stmtEnc = $enlace->prepare($sqlEncabezado);
if (!$stmtEnc) {
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Error preparando consulta de encabezado: " . $enlace->error]));
}

$stmtEnc->bind_param("i", $idCompra);
$stmtEnc->execute();
$stmtEnc->bind_result(
    $idEncabCompra,
    $idDevolucion,
    $numeroDevolucion,
    $fechaDevolucion,
    $observacionesDevolucion,
    $compraAsociada,
    $compraNumero,
    $fechaCompra,
    $proveedorNombre,
    $direccionProveedor,
    $ciudadProveedor,
    $telefonoProveedor,
    $tieneIva,
    $trm,
    $moneda,
    $nombreComprador
);

if (!$stmtEnc->fetch()) {
    http_response_code(404);
    die(json_encode(["success" => false, "message" => "No se encontró la devolución para la compra especificada."]));
}
$stmtEnc->close();

// CONSULTA 2: DETALLE DE PRODUCTOS DEVUELTOS (solo campos que existen en compras)
$sqlDetalle = "SELECT
                dpc.IdDetProducto,
                p.NOMPRODUCTO AS producto,
                v.NOMVARIEDAD AS variedad,
                g.NOMGRADO AS grado,
                dpc.TallosDevolucion,
                dpc.Precio_Compra AS precio_unitario,
                dpc.MotivoDevolucion,
                (dpc.TallosDevolucion * dpc.Precio_Compra) AS total_linea
            FROM SAS_DetProductoCompra dpc
            LEFT JOIN GEN_Productos p ON dpc.IdProducto = p.IdProducto
            LEFT JOIN GEN_Variedades v ON dpc.IdVariedad = v.IdVariedad
            LEFT JOIN GEN_Grados g ON dpc.IdGrado = g.IdGrado
            WHERE dpc.IdEncabCompra = ? AND dpc.TallosDevolucion > 0
            ORDER BY dpc.IdDetProducto";

$stmtDet = $enlace->prepare($sqlDetalle);
if (!$stmtDet) {
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Error preparando consulta de detalle: " . $enlace->error]));
}

$stmtDet->bind_param("i", $idCompra);
$stmtDet->execute();
$stmtDet->bind_result(
    $idDetProducto,
    $producto,
    $variedad,
    $grado,
    $tallosDevueltos,
    $precioUnitario,
    $motivo,
    $totalLinea
);

$detalle = [];
$totalGeneral = 0;

while ($stmtDet->fetch()) {
    $item = [
        'producto' => $producto,
        'variedad' => $variedad,
        'grado' => $grado,
        'tallos' => $tallosDevueltos,
        'precio' => $precioUnitario,
        'motivo' => $motivo,
        'total' => $totalLinea
    ];
    $detalle[] = $item;
    
    $totalGeneral += $totalLinea;
}
$stmtDet->close();

// Si no hay detalles con tallos devueltos, mostrar mensaje
if (empty($detalle)) {
    http_response_code(400);
    die(json_encode(["success" => false, "message" => "No hay productos devueltos en esta compra."]));
}

// Preparar fecha formateada
$fechaFormateada = date('d-M-y', strtotime($fechaDevolucion));

// CLASE PDF PERSONALIZADA PARA DEVOLUCIONES DE COMPRAS - DISEÑO UNIFORME CON VENTAS
class PDF_DevolucionCompra extends FPDF
{
    function Header()
    {
        global $fechaFormateada, $numeroDevolucion, $compraAsociada, $proveedorNombre, 
               $direccionProveedor, $ciudadProveedor, $telefonoProveedor, $observacionesDevolucion, 
               $nombreComprador, $fechaCompra;
        
        // Logo (misma posición que en ventas)
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg", 10, 8, 50);
        
        // Título (similar a ventas)
        $this->SetY(10);
        $this->SetX(70);
        $this->SetFont('Helvetica', 'B', 16);
        $this->Cell(0, 10, utf8_decode('DEVOLUCIÓN / NOTA CRÉDITO COMPRA'), 0, 1, 'C');
        
        // Número de devolución y fecha (mismo estilo que ventas)
        $this->SetX(70);
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(25, 6, utf8_decode('No. Devolución:'), 0, 0, 'R');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(25, 6, $numeroDevolucion, 0, 0, 'L');
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(25);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $fechaFormateada, 0, 1, 'L');
        
        // Compra asociada
        $this->SetX(70);
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(50, 6, 'Compra:', 0, 0, 'R');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $compraAsociada, 0, 1, 'L');
        
        $this->Ln(10);
        
        // Datos del proveedor (mismo formato que cliente en ventas)
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 5, 'Proveedor:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, utf8_decode($proveedorNombre), 0, 1, 'L');
        
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 5, utf8_decode('Dirección:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, utf8_decode($direccionProveedor), 0, 1, 'L');
        
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 5, 'Ciudad:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, utf8_decode($ciudadProveedor), 0, 1, 'L');
        
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 5, utf8_decode('Teléfono:'), 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $telefonoProveedor, 0, 1, 'L');
        
        $this->Ln(3);
        
        // Información de comprador
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 5, 'Comprador:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, utf8_decode($nombreComprador ?: 'No especificado'), 0, 1, 'L');
        
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(30, 5, 'Fecha Compra:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $fechaCompra, 0, 1, 'L');
        
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
$pdf = new PDF_DevolucionCompra('P', 'mm', 'Letter');
$pdf->SetMargins(10, 10, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

// Tabla de detalle - ENCABEZADOS (mismo estilo que ventas)
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->SetFillColor(220, 220, 220);

// Definir anchos de columnas - ampliados para ocupar todo el ancho de página
$anchoProd = 38;
$anchoVar = 25;
$anchoGrado = 18;
$anchoTallos = 18;
$anchoPrecio = 18;
$anchoMotivo = 50;
$anchoTotal = 24;

$pdf->Cell($anchoProd, 6, 'Producto', 1, 0, 'C', true);
$pdf->Cell($anchoVar, 6, 'Variedad', 1, 0, 'C', true);
$pdf->Cell($anchoGrado, 6, 'Grado', 1, 0, 'C', true);
$pdf->Cell($anchoTallos, 6, 'Tallos', 1, 0, 'C', true);
$pdf->Cell($anchoPrecio, 6, 'Precio U', 1, 0, 'C', true);
$pdf->Cell($anchoMotivo, 6, 'Motivo', 1, 0, 'C', true);
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
        $pdf->Cell($anchoTotal, 6, 'Total', 1, 1, 'C', true);
        $pdf->SetFont('Helvetica', '', 7);
    }
    
    $pdf->Cell($anchoProd, 5, utf8_decode(substr($item['producto'], 0, 15)), 1, 0, 'L');
    $pdf->Cell($anchoVar, 5, utf8_decode(substr($item['variedad'], 0, 10)), 1, 0, 'L');
    $pdf->Cell($anchoGrado, 5, utf8_decode($item['grado']), 1, 0, 'L');
    $pdf->Cell($anchoTallos, 5, $item['tallos'], 1, 0, 'C');
    $pdf->Cell($anchoPrecio, 5, '$' . number_format($item['precio'], 2), 1, 0, 'R');
    $pdf->Cell($anchoMotivo, 5, utf8_decode(substr($item['motivo'], 0, 25)), 1, 0, 'L');
    $pdf->Cell($anchoTotal, 5, '$' . number_format($item['total'], 2), 1, 1, 'R');
}

// Línea separadora
$pdf->addSeparatorLine();

// Totales (mismo formato que ventas, alineados con la tabla ampliada)
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(140, 6, '', 0, 0, 'L');
$pdf->Cell(27, 6, 'Total a Devolver:', 0, 0, 'R');
$pdf->Cell(24, 6, '$' . number_format($totalGeneral, 2), 0, 1, 'R');

if ($tieneIva == 1) {
    $iva = $totalGeneral * 0.19;
    $pdf->Cell(140, 6, '', 0, 0, 'L');
    $pdf->Cell(27, 6, 'IVA (19%):', 0, 0, 'R');
    $pdf->Cell(24, 6, '$' . number_format($iva, 2), 0, 1, 'R');
    
    $totalFinal = $totalGeneral + $iva;
    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->Cell(140, 8, '', 0, 0, 'L');
    $pdf->Cell(27, 8, 'TOTAL FINAL:', 0, 0, 'R');
    $pdf->Cell(24, 8, '$' . number_format($totalFinal, 2), 0, 1, 'R');
} else {
    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->Cell(140, 8, '', 0, 0, 'L');
    $pdf->Cell(27, 8, 'TOTAL FINAL:', 0, 0, 'R');
    $pdf->Cell(24, 8, '$' . number_format($totalGeneral, 2), 0, 1, 'R');
}

$pdf->Ln(5);
$pdf->SetFont('Helvetica', 'I', 8);
$pdf->Cell(0, 5, 'Moneda: ' . utf8_decode($moneda) . ' - TRM: ' . number_format($trm, 2), 0, 1, 'R');

// Espacio para firmas
$pdf->Ln(15);
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(95, 5, utf8_decode('___________________________'), 0, 0, 'C');
$pdf->Cell(95, 5, utf8_decode('___________________________'), 0, 1, 'C');
$pdf->Cell(95, 5, 'Responsable All Season Flowers', 0, 0, 'C');
$pdf->Cell(95, 5, 'Recibido por Proveedor', 0, 1, 'C');

// Generar PDF
$pdf->Output('I', 'Devolucion_' . $numeroDevolucion . '.pdf');
?>