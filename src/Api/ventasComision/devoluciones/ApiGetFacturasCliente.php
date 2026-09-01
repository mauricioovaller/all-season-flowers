<?php
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['success'=>false]); exit; }

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;

$input = json_decode(file_get_contents('php://input'), true);
$idCliente = intval($input['idCliente'] ?? 0);

if ($idCliente <= 0) { echo json_encode(['success'=>false, 'facturas'=>[], 'total'=>0, 'message'=>'Cliente invÃ¡lido']); exit; }

try {
    $result = $enlace->query("SELECT p.IdEncabPedidoComision AS idFactura, p.NumeroPedido,
        p.FechaSolicitud AS fecha, p.PorcentajeComision, p.Estado,
        p.IdDevolucion,
        CONCAT('DEV-', LPAD(IFNULL(p.IdDevolucion, 0), 6, '0')) AS numeroDevolucion,
        p.IdDevolucion IS NOT NULL AND p.IdDevolucion > 0 AS tieneDevolucion,
        m.Moneda AS moneda, p.TRM
        FROM SAS_EncabPedidoComision p
        LEFT JOIN GEN_Monedas m ON p.IdMoneda = m.IdMoneda
        WHERE p.IdCliente = $idCliente AND p.Estado != 'Anulado'
        ORDER BY p.IdEncabPedidoComision DESC");
    $facturas = [];
    while ($row = $result->fetch_assoc()) {
        $row['tieneDevolucion'] = ($row['IdDevolucion'] !== null && $row['IdDevolucion'] > 0);
        $facturas[] = $row;
    }
    echo json_encode(['success'=>true, 'facturas'=>$facturas, 'total'=>count($facturas)]);
} catch (Exception $e) {
    echo json_encode(['success'=>false, 'facturas'=>[], 'total'=>0, 'message'=>$e->getMessage()]);
}
