<?php
// src/Api/pagosProveedores/ApiBuscarPagosProveedores.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$filtros = $data ?? [];

try {
    // Construir consulta dinámica con filtros
    $whereConditions = ["pp.Anulado = 0"];
    $params = [];
    $types = "";

    // Filtro por número de pago (IdEncabPagoProveedor)
    if (!empty($filtros['numeroPago'])) {
        $whereConditions[] = "pp.IdEncabPagoProveedor = ?";
        $params[] = intval($filtros['numeroPago']);
        $types .= "i";
    }

    // Filtro por proveedor
    if (!empty($filtros['idProveedor'])) {
        $whereConditions[] = "pp.IdProveedor = ?";
        $params[] = intval($filtros['idProveedor']);
        $types .= "i";
    }

    // Filtro por fecha desde
    if (!empty($filtros['fechaDesde'])) {
        $whereConditions[] = "pp.FechaPago >= ?";
        $params[] = $filtros['fechaDesde'];
        $types .= "s";
    }

    // Filtro por fecha hasta
    if (!empty($filtros['fechaHasta'])) {
        $whereConditions[] = "pp.FechaPago <= ?";
        $params[] = $filtros['fechaHasta'];
        $types .= "s";
    }

    // Filtro por medio de pago
    if (!empty($filtros['idMedioPago'])) {
        $whereConditions[] = "pp.MedioPago = ?";
        $params[] = intval($filtros['idMedioPago']);
        $types .= "i";
    }

    $whereClause = implode(" AND ", $whereConditions);

    // Consulta principal
    $query = "
        SELECT 
            pp.IdEncabPagoProveedor as idPagoProveedor,
            pp.IdEncabPagoProveedor as numeroPago,
            pp.FechaPago,
            pp.IdProveedor,
            p.Proveedor as proveedor,
            -- Cantidad de compras incluidas en el pago
            COALESCE((SELECT COUNT(*) FROM SAS_DetPagoProveedor dpp_cnt
                      WHERE dpp_cnt.IdEncabPagoProveedor = pp.IdEncabPagoProveedor
                      AND dpp_cnt.Anulado = 0), 0) as cantidadCompras,
            -- Valor total del pago (suma de todas las compras pagadas)
            COALESCE((SELECT SUM(dpp.ValorPago) FROM SAS_DetPagoProveedor dpp
                      WHERE dpp.IdEncabPagoProveedor = pp.IdEncabPagoProveedor
                      AND dpp.Anulado = 0), 0) as valorPago,
            pp.IdMoneda,
            m.Moneda as moneda,
            pp.TRM,
            pp.MedioPago as idMedioPago,
            mp.Medio as medioPago,
            pp.Observaciones,
            pp.Anulado
            
        FROM SAS_EncabPagoProveedor pp
        INNER JOIN GEN_Proveedores p ON pp.IdProveedor = p.IdProveedor
        INNER JOIN GEN_Monedas m ON pp.IdMoneda = m.IdMoneda
        LEFT JOIN GEN_MedioPagos mp ON pp.MedioPago = mp.IdMedioPago
        WHERE $whereClause
        ORDER BY pp.FechaPago DESC, pp.IdEncabPagoProveedor DESC
        LIMIT 100
    ";

    $stmt = $enlace->prepare($query);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    // Bind parameters si hay
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();

    // Vincular resultados
    $stmt->bind_result(
        $idPagoProveedor,
        $numeroPago,
        $fechaPago,
        $idProveedor,
        $proveedor,
        $cantidadCompras,
        $valorPago,
        $idMoneda,
        $moneda,
        $trm,
        $idMedioPago,
        $medioPago,
        $observaciones,
        $anulado
    );

    $pagos = [];

    // Obtener resultados
    while ($stmt->fetch()) {
        $pagos[] = [
            'idPagoProveedor' => $idPagoProveedor,
            'numeroPago' => 'PAG-PROV-' . str_pad($numeroPago, 6, '0', STR_PAD_LEFT),
            'fechaPago' => $fechaPago,
            'idProveedor' => $idProveedor,
            'proveedor' => $proveedor,
            'cantidadCompras' => intval($cantidadCompras),
            'idMoneda' => $idMoneda,
            'moneda' => $moneda,
            'trm' => floatval($trm),
            'idMedioPago' => $idMedioPago,
            'medioPago' => $medioPago,
            'valorPago' => floatval($valorPago),
            'observaciones' => $observaciones,
            'anulado' => $anulado
        ];
    }

    $stmt->close();

    // Obtener total de registros para paginación
    $queryCount = "SELECT COUNT(*) as total FROM SAS_EncabPagoProveedor pp WHERE $whereClause";
    $stmtCount = $enlace->prepare($queryCount);
    if (!$stmtCount) {
        throw new Exception("Error preparando consulta de conteo: " . $enlace->error);
    }

    if (!empty($params)) {
        $stmtCount->bind_param($types, ...$params);
    }

    $stmtCount->execute();
    $stmtCount->bind_result($total);
    $stmtCount->fetch();
    $stmtCount->close();

    echo json_encode([
        'success' => true,
        'pagos' => $pagos,
        'total' => $total,
        'filtros' => $filtros
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'pagos' => [],
        'total' => 0
    ]);
}

$enlace->close();
