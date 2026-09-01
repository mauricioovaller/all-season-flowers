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
$idProducto = intval($input['idProducto'] ?? 0);

$response = ['success' => true, 'variedades' => [], 'grados' => []];

try {
    $result = $enlace->query("SELECT IdVariedad AS id, NOMVARIEDAD AS nombre FROM GEN_Variedades WHERE IdProducto = $idProducto AND ACTIVO = 1 ORDER BY NOMVARIEDAD");
    while ($row = $result->fetch_assoc()) {
        $response['variedades'][] = $row;
    }

    $result = $enlace->query("SELECT IdGrado AS id, NOMGRADO AS nombre FROM GEN_Grados WHERE IdProducto = $idProducto AND ACTIVO = 1 ORDER BY NOMGRADO");
    while ($row = $result->fetch_assoc()) {
        $response['grados'][] = $row;
    }
} catch (Exception $e) {
    $response = ['success' => false, 'message' => $e->getMessage(), 'variedades' => [], 'grados' => []];
}

echo json_encode($response);
