<?php
// ApiValidarNIT.php - VERSIÓN MEJORADA CON SEGURIDAD
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Validar método HTTP
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido. Use POST."]);
    exit;
}

// Incluir conexión a base de datos
require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

// Verificar conexión
if (!isset($enlace) || $enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión a la base de datos"]);
    exit;
}

// Obtener y validar datos JSON
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "JSON inválido"]);
    exit;
}

if (!$data || !isset($data["nit"])) {
    echo json_encode(["existe" => false, "message" => "NIT no proporcionado"]);
    exit;
}

// Limpiar y validar datos
$nit = trim($data["nit"]);
$idExcluir = isset($data["idExcluir"]) ? intval($data["idExcluir"]) : 0;

// Validar formato básico del NIT (puedes ajustar según tus necesidades)
if (empty($nit)) {
    echo json_encode(["existe" => false, "message" => "NIT vacío"]);
    exit;
}

// Validar longitud del NIT (ajusta según tu país)
if (strlen($nit) < 3 || strlen($nit) > 20) {
    echo json_encode(["existe" => false, "message" => "NIT con longitud inválida"]);
    exit;
}

try {
    // Usar consultas preparadas para prevenir SQL injection
    $sql = "SELECT IdProveedor FROM GEN_Proveedores WHERE NIT = ?";

    if ($idExcluir > 0) {
        $sql .= " AND IdProveedor != ?";
        $stmt = $enlace->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("si", $nit, $idExcluir);
        }
    } else {
        $stmt = $enlace->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("s", $nit);
        }
    }

    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $enlace->error);
    }

    $stmt->execute();
    $stmt->bind_result($idProveedor);
    $existe = $stmt->fetch();
    $stmt->close();

    // Respuesta exitosa
    echo json_encode([
        "success" => true,
        "existe" => $existe ? true : false,
        "nit" => $nit,
        "message" => $existe ? "NIT ya existe en la base de datos" : "NIT disponible"
    ]);
    $enlace->close();
} catch (Exception $e) {
    // Manejo de errores
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "existe" => false,
        "message" => "Error en la validación",
        "error" => $e->getMessage()
    ]);
}
