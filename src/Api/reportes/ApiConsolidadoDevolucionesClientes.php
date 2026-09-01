<?php
// src/Api/reportes/ApiConsolidadoDevolucionesClientes.php - Consolidado de Devoluciones de Clientes
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['fechaInicio']) || !isset($data['fechaFin'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos. Se requiere fechaInicio y fechaFin"]);
    exit;
}

$fechaInicio = $data['fechaInicio'];
$fechaFin    = $data['fechaFin'];

if ($fechaInicio > $fechaFin) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "La fecha inicial no puede ser mayor a la fecha final"]);
    exit;
}

try {
    $sql = "
        SELECT
            cli.NOMBRE AS Cliente,
            DATE_FORMAT(enc.FechaDevolucion, '%Y-%m-%d') AS FechaDevolucion,
            enc.IdDevolucion AS IdDevolucion,
            enc.Factura AS NumeroFactura,
            COALESCE(aer.NOMAEROLINEA, '') AS Aerolinea,
            COALESCE(age.NOMAGENCIA, '') AS Agencia,
            dem.PO_Empaque AS PO,
            pro.NOMPRODUCTO AS Producto,
            COALESCE(var.NOMVARIEDAD, '') AS Variedad,
            COALESCE(gra.NOMGRADO, '') AS Grado,
            und.DescripUnidad AS UnidadFacturacion,
            tem.Descripcion AS TipoEmpaque,
            dpr.TallosDevolucion AS TallosDevueltos,
            dpr.Precio_Venta AS PrecioVenta,
            COALESCE(dpr.MotivoDevolucion, '') AS Motivo,
            COALESCE(dpr.Flete, 0) AS Flete,
            COALESCE(dpr.Fumigacion, 0) AS Fumigacion,
            COALESCE(dpr.Otros, 0) AS Otros,
            (dpr.TallosDevolucion * dpr.Precio_Venta) AS SubTotal,
            enc.IVA AS TieneIVA,
            IF(enc.IVA <> 0,
               dpr.TallosDevolucion * dpr.Precio_Venta * 0.19,
               0) AS ValorIVA,
            ((dpr.TallosDevolucion * dpr.Precio_Venta)
             + IFNULL(dpr.Flete, 0) + IFNULL(dpr.Fumigacion, 0) + IFNULL(dpr.Otros, 0)
             + IF(enc.IVA <> 0, dpr.TallosDevolucion * dpr.Precio_Venta * 0.19, 0)) AS TotalDevolucion
        FROM SAS_EncabPedido enc
        INNER JOIN GEN_Clientes cli ON enc.IdCliente = cli.IdCliente
        INNER JOIN SAS_DetEmpaque dem ON enc.IdEncabPedido = dem.IdEncabPedido AND dem.Anulado = 0
        INNER JOIN SAS_DetProducto dpr ON dem.IdDetEmpaque = dpr.IdDetEmpaque AND dpr.Anulado = 0
        INNER JOIN GEN_Productos pro ON dpr.IdProducto = pro.IdProducto
        LEFT JOIN GEN_Variedades var ON dpr.IdVariedad = var.IdVariedad
        LEFT JOIN GEN_Grados gra ON dpr.IdGrado = gra.IdGrado
        INNER JOIN GEN_Unidades und ON dpr.IdUnidad = und.IdUnidades
        INNER JOIN GEN_TipoEmpaque tem ON dem.IdTipoEmpaque = tem.IdTipoEmpaque
        LEFT JOIN GEN_Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
        LEFT JOIN GEN_Agencias age ON enc.IdAgencia = age.IdAgencia
        WHERE enc.Anulado = 0
          AND enc.IdDevolucion IS NOT NULL
          AND enc.IdDevolucion > 0
          AND dpr.TallosDevolucion > 0
          AND enc.FechaDevolucion BETWEEN ? AND ?
        ORDER BY enc.FechaDevolucion, enc.IdEncabPedido, dem.IdDetEmpaque, dpr.IdDetProducto
    ";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $stmt->bind_result(
        $cliente,
        $fechaDevolucion,
        $idDevolucion,
        $numeroFactura,
        $aerolinea,
        $agencia,
        $po,
        $producto,
        $variedad,
        $grado,
        $unidadFacturacion,
        $tipoEmpaque,
        $tallosDevueltos,
        $precioVenta,
        $motivo,
        $flete,
        $fumigacion,
        $otros,
        $subTotal,
        $tieneIVA,
        $valorIVA,
        $totalDevolucion
    );

    $registros = [];
    $totales = [
        'tallosDevueltos' => 0,
        'subtotal' => 0,
        'valorIVA' => 0,
        'totalDevolucion' => 0,
        'cantidadRegistros' => 0
    ];

    while ($stmt->fetch()) {
        $registros[] = [
            'cliente' => $cliente,
            'fechaDevolucion' => $fechaDevolucion,
            'idDevolucion' => $idDevolucion,
            'numeroFactura' => $numeroFactura,
            'aerolinea' => $aerolinea,
            'agencia' => $agencia,
            'po' => $po,
            'producto' => $producto,
            'variedad' => $variedad,
            'grado' => $grado,
            'unidadFacturacion' => $unidadFacturacion,
            'tipoEmpaque' => $tipoEmpaque,
            'tallosDevueltos' => $tallosDevueltos,
            'precioVenta' => $precioVenta,
            'motivo' => $motivo,
            'flete' => $flete,
            'fumigacion' => $fumigacion,
            'otros' => $otros,
            'subTotal' => $subTotal,
            'tieneIVA' => $tieneIVA,
            'valorIVA' => $valorIVA,
            'totalDevolucion' => $totalDevolucion
        ];
        $totales['tallosDevueltos'] += $tallosDevueltos;
        $totales['subtotal'] += $subTotal;
        $totales['valorIVA'] += $valorIVA;
        $totales['totalDevolucion'] += $totalDevolucion;
        $totales['cantidadRegistros']++;
    }

    $stmt->close();

    echo json_encode([
        "success" => true,
        "registros" => $registros,
        "totales" => $totales,
        "fechaInicio" => $fechaInicio,
        "fechaFin" => $fechaFin
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener consolidado de devoluciones de clientes: " . $e->getMessage()
    ]);
}

$enlace->close();
