<?php
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['success'=>false,'message'=>'MÃ©todo no permitido']); exit; }

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;

try {
    $result = $enlace->query("SELECT MAX(CAST(SUBSTRING(IFNULL(IdDevolucion,0), 5) AS UNSIGNED)) AS ultimo FROM SAS_EncabPedidoComision WHERE IdDevolucion IS NOT NULL");
    // El IdDevolucion es INT, no VARCHAR. Debemos manejarlo diferente.
    $result = $enlace->query("SELECT MAX(IdDevolucion) AS ultimo FROM SAS_EncabPedidoComision");
    $row = $result->fetch_assoc();
    $ultimo = intval($row['ultimo'] ?? 0);
    $sig = $ultimo + 1;
    echo json_encode(['success'=>true, 'ultimoNumero'=>$ultimo, 'siguienteNumeroFormateado'=>'DEV-' . str_pad($sig, 6, '0', STR_PAD_LEFT)]);
} catch (Exception $e) {
    echo json_encode(['success'=>false, 'ultimoNumero'=>0, 'siguienteNumeroFormateado'=>'DEV-000001', 'message'=>$e->getMessage()]);
}
