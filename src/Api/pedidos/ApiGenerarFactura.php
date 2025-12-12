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

$input = json_decode(file_get_contents("php://input"), true);

// Validar datos requeridos
if (!isset($input['idPedido']) || !isset($input['numeroFactura'])) {
    http_response_code(400);
    echo json_encode(["error" => "Datos incompletos: idPedido y numeroFactura son requeridos"]);
    exit;
}

$idPedido = (int) $input['idPedido'];
$numeroFacturaStr = $input['numeroFactura'];

// Extraer solo los números de "FACT-000001"
// Si es string como "FACT-000001", extraer "000001" y convertir a int
if (is_string($numeroFacturaStr)) {
    // Extraer solo los números
    preg_match('/\d+/', $numeroFacturaStr, $matches);
    $numeroFactura = isset($matches[0]) ? (int)$matches[0] : 0;
} else {
    $numeroFactura = (int) $numeroFacturaStr;
}

// Validar que tenemos un número válido
if ($numeroFactura <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Número de factura inválido"]);
    exit;
}

$fechaFactura = date('Y-m-d H:i:s');

try {
    // Iniciar transacción
    $enlace->begin_transaction();
    
    // 1. Actualizar el pedido con el número de factura (como INT)
    $query1 = "UPDATE SAS_EncabPedido 
               SET Factura = ?, 
                   Estado = 'Facturado'
               WHERE IdEncabPedido = ?";
    
    $stmt1 = $enlace->prepare($query1);
    $stmt1->bind_param("ii", $numeroFactura, $idPedido); // "i" para integer
    
    if (!$stmt1->execute()) {
        throw new Exception("Error al actualizar pedido: " . $stmt1->error);
    }
    
    // Verificar si se actualizó alguna fila
    if ($stmt1->affected_rows === 0) {
        throw new Exception("No se encontró el pedido con ID: $idPedido");
    }
    
    // Confirmar transacción
    $enlace->commit();
    
    // Formatear el número para la respuesta
    $numeroFacturaFormateado = "FACT-" . str_pad($numeroFactura, 6, '0', STR_PAD_LEFT);
    
    echo json_encode([
        'success' => true,
        'message' => 'Factura generada correctamente',
        'numeroFactura' => $numeroFacturaFormateado,
        'numeroFacturaInt' => $numeroFactura,
        'fechaFactura' => $fechaFactura,
        'idPedido' => $idPedido,
        'affectedRows' => $stmt1->affected_rows
    ]);
    
} catch (Exception $e) {
    // Revertir transacción en caso de error
    if (isset($enlace) && $enlace) {
        $enlace->rollback();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'queryError' => isset($stmt1) ? $stmt1->error : null
    ]);
}

if (isset($enlace) && $enlace) {
    $enlace->close();
}
?>