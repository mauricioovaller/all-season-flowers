<?php
header('Content-Type: application/json; charset=UTF-8');

function responderJson(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderJson(['success' => false, 'message' => 'Método no permitido'], 405);
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;
/** @var mysqli $enlace */
$enlace->set_charset('utf8mb4');

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || json_last_error() !== JSON_ERROR_NONE) {
    responderJson(['success' => false, 'message' => 'JSON de entrada no válido'], 400);
}

try {
    $idEncabezado = 0;
    $enlace->begin_transaction();

    $stmtHeader = $enlace->prepare(
        'INSERT INTO TablaEncabezado (Campo) VALUES (?)'
    );
    if (!$stmtHeader) {
        throw new Exception('Error preparando encabezado: ' . $enlace->error);
    }
    $campo = trim((string)($input['campo'] ?? ''));
    $stmtHeader->bind_param('s', $campo);
    if (!$stmtHeader->execute()) {
        throw new Exception('Error guardando encabezado: ' . $stmtHeader->error);
    }
    $idEncabezado = $enlace->insert_id;
    $stmtHeader->close();

    $stmtDetail = $enlace->prepare(
        'INSERT INTO TablaDetalle (IdEncabezado, Campo) VALUES (?, ?)'
    );
    if (!$stmtDetail) {
        throw new Exception('Error preparando detalle: ' . $enlace->error);
    }
    foreach (($input['detalles'] ?? []) as $detalle) {
        $valor = trim((string)($detalle['valor'] ?? ''));
        $stmtDetail->bind_param('is', $idEncabezado, $valor);
        if (!$stmtDetail->execute()) {
            throw new Exception('Error guardando detalle: ' . $stmtDetail->error);
        }
    }
    $stmtDetail->close();

    $enlace->commit();
    responderJson(['success' => true, 'id' => $idEncabezado]);
} catch (Throwable $exception) {
    $enlace->rollback();
    error_log('Error transaccional PHP: ' . $exception->getMessage());
    responderJson(['success' => false, 'message' => 'No fue posible guardar la información'], 500);
}
