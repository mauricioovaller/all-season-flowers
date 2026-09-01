<?php
require_once __DIR__ . '/../config/empresa.php';
require_once FPDF_PATH;
require_once CONEXION_BD_PATH;
// Helper multi-cliente de razones sociales ("Empresa Emisora").
// Si la carpeta helpers/ no está desplegada en el servidor de un cliente,
// no debe romper el endpoint: se definen fallbacks seguros que desactivan
// la funcionalidad y todo cae a las constantes de empresa.php (original).
if (file_exists(__DIR__ . '/helpers/razon_social.php')) {
    require_once __DIR__ . '/helpers/razon_social.php';
}
if (!function_exists('razon_social_columna_existe')) {
    function razon_social_tabla_existe($enlace): bool { return false; }
    function razon_social_columna_existe($enlace): bool { return false; }
    function razon_social_disponible($enlace): bool { return false; }
    function razon_social_obtener($enlace, $idRazonSocial): ?array { return null; }
    function razon_social_de_pedido($enlace, $idEncabPedido): ?array { return null; }
    function razon_social_logo_absoluto($razonSocial): ?string { return null; }
}
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ============================================
// 1. DETECTAR MÉTODO Y OBTENER DATOS
// ============================================

$numeroPlanilla = 0;
$outputType = 'browser'; // browser o base64

// Permitir tanto POST como GET para flexibilidad
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Intentar leer JSON del body primero
    $jsonInput = file_get_contents("php://input");
    if (!empty($jsonInput)) {
        $input = json_decode($jsonInput, true);
        if ($input) {
            $numeroPlanilla = isset($input['numeroPlanilla']) ? intval($input['numeroPlanilla']) : 0;
            $outputType = isset($input['formato']) && $input['formato'] === 'base64' ? 'base64' : 'browser';
        }
    }

    // Si no vino por JSON, verificar POST normal
    if ($numeroPlanilla <= 0 && isset($_POST['numeroPlanilla'])) {
        $numeroPlanilla = intval($_POST['numeroPlanilla']);
        $outputType = isset($_POST['formato']) && $_POST['formato'] === 'base64' ? 'base64' : 'browser';
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['numeroPlanilla'])) {
    $numeroPlanilla = intval($_GET['numeroPlanilla']);
    $outputType = isset($_GET['formato']) && $_GET['formato'] === 'base64' ? 'base64' : 'browser';
} else {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido. Usa POST o GET con parámetro numeroPlanilla."]);
    exit;
}

// Validar que tenemos un número válido
if ($numeroPlanilla <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Número de planilla no válido: $numeroPlanilla"]);
    exit;
}

// ============================================
// 2. CONSULTA DE DATOS DE LA PLANILLA
// ============================================

