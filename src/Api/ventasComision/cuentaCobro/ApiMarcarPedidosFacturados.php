<?php
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['success'=>false]); exit; }

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$idsPedidos = $input['idsPedidos'] ?? [];

if (empty($idsPedidos) || !is_array($idsPedidos)) {
    echo json_encode(['success'=>false, 'message'=>'No se recibieron pedidos para marcar']);
    exit;
}

try {
    $ids = array_map('intval', $idsPedidos);
    $idsStr = implode(',', $ids);
    $fecha = date('Y-m-d');
    
    $sql = "UPDATE SAS_EncabPedidoComision SET FechaCuentaCobro = '$fecha' WHERE IdEncabPedidoComision IN ($idsStr)";
    $enlace->query($sql);
    
    echo json_encode(['success'=>true, 'message'=>count($ids) . ' pedido(s) marcado(s) como facturado(s)', 'fecha'=>$fecha]);
} catch (Exception $e) {
    echo json_encode(['success'=>false, 'message'=>'Error: ' . $e->getMessage()]);
}
