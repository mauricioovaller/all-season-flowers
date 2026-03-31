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

// CLASE PDF PERSONALIZADA PARA DEVOLUCIONES DE COMPRAS
class PDF_DevolucionCompra extends FPDF
{
    function Header()
    {
        global $numeroDevolucion, $fechaDevolucion, $proveedorNombre, $direccionProveedor, 
               $ciudadProveedor, $telefonoProveedor, $observacionesDevolucion, 
               $compraAsociada, $fechaCompra, $tieneIva, $trm, $moneda, $nombreComprador;
        
        // Logo (si existe)
        $logoPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/assets/logo.png";
        if (file_exists($logoPath)) {
            $this->Image($logoPath, 10, 8, 30);
        }
        
        // Título
        $this->SetFont('Helvetica', 'B', 16);
        $this->Cell(0, 10, utf8_decode('NOTA DE DEVOLUCIÓN DE COMPRA'), 0, 1, 'C');
        
        $this->SetFont('Helvetica', 'B', 12);
        $this->Cell(0, 6, $numeroDevolucion, 0, 1, 'C');
        
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, 'Fecha: ' . $fechaDevolucion, 0, 1, 'C');
        
        $this->Ln(5);
        
        // Información de la empresa
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 5, 'ALL SEASON FLOWERS', 0, 1, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 4, 'Carrera 10 # 9 - 45, Bogotá D.C.', 0, 1, 'L');
        $this->Cell(0, 4, 'Tel: (57) 1 123 4567 | Email: info@allseasonflowers.com', 0, 1, 'L');
        
        $this->Ln(3);
        $this->addSeparatorLine();
        
        // Información del proveedor
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
        
        // Información de la compra asociada
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(40, 5, 'Compra asociada:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $compraAsociada . ' (Fecha: ' . $fechaCompra . ')', 0, 1, 'L');
        
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(40, 5, 'Comprador:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, utf8_decode($nombreComprador ?: 'No especificado'), 0, 1, 'L');
        
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

// Tabla de detalle - ENCABEZADOS
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->SetFillColor(220, 220, 220);

// Definir anchos de columnas (ajustados para compras - sin Flete, Fumigacion, Otros)
$anchoProd = 35;
$anchoVar = 25;
$anchoGrado = 20;
$anchoTallos = 20;
$anchoPrecio = 20;
$anchoMotivo = 50;
$anchoTotal = 20;

$pdf->Cell($anchoProd, 6, 'Producto', 1, 0, 'C', true);
$pdf->Cell($anchoVar, 6, 'Variedad', 1, 0, 'C', true);
$pdf->Cell($anchoGrado, 6, 'Grado', 1, 0, 'C', true);
$pdf->Cell($anchoTallos, 6, 'Tallos Dev.', 1, 0, 'C', true);
$pdf->Cell($anchoPrecio, 6, 'Precio U', 1, 0, 'C', true);
$pdf->Cell($anchoMotivo, 6, 'Motivo', 1, 0, 'C', true);
$pdf->Cell($anchoTotal, 6, 'Total', 1, 1, 'C', true);

$pdf->SetFont('Helvetica', '', 7);
$pdf->SetFillColor(255, 255, 255);

foreach ($detalle as $item) {
    // Verificar salto de página
    if ($pdf->GetY() > 250) {
        $pdf->AddPage();
        // Redibujar encabezados de tabla en nueva página
        $pdf->SetFont('Helvetica', 'B', 8);
        $pdf->SetFillColor(220, 220, 220);
        $pdf->Cell($anchoProd, 6, 'Producto', 1, 0, 'C', true);
        $pdf->Cell($anchoVar, 6, 'Variedad', 1, 0, 'C', true);
        $pdf->Cell($anchoGrado, 6, 'Grado', 1, 0, 'C', true);
        $pdf->Cell($anchoTallos, 6, 'Tallos Dev.', 1, 0, 'C', true);
        $pdf->Cell($anchoPrecio, 6, 'Precio U', 1, 0, 'C', true);
        $pdf->Cell($anchoMotivo, 6, 'Motivo', 1, 0, 'C', true);
        $pdf->Cell($anchoTotal, 6, 'Total', 1, 1, 'C', true);
        $pdf->SetFont('Helvetica', '', 7);
        $pdf->SetFillColor(255, 255, 255);
    }
    
    $pdf->Cell($anchoProd, 6, utf8_decode(substr($item['producto'], 0, 20)), 1, 0, 'L', true);
    $pdf->Cell($anchoVar, 6, utf8_decode(substr($item['variedad'], 0, 15)), 1, 0, 'L', true);
    $pdf->Cell($anchoGrado, 6, utf8_decode(substr($item['grado'], 0, 10)), 1, 0, 'C', true);
    $pdf->Cell($anchoTallos, 6, $item['tallos'], 1, 0, 'C', true);
    $pdf->Cell($anchoPrecio, 6, '$' . number_format($item['precio'], 2), 1, 0, 'R', true);
    $pdf->Cell($anchoMotivo, 6, utf8_decode(substr($item['motivo'], 0, 25)), 1, 0, 'L', true);
    $pdf->Cell($anchoTotal, 6, '$' . number_format($item['total'], 2), 1, 1, 'R', true);
}

$pdf->Ln(5);

// Totales
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell($anchoProd + $anchoVar + $anchoGrado + $anchoTallos + $anchoPrecio + $anchoMotivo, 6, 'TOTAL GENERAL:', 0, 0, 'R');
$pdf->Cell($anchoTotal, 6, '$' . number_format($totalGeneral, 2), 1, 1, 'R');

// Información adicional
$pdf->Ln(10);
$pdf->SetFont('Helvetica', '', 9);
$pdf->MultiCell(0, 5, utf8_decode("Nota: Esta devolución corresponde a la compra $compraAsociada con fecha $fechaCompra. Los valores están expresados en $moneda con TRM de $trm."), 0, 'L');

if ($tieneIva) {
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->Cell(0, 5, utf8_decode('(*) Incluye IVA'), 0, 1, 'L');
}

// Firmas
$pdf->Ln(15);
$pdf->SetFont('Helvetica', '', 9);
$pdf->Cell(95, 5, utf8_decode('___________________________'), 0, 0, 'C');
$pdf->Cell(95, 5, utf8_decode('___________________________'), 0, 1, 'C');
$pdf->Cell(95, 5, 'Responsable All Season Flowers', 0, 0, 'C');
$pdf->Cell(95, 5, 'Recibido por Proveedor', 0, 1, 'C');

// Generar PDF
$pdf->Output('I', "Devolucion_Compra_$numeroDevolucion.pdf");
?>