$sql = "SELECT 
            enc.IdEncabPedido,
            CONCAT('PLAN-', LPAD(enc.NoPlanilla, 4, '0')) AS numero_planilla,
            DATE_FORMAT(NOW(), '%d/%m/%Y') AS fecha_actual,
            DATE_FORMAT(enc.FechaEntrega, '%d/%m/%Y') AS fecha_entrega,
            '" . EMPRESA_NOMBRE . "' AS empresa_nombre,
            '" . EMPRESA_NIT . "' AS nit,
            '" . EMPRESA_REPRESENTANTE . "' AS representante_legal,
            '" . EMPRESA_CC_REPRESENTANTE . "' AS cc_representante,
            '" . EMPRESA_CC_REPRESENTANTE . "' AS cc_completo,
            '" . EMPRESA_TELEFONO . "' AS telefono_empresa,
            '" . EMPRESA_DIRECCION . "' AS direccion_empresa,
            '" . EMPRESA_CIUDAD . "' AS ciudad_empresa,
            cli.NOMBRE AS cliente_nombre,
            CONCAT(cli.Direc1, ', ', cli.CIUDAD, ', ', cli.ESTADO, ', ', cli.PAIS) AS direccion_cliente,
            enc.PO_Cliente,
            enc.AWB,
            enc.AWB_HIJA,
            enc.AWB_NIETA,
            COALESCE(aer.NOMAEROLINEA, 'UNITED PARCEL SERVICE') AS aerolinea,
            COALESCE(age.NOMAGENCIA, 'K&M Handling') AS agencia,
            'ESTADOS UNIDOS' AS destino_pais,
            CONCAT(cli.Direc1,', ', cli.CIUDAD, ', ', cli.ESTADO, ', ', cli.PAIS) AS destino_completo,
            enc.DestinoFinal,
            COALESCE(empaques.TotalPiezas, 0) AS TotalPiezas,
            COALESCE(empaques.EquivalenciaFulles, 0) AS EquivalenciaFulles,
            COALESCE(productos.TotalTallos, 0) AS TotalTallos,
            enc.Factura,
            CONCAT('FACT-', LPAD(enc.Factura, 6, '0')) AS numero_factura,
            'FLORES FRESCAS CORTADAS' AS descripcion_mercancia,
            con.NombreConductor AS conductor_nombre,
            con.NoCedula AS conductor_cedula,
            ayu.NomAyudante AS ayudante_nombre,
            ayu.NoCedula AS ayudante_cedula,
            enc.Placa,
            enc.Precinto
        FROM SAS_EncabPedido enc
        LEFT JOIN (
            SELECT 
                deq.IdEncabPedido,
                SUM(deq.Cantidad) AS TotalPiezas,
                SUM(deq.Cantidad * COALESCE(teq.EquivFull, 0)) AS EquivalenciaFulles
            FROM SAS_DetEmpaque deq
            LEFT JOIN GEN_TipoEmpaque teq ON deq.IdTipoEmpaque = teq.IdTipoEmpaque
            WHERE deq.Anulado = 0
            GROUP BY deq.IdEncabPedido
        ) empaques ON enc.IdEncabPedido = empaques.IdEncabPedido
        LEFT JOIN (
            SELECT 
                dpr.IdEncabPedido,
                SUM(deq1.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja) AS TotalTallos
            FROM SAS_DetProducto dpr
            INNER JOIN SAS_DetEmpaque deq1 ON dpr.IdDetEmpaque = deq1.IdDetEmpaque
            WHERE dpr.Anulado = 0
            GROUP BY dpr.IdEncabPedido
        ) productos ON enc.IdEncabPedido = productos.IdEncabPedido
        LEFT JOIN GEN_Clientes cli ON enc.IdCliente = cli.IdCliente
        LEFT JOIN GEN_Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
        LEFT JOIN GEN_Agencias age ON enc.IdAgencia = age.IdAgencia
        LEFT JOIN GEN_Conductores con ON enc.IdConductor = con.IdConductor
        LEFT JOIN GEN_Ayudantes ayu ON enc.IdAyudante = ayu.IdAyudante
        WHERE enc.NoPlanilla = ?";

$stmt = $enlace->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Error en preparación de consulta: " . $enlace->error]);
    exit;
}

$stmt->bind_param("i", $numeroPlanilla);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["error" => "Error al ejecutar consulta: " . $stmt->error]);
    exit;
}

$stmt->bind_result(
    $idEncabPedido,
    $numero_planilla,
    $fecha_actual,
    $fecha_entrega,
    $empresa_nombre,
    $nit,
    $representante_legal,
    $cc_representante,
    $cc_completo,
    $telefono_empresa,
    $direccion_empresa,
    $ciudad_empresa,
    $cliente_nombre,
    $direccion_cliente,
    $po_cliente,
    $awb,
    $awb_hija,
    $awb_nieta,
    $aerolinea,
    $agencia,
    $destino_pais,
    $destino_completo,
    $destino_final,
    $total_piezas,
    $equivalencia_fulles,
    $total_tallos,
    $factura,
    $numero_factura,
    $descripcion_mercancia,
    $conductor_nombre,
    $conductor_cedula,
    $ayudante_nombre,
    $ayudante_cedula,
    $placa,
    $precinto
);

if (!$stmt->fetch()) {
    $stmt->close();
    http_response_code(404);
    echo json_encode(["error" => "Planilla no encontrada con número: $numeroPlanilla"]);
    exit;
}
$stmt->close();

