<?php
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST"); 
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Incluir la conexión a la base de datos
$rutaConexion = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if (!file_exists($rutaConexion)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Archivo de conexión no encontrado: ' . $rutaConexion
    ]);
    exit;
}

include $rutaConexion;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

// Leer el input JSON
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(["error" => "Datos JSON inválidos o vacíos"]);
    exit;
}

if (!isset($input['numeroFactura'])) {
    http_response_code(400);
    echo json_encode(["error" => "Número de factura requerido"]);
    exit;
}

$numeroFactura = (int) $input['numeroFactura'];

// Validar que sea un número válido
if ($numeroFactura <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Número de factura inválido: " . $input['numeroFactura']]);
    exit;
}

// Función auxiliar para convertir resultado a array asociativo
function getResultArray($stmt) {
    $metadata = $stmt->result_metadata();
    $fields = $metadata->fetch_fields();
    
    $params = [];
    $row = [];
    
    foreach ($fields as $field) {
        $params[] = &$row[$field->name];
    }
    
    call_user_func_array([$stmt, 'bind_result'], $params);
    
    $results = [];
    while ($stmt->fetch()) {
        $currentRow = [];
        foreach ($row as $key => $val) {
            $currentRow[$key] = $val;
        }
        $results[] = $currentRow;
    }
    
    $stmt->free_result();
    return $results;
}

