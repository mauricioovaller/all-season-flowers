<?php
// ApiGetUltimoCodigoCliente.php - VERSIÓN ULTRA SIMPLE
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

try {
    $sql = "SELECT CodCliente FROM GEN_Clientes 
            WHERE CodCliente LIKE 'CLI-%' 
            ORDER BY CodCliente DESC 
            LIMIT 1";
    
    $result = $enlace->query($sql);
    
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $ultimoCodigo = $row["CodCliente"];
        
        // Extraer número del código
        if (preg_match('/CLI-(\d+)/', $ultimoCodigo, $matches)) {
            $ultimoNumero = intval($matches[1]);
            $siguienteNumero = $ultimoNumero + 1;
        } else {
            $siguienteNumero = 1;
        }
    } else {
        $ultimoCodigo = "CLI-000";
        $siguienteNumero = 1;
    }
    
    echo json_encode([
        "success" => true,
        "ultimoCodigo" => $ultimoCodigo,
        "siguiente" => $siguienteNumero,
        "siguienteCodigo" => "CLI-" . str_pad($siguienteNumero, 3, "0", STR_PAD_LEFT)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "ultimoCodigo" => "CLI-000",
        "siguiente" => 1,
        "siguienteCodigo" => "CLI-001",
        "message" => "Usando valor por defecto: " . $e->getMessage()
    ]);
}

$enlace->close();
?>