// ── RAZÓN SOCIAL / "Empresa Emisora" (multi-cliente) ─────────────────────
// Si el pedido tiene una razón social guardada y existe la tabla, se usan sus
// datos y logo; si no, se mantienen las constantes de empresa.php.
$razonSocial = razon_social_de_pedido($enlace, $idEncabPedido);
if ($razonSocial) {
    $empresa_nombre    = !empty($razonSocial['Nombre']) ? $razonSocial['Nombre'] : $empresa_nombre;
    $nit               = !empty($razonSocial['NIT']) ? $razonSocial['NIT'] : $nit;
    $representante_legal = !empty($razonSocial['RepresentanteLegal']) ? $razonSocial['RepresentanteLegal'] : $representante_legal;
    $cc_representante  = !empty($razonSocial['CCRepresentante']) ? $razonSocial['CCRepresentante'] : $cc_representante;
    $cc_completo       = $cc_representante;
    $telefono_empresa  = !empty($razonSocial['Telefono']) ? $razonSocial['Telefono'] : $telefono_empresa;
    $direccion_empresa = !empty($razonSocial['Direccion']) ? $razonSocial['Direccion'] : $direccion_empresa;
    $ciudad_empresa    = !empty($razonSocial['Ciudad']) ? $razonSocial['Ciudad'] : $ciudad_empresa;
}
$logo_planilla = razon_social_logo_absoluto($razonSocial) ?: EMPRESA_LOGO_PATH;

// Validar y limpiar valores NULL para evitar problemas con utf8_decode
if (empty($conductor_nombre)) {
    $conductor_nombre = $representante_legal;
}
if (empty($conductor_cedula)) {
    $conductor_cedula = "N/A";
}
if (empty($ayudante_nombre)) {
    $ayudante_nombre = "";
}
if (empty($ayudante_cedula)) {
    $ayudante_cedula = "";
}
if (empty($placa)) {
    $placa = "KLN564";
}
if (empty($precinto)) {
    $precinto = "0";
}

// ============================================
// 3. CLASE PDF PARA LAS 3 PLANILLAS
// ============================================

/**
 * Función auxiliar para decodificar UTF-8 de forma segura
 * Maneja valores NULL y retorna string seguro
 */
function safeUtf8Decode($value)
{
    if ($value === null || $value === '') {
        return '';
    }
    return utf8_decode((string)$value);
}

class PDF_Planilla extends FPDF
{
    private $datos;

    function __construct($datos)
    {
        parent::__construct('P', 'mm', 'Letter');
        $this->SetMargins(10, 10, 10);
        $this->datos = $datos;
    }

    function Header()
    {
        // Solo para la primera página
        if ($this->PageNo() == 1) {
            $this->SetFont('Helvetica', 'B', 14);
            $this->Ln(0);
        }
    }

    function Footer()
    {
        $this->SetY(-10);
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(0, 10, 'Address: ' . utf8_decode($this->datos['direccion_empresa'] ?? EMPRESA_DIRECCION) . ' / Tel: ' . utf8_decode($this->datos['telefono_empresa'] ?? EMPRESA_TELEFONO) . ' / City: ' . utf8_decode($this->datos['ciudad_empresa'] ?? EMPRESA_CIUDAD), 0, 0, 'C');
    }

    /**
     * Función auxiliar para campos con etiqueta y valor que puede envolver en múltiples líneas
     * Detecta automáticamente si el texto cabe en 1 o 2+ líneas
     * Si cabe en 1 línea: altura normal (6mm)
     * Si necesita 2+ líneas: altura reducida (3.5mm por línea) para no descuadrar documento
     * @param string $label - Etiqueta del campo
     * @param string $value - Valor del campo
     * @param float $labelWidth - Ancho de la etiqueta (mm)
     * @param float $lineHeight - Alto de cada línea cuando cabe en 1 línea (mm)
     */
    function multiCellWithLabel($label, $value, $labelWidth = 60, $lineHeight = 6)
    {
        // Guardar posición Y actual
        $startY = $this->GetY();

        // Establecer fuente para calcular ancho del valor
        $this->SetFont('Helvetica', '', 10);

        // Calcular ancho disponible para el valor
        $valueWidth = $this->w - $this->lMargin - $labelWidth - $this->rMargin;

        // Calcular número de líneas que necesita el valor
        $stringWidth = $this->GetStringWidth(utf8_decode($value));
        $numLines = ceil($stringWidth / $valueWidth);

        // Ajustar altura según número de líneas
        // 1 línea: usar altura normal (6mm)
        // 2+ líneas: usar altura reducida (3mm por línea) para minimizar espacio
        if ($numLines == 1) {
            $cellHeight = $lineHeight;
            $totalHeight = $lineHeight;
        } else {
            $cellHeight = 3;
            $totalHeight = $cellHeight * $numLines;
        }

        // Dibujar etiqueta con altura total ajustada (alineada arriba)
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell($labelWidth, $totalHeight, utf8_decode($label), 0, 0, 'T');

        // Dibujar valor con MultiCell usando la altura calculada
        $this->SetFont('Helvetica', '', 10);
        $this->MultiCell($valueWidth, $cellHeight, utf8_decode($value), 0, 'L');
    }

