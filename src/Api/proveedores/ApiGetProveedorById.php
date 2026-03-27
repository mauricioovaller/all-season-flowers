<?php
// ApiGetProveedorById.php - VERSIÓN ULTRA SIMPLE
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

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || !isset($data["idProveedor"])) {
http_response_code(400);
echo json_encode(["success" => false, "message" => "ID de proveedor no proporcionado"]);
exit;
}

$idProveedor = intval($data["idProveedor"]);

try {
$sql = "SELECT * FROM GEN_Proveedores WHERE IdProveedor = $idProveedor";
$result = $enlace->query($sql);

if (!$result || $result->num_rows === 0) {
echo json_encode([
"success" => false,
"message" => "Proveedor no encontrado"
]);
exit;
}

$proveedor = $result->fetch_assoc();

// Convertir bits a booleanos si existen esos campos
if (isset($proveedor["ACTIVO"])) {
$proveedor["ACTIVO"] = $proveedor["ACTIVO"] == 1;
}
if (isset($proveedor["IVA"])) {
$proveedor["IVA"] = $proveedor["IVA"] == 1;
}

echo json_encode([
"success" => true,
"proveedor" => $proveedor
]);

} catch (Exception $e) {
http_response_code(500);
echo json_encode([
"success" => false,
"message" => "Error al obtener proveedor: " . $e->getMessage()
]);
}

$enlace->close();
?>