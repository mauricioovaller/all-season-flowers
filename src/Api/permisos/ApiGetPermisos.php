<?php
// src/Api/permisos/ApiGetPermisos.php
// Devuelve los permisos de menú del usuario autenticado según la tabla Permisos.

session_start();

if (!isset($_SESSION['idUsuario'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

$idUsuario = intval($_SESSION['idUsuario']);

$sql = "SELECT NombreOpcion, Ruta FROM Permisos WHERE IdUsuario = ?";
$stmt = $enlace->prepare($sql);
$stmt->bind_param("i", $idUsuario);
$stmt->execute();
$stmt->bind_result($nombreOpcion, $ruta);

$permisos = [];
while ($stmt->fetch()) {
    $permisos[] = [
        "nombreOpcion" => $nombreOpcion,
        "ruta" => $ruta,
    ];
}
$stmt->close();

echo json_encode([
    "success" => true,
    "permisos" => $permisos,
]);