    /**
     * Función para dibujar los 4 bloques de firmas con separación clara
     * Permite envolver nombres (hasta 3 líneas) y cédulas (hasta 2 líneas)
     * Con altura mínima para no expandir el documento
     */
    function dibujarBloquesFirmas()
    {
        // Definir anchos de bloques iguales y distribuidos horizontalmente
        $anchoBloque = 47.5;  // aproximadamente 190 / 4
        $x1 = 10;   // Margen izquierdo
        $x2 = $x1 + $anchoBloque;
        $x3 = $x2 + $anchoBloque;
        $x4 = $x3 + $anchoBloque;

        $y = $this->GetY();
        $altoLineaMin = 2.5;  // Altura mínima por línea para legibilidad

        // Array para almacenar Y máxima de cada bloque después de nombres
        $yFinal = $y;

        // --- BLOQUE 1: REPRESENTANTE LEGAL ---
        $this->SetFont('Helvetica', '', 7.5);
        $this->SetXY($x1, $y);
        $yBefore = $this->GetY();
        $this->MultiCell($anchoBloque - 2, $altoLineaMin, safeUtf8Decode($this->datos['representante_legal']), 0, 'C');
        $yAfter = $this->GetY();
        $yFinal = max($yFinal, $yAfter);

        // --- BLOQUE 2: CONDUCTOR ---
        $this->SetFont('Helvetica', '', 7.5);
        $this->SetXY($x2, $y);
        $this->MultiCell($anchoBloque - 2, $altoLineaMin, safeUtf8Decode($this->datos['conductor_nombre']), 0, 'C');
        $yAfter = $this->GetY();
        $yFinal = max($yFinal, $yAfter);

        // --- BLOQUE 3: AYUDANTE ---
        $this->SetFont('Helvetica', '', 7.5);
        $this->SetXY($x3, $y);
        $this->MultiCell($anchoBloque - 2, $altoLineaMin, safeUtf8Decode($this->datos['ayudante_nombre'] ?: 'N/A'), 0, 'C');
        $yAfter = $this->GetY();
        $yFinal = max($yFinal, $yAfter);

        // --- BLOQUE 4: AGENCIA ---
        $this->SetFont('Helvetica', '', 7.5);
        $this->SetXY($x4, $y);
        $this->MultiCell($anchoBloque - 2, $altoLineaMin, safeUtf8Decode($this->datos['agencia']), 0, 'C');
        $yAfter = $this->GetY();
        $yFinal = max($yFinal, $yAfter);

        // Posicionar Y después de los nombres
        $y = $yFinal + 1;

        // --- CÉDULAS ---
        $yFinal = $y;

        $this->SetFont('Helvetica', '', 6.5);
        $this->SetXY($x1, $y);
        $this->MultiCell($anchoBloque - 2, $altoLineaMin, safeUtf8Decode($this->datos['cc_completo']), 0, 'C');
        $yAfter = $this->GetY();
        $yFinal = max($yFinal, $yAfter);

        $this->SetXY($x2, $y);
        $this->MultiCell($anchoBloque - 2, $altoLineaMin, safeUtf8Decode($this->datos['conductor_cedula']), 0, 'C');
        $yAfter = $this->GetY();
        $yFinal = max($yFinal, $yAfter);

        $this->SetXY($x3, $y);
        $this->MultiCell($anchoBloque - 2, $altoLineaMin, safeUtf8Decode($this->datos['ayudante_cedula']), 0, 'C');
        $yAfter = $this->GetY();
        $yFinal = max($yFinal, $yAfter);

        // Agencia no tiene cédula
        $this->SetXY($x4, $y);
        $this->MultiCell($anchoBloque - 2, $altoLineaMin, '', 0, 'C');

        // Posicionar Y después de las cédulas
        $y = $yFinal + 2;

        // --- LÍNEAS DE FIRMA ---
        $this->SetDrawColor(0);
        $this->SetLineWidth(0.3);

        // Línea para Representante Legal
        $this->Line($x1 + 2, $y, $x1 + $anchoBloque - 3, $y);

        // Línea para Conductor
        $this->Line($x2 + 2, $y, $x2 + $anchoBloque - 3, $y);

        // Línea para Ayudante
        $this->Line($x3 + 2, $y, $x3 + $anchoBloque - 3, $y);

        // Línea para Agencia
        $this->Line($x4 + 2, $y, $x4 + $anchoBloque - 3, $y);

        $y += 4;

        // --- ETIQUETAS ---
        $this->SetFont('Helvetica', 'B', 8);
        $this->SetXY($x1, $y);
        $this->Cell($anchoBloque - 2, 4, utf8_decode('REPRESENTANTE LEGAL'), 0, 0, 'C');

        $this->SetXY($x2, $y);
        $this->Cell($anchoBloque - 2, 4, utf8_decode('CONDUCTOR'), 0, 0, 'C');

        $this->SetXY($x3, $y);
        $this->Cell($anchoBloque - 2, 4, utf8_decode('AYUDANTE'), 0, 0, 'C');

        $this->SetXY($x4, $y);
        $this->Cell($anchoBloque - 2, 4, utf8_decode('AGENCIA'), 0, 0, 'C');
        $this->SetY($y + 5);
    }

