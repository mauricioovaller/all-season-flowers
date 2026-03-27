<?php
// api/dashboard/datos.php - PARA ALL SEASON FLOWERS (COMPRAS Y VENTAS JUNTAS)

// TEMPORAL: ACTIVAR DEBUG
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Use POST.']);
    exit;
}

// Obtener datos del body (JSON)
$json = file_get_contents("php://input");
$input = json_decode($json, true) ?? [];

// Verificar si se recibió JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Error decodificando JSON: ' . json_last_error_msg()
    ]);
    exit;
}

$fechaInicio = $input['fechaInicio'] ?? date('Y-m-01');
$fechaFin = $input['fechaFin'] ?? date('Y-m-d');
$app = $input['app'] ?? 'allseason';

// INCLUIR CONEXIÓN
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

// VERIFICAR CONEXIÓN (COMO EL OTRO ARCHIVO)
if ($enlace->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error de conexión: ' . $enlace->connect_error
    ]);
    exit;
}

$enlace->set_charset("utf8mb4");

// FUNCIÓN PARA EJECUTAR CONSULTAS
function ejecutarConsulta($enlace, $sql, $params = [], $types = "") {
    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }
    
    if (!empty($params)) {
        if (empty($types)) {
            $types = str_repeat("s", count($params));
        }
        $stmt->bind_param($types, ...$params);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Error ejecutando consulta: " . $stmt->error);
    }
    
    return $stmt;
}

