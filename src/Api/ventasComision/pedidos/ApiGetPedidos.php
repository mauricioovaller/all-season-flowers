<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'MÃ©todo no permitido']);
    exit;
}

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$pagina = intval($input['pagina'] ?? 1);
$itemsPorPagina = intval($input['itemsPorPagina'] ?? 10);
$offset = ($pagina - 1) * $itemsPorPagina;

try {
    // Construir WHERE con parÃ¡metros escapados directamente
    $whereCondiciones = [];
    $whereCondiciones[] = "1=1"; // condiciÃ³n base para simplificar

    if (!empty($input['numero'])) {
        $numero = $enlace->real_escape_string($input['numero']);
        $whereCondiciones[] = "p.NumeroPedido LIKE '%$numero%'";
    }
    if (!empty($input['cliente'])) {
        $cliente = $enlace->real_escape_string($input['cliente']);
        $whereCondiciones[] = "c.NOMBRE LIKE '%$cliente%'";
    }
    if (!empty($input['fechaInicio'])) {
        $fInicio = $enlace->real_escape_string($input['fechaInicio']);
        $whereCondiciones[] = "p.FechaSolicitud >= '$fInicio'";
    }
    if (!empty($input['fechaFin'])) {
        $fFin = $enlace->real_escape_string($input['fechaFin']);
        $whereCondiciones[] = "p.FechaSolicitud <= '$fFin'";
    }
    if (!empty($input['estado'])) {
        $estado = $enlace->real_escape_string($input['estado']);
        $whereCondiciones[] = "p.Estado = '$estado'";
    }

    $whereClause = "WHERE " . implode(" AND ", $whereCondiciones);

    // Total
    $sqlCount = "SELECT COUNT(*) AS total FROM SAS_EncabPedidoComision p LEFT JOIN GEN_Clientes c ON p.IdCliente = c.IdCliente $whereClause";
    $result = $enlace->query($sqlCount);
    if (!$result) throw new Exception("Error en COUNT: " . $enlace->error);
    $total = $result->fetch_assoc()['total'] ?? 0;

    // Datos
    $sqlData = "SELECT p.IdEncabPedidoComision AS idPedido, p.NumeroPedido, p.FechaSolicitud, p.FechaEntrega,
                p.Estado, p.PorcentajeComision,
                c.NOMBRE AS cliente, c.IdCliente
                FROM SAS_EncabPedidoComision p
                LEFT JOIN GEN_Clientes c ON p.IdCliente = c.IdCliente
                $whereClause
                ORDER BY p.IdEncabPedidoComision DESC
                LIMIT $itemsPorPagina OFFSET $offset";
    $result = $enlace->query($sqlData);
    if (!$result) throw new Exception("Error en SELECT: " . $enlace->error);

    $pedidos = [];
    while ($row = $result->fetch_assoc()) {
        $pedidos[] = $row;
    }

    echo json_encode(['success' => true, 'pedidos' => $pedidos, 'total' => intval($total)]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'pedidos' => [],
        'total' => 0,
        'message' => $e->getMessage(),
    ]);
}
