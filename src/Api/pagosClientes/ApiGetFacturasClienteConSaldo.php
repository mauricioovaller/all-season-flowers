<?php
// src/Api/pagosClientes/ApiGetFacturasClienteConSaldo.php
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

if (!$data || !isset($data['idCliente'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    exit;
}

$idCliente = intval($data['idCliente']);
// Si se pasa idPagoExcluir, ese pago se excluye del cálculo de saldo
// (necesario para edición: las facturas del pago actual vuelven a mostrar su saldo real)
$idPagoExcluir = isset($data['idPagoExcluir']) ? intval($data['idPagoExcluir']) : 0;
$condPagoExcluir = $idPagoExcluir > 0 ? " AND epc.IdEncabPagoCliente != $idPagoExcluir" : "";

try {
    // Consulta para obtener facturas con saldo pendiente (actuales + legacy)
    $query = "
        (
            SELECT 
                ep.IdEncabPedido as idFactura,
                ep.Factura as numeroFactura,
                CONCAT('FAC-', LPAD(ep.Factura, 6, '0')) as numeroFacturaFormateado,
                ep.FechaEntrega as fechaFactura,
                c.NOMBRE as cliente,
                ep.IdMoneda as idMoneda,
                m.Moneda as moneda,
                ep.TRM as trm,
                
                -- VALOR FACTURA
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
                    AND de.Anulado = 0
                    AND dp.Anulado = 0
                ), 0) as valorFactura,
                
                -- VALOR DEVOLUCIONES
                COALESCE((
                    SELECT SUM(
                        (COALESCE(dp.TallosDevolucion, 0) * COALESCE(dp.Precio_Venta, 0)) + 
                        COALESCE(dp.Flete, 0) + 
                        COALESCE(dp.Fumigacion, 0) + 
                        COALESCE(dp.Otros, 0)
                    )
                    FROM SAS_DetEmpaque de
                    INNER JOIN SAS_DetProducto dp ON de.IdDetEmpaque = dp.IdDetEmpaque
                    WHERE de.IdEncabPedido = ep.IdEncabPedido
                    AND de.Anulado = 0
                    AND dp.Anulado = 0
                    AND COALESCE(dp.TallosDevolucion, 0) > 0
                ), 0) as valorDevolucion,
                
                -- VALOR PAGOS
                COALESCE((
                    SELECT SUM(dpc.ValorPago)
                    FROM SAS_EncabPagoCliente epc
                    INNER JOIN SAS_DetPagoCliente dpc ON epc.IdEncabPagoCliente = dpc.IdEncabPagoCliente
                    WHERE dpc.Invoice = ep.Factura
                    AND epc.Anulado = 0{$condPagoExcluir}
                ), 0) as valorPagado,
                
                -- SALDO PENDIENTE
                (
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
                        AND de.Anulado = 0
                        AND dp.Anulado = 0
                    ), 0)
                    - COALESCE((
                        SELECT SUM(
                            (COALESCE(dp.TallosDevolucion, 0) * COALESCE(dp.Precio_Venta, 0)) + 
                            COALESCE(dp.Flete, 0) + 
                            COALESCE(dp.Fumigacion, 0) + 
                            COALESCE(dp.Otros, 0)
                        )
                        FROM SAS_DetEmpaque de
                        INNER JOIN SAS_DetProducto dp ON de.IdDetEmpaque = dp.IdDetEmpaque
                        WHERE de.IdEncabPedido = ep.IdEncabPedido
                        AND de.Anulado = 0
                        AND dp.Anulado = 0
                        AND COALESCE(dp.TallosDevolucion, 0) > 0
                    ), 0)
                    - COALESCE((
                        SELECT SUM(dpc.ValorPago)
                        FROM SAS_EncabPagoCliente epc
                        INNER JOIN SAS_DetPagoCliente dpc ON epc.IdEncabPagoCliente = dpc.IdEncabPagoCliente
                        WHERE dpc.Invoice = ep.Factura
                        AND epc.Anulado = 0{$condPagoExcluir}
                    ), 0)
                ) as saldoPendiente,
                
                0 as esLegacy
                
            FROM SAS_EncabPedido ep
            INNER JOIN GEN_Clientes c ON ep.IdCliente = c.IdCliente
            LEFT JOIN GEN_Monedas m ON ep.IdMoneda = m.IdMoneda
            WHERE ep.IdCliente = ?
            AND ep.Factura IS NOT NULL
            AND ep.Factura > 0
            AND ep.Anulado = 0
            HAVING saldoPendiente > 0
        )
        UNION ALL
        (
            SELECT
                leg.IdLegacyMovimiento as idFactura,
                CAST(leg.NumeroDocumento AS UNSIGNED) as numeroFactura,
                CONCAT('LEG-', leg.NumeroDocumento) as numeroFacturaFormateado,
                leg.Fecha as fechaFactura,
                c.NOMBRE as cliente,
                COALESCE(leg.IdMoneda, 1) as idMoneda,
                COALESCE(m.Moneda, 'Sin moneda') as moneda,
                COALESCE(leg.TRM, 1) as trm,
                leg.Valor as valorFactura,
                leg.Credito as valorDevolucion,
                leg.Pago as valorPagado,
                (leg.Valor - leg.Credito - leg.Pago) as saldoPendiente,
                1 as esLegacy
            FROM SAS_LegacyMovimientos leg
            INNER JOIN GEN_Clientes c ON leg.IdEntidad = c.IdCliente
            LEFT JOIN GEN_Monedas m ON leg.IdMoneda = m.IdMoneda
            WHERE leg.Tipo = 'C'
              AND leg.IdEntidad = ?
              AND leg.Anulado = 0
            HAVING saldoPendiente > 0
        )
        ORDER BY fechaFactura DESC
    ";

    $stmt = $enlace->prepare($query);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("ii", $idCliente, $idCliente);
    $stmt->execute();

    // Vincular resultados
    $stmt->bind_result(
        $idFactura,
        $numeroFactura,
        $numeroFacturaFormateado,
        $fechaFactura,
        $cliente,
        $idMoneda,
        $moneda,
        $trm,
        $valorFactura,
        $valorDevolucion,
        $valorPagado,
        $saldoPendiente,
        $esLegacy
    );

    $facturas = [];

    while ($stmt->fetch()) {
        $facturas[] = [
            'idFactura' => $idFactura,
            'numeroFactura' => $numeroFactura,
            'numeroFacturaFormateado' => $numeroFacturaFormateado,
            'fechaFactura' => $fechaFactura,
            'cliente' => $cliente,
            'idMoneda' => $idMoneda,
            'moneda' => $moneda,
            'trm' => $trm,
            'valorFactura' => floatval($valorFactura),
            'valorDevolucion' => floatval($valorDevolucion),
            'valorPagado' => floatval($valorPagado),
            'saldoPendiente' => floatval($saldoPendiente),
            'esLegacy' => (bool)$esLegacy
        ];
    }

    $stmt->close();

    echo json_encode([
        'success' => true,
        'facturas' => $facturas,
        'total' => count($facturas)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'facturas' => [],
        'total' => 0
    ]);
}

$enlace->close();
