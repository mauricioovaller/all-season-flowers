<?php
// src/Api/compras/ApiGetUltimoNumeroOrdenCompra.php
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

try {
    // NOTA: Para compras, necesitamos decidir cómo se almacenan los números de orden
    // Opción 1: Si hay un campo específico en SAS_EncabCompra (ej: NoOrdenCompra)
    // Opción 2: Si se usa el IdEncabCompra como número de orden
    
    // Primero, verificar si existe campo NoOrdenCompra
    $checkField = "SHOW COLUMNS FROM SAS_EncabCompra LIKE 'NoOrdenCompra'";
    $resultCheck = $enlace->query($checkField);
    
    if ($resultCheck && $resultCheck->num_rows > 0) {
        // Opción 1: Campo específico existe
        $query = "SELECT MAX(NoOrdenCompra) as ultimoNumero 
                  FROM SAS_EncabCompra 
                  WHERE NoOrdenCompra IS NOT NULL 
                  AND NoOrdenCompra > 0";
    } else {
        // Opción 2: Usar ID como número de orden (como en pedidos)
        $query = "SELECT MAX(IdEncabCompra) as ultimoNumero 
                  FROM SAS_EncabCompra";
    }
    
    $result = $enlace->query($query);
    
    if (!$result) {
        throw new Exception("Error en la consulta: " . $enlace->error);
    }
    
    $row = $result->fetch_assoc();
    $ultimoNumero = $row['ultimoNumero'] ? (int)$row['ultimoNumero'] : 0;
    $siguienteNumero = $ultimoNumero + 1;
    
    // Definir prefijo para orden de compra
    $prefijo = "OC-";
    
    echo json_encode([
        'success' => true,
        'ultimoNumero' => $ultimoNumero,
        'ultimoNumeroFormateado' => $ultimoNumero > 0 ? $prefijo . str_pad($ultimoNumero, 6, '0', STR_PAD_LEFT) : 'Ninguna',
        'prefijo' => $prefijo,
        'siguienteNumero' => $siguienteNumero,
        'siguienteNumeroFormateado' => $prefijo . str_pad($siguienteNumero, 6, '0', STR_PAD_LEFT),
        'nota' => $resultCheck && $resultCheck->num_rows > 0 ? 
                 'Usando campo NoOrdenCompra' : 'Usando IdEncabCompra como número de orden'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'ultimoNumero' => 0,
        'prefijo' => 'OC-',
        'siguienteNumeroFormateado' => 'OC-000001',
        'nota' => 'Error: usando valor por defecto'
    ]);
}

$enlace->close();
?>