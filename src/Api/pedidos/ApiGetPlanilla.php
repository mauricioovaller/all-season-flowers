<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['idPlanilla'])) {
    http_response_code(400);
    echo json_encode(["error" => "idPlanilla es requerido"]);
    exit;
}

$idPlanilla = $input['idPlanilla'];

try {
    // Buscar por número de planilla (puede venir como "PLAN-0001" o solo "1")
    if (is_string($idPlanilla) && stripos($idPlanilla, 'PLAN-') !== false) {
        preg_match('/\d+/', $idPlanilla, $matches);
        $numeroPlanilla = isset($matches[0]) ? (int)$matches[0] : 0;
    } else {
        $numeroPlanilla = (int) $idPlanilla;
    }

    if ($numeroPlanilla <= 0) {
        throw new Exception("Número de planilla inválido");
    }

    // Consultar datos de la planilla desde SAS_EncabPedido
    $query = "SELECT 
                enc.IdEncabPedido,
                enc.NoPlanilla,
                CONCAT('PLAN-', LPAD(enc.NoPlanilla, 4, '0')) AS numero_planilla_formateado,
                enc.IdConductor,
                enc.IdAyudante,
                enc.Placa,
                enc.Precinto,
                enc.Factura,
                CONCAT('FACT-', LPAD(enc.Factura, 6, '0')) AS numero_factura_formateado,
                enc.Estado,
                DATE_FORMAT(enc.FechaSolicitud, '%d/%m/%Y') AS fecha_solicitud,
                DATE_FORMAT(enc.FechaEntrega, '%d/%m/%Y') AS fecha_entrega,
                enc.PO_Cliente,
                enc.AWB,
                enc.AWB_HIJA,
                enc.AWB_NIETA,
                0 AS TotalPiezas,
                0 AS EquivalenciaFulles,
                0 AS TotalTallos,
                0 AS ValorVenta,
                0 AS IVA,
                0 AS TotalVenta,
                cli.NOMBRE AS cliente_nombre,
                aer.NOMAEROLINEA AS aerolinea_nombre,
                age.NOMAGENCIA AS agencia_nombre,
                con.NombreConductor AS conductor_nombre,
                ayu.NomAyudante AS ayudante_nombre
            FROM SAS_EncabPedido enc
            LEFT JOIN GEN_Clientes cli ON enc.IdCliente = cli.IdCliente
            LEFT JOIN GEN_Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
            LEFT JOIN GEN_Agencias age ON enc.IdAgencia = age.IdAgencia
            LEFT JOIN GEN_Conductores con ON enc.IdConductor = con.IdConductor
            LEFT JOIN GEN_Ayudantes ayu ON enc.IdAyudante = ayu.IdAyudante
            WHERE enc.NoPlanilla = ?";

    $stmt = $enlace->prepare($query);
    $stmt->bind_param("i", $numeroPlanilla);

    if (!$stmt->execute()) {
        throw new Exception("Error en la consulta: " . $stmt->error);
    }

    // Usar bind_result para obtener los datos (compatible con todas las versiones de PHP)
    $stmt->bind_result(
        $IdEncabPedido,
        $NoPlanilla,
        $numero_planilla_formateado,
        $IdConductor,
        $IdAyudante,
        $Placa,
        $Precinto,
        $Factura,
        $numero_factura_formateado,
        $Estado,
        $fecha_solicitud,
        $fecha_entrega,
        $PO_Cliente,
        $AWB,
        $AWB_HIJA,
        $AWB_NIETA,
        $TotalPiezas,
        $EquivalenciaFulles,
        $TotalTallos,
        $ValorVenta,
        $IVA,
        $TotalVenta,
        $cliente_nombre,
        $aerolinea_nombre,
        $agencia_nombre,
        $conductor_nombre,
        $ayudante_nombre
    );

    if (!$stmt->fetch()) {
        throw new Exception("No se encontró la planilla con número: $numeroPlanilla");
    }

    // Construir el array de la planilla
    $planilla = array(
        'IdEncabPedido' => $IdEncabPedido,
        'NoPlanilla' => $NoPlanilla,
        'numero_planilla_formateado' => $numero_planilla_formateado,
        'IdConductor' => $IdConductor,
        'IdAyudante' => $IdAyudante,
        'Placa' => $Placa,
        'Precinto' => $Precinto,
        'Factura' => $Factura,
        'numero_factura_formateado' => $numero_factura_formateado,
        'Estado' => $Estado,
        'fecha_solicitud' => $fecha_solicitud,
        'fecha_entrega' => $fecha_entrega,
        'PO_Cliente' => $PO_Cliente,
        'AWB' => $AWB,
        'AWB_HIJA' => $AWB_HIJA,
        'AWB_NIETA' => $AWB_NIETA,
        'TotalPiezas' => $TotalPiezas,
        'EquivalenciaFulles' => $EquivalenciaFulles,
        'TotalTallos' => $TotalTallos,
        'ValorVenta' => $ValorVenta,
        'IVA' => $IVA,
        'TotalVenta' => $TotalVenta,
        'cliente_nombre' => $cliente_nombre,
        'aerolinea_nombre' => $aerolinea_nombre,
        'agencia_nombre' => $agencia_nombre,
        'conductor_nombre' => $conductor_nombre,
        'ayudante_nombre' => $ayudante_nombre
    );

    // Formatear datos adicionales
    $planilla['fecha_generacion'] = date('d/m/Y');
    $planilla['hora_generacion'] = date('H:i:s');

    echo json_encode([
        'success' => true,
        'message' => 'Planilla encontrada',
        'planilla' => $planilla
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$enlace->close();
