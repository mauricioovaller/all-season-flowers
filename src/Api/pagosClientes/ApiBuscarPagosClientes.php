<?php
// src/Api/pagosClientes/ApiBuscarPagosClientes.php
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

$filtros = $data ?? [];

try {
    // Construir consulta dinámica con filtros
    $whereConditions = ["pc.Anulado = 0"];
    $params = [];
    $types = "";

    // Filtro por número de pago (usando IdEncabPagoCliente)
    if (!empty($filtros['numeroPago'])) {
        $whereConditions[] = "pc.IdEncabPagoCliente = ?";
        $params[] = intval($filtros['numeroPago']);
        $types .= "i";
    }

    // Filtro por cliente
    if (!empty($filtros['idCliente'])) {
        $whereConditions[] = "pc.IdCliente = ?";
        $params[] = intval($filtros['idCliente']);
        $types .= "i";
    }

    // Filtro por fecha desde
    if (!empty($filtros['fechaDesde'])) {
        $whereConditions[] = "pc.Fecha >= ?";
        $params[] = $filtros['fechaDesde'];
        $types .= "s";
    }

    // Filtro por fecha hasta
    if (!empty($filtros['fechaHasta'])) {
        $whereConditions[] = "pc.Fecha <= ?";
        $params[] = $filtros['fechaHasta'];
        $types .= "s";
    }

    // Filtro por medio de pago
    if (!empty($filtros['idMedioPago'])) {
        $whereConditions[] = "pc.IdMedioPago = ?";
        $params[] = intval($filtros['idMedioPago']);
        $types .= "i";
    }

    // Filtro por número de factura
    if (!empty($filtros['numeroFactura'])) {
        $whereConditions[] = "EXISTS (
            SELECT 1 FROM SAS_DetPagoCliente dpc
            INNER JOIN SAS_EncabPedido ep ON dpc.Invoice = ep.Factura
            WHERE dpc.IdEncabPagoCliente = pc.IdEncabPagoCliente
            AND ep.Factura LIKE ?
        )";
        $params[] = "%" . $filtros['numeroFactura'] . "%";
        $types .= "s";
    }

    $whereClause = implode(" AND ", $whereConditions);

    // Consulta principal para encabezados de pagos
    $query = "
        SELECT 
            pc.IdEncabPagoCliente,
            pc.IdEncabPagoCliente AS numeroPago,
            pc.Fecha,
            pc.IdCliente,
            c.NOMBRE as cliente,
            pc.IdMoneda,
            m.Moneda as moneda,
            pc.TRM,
            pc.MedioPago,
            mp.Medio as medioPago,
            pc.CostoTransferencia,
            pc.Observaciones,
            pc.Anulado
        FROM SAS_EncabPagoCliente pc
        INNER JOIN GEN_Clientes c ON pc.IdCliente = c.IdCliente
        INNER JOIN GEN_Monedas m ON pc.IdMoneda = m.IdMoneda
        LEFT JOIN GEN_MedioPagos mp ON pc.MedioPago = mp.IdMedioPago
        WHERE $whereClause
        ORDER BY pc.Fecha DESC, pc.IdEncabPagoCliente DESC
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
        $IdEncabPagoCliente,
        $numeroPago,
        $Fecha,
        $IdCliente,
        $cliente,
        $IdMoneda,
        $moneda,
        $TRM,
        $MedioPago,
        $medioPago,
        $CostoTransferencia,
        $Observaciones,
        $Anulado
    );

    $pagos = [];
    $idPagos = [];

    while ($stmt->fetch()) {
        $pagos[$IdEncabPagoCliente] = [
            'idEncabPagoCliente' => $IdEncabPagoCliente,
            'numeroPago' => $numeroPago,
            'fecha' => $Fecha,
            'idCliente' => $IdCliente,
            'cliente' => $cliente,
            'idMoneda' => $IdMoneda,
            'moneda' => $moneda,
            'trm' => floatval($TRM),
            'idMedioPago' => $MedioPago,
            'medioPago' => $medioPago,
            'costoTransferencia' => floatval($CostoTransferencia),
            'observaciones' => $Observaciones,
            'anulado' => $Anulado,
            'facturas' => [],
            'valorTotalPago' => 0
        ];
        $idPagos[] = $IdEncabPagoCliente;
    }

    $stmt->close();

    // Si hay pagos, obtener las facturas asociadas
    if (!empty($idPagos)) {
        $placeholders = implode(',', array_fill(0, count($idPagos), '?'));
        $typesFacturas = str_repeat('i', count($idPagos));

        $queryFacturas = "
            SELECT 
                dpc.IdEncabPagoCliente,
                dpc.Invoice,
                dpc.ValorPago,
                ep.Factura as numeroFactura,
                ep.FechaEntrega as fechaFactura,
                -- Calcular total de la factura
                COALESCE((
                    SELECT SUM(
                        CASE 
                            WHEN dp.IdUnidad = 4 THEN de.Cantidad * (dp.Tallos_Ramo * dp.Ramos_Caja) * dp.Precio_Venta
                            ELSE de.Cantidad * dp.Ramos_Caja * dp.Precio_Venta
                        END
                    )
                    FROM SAS_DetEmpaque de
                    INNER JOIN SAS_DetProducto dp ON de.IdDetEmpaque = dp.IdDetEmpaque
                    WHERE de.IdEncabPedido = ep.IdEncabPedido
                ), 0) as totalFactura,
                -- Calcular saldo pendiente (total - devoluciones - pagos realizados)
                COALESCE((
                    SELECT SUM(
                        CASE 
                            WHEN dp.IdUnidad = 4 THEN de.Cantidad * (dp.Tallos_Ramo * dp.Ramos_Caja) * dp.Precio_Venta
                            ELSE de.Cantidad * dp.Ramos_Caja * dp.Precio_Venta
                        END
                    )
                    FROM SAS_DetEmpaque de
                    INNER JOIN SAS_DetProducto dp ON de.IdDetEmpaque = dp.IdDetEmpaque
                    WHERE de.IdEncabPedido = ep.IdEncabPedido
                ), 0)
                - COALESCE((
                    SELECT SUM(
                        (COALESCE(dp2.TallosDevolucion, 0) * COALESCE(dp2.Precio_Venta, 0)) +
                        COALESCE(dp2.Flete, 0) +
                        COALESCE(dp2.Fumigacion, 0) +
                        COALESCE(dp2.Otros, 0)
                    )
                    FROM SAS_DetEmpaque de2
                    INNER JOIN SAS_DetProducto dp2 ON de2.IdDetEmpaque = dp2.IdDetEmpaque
                    WHERE de2.IdEncabPedido = ep.IdEncabPedido
                    AND COALESCE(dp2.TallosDevolucion, 0) > 0
                ), 0)
                - COALESCE((
                    SELECT SUM(dpc2.ValorPago)
                    FROM SAS_DetPagoCliente dpc2
                    WHERE dpc2.Invoice = ep.Factura
                    AND dpc2.Anulado = 0
                ), 0) as saldoFactura
            FROM SAS_DetPagoCliente dpc
            INNER JOIN SAS_EncabPedido ep ON dpc.Invoice = ep.Factura
            WHERE dpc.IdEncabPagoCliente IN ($placeholders)
            AND dpc.Anulado = 0
            ORDER BY dpc.IdEncabPagoCliente, dpc.IdDetPagoCliente
        ";

        $stmtFact = $enlace->prepare($queryFacturas);
        if (!$stmtFact) {
            throw new Exception("Error preparando consulta de facturas: " . $enlace->error);
        }

        $stmtFact->bind_param($typesFacturas, ...$idPagos);
        $stmtFact->execute();

        $stmtFact->bind_result(
            $IdEncabPagoClienteFact,
            $Invoice,
            $ValorPago,
            $numeroFactura,
            $fechaFactura,
            $totalFactura,
            $saldoFactura
        );

        while ($stmtFact->fetch()) {
            if (isset($pagos[$IdEncabPagoClienteFact])) {
                $pagos[$IdEncabPagoClienteFact]['facturas'][] = [
                    'invoice' => $Invoice,
                    'numeroFactura' => $numeroFactura,
                    'fechaFactura' => $fechaFactura,
                    'valorPago' => floatval($ValorPago),
                    'totalFactura' => floatval($totalFactura),
                    'saldoFactura' => floatval($saldoFactura)
                ];
                $pagos[$IdEncabPagoClienteFact]['valorTotalPago'] += floatval($ValorPago);
            }
        }

        $stmtFact->close();
    }

    // Convertir array asociativo a lista
    $pagosLista = array_values($pagos);

    // Obtener total de registros para paginación
    $queryCount = "SELECT COUNT(*) as total FROM SAS_EncabPagoCliente pc WHERE $whereClause";
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
        'pagos' => $pagosLista,
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