    function generarPlanillaPolicia()
    {
        $this->AddPage();

        // Logo
        $this->Image($this->datos['logo'] ?? EMPRESA_LOGO_PATH, 150, 10, 60);
        $this->Ln(12);

        // Fecha y lugar
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 6, utf8_decode('Bogotá, ' . $this->datos['fecha_entrega']), 0, 1, 'L');
        $this->Ln(1);

        // Destinatario
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 6, utf8_decode('Señores:'), 0, 1, 'L');
        $this->SetFont('Helvetica', 'B', 11);
        $this->Cell(0, 6, utf8_decode('DIRECCIÓN DE ANTINARCÓTICOS'), 0, 1, 'L');
        $this->Cell(0, 6, utf8_decode('BASE OPERATIVA AEROPUERTO EL DORADO BOGOTÁ'), 0, 1, 'L');
        $this->Cell(0, 6, utf8_decode('REF: CARTA DE RESPONSABILIDAD'), 0, 1, 'L');
        $this->Ln(3);

        // Cuerpo de la carta
        $this->SetFont('Helvetica', '', 10);
        $texto = utf8_decode("Yo, " . $this->datos['representante_legal'] . " identificado con C.C " . $this->datos['cc_representante'] .
            " en condición de Representante Legal de la Empresa " . $this->datos['empresa_nombre'] .
            " Con NIT: " . $this->datos['nit'] . " certifico que el contenido de la presente carga se ajusta a lo declarado en:");
        $this->MultiCell(0, 5, $texto);
        $this->Ln(2);

        // Tabla de información       

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('GUÍA AÉREA MASTER No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['awb'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('GUÍA HIJA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['awb_hija'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('GUÍA NIETA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['awb_nieta'] ?: 'N/A', 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('CONSIGNATARIO:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, safeUtf8Decode($this->datos['cliente_nombre']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('DESCRIPCIÓN GENERAL:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, safeUtf8Decode($this->datos['descripcion_mercancia']), 0, 1);

        $this->multiCellWithLabel(utf8_decode('DESTINO:'), $this->datos['destino_completo'], 60, 5);

        $this->multiCellWithLabel(utf8_decode('DESTINO FINAL:'), $this->datos['destino_final_pdf'], 60, 5);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('AEROLÍNEA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, safeUtf8Decode($this->datos['aerolinea']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('NÚMERO DE FULLES:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, number_format($this->datos['equivalencia_fulles'], 2), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('NÚMERO DE PIEZAS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, number_format($this->datos['total_piezas'], 2), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('TALLOS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['total_tallos'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('AGENCIA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, safeUtf8Decode($this->datos['agencia']), 0, 1);

        $this->multiCellWithLabel(utf8_decode('NOMBRE DEL RESPONSABLE:'), $this->datos['conductor_nombre'], 60, 5);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('CÉDULA DE CIUDADANÍA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, safeUtf8Decode($this->datos['conductor_cedula']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('TELÉFONO:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['telefono_empresa'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('PLACAS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['placa'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('PLANILLA DE CARGA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['numero_planilla'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('FACTURA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['numero_factura'], 0, 1);

        $this->Ln(1);

        // Declaración de responsabilidad
        $declaracion = utf8_decode("Nos hacemos responsables por el contenido de esta carga ante las autoridades colombianas, " .
            "extranjeras y ante el transportador aéreo en caso que se encuentren sustancias o elementos " .
            "narcóticos, explosivos ilícitos o prohibidos (estipulados en las normas internacionales a " .
            "excepción de aquellas que expresamente se han declarado como tal) armas o partes de ellas, " .
            "municiones, material de guerra o sus partes u otros elementos que no cumplan con las " .
            "obligaciones legales establecidas para este tipo de carga, siempre que se conserve sus " .
            "empaques, características y sellos originales con las que sea entregada al transportador " .
            "aéreo. El embarque ha sido preparado en lugares con óptimas condiciones de seguridad y ha " .
            "sido protegido de toda intervención ilícita durante su preparación, embalaje, almacenamiento " .
            "y transporte hacia las instalaciones de la aerolínea y cumple con todos los requisitos " .
            "exigidos por la ley y las normas fitosanitarias.");

        $this->MultiCell(0, 5, $declaracion);
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(60, 6, utf8_decode('Atentamente:'), 0, 1, 'L');
        $this->Ln(8);

        // Firmas con bloques separados
        $this->dibujarBloquesFirmas();
    }

    function generarPlanillaAerolinea()
    {
        $this->AddPage();

        // Logo
        $this->Image($this->datos['logo'] ?? EMPRESA_LOGO_PATH, 150, 10, 60);

        $this->Ln(14);

        // Fecha y lugar
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 6, utf8_decode('Bogotá, ' . $this->datos['fecha_entrega']), 0, 1, 'L');
        $this->Ln(1);

        // Destinatario
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 6, utf8_decode('Señores:'), 0, 1, 'L');
        $this->SetFont('Helvetica', 'B', 11);
        $this->Cell(0, 6, safeUtf8Decode($this->datos['aerolinea']), 0, 1, 'L');
        $this->Cell(0, 6, utf8_decode('DEPARTAMENTO DE SEGURIDAD'), 0, 1, 'L');
        $this->Cell(0, 6, utf8_decode('AEROPUERTO EL DORADO BOGOTÁ'), 0, 1, 'L');
        $this->Cell(0, 6, utf8_decode('REF: CARTA DE RESPONSABILIDAD'), 0, 1, 'L');
        $this->Ln(1);

        // Cuerpo de la carta
        $this->SetFont('Helvetica', '', 10);
        $texto = utf8_decode("Yo, " . $this->datos['representante_legal'] . " identificado con C.C " . $this->datos['cc_representante'] .
            " en condición de Representante Legal de la Empresa " . $this->datos['empresa_nombre'] .
            " Con NIT: " . $this->datos['nit'] . " certifico que el contenido de la presente carga se ajusta a lo declarado en:");
        $this->MultiCell(0, 5, $texto);
        $this->Ln(1);

        // Tabla de información        
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('GUÍA AÉREA MASTER No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['awb'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('GUÍA HIJA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['awb_hija'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('GUÍA NIETA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['awb_nieta'] ?: 'N/A', 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('CONSIGNATARIO:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, safeUtf8Decode($this->datos['cliente_nombre']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('DESCRIPCIÓN GENERAL:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, safeUtf8Decode($this->datos['descripcion_mercancia']), 0, 1);

        $this->multiCellWithLabel(utf8_decode('DESTINO:'), $this->datos['destino_completo'], 60, 5);

        $this->multiCellWithLabel(utf8_decode('DESTINO FINAL:'), $this->datos['destino_final_pdf'], 60, 5);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('AEROLÍNEA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, safeUtf8Decode($this->datos['aerolinea']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('NÚMERO DE FULLES:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, number_format($this->datos['equivalencia_fulles'], 2), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('NÚMERO DE PIEZAS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, number_format($this->datos['total_piezas'], 2), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('TALLOS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['total_tallos'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('AGENCIA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, safeUtf8Decode($this->datos['agencia']), 0, 1);

        $this->multiCellWithLabel(utf8_decode('NOMBRE DEL RESPONSABLE:'), $this->datos['conductor_nombre'], 60, 5);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('CÉDULA DE CIUDADANÍA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, safeUtf8Decode($this->datos['conductor_cedula']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('TELÉFONO:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['telefono_empresa'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('PLACAS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['placa'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('PLANILLA DE CARGA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['numero_planilla'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 5, utf8_decode('FACTURA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 5, $this->datos['numero_factura'], 0, 1);


        $this->Ln(0);

        // Declaración de responsabilidad
        $declaracion = utf8_decode("Nos hacemos responsables por el contenido de esta carga ante las autoridades colombianas, " .
            "extranjeras y ante el transportador aéreo en caso que se encuentren sustancias o elementos " .
            "narcóticos, explosivos ilícitos o prohibidos (estipulados en las normas internacionales a " .
            "excepción de aquellas que expresamente se han declarado como tal) armas o partes de ellas, " .
            "municiones, material de guerra o sus partes u otros elementos que no cumplan con las " .
            "obligaciones legales establecidas para este tipo de carga, siempre que se conserve sus " .
            "empaques, características y sellos originales con las que sea entregada al transportador " .
            "aéreo. El embarque ha sido preparado en lugares con óptimas condiciones de seguridad y ha " .
            "sido protegido de toda intervención ilícita durante su preparación, embalaje, almacenamiento " .
            "y transporte hacia las instalaciones de la aerolínea y cumple con todos los requisitos " .
            "exigidos por la ley y las normas fitosanitarias.");

        $this->MultiCell(0, 5, $declaracion);
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(60, 4, utf8_decode('Atentamente:'), 0, 1, 'L');
        $this->Ln(7);

        // Firmas con bloques separados
        $this->dibujarBloquesFirmas();
    }

    function generarPlanillaDespacho()
    {
        $this->AddPage();

        // Título
        // Logo
        $this->Image($this->datos['logo'] ?? EMPRESA_LOGO_PATH, 150, 10, 60);

        $this->Ln(45);

        $this->SetFont('Helvetica', 'B', 14);
        $this->Cell(0, 10, utf8_decode('PLANILLA DE CARGA No.: ' . $this->datos['numero_planilla']), 0, 1, 'C');
        $this->Ln(5);

        // Información principal
        $this->SetFont('Helvetica', '', 11);
        $this->Cell(100, 7, utf8_decode('FECHA:'), 0, 0);
        $this->Cell(0, 7, $this->datos['fecha_entrega'], 0, 1);

        $this->Cell(100, 7, utf8_decode('AEROLÍNEA:'), 0, 0);
        $this->Cell(0, 7, safeUtf8Decode($this->datos['aerolinea']), 0, 1);

        $this->Cell(100, 7, utf8_decode('AGENCIA:'), 0, 0);
        $this->Cell(0, 7, safeUtf8Decode($this->datos['agencia']), 0, 1);

        $this->Cell(100, 7, utf8_decode('GUÍA AÉREA MASTER:'), 0, 0);
        $this->Cell(0, 7, $this->datos['awb'], 0, 1);

        $this->Cell(100, 7, utf8_decode('GUÍA HIJA:'), 0, 0);
        $this->Cell(0, 7, $this->datos['awb_hija'], 0, 1);

        $this->Cell(100, 7, utf8_decode('GUÍA NIETA:'), 0, 0);
        $this->Cell(0, 7, $this->datos['awb_nieta'] ?: 'N/A', 0, 1);

        $this->Cell(100, 7, utf8_decode('EXPORTADOR:'), 0, 0);
        $this->Cell(0, 7, safeUtf8Decode($this->datos['empresa_nombre']), 0, 1);

        $this->Cell(100, 7, utf8_decode('IMPORTADOR:'), 0, 0);
        $this->Cell(0, 7, safeUtf8Decode($this->datos['cliente_nombre']), 0, 1);

        $this->Cell(100, 7, utf8_decode('NÚMERO DE FULLES:'), 0, 0);
        $this->Cell(0, 7, number_format($this->datos['equivalencia_fulles'], 2), 0, 1);

        $this->Cell(100, 7, utf8_decode('NÚMERO DE PIEZAS:'), 0, 0);
        $this->Cell(0, 7, number_format($this->datos['total_piezas'], 2), 0, 1);

        $this->Cell(100, 7, utf8_decode('TIPO DE VEHÍCULO:'), 0, 0);
        $this->Cell(0, 7, utf8_decode('FURGÓN VEHÍCULO'), 0, 1);

        $this->Cell(100, 7, utf8_decode('PLACAS:'), 0, 0);
        $this->Cell(0, 7, $this->datos['placa'], 0, 1);

        $this->multiCellWithLabel(utf8_decode('NOMBRE CONDUCTOR:'), $this->datos['conductor_nombre'], 100, 7);

        $this->multiCellWithLabel(utf8_decode('CÉDULA:'), safeUtf8Decode($this->datos['conductor_cedula']), 100, 7);

        $this->Cell(100, 7, utf8_decode('TELÉFONO:'), 0, 0);
        $this->Cell(0, 7, $this->datos['telefono_empresa'], 0, 1);

        $this->multiCellWithLabel(utf8_decode('DESTINO:'), $this->datos['destino_completo'], 100, 7);

        $this->multiCellWithLabel(utf8_decode('DESTINO FINAL:'), $this->datos['destino_final_pdf'], 100, 7);

        $this->Ln(10);
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(60, 4, utf8_decode('Atentamente:'), 0, 1, 'L');
        $this->Ln(8);

        // Firmas con bloques separados
        $this->dibujarBloquesFirmas();
    }
}

// ============================================
// 4. PREPARAR DATOS PARA EL PDF
// ============================================

// DestinoFinal: usar valor guardado, sino usar destino_completo calculado
$destino_final_para_pdf = !empty($destino_final) ? $destino_final : $destino_completo;

$datosPDF = [
    'numero_planilla' => $numero_planilla,
    'fecha_actual' => $fecha_actual,
    'fecha_entrega' => $fecha_entrega,
    'empresa_nombre' => $empresa_nombre,
    'nit' => $nit,
    'representante_legal' => $representante_legal,
    'cc_representante' => $cc_representante,
    'cc_completo' => $cc_completo,
    'telefono_empresa' => $telefono_empresa,
    'direccion_empresa' => $direccion_empresa,
    'ciudad_empresa' => $ciudad_empresa,
    'logo' => $logo_planilla,
    'cliente_nombre' => $cliente_nombre,
    'direccion_cliente' => $direccion_cliente,
    'po_cliente' => $po_cliente,
    'awb' => $awb,
    'awb_hija' => $awb_hija,
    'awb_nieta' => $awb_nieta,
    'aerolinea' => $aerolinea,
    'agencia' => $agencia,
    'destino_pais' => $destino_pais,
    'destino_completo' => $destino_completo,
    'destino_final_pdf' => $destino_final_para_pdf,
    'total_piezas' => $total_piezas,
    'equivalencia_fulles' => $equivalencia_fulles,
    'total_tallos' => $total_tallos,
    'factura' => $factura,
    'numero_factura' => $numero_factura,
    'descripcion_mercancia' => $descripcion_mercancia,
    'conductor_nombre' => $conductor_nombre,
    'conductor_cedula' => $conductor_cedula,
    'ayudante_nombre' => $ayudante_nombre,
    'ayudante_cedula' => $ayudante_cedula,
    'placa' => $placa,
    'precinto' => $precinto
];

// ============================================
// 5. GENERAR PDF
// ============================================

$pdf = new PDF_Planilla($datosPDF);
$pdf->SetTitle('Planilla ' . $numero_planilla);
$pdf->SetAuthor(EMPRESA_NOMBRE_CORTO);
$pdf->SetCreator('Sistema de Pedidos');

// Generar las 3 planillas
$pdf->generarPlanillaPolicia();
$pdf->generarPlanillaAerolinea();
$pdf->generarPlanillaDespacho();

// ============================================
// 6. SALIDA DEL PDF
// ============================================

if ($outputType === 'base64') {
    // Capturar output en buffer
    ob_start();
    $pdf->Output('S', 'Planilla_' . $numero_planilla . '.pdf');
    $pdfData = ob_get_clean();

    // Devolver como JSON con base64
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'pdf_base64' => base64_encode($pdfData),
        'filename' => 'Planilla_' . $numero_planilla . '.pdf',
        'numero_planilla' => $numero_planilla,
        'message' => 'PDF generado correctamente'
    ]);
} else {
    // Mostrar directamente en el navegador
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="Planilla_' . $numero_planilla . '.pdf"');
    $pdf->Output('I', 'Planilla_' . $numero_planilla . '.pdf');
}

// Cerrar conexión
$enlace->close();
