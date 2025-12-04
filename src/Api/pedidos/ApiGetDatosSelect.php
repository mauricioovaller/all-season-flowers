<?php
//echo "LLEGÓ AL ARCHIVO"; exit;
header("Access-Control-Allow-Origin: *"); // Permite solicitudes desde cualquier origen (puedes cambiarlo)
header("Content-Type: application/json; charset=UTF-8");

ini_set('display_errors', 1);
error_reporting(E_ALL);
// Conexión a la base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";
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
$tipoEmpaque = obtenerDatos($enlace, "SELECT IdTipoEmpaque, Descripcion FROM GEN_TipoEmpaque ORDER BY Descripcion");
$predios = obtenerDatos($enlace, "SELECT IdPredio, NombrePredio FROM GEN_Predios ORDER BY NombrePredio");
$conductores = obtenerDatos($enlace, "SELECT IdConductor, NombreConductor FROM GEN_Conductores ORDER BY NombreConductor");
$ayudantes = obtenerDatos($enlace, "SELECT IdAyudante, NomAyudante FROM GEN_Ayudantes ORDER BY NomAyudante");
$responsables = obtenerDatos($enlace, "SELECT IdResponsable, Nombre FROM GEN_Responsables ORDER BY Nombre");

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
    'responsables' => $responsables
]);

$enlace->close();
?>


