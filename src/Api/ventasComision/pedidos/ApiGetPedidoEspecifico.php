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

$input = json_decode(file_get_contents('php://input'), true);
$idPedido = intval($input['idPedido'] ?? 0);

if ($idPedido <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID de pedido invÃ¡lido']);
    exit;
}

try {
    // Encabezado
    $result = $enlace->query("SELECT * FROM SAS_EncabPedidoComision WHERE IdEncabPedidoComision = $idPedido");
    $encabezado = $result->fetch_assoc();

    if (!$encabezado) {
        echo json_encode(['success' => false, 'message' => 'Pedido no encontrado']);
        exit;
    }

    // Empaques
    $result = $enlace->query("SELECT * FROM SAS_DetEmpaqueComision WHERE IdEncabPedidoComision = $idPedido AND (Anulado IS NULL OR Anulado = 0)");
    $empaques = [];
    while ($row = $result->fetch_assoc()) {
        $idDetEmpaque = intval($row['IdDetEmpaqueComision']);

        // Productos
        $result2 = $enlace->query("SELECT * FROM SAS_DetProductoComision WHERE IdDetEmpaqueComision = $idDetEmpaque AND (Anulado IS NULL OR Anulado = 0)");
        $productos = [];
        while ($row2 = $result2->fetch_assoc()) {
            $idDetProducto = intval($row2['IdDetProductoComision']);

            // Receta
            $result3 = $enlace->query("SELECT * FROM SAS_DetRecetaComision WHERE IdDetProductoComision = $idDetProducto AND (Anulado IS NULL OR Anulado = 0)");
            $receta = [];
            while ($row3 = $result3->fetch_assoc()) {
                $receta[] = $row3;
            }

            $row2['receta'] = $receta;
            $productos[] = $row2;
        }
        $row['productos'] = $productos;
        $empaques[] = $row;
    }

    echo json_encode([
        'success' => true,
        'idPedido' => $idPedido,
        'numeroPedido' => $encabezado['NumeroPedido'],
        'encabezado' => $encabezado,
        'empaques' => $empaques,
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
