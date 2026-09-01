<?php
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['success'=>false]); exit; }

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$modo = $input['modo'] ?? 'pendientes';
$fechaInicio = $input['fechaInicio'] ?? '';
$fechaFin = $input['fechaFin'] ?? '';
$idCliente = intval($input['idCliente'] ?? 0);

try {
    if ($modo === 'historial_detalle') {
        $fechaCC = $enlace->real_escape_string($input['fechaCuentaCobro'] ?? '');
        if (!$fechaCC) { echo json_encode(['success'=>false, 'pedidos'=>[], 'message'=>'Fecha requerida']); exit; }

        $sql = "SELECT p.IdEncabPedidoComision AS idPedido, p.NumeroPedido, p.FechaSolicitud AS fecha,
            p.PorcentajeComision, c.NOMBRE AS cliente,
            (SELECT COALESCE(SUM(GREATEST(dp.Tallos_Ramo*dp.Ramos_Caja*de.Cantidad-COALESCE(dp.TallosDevolucion,0),0)*dp.Precio_Venta),0)
             FROM SAS_DetProductoComision dp INNER JOIN SAS_DetEmpaqueComision de ON dp.IdDetEmpaqueComision=de.IdDetEmpaqueComision
             WHERE dp.IdEncabPedidoComision=p.IdEncabPedidoComision AND (dp.Anulado IS NULL OR dp.Anulado=0) AND (de.Anulado IS NULL OR de.Anulado=0)
            ) AS valorTotal
            FROM SAS_EncabPedidoComision p
            LEFT JOIN GEN_Clientes c ON p.IdCliente=c.IdCliente
            WHERE p.FechaCuentaCobro='$fechaCC' ORDER BY p.FechaSolicitud, p.NumeroPedido";
        $result = $enlace->query($sql);
        $pedidos = [];
        while ($row = $result->fetch_assoc()) {
            $pct = floatval($row['PorcentajeComision']??0);
            $r2 = $enlace->query("SELECT COALESCE(SUM(GREATEST(dp.Tallos_Ramo*dp.Ramos_Caja*de.Cantidad-COALESCE(dp.TallosDevolucion,0),0)*dp.Precio_Venta*(COALESCE(dp.PorcentajeComision,$pct,0)/100)),0) AS tc
                FROM SAS_DetProductoComision dp INNER JOIN SAS_DetEmpaqueComision de ON dp.IdDetEmpaqueComision=de.IdDetEmpaqueComision
                WHERE dp.IdEncabPedidoComision=" . intval($row['idPedido']) . " AND (dp.Anulado IS NULL OR dp.Anulado=0) AND (de.Anulado IS NULL OR de.Anulado=0)");
            $row['comision'] = $r2 ? floatval($r2->fetch_assoc()['tc']??0) : 0;
            $pedidos[] = $row;
        }
        echo json_encode(['success'=>true, 'modo'=>'historial_detalle', 'pedidos'=>$pedidos]);
        exit;
    }

    if ($modo === 'historial') {
        $where = ["p.FechaCuentaCobro IS NOT NULL"];
        if (!empty($fechaInicio)) $where[] = "p.FechaCuentaCobro >= '" . $enlace->real_escape_string($fechaInicio) . "'";
        if (!empty($fechaFin)) $where[] = "p.FechaCuentaCobro <= '" . $enlace->real_escape_string($fechaFin) . "'";
        if ($idCliente > 0) $where[] = "p.IdCliente = $idCliente";
        $whereClause = "WHERE " . implode(" AND ", $where);

        $pedidos = [];
        $r = $enlace->query("SELECT p.FechaCuentaCobro, COUNT(*) AS totalPedidos,
            c.NOMBRE AS cliente
            FROM SAS_EncabPedidoComision p
            LEFT JOIN GEN_Clientes c ON p.IdCliente = c.IdCliente
            $whereClause
            GROUP BY p.FechaCuentaCobro, c.NOMBRE
            ORDER BY p.FechaCuentaCobro DESC");
        while ($row = $r->fetch_assoc()) $pedidos[] = $row;
        echo json_encode(['success'=>true, 'modo'=>'historial', 'cuentas'=>$pedidos]);
        exit;
    }

    if (!$fechaInicio || !$fechaFin) {
        echo json_encode(['success'=>false, 'pedidos'=>[], 'totalPedidos'=>0, 'message'=>'Rango de fechas requerido']);
        exit;
    }

    $where = ["p.Estado = 'Activo'", "p.FechaCuentaCobro IS NULL"];
    $where[] = "p.FechaSolicitud >= '" . $enlace->real_escape_string($fechaInicio) . "'";
    $where[] = "p.FechaSolicitud <= '" . $enlace->real_escape_string($fechaFin) . "'";
    if ($idCliente > 0) $where[] = "p.IdCliente = $idCliente";
    $whereClause = "WHERE " . implode(" AND ", $where);

    $sql = "SELECT p.IdEncabPedidoComision AS idPedido, p.NumeroPedido,
        p.FechaSolicitud AS fecha, p.PorcentajeComision,
        c.NOMBRE AS cliente,
        (SELECT COALESCE(SUM(
            GREATEST(dp.Tallos_Ramo * dp.Ramos_Caja * de.Cantidad - COALESCE(dp.TallosDevolucion, 0), 0) * dp.Precio_Venta
         ), 0)
         FROM SAS_DetProductoComision dp
         INNER JOIN SAS_DetEmpaqueComision de ON dp.IdDetEmpaqueComision = de.IdDetEmpaqueComision
         WHERE dp.IdEncabPedidoComision = p.IdEncabPedidoComision
         AND (dp.Anulado IS NULL OR dp.Anulado = 0)
         AND (de.Anulado IS NULL OR de.Anulado = 0)
        ) AS valorTotal
        FROM SAS_EncabPedidoComision p
        LEFT JOIN GEN_Clientes c ON p.IdCliente = c.IdCliente
        $whereClause
        ORDER BY p.FechaSolicitud, p.NumeroPedido";

    $result = $enlace->query($sql);
    if (!$result) throw new Exception("Error en SELECT: " . $enlace->error);

    $pedidos = [];
    while ($row = $result->fetch_assoc()) {
        $pctGlobal = floatval($row['PorcentajeComision'] ?? 0);
        $sql2 = "SELECT COALESCE(SUM(
            GREATEST(dp.Tallos_Ramo * dp.Ramos_Caja * de.Cantidad - COALESCE(dp.TallosDevolucion, 0), 0) * dp.Precio_Venta *
            (COALESCE(dp.PorcentajeComision, $pctGlobal, 0) / 100)
        ), 0) AS totalComision
        FROM SAS_DetProductoComision dp
        INNER JOIN SAS_DetEmpaqueComision de ON dp.IdDetEmpaqueComision = de.IdDetEmpaqueComision
        WHERE dp.IdEncabPedidoComision = " . intval($row['idPedido']) . "
        AND (dp.Anulado IS NULL OR dp.Anulado = 0)
        AND (de.Anulado IS NULL OR de.Anulado = 0)";
        $r2 = $enlace->query($sql2);
        $row['comision'] = $r2 ? floatval($r2->fetch_assoc()['totalComision'] ?? 0) : 0;
        $pedidos[] = $row;
    }
    echo json_encode(['success'=>true, 'modo'=>'pendientes', 'pedidos'=>$pedidos, 'totalPedidos'=>count($pedidos)]);
} catch (Exception $e) {
    echo json_encode(['success'=>false, 'pedidos'=>[], 'totalPedidos'=>0, 'message'=>$e->getMessage()]);
}
