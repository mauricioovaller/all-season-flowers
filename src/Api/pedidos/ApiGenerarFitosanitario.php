<?php
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST"); 
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

// Obtener datos JSON
$input = json_decode(file_get_contents("php://input"), true);

// Validar datos obligatorios
if (!isset($input['idPedido']) || empty($input['idPedido'])) {
    http_response_code(400);
    echo json_encode(["error" => "ID de pedido es obligatorio"]);
    exit;
}

if (!isset($input['numeroFitosanitario']) || empty($input['numeroFitosanitario'])) {
    http_response_code(400);
    echo json_encode(["error" => "Número de fitosanitario es obligatorio"]);
    exit;
}

$idPedido = intval($input['idPedido']);
$numeroFitosanitario = $input['numeroFitosanitario'];

// Extraer solo el número (ej: "FITO-000001" → 1)
$numeroFitoInt = 0;
if (preg_match('/FITO-(\d+)/', $numeroFitosanitario, $matches)) {
    $numeroFitoInt = intval($matches[1]);
} else {
    // Si viene solo el número
    $numeroFitoInt = intval($numeroFitosanitario);
}

try {
    // 1. Verificar que el pedido existe
    $checkQuery = "SELECT IdEncabPedido, FechaEntrega FROM SAS_EncabPedido WHERE IdEncabPedido = ?";
    $checkStmt = $enlace->prepare($checkQuery);
    $checkStmt->bind_param("i", $idPedido);
    $checkStmt->execute();
    $checkStmt->bind_result($idPedidoCheck, $fechaEntrega);
    
    if (!$checkStmt->fetch()) {
        throw new Exception("Pedido no encontrado con ID: $idPedido");
    }
    $checkStmt->close();
    
    // 2. Calcular fechas de vigencia
    $fechaVigenciaInicial = $fechaEntrega;
    $fechaVigenciaFinal = date('Y-m-d', strtotime($fechaEntrega . ' + 2 days'));
    
    // 3. Actualizar el pedido con el número de fitosanitario
    $updateQuery = "UPDATE SAS_EncabPedido 
                    SET NoFito = ?, 
                        FechaVigenciaInicial = ?, 
                        FechaVigenciaFinal = ?                        
                    WHERE IdEncabPedido = ?";
    
    $updateStmt = $enlace->prepare($updateQuery);
    $updateStmt->bind_param("issi", $numeroFitoInt, $fechaVigenciaInicial, $fechaVigenciaFinal, $idPedido);
    
    if (!$updateStmt->execute()) {
        throw new Exception("Error al actualizar pedido: " . $updateStmt->error);
    }
    
    // 4. Verificar que se actualizó correctamente
    if ($updateStmt->affected_rows === 0) {
        throw new Exception("No se pudo actualizar el pedido. Verifique que el ID sea correcto.");
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Fitosanitario generado exitosamente',
        'numeroFitosanitario' => $numeroFitosanitario,
        'numeroFitosanitarioInt' => $numeroFitoInt,
        'fechaVigenciaInicial' => $fechaVigenciaInicial,
        'fechaVigenciaFinal' => $fechaVigenciaFinal,
        'pedidoId' => $idPedido
    ]);
    
    $updateStmt->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$enlace->close();
?>