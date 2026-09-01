<?php
// src/Api/reportes/ApiConsolidadoVentas.php - Consolidado de Ventas
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
            DATE_FORMAT(enc.FechaEntrega, '%Y-%m-%d') AS FechaDespacho,
            enc.IdEncabPedido AS NumeroPedido,
            enc.Factura AS NumeroInvoice,
            COALESCE(enc.AWB, '') AS AWB,
            COALESCE(enc.AWB_HIJA, '') AS AWB_HIJA,
            COALESCE(aer.NOMAEROLINEA, '') AS Aerolinea,
            COALESCE(age.NOMAGENCIA, '') AS Agencia,
            dem.PO_Empaque AS PO,
            pro.NOMPRODUCTO AS Producto,
            COALESCE(var.NOMVARIEDAD, '') AS Variedad,
            COALESCE(gra.NOMGRADO, '') AS Grado,
            und.DescripUnidad AS UnidadFacturacion,
            tem.Descripcion AS TipoEmpaque,
            dem.Cantidad AS CantidadEmpaque,
            dpr.Tallos_Ramo AS TallosRamo,
            dpr.Ramos_Caja AS RamosCaja,
            (dpr.Tallos_Ramo * dpr.Ramos_Caja) AS TallosCaja,
            (dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja) AS TotalTallos,
            dpr.Precio_Venta AS PrecioVenta,
            IF(und.IdUnidades = 4,
               dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja * dpr.Precio_Venta,
               dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Venta) AS SubTotal,
            enc.IVA AS TieneIVA,
            IF(enc.IVA <> 0,
               IF(und.IdUnidades = 4,
                  dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja * dpr.Precio_Venta * 0.19,
                  dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Venta * 0.19),
               0) AS ValorIVA,
            IF(enc.IVA <> 0,
               IF(und.IdUnidades = 4,
                  dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja * dpr.Precio_Venta * 1.19,
                  dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Venta * 1.19),
               IF(und.IdUnidades = 4,
                  dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja * dpr.Precio_Venta,
                  dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Venta)) AS TotalVenta
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
          AND enc.Factura > 0
          AND enc.FechaEntrega BETWEEN ? AND ?
        ORDER BY enc.FechaEntrega, enc.IdEncabPedido, dem.IdDetEmpaque, dpr.IdDetProducto
    ";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $stmt->bind_result(
        $cliente,
        $fechaDespacho,
        $numeroPedido,
        $numeroInvoice,
        $awb,
        $awbHija,
        $aerolinea,
        $agencia,
        $po,
        $producto,
        $variedad,
        $grado,
        $unidadFacturacion,
        $tipoEmpaque,
        $cantidadEmpaque,
        $tallosRamo,
        $ramosCaja,
        $tallosCaja,
        $totalTallos,
        $precioVenta,
        $subTotal,
        $tieneIVA,
        $valorIVA,
        $totalVenta
    );

    $registros = [];
    $totales = [
        'subtotal' => 0,
        'valorIVA' => 0,
        'totalVenta' => 0,
        'totalTallos' => 0,
        'cantidadRegistros' => 0
    ];

    while ($stmt->fetch()) {
        $registros[] = [
            'cliente' => $cliente,
            'fechaDespacho' => $fechaDespacho,
            'numeroPedido' => $numeroPedido,
            'numeroInvoice' => $numeroInvoice,
            'awb' => $awb,
            'awbHija' => $awbHija,
            'aerolinea' => $aerolinea,
            'agencia' => $agencia,
            'po' => $po,
            'producto' => $producto,
            'variedad' => $variedad,
            'grado' => $grado,
            'unidadFacturacion' => $unidadFacturacion,
            'tipoEmpaque' => $tipoEmpaque,
            'cantidadEmpaque' => $cantidadEmpaque,
            'tallosRamo' => $tallosRamo,
            'ramosCaja' => $ramosCaja,
            'tallosCaja' => $tallosCaja,
            'totalTallos' => $totalTallos,
            'precioVenta' => $precioVenta,
            'subTotal' => $subTotal,
            'tieneIVA' => $tieneIVA,
            'valorIVA' => $valorIVA,
            'totalVenta' => $totalVenta
        ];
        $totales['subtotal'] += $subTotal;
        $totales['valorIVA'] += $valorIVA;
        $totales['totalVenta'] += $totalVenta;
        $totales['totalTallos'] += $totalTallos;
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
        "message" => "Error al obtener consolidado de ventas: " . $e->getMessage()
    ]);
}

$enlace->close();