try {
    // 1. Obtener datos del pedido con esta factura
    $query = "SELECT 
                p.*,
                c.NOMBRE as NombreCliente,
                c.NIT as NitCliente,
                c.Direc1 as DireccionCliente,
                c.TEL1 as TelefonoCliente,
                c.CIUDAD as CiudadCliente,
                e.NOMEJECUTIVO as NombreEjecutivo,
                m.Moneda as NombreMoneda,
                a.NOMAEROLINEA as NombreAerolinea,
                ag.NOMAGENCIA as NombreAgencia
              FROM SAS_EncabPedido p
              LEFT JOIN GEN_Clientes c ON p.IdCliente = c.IdCliente
              LEFT JOIN GEN_Ejecutivos e ON p.IdEjecutivo = e.IdEjecutivo
              LEFT JOIN GEN_Monedas m ON p.IdMoneda = m.IdMoneda
              LEFT JOIN GEN_Aerolineas a ON p.IdAerolinea = a.IdAerolinea
              LEFT JOIN GEN_Agencias ag ON p.IdAgencia = ag.IdAgencia
              WHERE p.Factura = ?";
    
    $stmt = $enlace->prepare($query);
    if (!$stmt) {
        throw new Exception("Error en preparación de consulta: " . $enlace->error);
    }
    
    $stmt->bind_param("i", $numeroFactura);
    if (!$stmt->execute()) {
        throw new Exception("Error al ejecutar consulta: " . $stmt->error);
    }
    
    $pedidos = getResultArray($stmt);
    
    if (count($pedidos) === 0) {
        throw new Exception("No se encontró factura con número: " . $numeroFactura);
    }
    
    $pedido = $pedidos[0];
    
    // 2. Obtener empaques del pedido
    $queryEmpaques = "SELECT 
                        de.*,
                        te.Descripcion as TipoEmpaque,
                        te.EquivFull
                      FROM SAS_DetEmpaque de
                      LEFT JOIN GEN_TipoEmpaque te ON de.IdTipoEmpaque = te.IdTipoEmpaque
                      WHERE de.IdEncabPedido = ?";
    
    $stmt2 = $enlace->prepare($queryEmpaques);
    if (!$stmt2) {
        throw new Exception("Error en preparación de consulta de empaques: " . $enlace->error);
    }
    
    $stmt2->bind_param("i", $pedido['IdEncabPedido']);
    if (!$stmt2->execute()) {
        throw new Exception("Error al ejecutar consulta de empaques: " . $stmt2->error);
    }
    
    $empaques = getResultArray($stmt2);
    
    // 3. Obtener productos de cada empaque
    $productosPorEmpaque = [];
    foreach ($empaques as $empaque) {
        $queryProductos = "SELECT 
                            dp.*,
                            p.NOMPRODUCTO as NombreProducto,
                            v.NOMVARIEDAD as NombreVariedad,
                            g.NOMGRADO as NombreGrado,
                            u.DescripUnidad as NombreUnidad,
                            pr.NombrePredio as NombrePredio
                          FROM SAS_DetProducto dp
                          LEFT JOIN GEN_Productos p ON dp.IdProducto = p.IdProducto
                          LEFT JOIN GEN_Variedades v ON dp.IdVariedad = v.IdVariedad
                          LEFT JOIN GEN_Grados g ON dp.IdGrado = g.IdGrado
                          LEFT JOIN GEN_Unidades u ON dp.IdUnidad = u.IdUnidades
                          LEFT JOIN GEN_Predios pr ON dp.IdPredio = pr.IdPredio
                          WHERE dp.IdDetEmpaque = ?";
        
        $stmt3 = $enlace->prepare($queryProductos);
        if ($stmt3) {
            $stmt3->bind_param("i", $empaque['IdDetEmpaque']);
            $stmt3->execute();
            $productos = getResultArray($stmt3);
            $productosPorEmpaque[$empaque['IdDetEmpaque']] = $productos;
            $stmt3->close();
        }
    }
    
    // 4. Preparar datos para la respuesta
    $datosFactura = [
        'success' => true,
        'message' => 'Datos de factura obtenidos correctamente',
        'factura' => [
            'numero' => 'FACT-' . str_pad($numeroFactura, 6, '0', STR_PAD_LEFT),
            'numeroInt' => $numeroFactura,
            'fecha' => $pedido['FechaFactura'] ?? date('Y-m-d'),
            'fechaPedido' => $pedido['FechaSolicitud'] ?? '',
            'fechaEntrega' => $pedido['FechaEntrega'] ?? '',
        ],
        'cliente' => [
            'nombre' => $pedido['NombreCliente'] ?? '',
            'nit' => $pedido['NitCliente'] ?? '',
            'direccion' => $pedido['DireccionCliente'] ?? '',
            'telefono' => $pedido['TelefonoCliente'] ?? '',
            'ciudad' => $pedido['CiudadCliente'] ?? '',
        ],
        'pedido' => [
            'numero' => $pedido['NumeroPedido'] ?? 'PED-' . str_pad($pedido['IdEncabPedido'], 6, '0', STR_PAD_LEFT),
            'id' => $pedido['IdEncabPedido'],
            'poCliente' => $pedido['PO_Cliente'] ?? '',
            'observaciones' => $pedido['Observaciones'] ?? '',
            'moneda' => $pedido['NombreMoneda'] ?? '',
            'trm' => $pedido['TRM'] ?? 0,
            'aerolinea' => $pedido['NombreAerolinea'] ?? '',
            'agencia' => $pedido['NombreAgencia'] ?? '',
            'awb' => $pedido['AWB'] ?? '',
            'awbHija' => $pedido['AWB_HIJA'] ?? '',
            'awbNieta' => $pedido['AWB_NIETA'] ?? '',
            'puertoSalida' => $pedido['PuertoSalida'] ?? '',
        ],
        'totales' => [
            'subtotal' => $pedido['ValorTotal'] ?? 0,
            'iva' => $pedido['TotalIVA'] ?? 0,
            'total' => $pedido['TotalGeneral'] ?? 0,
            'tieneIVA' => ($pedido['IVA'] ?? 0) == 1,
        ],
        'empaques' => $empaques,
        'productosPorEmpaque' => $productosPorEmpaque,
        'empaquesCount' => count($empaques),
        'productosCount' => array_sum(array_map('count', $productosPorEmpaque)),
        'timestamp' => date('Y-m-d H:i:s'),
    ];
    
    // Por ahora, retornamos los datos en JSON
    // Más adelante podríamos integrar TCPDF o Dompdf para generar PDF real
    echo json_encode($datosFactura, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}

// Cerrar conexiones
if (isset($stmt) && $stmt) $stmt->close();
if (isset($stmt2) && $stmt2) $stmt2->close();
if (isset($enlace) && $enlace) $enlace->close();
?>