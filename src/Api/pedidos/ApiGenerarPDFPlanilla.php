<?php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";
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
            'ALL SEASON FLOWERS SAS' AS empresa_nombre,
            '901.984.016-8' AS nit,
            'ERIKA JULEY GONZALEZ CHINGATE' AS representante_legal,
            '1.073.525.441' AS cc_representante,
            'C.C. 1.073.525.441 DE CAJAMARCA' AS cc_completo,
            '3114677282' AS telefono_empresa,
            'FINCA VILLA CLEMENCIA BRR SANTA MARTA VEREDA PRADO - Facatativa, Cundinamarca' AS direccion_empresa,
            cli.NOMBRE AS cliente_nombre,
            CONCAT(cli.Direc1, ', ', cli.CIUDAD, ', ', cli.ESTADO, ', ', cli.PAIS) AS direccion_cliente,
            enc.PO_Cliente,
            enc.AWB,
            enc.AWB_HIJA,
            enc.AWB_NIETA,
            COALESCE(aer.NOMAEROLINEA, 'UNITED PARCEL SERVICE') AS aerolinea,
            COALESCE(age.NOMAGENCIA, 'K&M Handling') AS agencia,
            'ESTADOS UNIDOS' AS destino_pais,
            CONCAT(cli.CIUDAD, ', ', cli.ESTADO, ', ', cli.PAIS) AS destino_completo,
            SUM(deq.Cantidad) AS TotalPiezas,
            SUM(deq.Cantidad * teq.EquivFull) AS EquivalenciaFulles,
            SUM(deq.Cantidad * (dpr.Tallos_Ramo * dpr.Ramos_Caja)) AS TotalTallos,
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
        LEFT JOIN SAS_DetEmpaque deq ON enc.IdEncabPedido = deq.IdEncabPedido
        LEFT JOIN GEN_TipoEmpaque teq ON deq.IdTipoEmpaque = teq.IdTipoEmpaque
        LEFT JOIN SAS_DetProducto dpr ON deq.IdDetEmpaque = dpr.IdDetEmpaque
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

// Si no hay conductor asignado, usar valores por defecto
if (empty($conductor_nombre)) {
    $conductor_nombre = $representante_legal;
}

