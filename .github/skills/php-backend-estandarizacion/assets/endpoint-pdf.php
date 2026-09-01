<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;
require_once FPDF_PATH;
/** @var mysqli $enlace */
$enlace->set_charset('utf8mb4');

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || json_last_error() !== JSON_ERROR_NONE) {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'JSON de entrada no válido'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $idEntidad = 0;
    $nombre = '';
    $id = intval($input['id'] ?? 0);
    if ($id <= 0) {
        throw new InvalidArgumentException('ID no válido');
    }

    $stmt = $enlace->prepare('SELECT IdEntidad, Nombre FROM TablaEntidad WHERE IdEntidad = ?');
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
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Registro no encontrado'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $stmt->close();

    $pdf = new FPDF('P', 'mm', 'Letter');
    $pdf->SetMargins(12, 10, 12);
    $pdf->SetAutoPageBreak(true, 20);
    $pdf->AddPage();
    $pdf->SetFont('Helvetica', 'B', 14);
    $pdf->Cell(0, 8, utf8_decode(EMPRESA_NOMBRE_TITULO), 0, 1, 'C');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(0, 6, utf8_decode((string)$nombre), 0, 1, 'L');

    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="Entidad_' . $id . '.pdf"');
    $pdf->Output('I');
} catch (Throwable $exception) {
    error_log('Error generando PDF: ' . $exception->getMessage());
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code($exception instanceof InvalidArgumentException ? 400 : 500);
    echo json_encode(['success' => false, 'message' => 'No fue posible generar el PDF'], JSON_UNESCAPED_UNICODE);
}
