<?php
// src/Api/reportes/ApiPlanillaDespacho.php - Planilla Entrega Despachos Aeropuerto
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
    $sql = "
        SELECT
            COALESCE(aer.NOMAEROLINEA, '') AS aerolinea,
            COALESCE(ag.NOMAGENCIA, '')    AS agencia,
            COALESCE(ep.AWB, '')           AS guiaMaster,
            COALESCE(ep.AWB_HIJA, '')      AS guiaHija,
            COALESCE(cli.Nombre, '')       AS cliente,
            COALESCE(SUM(CASE WHEN te.Abreviatura = 'FB' THEN de.Cantidad ELSE 0 END), 0) AS fb,
            COALESCE(SUM(CASE WHEN te.Abreviatura = 'HB' THEN de.Cantidad ELSE 0 END), 0) AS hb,
            COALESCE(SUM(CASE WHEN te.Abreviatura = 'QB' THEN de.Cantidad ELSE 0 END), 0) AS qb,
            COALESCE(SUM(CASE WHEN te.Abreviatura = 'EB' THEN de.Cantidad ELSE 0 END), 0) AS eb,
            COALESCE(SUM(de.Cantidad * te.EquivFull), 0)                                   AS fulles
        FROM SAS_EncabPedido ep
        LEFT JOIN GEN_Aerolineas aer  ON ep.IdAerolinea  = aer.IdAerolinea
        LEFT JOIN GEN_Agencias   ag   ON ep.IdAgencia    = ag.IdAgencia
        LEFT JOIN GEN_Clientes   cli  ON ep.IdCliente    = cli.IdCliente
        LEFT JOIN SAS_DetEmpaque de   ON ep.IdEncabPedido = de.IdEncabPedido AND de.Anulado = 0
        LEFT JOIN GEN_TipoEmpaque te  ON de.IdTipoEmpaque = te.IdTipoEmpaque
        WHERE ep.Anulado = 0
          AND ep.Factura > 0
          AND ep.FechaEntrega BETWEEN ? AND ?
        GROUP BY aer.NOMAEROLINEA, ag.NOMAGENCIA, ep.AWB, ep.AWB_HIJA, cli.Nombre
        ORDER BY aer.NOMAEROLINEA, ag.NOMAGENCIA, cli.Nombre
    ";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $stmt->bind_result(
        $aerolinea,
        $agencia,
        $guiaMaster,
        $guiaHija,
        $cliente,
        $fb,
        $hb,
        $qb,
        $eb,
        $fulles
    );

    $despachos = [];
    $totFb = 0;
    $totHb = 0;
    $totQb = 0;
    $totEb = 0;
    $totFulles = 0.0;

    while ($stmt->fetch()) {
        $despachos[] = [
            "aerolinea"  => $aerolinea,
            "agencia"    => $agencia,
            "guiaMaster" => $guiaMaster,
            "guiaHija"   => $guiaHija,
            "cliente"    => $cliente,
            "fb"         => (int)$fb,
            "hb"         => (int)$hb,
            "qb"         => (int)$qb,
            "eb"         => (int)$eb,
            "fulles"     => round((float)$fulles, 2),
        ];
        $totFb     += (int)$fb;
        $totHb     += (int)$hb;
        $totQb     += (int)$qb;
        $totEb     += (int)$eb;
        $totFulles += (float)$fulles;
    }
    $stmt->close();

    echo json_encode([
        "success"   => true,
        "despachos" => $despachos,
        "totales"   => [
            "fb"     => $totFb,
            "hb"     => $totHb,
            "qb"     => $totQb,
            "eb"     => $totEb,
            "fulles" => round($totFulles, 2),
        ],
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
