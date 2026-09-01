<?php
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['success'=>false]); exit; }

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$pagina = intval($input['pagina'] ?? 1);
$itemsPorPagina = intval($input['itemsPorPagina'] ?? 10);
$offset = ($pagina - 1) * $itemsPorPagina;

try {
    $where = ["p.IdDevolucion IS NOT NULL AND p.IdDevolucion > 0"];

    if (!empty($input['numero'])) {
        $num = intval(str_replace('DEV-', '', strtoupper($input['numero'])));
        if ($num > 0) {
            $where[] = "p.IdDevolucion = $num";
        }
    }
    if (!empty($input['cliente'])) {
        $cliente = $enlace->real_escape_string($input['cliente']);
        $where[] = "c.NOMBRE LIKE '%$cliente%'";
    }
    if (!empty($input['fechaInicio'])) {
        $fInicio = $enlace->real_escape_string($input['fechaInicio']);
        $where[] = "p.FechaDevolucion >= '$fInicio'";
    }
    if (!empty($input['fechaFin'])) {
        $fFin = $enlace->real_escape_string($input['fechaFin']);
        $where[] = "p.FechaDevolucion <= '$fFin'";
    }

    $whereClause = "WHERE " . implode(" AND ", $where);

    $sqlCount = "SELECT COUNT(*) AS total FROM SAS_EncabPedidoComision p LEFT JOIN GEN_Clientes c ON p.IdCliente = c.IdCliente $whereClause";
    $result = $enlace->query($sqlCount);
    if (!$result) throw new Exception("Error en COUNT: " . $enlace->error);
    $total = $result->fetch_assoc()['total'] ?? 0;

    $sqlData = "SELECT p.IdEncabPedidoComision AS idFactura, p.IdDevolucion,
        CONCAT('DEV-', LPAD(IFNULL(p.IdDevolucion,0),6,'0')) AS numeroDevolucion,
        p.FechaDevolucion, c.NOMBRE AS cliente,
        p.IdCliente, p.NumeroPedido
        FROM SAS_EncabPedidoComision p
        LEFT JOIN GEN_Clientes c ON p.IdCliente = c.IdCliente
        $whereClause
        ORDER BY p.IdDevolucion DESC
        LIMIT $itemsPorPagina OFFSET $offset";
    $result = $enlace->query($sqlData);
    if (!$result) throw new Exception("Error en SELECT: " . $enlace->error);

    $devoluciones = [];
    while ($row = $result->fetch_assoc()) {
        $devoluciones[] = $row;
    }

    echo json_encode(['success'=>true, 'devoluciones'=>$devoluciones, 'total'=>intval($total)]);
} catch (Exception $e) {
    echo json_encode(['success'=>false, 'devoluciones'=>[], 'total'=>0, 'message'=>$e->getMessage()]);
}
