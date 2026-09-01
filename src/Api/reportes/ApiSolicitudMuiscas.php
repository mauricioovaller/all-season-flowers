<?php
// src/Api/reportes/ApiSolicitudMuiscas.php - Solicitud Muiscas
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['fechaInicio']) || !isset($data['fechaFin'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos. Se requiere fechaInicio y fechaFin"]);
    exit;
}

$fechaInicio = $data['fechaInicio'];
$fechaFin    = $data['fechaFin'];

if ($fechaInicio > $fechaFin) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "La fecha inicial no puede ser mayor a la fecha final"]);
    exit;
}

try {
    // Consulta para obtener pedidos con Factura, dentro del rango de FechaEntrega
    // Agrupados por Cliente, Guía Master, Agencia, Aerolínea
    $sql = "
        SELECT
            COALESCE(cli.Nombre, '') AS cliente,
            COALESCE(ep.AWB, '') AS guiaMaster,
            COALESCE(ag.NOMAGENCIA, '') AS agencia,
            COALESCE(aer.NOMAEROLINEA, '') AS aerolinea
        FROM SAS_EncabPedido ep
        LEFT JOIN GEN_Clientes cli ON ep.IdCliente = cli.IdCliente
        LEFT JOIN GEN_Agencias ag ON ep.IdAgencia = ag.IdAgencia
        LEFT JOIN GEN_Aerolineas aer ON ep.IdAerolinea = aer.IdAerolinea
        WHERE ep.Anulado = 0
          AND ep.Factura > 0
          AND ep.Factura IS NOT NULL
          AND ep.FechaEntrega BETWEEN ? AND ?
        ORDER BY cli.Nombre, ep.AWB, ag.NOMAGENCIA, aer.NOMAEROLINEA
    ";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $stmt->bind_result($cliente, $guiaMaster, $agencia, $aerolinea);

    $solicitudes = [];
    while ($stmt->fetch()) {
        $solicitudes[] = [
            'cliente' => $cliente,
            'guiaMaster' => $guiaMaster,
            'agencia' => $agencia,
            'aerolinea' => $aerolinea
        ];
    }

    $stmt->close();

    echo json_encode([
        "success" => true,
        "solicitudes" => $solicitudes,
        "total" => count($solicitudes),
        "fechaInicio" => $fechaInicio,
        "fechaFin" => $fechaFin
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener solicitud muiscas: " . $e->getMessage()
    ]);
}

$enlace->close();
