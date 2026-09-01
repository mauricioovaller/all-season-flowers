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

try {
    $result = $enlace->query("SELECT MAX(CAST(SUBSTRING(NumeroPedido, 5) AS UNSIGNED)) AS ultimo FROM SAS_EncabPedidoComision");
    $row = $result->fetch_assoc();
    $ultimoNumero = intval($row['ultimo'] ?? 0);
    $sig = $ultimoNumero + 1;
    $siguienteFormateado = 'PEC-' . str_pad($sig, 6, '0', STR_PAD_LEFT);

    echo json_encode([
        'success' => true,
        'ultimoNumero' => $ultimoNumero,
        'siguienteNumeroFormateado' => $siguienteFormateado,
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'ultimoNumero' => 0,
        'siguienteNumeroFormateado' => 'PEC-000001',
    ]);
}
