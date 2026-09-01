<?php
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['success'=>false]); exit; }

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;

$input = json_decode(file_get_contents('php://input'), true);
$idDevolucion = intval($input['idDevolucion'] ?? 0);

if ($idDevolucion <= 0) { echo json_encode(['success'=>false,'message'=>'ID invÃ¡lido']); exit; }

$enlace->begin_transaction();
try {
    // 1. Limpiar campos de devoluciÃ³n en el detalle
    $stmt = $enlace->prepare("UPDATE SAS_DetProductoComision dp
        INNER JOIN SAS_EncabPedidoComision e ON dp.IdEncabPedidoComision = e.IdEncabPedidoComision
        SET dp.TallosDevolucion = NULL, dp.MotivoDevolucion = NULL, dp.Flete = NULL, dp.Fumigacion = NULL, dp.Otros = NULL
        WHERE e.IdDevolucion = ?");
    $stmt->bind_param("i", $idDevolucion);
    $stmt->execute();
    $stmt->close();

    // 2. Limpiar campos de devoluciÃ³n en el encabezado
    $stmt = $enlace->prepare("UPDATE SAS_EncabPedidoComision SET IdDevolucion = NULL, FechaDevolucion = NULL, ObservacionesDevolucion = NULL WHERE IdDevolucion = ?");
    $stmt->bind_param("i", $idDevolucion);
    $stmt->execute();
    $stmt->close();

    $enlace->commit();
    echo json_encode(['success'=>true, 'message'=>'DevoluciÃ³n eliminada']);
} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(['success'=>false, 'message'=>'Error: ' . $e->getMessage()]);
}
