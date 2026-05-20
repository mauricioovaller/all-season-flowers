<?php
// src/Api/pagosClientes/ApiGetFacturasClienteConSaldo.php
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
    // Consulta corregida para obtener facturas con saldo pendiente
    // Saldo = Valor Factura - Valor Devolución - Suma(Pagos Previos)
    // Usando la estructura real de tablas y campos
    $query = "
        SELECT 
            ep.IdEncabPedido as idFactura,
            ep.Factura as numeroFactura,
            CONCAT('FAC-', LPAD(ep.Factura, 6, '0')) as numeroFacturaFormateado,
            ep.FechaEntrega as fechaFactura,
            c.NOMBRE as cliente,
            ep.IdMoneda as idMoneda,
            m.Moneda as moneda,
            ep.TRM as trm,
            
            -- VALOR FACTURA (lógica corregida con conversión de unidades)
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
            ), 0) as valorFactura,
            
            -- VALOR DEVOLUCIONES (incluye Flete, Fumigacion, Otros)
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
                AND COALESCE(dp.TallosDevolucion, 0) > 0
            ), 0) as valorDevolucion,
            
            -- VALOR PAGOS (relacionando por Invoice = Factura)
            COALESCE((
                SELECT SUM(dpc.ValorPago)
                FROM SAS_EncabPagoCliente epc
                INNER JOIN SAS_DetPagoCliente dpc ON epc.IdEncabPagoCliente = dpc.IdEncabPagoCliente
                WHERE dpc.Invoice = ep.Factura
                AND epc.Anulado = 0{$condPagoExcluir}
            ), 0) as valorPagado,
            
            -- SALDO PENDIENTE (Valor Factura - Devoluciones - Pagos)
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
                    AND COALESCE(dp.TallosDevolucion, 0) > 0
                ), 0)
                - COALESCE((
                    SELECT SUM(dpc.ValorPago)
                    FROM SAS_EncabPagoCliente epc
                    INNER JOIN SAS_DetPagoCliente dpc ON epc.IdEncabPagoCliente = dpc.IdEncabPagoCliente
                    WHERE dpc.Invoice = ep.Factura
                    AND epc.Anulado = 0{$condPagoExcluir}
                ), 0)
            ) as saldoPendiente
            
        FROM SAS_EncabPedido ep
        INNER JOIN GEN_Clientes c ON ep.IdCliente = c.IdCliente
        LEFT JOIN GEN_Monedas m ON ep.IdMoneda = m.IdMoneda
        WHERE ep.IdCliente = ?
        AND ep.Factura IS NOT NULL
        AND ep.Factura > 0
        HAVING saldoPendiente > 0
        ORDER BY ep.FechaEntrega DESC
    ";

    $stmt = $enlace->prepare($query);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("i", $idCliente);
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
        $saldoPendiente
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
            'saldoPendiente' => floatval($saldoPendiente)
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
