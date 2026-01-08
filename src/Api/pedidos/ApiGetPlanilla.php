<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

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
                enc.TotalPiezas,
                enc.EquivalenciaFulles,
                enc.TotalTallos,
                enc.ValorVenta,
                enc.IVA,
                enc.TotalVenta,
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

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("No se encontró la planilla con número: $numeroPlanilla");
    }

    $planilla = $result->fetch_assoc();

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
