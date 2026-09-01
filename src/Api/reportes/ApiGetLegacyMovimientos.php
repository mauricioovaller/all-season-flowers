<?php
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

$tipo      = isset($data['tipo']) ? $data['tipo'] : '';
$idEntidad = isset($data['idEntidad']) ? intval($data['idEntidad']) : 0;
$soloSaldo = isset($data['soloSaldo']) ? (bool)$data['soloSaldo'] : false;

try {
    $where = "WHERE 1=1";
    $params = [];
    $types = "";

    if ($tipo === 'C' || $tipo === 'P') {
        $where .= " AND leg.Tipo = ?";
        $params[] = $tipo;
        $types .= "s";
    }
    if ($idEntidad > 0) {
        $where .= " AND leg.IdEntidad = ?";
        $params[] = $idEntidad;
        $types .= "i";
    }
    if ($soloSaldo) {
        $where .= " AND (leg.Valor - leg.Credito - leg.Pago) > 0";
    }

    $sql = "
        SELECT
            leg.IdLegacyMovimiento,
            leg.Tipo,
            leg.IdEntidad,
            CASE WHEN leg.Tipo = 'C' THEN c.NOMBRE ELSE p.Proveedor END as NombreEntidad,
            leg.Fecha,
            leg.NumeroDocumento,
            leg.Guia,
            leg.Valor,
            leg.Credito,
            leg.Pago,
            (leg.Valor - leg.Credito - leg.Pago) as Saldo,
            COALESCE(leg.IdMoneda, 1) as IdMoneda,
            m.Moneda,
            COALESCE(leg.TRM, 1) as TRM,
            leg.Anulado,
            leg.FechaCreacion
        FROM SAS_LegacyMovimientos leg
        LEFT JOIN GEN_Clientes c ON leg.Tipo = 'C' AND leg.IdEntidad = c.IdCliente
        LEFT JOIN GEN_Proveedores p ON leg.Tipo = 'P' AND leg.IdEntidad = p.IdProveedor
        LEFT JOIN GEN_Monedas m ON leg.IdMoneda = m.IdMoneda
        $where
        ORDER BY leg.Fecha ASC, leg.NumeroDocumento ASC
    ";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $stmt->bind_result(
        $id, $tipoR, $idEnt, $nombreEnt, $fecha, $numDoc, $guia,
        $valor, $credito, $pago, $saldo, $idMoneda, $moneda, $trm, $anulado, $fechaCreacion
    );

    $movimientos = [];
    while ($stmt->fetch()) {
        $movimientos[] = [
            'idLegacyMovimiento' => intval($id),
            'tipo'               => $tipoR,
            'idEntidad'          => intval($idEnt),
            'nombreEntidad'      => $nombreEnt,
            'fecha'              => $fecha,
            'numeroDocumento'    => $numDoc,
            'guia'               => $guia,
            'valor'              => floatval($valor),
            'credito'            => floatval($credito),
            'pago'               => floatval($pago),
            'saldo'              => floatval($saldo),
            'idMoneda'           => intval($idMoneda),
            'moneda'             => $moneda,
            'trm'                => floatval($trm),
            'anulado'            => intval($anulado)
        ];
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'movimientos' => $movimientos,
        'total' => count($movimientos)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'movimientos' => [],
        'total' => 0
    ]);
}

$enlace->close();
