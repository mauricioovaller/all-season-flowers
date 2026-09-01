<?php
// src/Api/pedidos/ApiGetRazonesSociales.php
// Devuelve las razones sociales activas ("Empresa Emisora") para el módulo de Pedidos.
// Multi-cliente: si la tabla GEN_RazonesSociales no existe (otro cliente),
// responde lista vacía sin error (200) para no romper el frontend.
header('Content-Type: application/json; charset=UTF-8');

function responderJson(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderJson(['success' => false, 'message' => 'Método no permitido'], 405);
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;
// Helper multi-cliente de razones sociales ("Empresa Emisora").
// Si la carpeta helpers/ no está desplegada en el servidor de un cliente,
// no debe romper el endpoint: se definen fallbacks seguros que desactivan
// la funcionalidad y todo cae a las constantes de empresa.php (original).
if (file_exists(__DIR__ . '/helpers/razon_social.php')) {
    require_once __DIR__ . '/helpers/razon_social.php';
}
if (!function_exists('razon_social_columna_existe')) {
    function razon_social_tabla_existe($enlace): bool { return false; }
    function razon_social_columna_existe($enlace): bool { return false; }
    function razon_social_disponible($enlace): bool { return false; }
    function razon_social_obtener($enlace, $idRazonSocial): ?array { return null; }
    function razon_social_de_pedido($enlace, $idEncabPedido): ?array { return null; }
    function razon_social_logo_absoluto($razonSocial): ?string { return null; }
}
/** @var mysqli $enlace */
$enlace->set_charset('utf8mb4');

// Entrada (opcional): se acepta body vacío o JSON con filtros futuros.
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) && $input !== null) {
    responderJson(['success' => false, 'message' => 'JSON de entrada no válido'], 400);
}

try {
    if (!razon_social_tabla_existe($enlace)) {
        responderJson(['success' => true, 'razonesSociales' => []]);
    }

    $sql = "SELECT IdRazonSocial, Nombre, NIT, Direccion, Ciudad, Pais,
                   Telefono, Email, Logo, PrefijoInvoice, RegistroICA, CultivoRegistroICA,
                   RepresentanteLegal, CCRepresentante,
                   InspectorNombre, InspectorCC, InspectorTP, InspectorRegSV,
                   PorDefecto
            FROM GEN_RazonesSociales
            WHERE Activo = 1
            ORDER BY PorDefecto DESC, Nombre";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception('Error preparando consulta: ' . $enlace->error);
    }
    if (!$stmt->execute()) {
        throw new Exception('Error ejecutando consulta: ' . $stmt->error);
    }
    $stmt->bind_result(
        $IdRazonSocial, $Nombre, $NIT, $Direccion, $Ciudad, $Pais,
        $Telefono, $Email, $Logo, $PrefijoInvoice, $RegistroICA, $CultivoRegistroICA,
        $RepresentanteLegal, $CCRepresentante,
        $InspectorNombre, $InspectorCC, $InspectorTP, $InspectorRegSV,
        $PorDefecto
    );

    $razonesSociales = [];
    while ($stmt->fetch()) {
        $razonesSociales[] = [
            'IdRazonSocial'      => intval($IdRazonSocial),
            'Nombre'             => $Nombre,
            'NIT'                => $NIT,
            'Direccion'          => $Direccion,
            'Ciudad'             => $Ciudad,
            'Pais'               => $Pais,
            'Telefono'           => $Telefono,
            'Email'              => $Email,
            'Logo'               => $Logo,
            'PrefijoInvoice'     => $PrefijoInvoice,
            'RegistroICA'        => $RegistroICA,
            'CultivoRegistroICA' => $CultivoRegistroICA,
            'RepresentanteLegal' => $RepresentanteLegal,
            'CCRepresentante'    => $CCRepresentante,
            'InspectorNombre'    => $InspectorNombre,
            'InspectorCC'        => $InspectorCC,
            'InspectorTP'        => $InspectorTP,
            'InspectorRegSV'     => $InspectorRegSV,
            'PorDefecto'         => intval($PorDefecto),
        ];
    }
    $stmt->close();

    responderJson(['success' => true, 'razonesSociales' => $razonesSociales]);
} catch (Throwable $exception) {
    error_log('Error en ApiGetRazonesSociales.php: ' . $exception->getMessage());
    responderJson(['success' => false, 'message' => 'Error interno del servidor', 'razonesSociales' => []], 500);
}
