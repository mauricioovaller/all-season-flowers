<?php
// src/Api/reportes/ApiIngresosRecibidos.php - Consolidado de Ingresos Recibidos (pagos de clientes)
// Muestra un renglón por factura pagada, con el costo de transferencia prorrateado y el neto recibido.
// SQL validado contra la base de datos real (describe_table + query_db).
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

// Filtros opcionales
$idCliente   = !empty($data['idCliente']) ? intval($data['idCliente']) : 0;
$idMedioPago = !empty($data['idMedioPago']) ? intval($data['idMedioPago']) : 0;

/**
 * Devuelve el código corto de la moneda (USD, COP, EUR, ...)
 */
function monedaCorta($moneda) {
    if (mb_stripos($moneda, 'peso colombiano') !== false) return 'COP';
    if (mb_stripos($moneda, 'dólar') !== false || mb_stripos($moneda, 'usd') !== false) return 'USD';
    // Extraer código entre paréntesis (ej: "Euro (EUR)") o primer token
    if (preg_match('/\(([A-Z]{3})\)/i', $moneda, $m)) return strtoupper($m[1]);
    $tok = trim(mb_substr($moneda, 0, 3));
    return $tok !== '' ? strtoupper($tok) : 'OTR';
}

try {
    // Construir WHERE dinámico
    $whereConditions = [
        "dpc.Anulado = 0",
        "pc.Anulado = 0",
        "pc.Fecha BETWEEN CONCAT(?, ' 00:00:00') AND CONCAT(?, ' 23:59:59')"
    ];
    $params = [$fechaInicio, $fechaFin];
    $types  = "ss";

    if ($idCliente > 0) {
        $whereConditions[] = "pc.IdCliente = ?";
        $params[] = $idCliente;
        $types .= "i";
    }
    if ($idMedioPago > 0) {
        $whereConditions[] = "pc.MedioPago = ?";
        $params[] = $idMedioPago;
        $types .= "i";
    }

    $whereClause = implode(" AND ", $whereConditions);

    $sql = "
        SELECT
            pc.IdEncabPagoCliente AS idPago,
            DATE_FORMAT(pc.Fecha, '%Y-%m-%d') AS fecha,
            c.NOMBRE AS cliente,
            mp.Medio AS medioPago,
            m.Moneda AS moneda,
            m.IdMoneda AS idMoneda,
            dpc.Invoice AS numeroFactura,
            ROUND(dpc.ValorPago, 2) AS valorPago,
            ROUND(pc.CostoTransferencia, 2) AS costoTransferencia
        FROM SAS_DetPagoCliente dpc
        INNER JOIN SAS_EncabPagoCliente pc ON dpc.IdEncabPagoCliente = pc.IdEncabPagoCliente
        INNER JOIN GEN_Clientes c ON pc.IdCliente = c.IdCliente
        LEFT JOIN GEN_MedioPagos mp ON pc.MedioPago = mp.IdMedioPago
        INNER JOIN GEN_Monedas m ON pc.IdMoneda = m.IdMoneda
        WHERE $whereClause
        ORDER BY pc.Fecha, pc.IdEncabPagoCliente, dpc.IdDetPagoCliente
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
        $idPago,
        $fecha,
        $cliente,
        $medioPago,
        $moneda,
        $idMoneda,
        $numeroFactura,
        $valorPago,
        $costoTransferencia
    );

    // Acumular filas por pago para poder prorratear el costo de transferencia
    $rows = [];
    $pagoTotales = [];
    while ($stmt->fetch()) {
        $rows[] = [
            'idPago'              => intval($idPago),
            'fecha'               => $fecha,
            'cliente'             => $cliente,
            'medioPago'           => $medioPago ?: '',
            'moneda'              => $moneda,
            'idMoneda'            => intval($idMoneda),
            'numeroFactura'       => intval($numeroFactura),
            'valorPago'           => floatval($valorPago),
            'costoTransferencia'  => floatval($costoTransferencia)
        ];
        $pagoTotales[intval($idPago)] = ($pagoTotales[intval($idPago)] ?? 0) + floatval($valorPago);
    }
    $stmt->close();

    $registros = [];
    $totales = ['porMoneda' => [], 'cantidadRegistros' => 0, 'cantidadPagos' => 0];
    $pagosSet = [];

    foreach ($rows as $r) {
        $totalPago  = $pagoTotales[$r['idPago']] ?? 0;
        // Prorrateo proporcional del costo de transferencia según el valor pagado de la factura
        $factor = $totalPago > 0 ? ($r['valorPago'] / $totalPago) : 0;
        $costoProrrateado = round($r['costoTransferencia'] * $factor, 2);
        $netoRecibido     = round($r['valorPago'] - $costoProrrateado, 2);

        $monedaCorta = monedaCorta($r['moneda']);

        $registros[] = [
            'numeroPago'          => 'PAG-CLI-' . str_pad($r['idPago'], 6, '0', STR_PAD_LEFT),
            'idPago'              => $r['idPago'],
            'fecha'               => $r['fecha'],
            'cliente'             => $r['cliente'],
            'medioPago'           => $r['medioPago'],
            'moneda'              => $r['moneda'],
            'monedaCorta'         => $monedaCorta,
            'numeroFactura'       => $r['numeroFactura'],
            'valorPago'           => $r['valorPago'],
            'costoTransferencia'  => $costoProrrateado,
            'netoRecibido'        => $netoRecibido
        ];

        if (!isset($totales['porMoneda'][$monedaCorta])) {
            $totales['porMoneda'][$monedaCorta] = [
                'valorPago'          => 0,
                'costoTransferencia' => 0,
                'netoRecibido'       => 0,
                'cantidad'           => 0
            ];
        }
        $totales['porMoneda'][$monedaCorta]['valorPago']          += $r['valorPago'];
        $totales['porMoneda'][$monedaCorta]['costoTransferencia'] += $costoProrrateado;
        $totales['porMoneda'][$monedaCorta]['netoRecibido']       += $netoRecibido;
        $totales['porMoneda'][$monedaCorta]['cantidad']++;

        $pagosSet[$r['idPago']] = true;
        $totales['cantidadRegistros']++;
    }
    $totales['cantidadPagos'] = count($pagosSet);

    // Redondear totales por moneda
    foreach ($totales['porMoneda'] as &$m) {
        $m['valorPago']          = round($m['valorPago'], 2);
        $m['costoTransferencia'] = round($m['costoTransferencia'], 2);
        $m['netoRecibido']       = round($m['netoRecibido'], 2);
    }
    unset($m);

    echo json_encode([
        "success"      => true,
        "registros"    => $registros,
        "totales"      => $totales,
        "fechaInicio"  => $fechaInicio,
        "fechaFin"     => $fechaFin
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener ingresos recibidos: " . $e->getMessage()
    ]);
}

if (isset($enlace)) $enlace->close();
