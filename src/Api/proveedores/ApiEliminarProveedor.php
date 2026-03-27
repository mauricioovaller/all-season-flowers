<?php
// ApiEliminarProveedor.php - VERSIÓN ULTRA SIMPLE
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
// Verificar si el proveedor existe
$sqlVerificar = "SELECT Proveedor FROM GEN_Proveedores WHERE IdProveedor = $idProveedor";
$resultVerificar = $enlace->query($sqlVerificar);

if (!$resultVerificar || $resultVerificar->num_rows === 0) {
echo json_encode([
"success" => false,
"message" => "Proveedor no encontrado"
]);
exit;
}

$proveedor = $resultVerificar->fetch_assoc();
$nombreProveedor = $proveedor["Proveedor"];

// ELIMINACIÓN LÓGICA (marcar como inactivo)
// Asumiendo que la tabla GEN_Proveedores tiene un campo ACTIVO o similar
// Si no existe, se puede usar el campo Estado para marcar como "Inactivo"

// Opción 1: Si existe campo ACTIVO
$sql = "UPDATE GEN_Proveedores SET ACTIVO = 0 WHERE IdProveedor = $idProveedor";

// Opción 2: Si no existe ACTIVO pero existe Estado
// $sql = "UPDATE GEN_Proveedores SET Estado = 'Inactivo' WHERE IdProveedor = $idProveedor";

$result = $enlace->query($sql);

if ($result) {
echo json_encode([
"success" => true,
"message" => "Proveedor '$nombreProveedor' desactivado correctamente",
"eliminacionLogica" => true
]);
} else {
echo json_encode([
"success" => false,
"message" => "No se pudo desactivar el proveedor: " . $enlace->error
]);
}

} catch (Exception $e) {
http_response_code(500);
echo json_encode([
"success" => false,
"message" => "Error al desactivar proveedor: " . $e->getMessage()
]);
}

$enlace->close();
?>