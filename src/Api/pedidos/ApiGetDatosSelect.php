<?php
//src/Api/pedidos/ApiGetDatosSelect.php
//echo "LLEGÓ AL ARCHIVO"; exit;
header("Access-Control-Allow-Origin: *"); // Permite solicitudes desde cualquier origen (puedes cambiarlo)
header("Content-Type: application/json; charset=UTF-8");

ini_set('display_errors', 1);
error_reporting(E_ALL);
// Conexión a la base de datos
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
$enlace->set_charset("utf8mb4"); // 👈 importante

if (!$enlace) {
    echo json_encode(["error" => "No se pudo conectar a la base de datos"]);
    exit;
}

// Verificar que la solicitud sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Método no permitido"]);
    http_response_code(405);
    exit;
}

// Función para obtener datos de una tabla
function obtenerDatos($enlace, $query) {
    $result = $enlace->query($query);
    if (!$result) {
        echo json_encode(["error" => "Error en consulta: $query", "detalle" => $enlace->error]);
        exit;
    }
    $datos = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $datos[] = $row;
        }
    }

    return $datos;
}

// Consultas a la base de datos
$clientes = obtenerDatos($enlace, "SELECT IdCliente, NOMBRE, IVA FROM GEN_Clientes ORDER BY NOMBRE");
$ejecutivos = obtenerDatos($enlace, "SELECT IdEjecutivo, NOMEJECUTIVO FROM GEN_Ejecutivos ORDER BY NOMEJECUTIVO");
$monedas = obtenerDatos($enlace, "SELECT IdMoneda, Moneda FROM GEN_Monedas ORDER BY Moneda"); 
$aerolineas = obtenerDatos($enlace, "SELECT IdAerolinea, NOMAEROLINEA FROM GEN_Aerolineas ORDER BY NOMAEROLINEA"); 
$agencias = obtenerDatos($enlace, "SELECT IdAgencia, NOMAGENCIA FROM GEN_Agencias ORDER BY NOMAGENCIA"); 
$productos = obtenerDatos($enlace, "SELECT IdProducto, NOMPRODUCTO FROM GEN_Productos ORDER BY NOMPRODUCTO");
$unidades = obtenerDatos($enlace, "SELECT IdUnidades, DescripUnidad FROM GEN_Unidades ORDER BY DescripUnidad");
$tipoEmpaque = obtenerDatos($enlace, "SELECT IdTipoEmpaque, Descripcion, EquivFull FROM GEN_TipoEmpaque ORDER BY Descripcion");
$predios = obtenerDatos($enlace, "SELECT IdPredio, NombrePredio FROM GEN_Predios ORDER BY NombrePredio");
$conductores = obtenerDatos($enlace, "SELECT IdConductor, NombreConductor, Placas FROM GEN_Conductores ORDER BY NombreConductor");
$ayudantes = obtenerDatos($enlace, "SELECT IdAyudante, NomAyudante FROM GEN_Ayudantes ORDER BY NomAyudante");
$responsables = obtenerDatos($enlace, "SELECT IdResponsable, Nombre FROM GEN_Responsables ORDER BY Nombre");
$mediosPago = obtenerDatos($enlace, "SELECT IdMedioPago, Medio FROM GEN_MedioPagos ORDER BY Medio");

// Razones sociales ("Empresa Emisora") — solo si la tabla existe (multi-cliente)
$razonesSociales = [];
if (razon_social_tabla_existe($enlace)) {
    $razonesSociales = obtenerDatos($enlace, "SELECT IdRazonSocial, Nombre, PorDefecto FROM GEN_RazonesSociales WHERE Activo = 1 ORDER BY PorDefecto DESC, Nombre");
}

echo json_encode([
    'ejecutivos' => $ejecutivos,
    'monedas' => $monedas,
    'clientes' => $clientes,
    'aerolineas' => $aerolineas,
    'agencias' => $agencias,
    'productos' => $productos,        
    'tipoEmpaque' => $tipoEmpaque,
    'unidades' => $unidades,
    'predios' => $predios,
    'conductores' => $conductores,
    'ayudantes' => $ayudantes,
    'responsables' => $responsables,
    'mediosPago' => $mediosPago,
    'razonesSociales' => $razonesSociales
]);

$enlace->close();
?>


