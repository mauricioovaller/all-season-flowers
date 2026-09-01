<?php
/**
 * Obtiene datos para los selects del formulario de Pedidos ComisiÃ³n
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'MÃ©todo no permitido']);
    exit;
}

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;

$response = ['success' => true];

try {
    $clientes = obtenerDatos($enlace, "SELECT IdCliente, NOMBRE, IVA FROM GEN_Clientes ORDER BY NOMBRE");
    $ejecutivos = obtenerDatos($enlace, "SELECT IdEjecutivo, NOMEJECUTIVO FROM GEN_Ejecutivos ORDER BY NOMEJECUTIVO");
    $monedas = obtenerDatos($enlace, "SELECT IdMoneda, Moneda FROM GEN_Monedas ORDER BY Moneda");
    $aerolineas = obtenerDatos($enlace, "SELECT IdAerolinea, NOMAEROLINEA FROM GEN_Aerolineas ORDER BY NOMAEROLINEA");
    $agencias = obtenerDatos($enlace, "SELECT IdAgencia, NOMAGENCIA FROM GEN_Agencias ORDER BY NOMAGENCIA");
    $productos = obtenerDatos($enlace, "SELECT IdProducto, NOMPRODUCTO, CODPRODUCTO FROM GEN_Productos ORDER BY NOMPRODUCTO");
    $variedades = obtenerDatos($enlace, "SELECT IdVariedad, NOMVARIEDAD, IdProducto FROM GEN_Variedades WHERE ACTIVO = 1 ORDER BY NOMVARIEDAD");
    $grados = obtenerDatos($enlace, "SELECT IdGrado, NOMGRADO, IdProducto FROM GEN_Grados WHERE ACTIVO = 1 ORDER BY NOMGRADO");
    $tipoEmpaque = obtenerDatos($enlace, "SELECT IdTipoEmpaque, Descripcion, EquivFull FROM GEN_TipoEmpaque ORDER BY Descripcion");
    $unidades = obtenerDatos($enlace, "SELECT IdUnidades, DescripUnidad FROM GEN_Unidades ORDER BY DescripUnidad");
    $predios = obtenerDatos($enlace, "SELECT IdPredio, NombrePredio FROM GEN_Predios ORDER BY NombrePredio");

    echo json_encode([
        'success' => true,
        'clientes' => $clientes,
        'ejecutivos' => $ejecutivos,
        'monedas' => $monedas,
        'aerolineas' => $aerolineas,
        'agencias' => $agencias,
        'productos' => $productos,
        'variedades' => $variedades,
        'grados' => $grados,
        'tipoEmpaque' => $tipoEmpaque,
        'unidades' => $unidades,
        'predios' => $predios,
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener datos: ' . $e->getMessage(),
    ]);
}

function obtenerDatos($enlace, $query) {
    $result = $enlace->query($query);
    if (!$result) return [];
    $datos = [];
    while ($row = $result->fetch_assoc()) {
        $datos[] = $row;
    }
    return $datos;
}
