<?php
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['success'=>false,'message'=>'MÃ©todo no permitido']); exit; }

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) { echo json_encode(['success'=>false,'message'=>'Datos invÃ¡lidos']); exit; }

$idFactura = intval($input['idFactura'] ?? 0);
$fechaDevolucion = $input['fechaDevolucion'] ?? date('Y-m-d');
$observaciones = $input['observaciones'] ?? '';
$detalles = $input['detalles'] ?? [];

if ($idFactura <= 0) { echo json_encode(['success'=>false,'message'=>'Factura invÃ¡lida']); exit; }

$enlace->begin_transaction();
try {
    // Verificar si ya tiene devoluciÃ³n
    $result = $enlace->query("SELECT IdDevolucion FROM SAS_EncabPedidoComision WHERE IdEncabPedidoComision = $idFactura");
    $row = $result->fetch_assoc();

    $idDevolucion = intval($row['IdDevolucion'] ?? 0);

    if ($idDevolucion <= 0) {
        // Nueva devoluciÃ³n - obtener siguiente nÃºmero
        $result = $enlace->query("SELECT MAX(IdDevolucion) AS ultimo FROM SAS_EncabPedidoComision");
        $r = $result->fetch_assoc();
        $idDevolucion = intval($r['ultimo'] ?? 0) + 1;
    }

    // Actualizar encabezado
    $fechaDevEsc = $enlace->real_escape_string($fechaDevolucion);
    $obsEsc = $enlace->real_escape_string($observaciones);
    $enlace->query("UPDATE SAS_EncabPedidoComision SET
        IdDevolucion = $idDevolucion, FechaDevolucion = '$fechaDevEsc', ObservacionesDevolucion = '$obsEsc'
        WHERE IdEncabPedidoComision = $idFactura");

    // Actualizar detalle
    foreach ($detalles as $det) {
        $idDet = intval($det['idDetProducto'] ?? 0);
        $tallos = intval($det['tallosDevolucion'] ?? 0);
        $motivoEsc = $enlace->real_escape_string($det['motivo'] ?? '');
        $flete = floatval($det['flete'] ?? 0);
        $fumigacion = floatval($det['fumigacion'] ?? 0);
        $otros = floatval($det['otros'] ?? 0);

        $enlace->query("UPDATE SAS_DetProductoComision SET
            TallosDevolucion = $tallos, MotivoDevolucion = '$motivoEsc', Flete = $flete, Fumigacion = $fumigacion, Otros = $otros
            WHERE IdDetProductoComision = $idDet");
    }

    $enlace->commit();

    $numDev = 'DEV-' . str_pad($idDevolucion, 6, '0', STR_PAD_LEFT);
    echo json_encode(['success'=>true, 'idDevolucion'=>$idDevolucion, 'numeroDevolucion'=>$numDev, 'message'=>'DevoluciÃ³n guardada']);
} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(['success'=>false, 'message'=>'Error: ' . $e->getMessage()]);
}