if (empty($ayudante_nombre)) {
    $ayudante_nombre = "";
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
        $this->Cell(0, 10, 'Address: FINCA VILLA CLEMENCIA BRR SANTA MARTA VEREDA PRADO - Facatativa, Cundinamarca / Tel: 3114677282', 0, 0, 'C');
    }

    function generarPlanillaPolicia()
    {
        $this->AddPage();

        // Logo
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg", 150, 10, 60);
        $this->Ln(18);

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
        $this->Cell(60, 6, utf8_decode('FACTURA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['numero_factura'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('GUÍA AÉREA MASTER No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['awb'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('GUÍA HIJA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['awb_hija'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('GUÍA NIETA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['awb_nieta'] ?: 'N/A', 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('CONSIGNATARIO:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['cliente_nombre']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('DESCRIPCIÓN GENERAL:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['descripcion_mercancia']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('DESTINO:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['destino_completo']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('DESTINO FINAL:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['destino_completo']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('AEROLÍNEA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['aerolinea']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('NÚMERO DE FULLES:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, number_format($this->datos['equivalencia_fulles'], 2), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('NÚMERO DE PIEZAS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, number_format($this->datos['total_piezas'], 2), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('TALLOS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['total_tallos'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('AGENCIA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['agencia']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('NOMBRE DEL RESPONSABLE:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['conductor_nombre']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('CÉDULA DE CIUDADANÍA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['conductor_cedula'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('TELÉFONO:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['telefono_empresa'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('PLACAS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['placa'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('PLANILLA DE CARGA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['numero_planilla'], 0, 1);

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
        $this->Ln(14);

        // Firmas      

        $this->SetFont('Helvetica', '', 8);
        $this->Cell(55, 5, utf8_decode($this->datos['representante_legal']), 0, 0, 'C');
        $this->Cell(55, 5, utf8_decode($this->datos['conductor_nombre']), 0, 0, 'C');
        $this->Cell(50, 5, utf8_decode($this->datos['ayudante_nombre'] ?: 'N/A'), 0, 0, 'C');
        $this->Cell(40, 5, utf8_decode($this->datos['agencia']), 0, 1, 'C');
        $this->Ln(0);

        $this->SetFont('Helvetica', '', 8);
        $this->Cell(55, 5, $this->datos['cc_completo'], 0, 0, 'C');
        $this->Cell(55, 5, $this->datos['conductor_cedula'], 0, 0, 'C');
        $this->Cell(50, 5, $this->datos['ayudante_cedula'], 0, 1, 'C');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(55, 5, utf8_decode('REPRESENTANTE LEGAL'), 0, 0, 'C');
        $this->Cell(55, 5, utf8_decode('CONDUCTOR'), 0, 0, 'C');
        $this->Cell(50, 5, utf8_decode('AYUDANTE'), 0, 0, 'C');
        $this->Cell(40, 5, utf8_decode('AGENCIA'), 0, 1, 'C');
    }

    function generarPlanillaAerolinea()
    {
        $this->AddPage();

        // Logo
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg", 150, 10, 60);

        $this->Ln(14);

        // Fecha y lugar
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 6, utf8_decode('Bogotá, ' . $this->datos['fecha_entrega']), 0, 1, 'L');
        $this->Ln(1);

        // Destinatario
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 6, utf8_decode('Señores:'), 0, 1, 'L');
        $this->SetFont('Helvetica', 'B', 11);
        $this->Cell(0, 6, utf8_decode($this->datos['aerolinea']), 0, 1, 'L');
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
        $this->Cell(60, 6, utf8_decode('FACTURA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['numero_factura'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('GUÍA AÉREA MASTER No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['awb'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('GUÍA HIJA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['awb_hija'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('GUÍA NIETA No.:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['awb_nieta'] ?: 'N/A', 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('CONSIGNATARIO:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['cliente_nombre']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('DESCRIPCIÓN GENERAL:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['descripcion_mercancia']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('DESTINO:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['destino_completo']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('DESTINO FINAL:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['destino_completo']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('AEROLÍNEA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['aerolinea']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('NÚMERO DE FULLES:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, number_format($this->datos['equivalencia_fulles'], 2), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('NÚMERO DE PIEZAS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, number_format($this->datos['total_piezas'], 2), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('TALLOS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['total_tallos'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('AGENCIA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['agencia']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('NOMBRE DEL RESPONSABLE:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, utf8_decode($this->datos['conductor_nombre']), 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('CÉDULA DE CIUDADANÍA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['conductor_cedula'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('TELÉFONO:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['telefono_empresa'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('PLACAS:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['placa'], 0, 1);

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(60, 6, utf8_decode('PLANILLA DE CARGA:'), 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(0, 6, $this->datos['numero_planilla'], 0, 1);

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
        $this->Ln(13);

        // Firmas 
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(55, 5, utf8_decode($this->datos['representante_legal']), 0, 0, 'C');
        $this->Cell(55, 5, utf8_decode($this->datos['conductor_nombre']), 0, 0, 'C');
        $this->Cell(50, 5, utf8_decode($this->datos['ayudante_nombre'] ?: 'N/A'), 0, 0, 'C');
        $this->Cell(40, 5, utf8_decode($this->datos['agencia']), 0, 1, 'C');
        $this->Ln(0);

        $this->SetFont('Helvetica', '', 8);
        $this->Cell(55, 5, $this->datos['cc_completo'], 0, 0, 'C');
        $this->Cell(55, 5, $this->datos['conductor_cedula'], 0, 0, 'C');
        $this->Cell(50, 5, $this->datos['ayudante_cedula'], 0, 1, 'C');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(55, 5, utf8_decode('REPRESENTANTE LEGAL'), 0, 0, 'C');
        $this->Cell(55, 5, utf8_decode('CONDUCTOR'), 0, 0, 'C');
        $this->Cell(50, 5, utf8_decode('AYUDANTE'), 0, 0, 'C');
        $this->Cell(40, 5, utf8_decode('AGENCIA'), 0, 1, 'C');
    }

    function generarPlanillaDespacho()
    {
        $this->AddPage();

        // Título
        // Logo
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg", 150, 10, 60);

        $this->Ln(45);

        $this->SetFont('Helvetica', 'B', 14);
        $this->Cell(0, 10, utf8_decode('PLANILLA DE CARGA No.: ' . $this->datos['numero_planilla']), 0, 1, 'C');
        $this->Ln(5);

        // Información principal
        $this->SetFont('Helvetica', '', 11);
        $this->Cell(100, 7, utf8_decode('FECHA:'), 0, 0);
        $this->Cell(0, 7, $this->datos['fecha_entrega'], 0, 1);

        $this->Cell(100, 7, utf8_decode('AEROLÍNEA:'), 0, 0);
        $this->Cell(0, 7, utf8_decode($this->datos['aerolinea']), 0, 1);

        $this->Cell(100, 7, utf8_decode('AGENCIA:'), 0, 0);
        $this->Cell(0, 7, utf8_decode($this->datos['agencia']), 0, 1);

        $this->Cell(100, 7, utf8_decode('GUÍA AÉREA MASTER:'), 0, 0);
        $this->Cell(0, 7, $this->datos['awb'], 0, 1);

        $this->Cell(100, 7, utf8_decode('GUÍA HIJA:'), 0, 0);
        $this->Cell(0, 7, $this->datos['awb_hija'], 0, 1);

        $this->Cell(100, 7, utf8_decode('GUÍA NIETA:'), 0, 0);
        $this->Cell(0, 7, $this->datos['awb_nieta'] ?: 'N/A', 0, 1);

        $this->Cell(100, 7, utf8_decode('EXPORTADOR:'), 0, 0);
        $this->Cell(0, 7, utf8_decode($this->datos['empresa_nombre']), 0, 1);

        $this->Cell(100, 7, utf8_decode('IMPORTADOR:'), 0, 0);
        $this->Cell(0, 7, utf8_decode($this->datos['cliente_nombre']), 0, 1);

        $this->Cell(100, 7, utf8_decode('NÚMERO DE FULLES:'), 0, 0);
        $this->Cell(0, 7, number_format($this->datos['equivalencia_fulles'], 2), 0, 1);

        $this->Cell(100, 7, utf8_decode('NÚMERO DE PIEZAS:'), 0, 0);
        $this->Cell(0, 7, number_format($this->datos['total_piezas'], 2), 0, 1);

        $this->Cell(100, 7, utf8_decode('TIPO DE VEHÍCULO:'), 0, 0);
        $this->Cell(0, 7, utf8_decode('FURGÓN VEHÍCULO'), 0, 1);

        $this->Cell(100, 7, utf8_decode('PLACAS:'), 0, 0);
        $this->Cell(0, 7, $this->datos['placa'], 0, 1);

        $this->Cell(100, 7, utf8_decode('NOMBRE CONDUCTOR:'), 0, 0);
        $this->Cell(0, 7, utf8_decode($this->datos['conductor_nombre']), 0, 1);

        $this->Cell(100, 7, utf8_decode('CÉDULA:'), 0, 0);
        $this->Cell(0, 7, $this->datos['conductor_cedula'], 0, 1);

        $this->Cell(100, 7, utf8_decode('TELÉFONO:'), 0, 0);
        $this->Cell(0, 7, $this->datos['telefono_empresa'], 0, 1);

        $this->Cell(100, 7, utf8_decode('DESTINO:'), 0, 0);
        $this->Cell(0, 7, utf8_decode($this->datos['destino_completo']), 0, 1);

        $this->Cell(100, 7, utf8_decode('DESTINO FINAL:'), 0, 0);
        $this->Cell(0, 7, utf8_decode($this->datos['destino_completo']), 0, 1);

        $this->Ln(25);
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(60, 4, utf8_decode('Atentamente:'), 0, 1, 'L');
        $this->Ln(25);

        // Firmas 
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(55, 5, utf8_decode($this->datos['representante_legal']), 0, 0, 'C');
        $this->Cell(55, 5, utf8_decode($this->datos['conductor_nombre']), 0, 0, 'C');
        $this->Cell(50, 5, utf8_decode($this->datos['ayudante_nombre'] ?: 'N/A'), 0, 0, 'C');
        $this->Cell(40, 5, utf8_decode($this->datos['agencia']), 0, 1, 'C');
        $this->Ln(0);

        $this->SetFont('Helvetica', '', 8);
        $this->Cell(55, 5, $this->datos['cc_completo'], 0, 0, 'C');
        $this->Cell(55, 5, $this->datos['conductor_cedula'], 0, 0, 'C');
        $this->Cell(50, 5, $this->datos['ayudante_cedula'], 0, 1, 'C');

        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(55, 5, utf8_decode('REPRESENTANTE LEGAL'), 0, 0, 'C');
        $this->Cell(55, 5, utf8_decode('CONDUCTOR'), 0, 0, 'C');
        $this->Cell(50, 5, utf8_decode('AYUDANTE'), 0, 0, 'C');
        $this->Cell(40, 5, utf8_decode('AGENCIA'), 0, 1, 'C');
    }
}

// ============================================
// 4. PREPARAR DATOS PARA EL PDF
// ============================================

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
$pdf->SetAuthor('All Season Flowers');
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
