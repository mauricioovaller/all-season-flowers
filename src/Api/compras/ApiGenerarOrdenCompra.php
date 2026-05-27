<?php
// src/Api/compras/ApiGenerarOrdenCompra.php
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

// Validar datos requeridos
if (!isset($input['idCompra']) || !isset($input['numeroOrdenCompra'])) {
    http_response_code(400);
    echo json_encode(["error" => "Datos incompletos: idCompra y numeroOrdenCompra son requeridos"]);
    exit;
}

$idCompra = (int) $input['idCompra'];
$numeroOrdenCompraStr = $input['numeroOrdenCompra'];

// Extraer solo los números de "OC-000001" o similar
if (is_string($numeroOrdenCompraStr)) {
    preg_match('/\d+/', $numeroOrdenCompraStr, $matches);
    $numeroOrdenCompra = isset($matches[0]) ? (int)$matches[0] : 0;
} else {
    $numeroOrdenCompra = (int) $numeroOrdenCompraStr;
}

// Validar que tenemos un número válido
if ($numeroOrdenCompra <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Número de orden de compra inválido"]);
    exit;
}

// Obtener prefijo del número (OC- por defecto)
$prefijo = "OC-";
if (is_string($numeroOrdenCompraStr) && preg_match('/^([A-Za-z]+-)/', $numeroOrdenCompraStr, $prefijoMatches)) {
    $prefijo = $prefijoMatches[1];
}

$fechaOrden = date('Y-m-d H:i:s');

try {
    // Iniciar transacción
    $enlace->begin_transaction();
    
    // Primero, verificar si existe campo NoOrdenCompra
    $checkField = "SHOW COLUMNS FROM SAS_EncabCompra LIKE 'NoOrdenCompra'";
    $resultCheck = $enlace->query($checkField);
    $campoExiste = ($resultCheck && $resultCheck->num_rows > 0);
    
    if ($campoExiste) {
        // Opción 1: Actualizar campo NoOrdenCompra si existe
        $query = "UPDATE SAS_EncabCompra 
                  SET NoOrdenCompra = ?, 
                      Estado = 'Orden Generada'
                  WHERE IdEncabCompra = ?";
    } else {
        // Opción 2: Si no existe campo específico, solo actualizar estado
        // (El número se mantendrá en el formato OC-000001 pero no se guarda en BD)
        $query = "UPDATE SAS_EncabCompra 
                  SET Estado = 'Orden Generada'
                  WHERE IdEncabCompra = ?";
        
        // Ajustar parámetros para este caso
        $numeroOrdenCompra = $idCompra; // Usar ID como número
    }
    
    $stmt = $enlace->prepare($query);
    
    if ($campoExiste) {
        $stmt->bind_param("ii", $numeroOrdenCompra, $idCompra);
    } else {
        $stmt->bind_param("i", $idCompra);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Error al actualizar compra: " . $stmt->error);
    }
    
    // Verificar si se actualizó alguna fila
    if ($stmt->affected_rows === 0) {
        throw new Exception("No se encontró la compra con ID: $idCompra");
    }
    
    // Confirmar transacción
    $enlace->commit();
    
    // Formatear el número para la respuesta
    $numeroOrdenCompraFormateado = $prefijo . str_pad($numeroOrdenCompra, 6, '0', STR_PAD_LEFT);
    
    echo json_encode([
        'success' => true,
        'message' => 'Orden de compra generada correctamente',
        'numeroOrdenCompra' => $numeroOrdenCompraFormateado,
        'numeroOrdenCompraInt' => $numeroOrdenCompra,
        'fechaOrden' => $fechaOrden,
        'idCompra' => $idCompra,
        'campoNoOrdenCompra' => $campoExiste ? 'Existe' : 'No existe - usando ID',
        'affectedRows' => $stmt->affected_rows
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
        //'queryError' => isset($stmt) ? $stmt->error : null
    ]);
}

if (isset($enlace) && $enlace) {
    $enlace->close();
}
?>