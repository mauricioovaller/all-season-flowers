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
    $idEntidad = 0;
    $nombre = '';
    $id = intval($input['id'] ?? 0);
    if ($id <= 0) {
        responderJson(['success' => false, 'message' => 'ID no válido'], 400);
    }

    $sql = 'SELECT IdEntidad, Nombre FROM TablaEntidad WHERE IdEntidad = ?';
    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception('Error preparando consulta: ' . $enlace->error);
    }
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) {
        throw new Exception('Error ejecutando consulta: ' . $stmt->error);
    }
    $stmt->bind_result($idEntidad, $nombre);

    if (!$stmt->fetch()) {
        $stmt->close();
        responderJson(['success' => false, 'message' => 'Registro no encontrado'], 404);
    }
    $stmt->close();

    responderJson([
        'success' => true,
        'data' => ['id' => intval($idEntidad), 'nombre' => $nombre],
    ]);
} catch (Throwable $exception) {
    error_log('Error en endpoint PHP: ' . $exception->getMessage());
    responderJson(['success' => false, 'message' => 'Error interno del servidor'], 500);
}
