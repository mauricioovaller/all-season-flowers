<?php
// ApiGetUltimoCodigoProveedor.php - VERSIÓN ULTRA SIMPLE
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
http_response_code(405);
echo json_encode(["success" => false, "message" => "Método no permitido"]);
exit;
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($enlace->connect_error) {
http_response_code(500);
echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
exit;
}

try {
$sql = "SELECT CodProveedor FROM GEN_Proveedores
WHERE CodProveedor LIKE 'PROV-%'
ORDER BY CodProveedor DESC
LIMIT 1";

$result = $enlace->query($sql);

if ($result && $result->num_rows > 0) {
$row = $result->fetch_assoc();
$ultimoCodigo = $row["CodProveedor"];

// Extraer número del código
if (preg_match('/PROV-(\d+)/', $ultimoCodigo, $matches)) {
$ultimoNumero = intval($matches[1]);
$siguienteNumero = $ultimoNumero + 1;
} else {
$siguienteNumero = 1;
}
} else {
$ultimoCodigo = "PROV-000";
$siguienteNumero = 1;
}

echo json_encode([
"success" => true,
"ultimoCodigo" => $ultimoCodigo,
"siguiente" => $siguienteNumero,
"siguienteCodigo" => "PROV-" . str_pad($siguienteNumero, 3, "0", STR_PAD_LEFT)
]);

} catch (Exception $e) {
echo json_encode([
"success" => false,
"ultimoCodigo" => "PROV-000",
"siguiente" => 1,
"siguienteCodigo" => "PROV-001",
"message" => "Usando valor por defecto: " . $e->getMessage()
]);
}

$enlace->close();
?>