<?php
/**
 * Obtiene la lista de paises desde GEN_Paises
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

try {
    $result = $enlace->query("SELECT IdPais, Pais FROM GEN_Paises ORDER BY Pais");
    if (!$result) throw new Exception($enlace->error);
    $paises = [];
    while ($row = $result->fetch_assoc()) {
        $paises[] = $row;
    }
    echo json_encode(['success' => true, 'paises' => $paises]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'paises' => [], 'message' => $e->getMessage()]);
}
