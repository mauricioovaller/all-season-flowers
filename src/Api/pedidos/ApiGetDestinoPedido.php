<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['idPedido']) || empty($input['idPedido'])) {
    http_response_code(400);
    echo json_encode(["error" => "idPedido es requerido"]);
    exit;
}

$idPedido = (int) $input['idPedido'];

try {
    $query = "SELECT CONCAT(cli.Direc1, ', ', cli.CIUDAD, ', ', cli.ESTADO, ', ', cli.PAIS) AS destino_completo
              FROM SAS_EncabPedido enc
              LEFT JOIN GEN_Clientes cli ON enc.IdCliente = cli.IdCliente
              WHERE enc.IdEncabPedido = ?";

    $stmt = $enlace->prepare($query);
    $stmt->bind_param("i", $idPedido);

    if (!$stmt->execute()) {
        throw new Exception("Error en la consulta: " . $stmt->error);
    }

    $stmt->bind_result($destino_completo);

    if (!$stmt->fetch()) {
        throw new Exception("No se encontró el pedido con ID: $idPedido");
    }

    echo json_encode([
        'success' => true,
        'destino_completo' => $destino_completo
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$enlace->close();
