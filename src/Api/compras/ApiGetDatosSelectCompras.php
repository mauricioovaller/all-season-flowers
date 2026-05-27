<?php
// src/Api/compras/ApiGetDatosSelectCompras.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Conexión a la base de datos
require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;
$enlace->set_charset("utf8mb4");

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

// Función para obtener datos de una tabla usando bind_result()
function obtenerDatos($enlace, $query, $params = [], $types = "") {
    $stmt = $enlace->prepare($query);
    if (!$stmt) {
        echo json_encode(["error" => "Error en consulta: $query", "detalle" => $enlace->error]);
        exit;
    }
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    
    // Obtener metadatos para vincular resultados dinámicamente
    $meta = $stmt->result_metadata();
    $fields = [];
    while ($field = $meta->fetch_field()) {
        $fields[] = &$row[$field->name];
    }
    
    call_user_func_array([$stmt, 'bind_result'], $fields);
    
    $datos = [];
    while ($stmt->fetch()) {
        $item = [];
        foreach ($row as $key => $val) {
            $item[$key] = $val;
        }
        $datos[] = $item;
    }
    
    $stmt->close();
    return $datos;
}

// Consultas a la base de datos para COMPRAS
$proveedores = obtenerDatos($enlace, 
    "SELECT IdProveedor, Proveedor, Nit, IVA FROM GEN_Proveedores WHERE ACTIVO = 1 ORDER BY Proveedor");

$compradores = obtenerDatos($enlace, 
    "SELECT IdComprador, NomComprador, E_MAILComprador FROM GEN_Compradores WHERE ACTIVO = 1 ORDER BY NomComprador");

// Los demás datos son compartidos con pedidos
$monedas = obtenerDatos($enlace, "SELECT IdMoneda, Moneda FROM GEN_Monedas ORDER BY Moneda");
$productos = obtenerDatos($enlace, "SELECT IdProducto, NOMPRODUCTO FROM GEN_Productos ORDER BY NOMPRODUCTO");
$unidades = obtenerDatos($enlace, "SELECT IdUnidades, DescripUnidad FROM GEN_Unidades ORDER BY DescripUnidad");
$tipoEmpaque = obtenerDatos($enlace, "SELECT IdTipoEmpaque, Descripcion, EquivFull FROM GEN_TipoEmpaque ORDER BY Descripcion");
$predios = obtenerDatos($enlace, "SELECT IdPredio, NombrePredio FROM GEN_Predios ORDER BY NombrePredio");
$mediosPago = obtenerDatos($enlace, "SELECT IdMedioPago, Medio FROM GEN_MedioPagos ORDER BY Medio");

// Valores fijos para TipoCompra
$tiposCompra = [
    ["valor" => "ADICIONAL", "nombre" => "Adicional"],
    ["valor" => "REGULAR", "nombre" => "Regular"],
    ["valor" => "ORDEN FIJA", "nombre" => "Orden Fija"],
    ["valor" => "OTRO", "nombre" => "Otro"]
];

echo json_encode([
    'success' => true,
    'proveedores' => $proveedores,
    'compradores' => $compradores,
    'monedas' => $monedas,
    'productos' => $productos,
    'tipoEmpaque' => $tipoEmpaque,
    'unidades' => $unidades,
    'predios' => $predios,
    'tiposCompra' => $tiposCompra,
    'mediosPago' => $mediosPago
]);

$enlace->close();
?>