try {
    // ==================== DATOS DE COMPRAS ====================

    // 1A. KPI's PRINCIPALES DE COMPRAS
    $sqlComprasKPI = "SELECT 
                        COUNT(DISTINCT enc.IdEncabCompra) as cantidad,
                        SUM(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo * dpc.Precio_Compra, dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Compra)) AS valorTotal,
                        AVG(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo * dpc.Precio_Compra, dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Compra)) AS promedio
                       FROM SAS_EncabCompra enc
                       INNER JOIN SAS_DetEmpaqueCompra dek ON enc.IdEncabCompra = dek.IdEncabCompra
                       INNER JOIN SAS_DetProductoCompra dpc ON dek.IdDetEmpaque = dpc.IdDetEmpaque
                       WHERE enc.FechaEntrega BETWEEN ? AND ? AND enc.Anulado = 0";

    $stmtCompKPI = ejecutarConsulta($enlace, $sqlComprasKPI, [$fechaInicio, $fechaFin]);
    $stmtCompKPI->bind_result($cantidadCompras, $valorTotalCompras, $promedioCompras);
    $stmtCompKPI->fetch();
    $stmtCompKPI->close();

    // 2A. PROVEEDORES (TOP 10)
    $sqlProveedores = "SELECT 
                        prv.Proveedor as nombre,
                        COUNT(DISTINCT enc.IdEncabCompra) as cantidad,
                        SUM(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo * dpc.Precio_Compra, dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Compra)) as valor
                       FROM SAS_EncabCompra enc
                       INNER JOIN GEN_Proveedores prv ON enc.IdProveedor = prv.IdProveedor
                       INNER JOIN SAS_DetEmpaqueCompra dek ON enc.IdEncabCompra = dek.IdEncabCompra
                       INNER JOIN SAS_DetProductoCompra dpc ON dek.IdDetEmpaque = dpc.IdDetEmpaque
                       WHERE enc.FechaEntrega BETWEEN ? AND ?
                         AND enc.Anulado = 0
                       GROUP BY prv.IdProveedor, prv.Proveedor
                       ORDER BY valor DESC
                       LIMIT 10";

    $stmtProv = ejecutarConsulta($enlace, $sqlProveedores, [$fechaInicio, $fechaFin]);
    $stmtProv->bind_result($nombreProv, $cantidadProv, $valorProv);

    $proveedores = [];
    while ($stmtProv->fetch()) {
        $proveedores[] = [
            'nombre' => $nombreProv,
            'cantidad' => intval($cantidadProv),
            'valor' => floatval($valorProv)
        ];
    }
    $stmtProv->close();

    // 3A. PRODUCTOS MÁS COMPRADOS
    $sqlProductosCompras = "SELECT 
                              prd.NOMPRODUCTO as producto,
                              SUM(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo * dpc.Precio_Compra, dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Compra)) as valor,
                              SUM(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo, dek.Cantidad * dpc.Ramos_Caja)) as tallos
                             FROM SAS_DetProductoCompra dpc
                             INNER JOIN SAS_DetEmpaqueCompra dek ON dpc.IdDetEmpaque = dek.IdDetEmpaque
                             INNER JOIN SAS_EncabCompra enc ON dek.IdEncabCompra = enc.IdEncabCompra
                             INNER JOIN GEN_Productos prd ON dpc.IdProducto = prd.IdProducto
                             WHERE enc.FechaEntrega BETWEEN ? AND ?
                               AND enc.Anulado = 0
                             GROUP BY prd.IdProducto, prd.NOMPRODUCTO
                             ORDER BY valor DESC
                             LIMIT 8";

    $stmtProdComp = ejecutarConsulta($enlace, $sqlProductosCompras, [$fechaInicio, $fechaFin]);
    $stmtProdComp->bind_result($productoComp, $valorProdComp, $tallosComp);

    $productosCompras = [];
    $totalValorCompras = 0;
    while ($stmtProdComp->fetch()) {
        $productosCompras[] = [
            'producto' => $productoComp,
            'valor' => floatval($valorProdComp),
            'tallos' => intval($tallosComp)
        ];
        $totalValorCompras += floatval($valorProdComp);
    }
    $stmtProdComp->close();

    // Calcular porcentajes para productos comprados
    foreach ($productosCompras as &$prodComp) {
        $prodComp['porcentaje'] = $totalValorCompras > 0 ? round(($prodComp['valor'] / $totalValorCompras) * 100, 2) : 0;
    }

    // 4A. TENDENCIA DE COMPRAS POR DÍA
    $sqlTendenciaCompras = "SELECT 
                              DATE(enc.FechaEntrega) as fecha,
                              COUNT(DISTINCT enc.IdEncabCompra) as cantidad,
                              SUM(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo * dpc.Precio_Compra, dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Compra)) AS valor
                             FROM SAS_EncabCompra enc
                             INNER JOIN SAS_DetEmpaqueCompra dek ON enc.IdEncabCompra = dek.IdEncabCompra
                             INNER JOIN SAS_DetProductoCompra dpc ON dek.IdDetEmpaque = dpc.IdDetEmpaque
                             WHERE enc.FechaEntrega BETWEEN ? AND ?
                               AND enc.Anulado = 0
                             GROUP BY DATE(enc.FechaEntrega)
                             ORDER BY fecha";

    $stmtTenComp = ejecutarConsulta($enlace, $sqlTendenciaCompras, [$fechaInicio, $fechaFin]);
    $stmtTenComp->bind_result($fechaComp, $cantidadDiaComp, $valorDiaComp);

    $tendenciaCompras = [];
    while ($stmtTenComp->fetch()) {
        $tendenciaCompras[] = [
            'fecha' => $fechaComp,
            'cantidad' => intval($cantidadDiaComp),
            'valor' => floatval($valorDiaComp)
        ];
    }
    $stmtTenComp->close();

    // ==================== DATOS DE VENTAS ====================

    // 1B. KPI's PRINCIPALES DE VENTAS
    $sqlVentasKPI = "SELECT 
                      COUNT(DISTINCT enc.IdEncabPedido) as cantidad,
                      SUM(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo * dpc.Precio_Venta, dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Venta)) AS valorTotal,
                      AVG(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo * dpc.Precio_Venta, dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Venta)) AS promedio
                     FROM SAS_EncabPedido enc
                     INNER JOIN SAS_DetEmpaque dek ON enc.IdEncabPedido = dek.IdEncabPedido
                     INNER JOIN SAS_DetProducto dpc ON dek.IdDetEmpaque = dpc.IdDetEmpaque
                     WHERE enc.FechaEntrega BETWEEN ? AND ? AND enc.Anulado = 0";

    $stmtVentKPI = ejecutarConsulta($enlace, $sqlVentasKPI, [$fechaInicio, $fechaFin]);
    $stmtVentKPI->bind_result($cantidadVentas, $valorTotalVentas, $promedioVentas);
    $stmtVentKPI->fetch();
    $stmtVentKPI->close();

    // 2B. CLIENTES (TOP 10)
    $sqlClientes = "SELECT 
                      cli.NOMBRE as nombre,
                      COUNT(DISTINCT enc.IdEncabPedido) as cantidad,
                      SUM(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo * dpc.Precio_Venta, dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Venta)) as valor
                     FROM SAS_EncabPedido enc
                     INNER JOIN GEN_Clientes cli ON enc.IdCliente = cli.IdCliente
                     INNER JOIN SAS_DetEmpaque dek ON enc.IdEncabPedido = dek.IdEncabPedido
                     INNER JOIN SAS_DetProducto dpc ON dek.IdDetEmpaque = dpc.IdDetEmpaque
                     WHERE enc.FechaEntrega BETWEEN ? AND ?
                       AND enc.Anulado = 0
                     GROUP BY cli.IdCliente, cli.NOMBRE
                     ORDER BY valor DESC
                     LIMIT 10";

    $stmtCli = ejecutarConsulta($enlace, $sqlClientes, [$fechaInicio, $fechaFin]);
    $stmtCli->bind_result($nombreCli, $cantidadCli, $valorCli);

    $clientes = [];
    while ($stmtCli->fetch()) {
        $clientes[] = [
            'nombre' => $nombreCli,
            'cantidad' => intval($cantidadCli),
            'valor' => floatval($valorCli)
        ];
    }
    $stmtCli->close();

    // 3B. PRODUCTOS MÁS VENDIDOS
    $sqlProductosVentas = "SELECT 
                            prd.NOMPRODUCTO as producto,
                            SUM(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo * dpc.Precio_Venta, dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Venta)) as valor,
                            SUM(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo, dek.Cantidad * dpc.Ramos_Caja)) as tallos
                           FROM SAS_DetProducto dpc
                           INNER JOIN SAS_DetEmpaque dek ON dpc.IdDetEmpaque = dek.IdDetEmpaque
                           INNER JOIN SAS_EncabPedido enc ON dek.IdEncabPedido = enc.IdEncabPedido
                           INNER JOIN GEN_Productos prd ON dpc.IdProducto = prd.IdProducto
                           WHERE enc.FechaEntrega BETWEEN ? AND ?
                             AND enc.Anulado = 0
                           GROUP BY prd.IdProducto, prd.NOMPRODUCTO
                           ORDER BY valor DESC
                           LIMIT 8";

    $stmtProdVent = ejecutarConsulta($enlace, $sqlProductosVentas, [$fechaInicio, $fechaFin]);
    $stmtProdVent->bind_result($productoVent, $valorProdVent, $tallosVent);

    $productosVentas = [];
    $totalValorVentas = 0;
    while ($stmtProdVent->fetch()) {
        $productosVentas[] = [
            'producto' => $productoVent,
            'valor' => floatval($valorProdVent),
            'tallos' => intval($tallosVent)
        ];
        $totalValorVentas += floatval($valorProdVent);
    }
    $stmtProdVent->close();

    // Calcular porcentajes para productos vendidos
    foreach ($productosVentas as &$prodVent) {
        $prodVent['porcentaje'] = $totalValorVentas > 0 ? round(($prodVent['valor'] / $totalValorVentas) * 100, 2) : 0;
    }

    // 4B. TENDENCIA DE VENTAS POR DÍA
    $sqlTendenciaVentas = "SELECT 
                            DATE(enc.FechaEntrega) as fecha,
                            COUNT(DISTINCT enc.IdEncabPedido) as cantidad,
                            SUM(IF(dpc.IdUnidad = 4, dek.Cantidad * dpc.Ramos_Caja * dpc.Tallos_Ramo * dpc.Precio_Venta, dek.Cantidad * dpc.Ramos_Caja * dpc.Precio_Venta)) AS valor
                           FROM SAS_EncabPedido enc
                           INNER JOIN SAS_DetEmpaque dek ON enc.IdEncabPedido = dek.IdEncabPedido
                           INNER JOIN SAS_DetProducto dpc ON dek.IdDetEmpaque = dpc.IdDetEmpaque
                           WHERE enc.FechaEntrega BETWEEN ? AND ?
                             AND enc.Anulado = 0
                           GROUP BY DATE(enc.FechaEntrega)
                           ORDER BY fecha";

    $stmtTenVent = ejecutarConsulta($enlace, $sqlTendenciaVentas, [$fechaInicio, $fechaFin]);
    $stmtTenVent->bind_result($fechaVent, $cantidadDiaVent, $valorDiaVent);

    $tendenciaVentas = [];
    while ($stmtTenVent->fetch()) {
        $tendenciaVentas[] = [
            'fecha' => $fechaVent,
            'cantidad' => intval($cantidadDiaVent),
            'valor' => floatval($valorDiaVent)
        ];
    }
    $stmtTenVent->close();

    // ==================== RESPUESTA COMBINADA ====================

    echo json_encode([
        'success' => true,
        'app' => $app,
        'periodo' => [
            'inicio' => $fechaInicio,
            'fin' => $fechaFin
        ],
        'compras' => [
            'kpis' => [
                'totalTransacciones' => intval($cantidadCompras),
                'valorTotal' => floatval($valorTotalCompras),
                'promedioTransaccion' => floatval($promedioCompras)
            ],
            'proveedores' => $proveedores,
            'productos' => $productosCompras,
            'tendencia' => $tendenciaCompras
        ],
        'ventas' => [
            'kpis' => [
                'totalTransacciones' => intval($cantidadVentas),
                'valorTotal' => floatval($valorTotalVentas),
                'promedioTransaccion' => floatval($promedioVentas)
            ],
            'clientes' => $clientes,
            'productos' => $productosVentas,
            'tendencia' => $tendenciaVentas
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener datos del dashboard: ' . $e->getMessage()
    ]);
}

$enlace->close();
?>