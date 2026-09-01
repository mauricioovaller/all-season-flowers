<?php
// src/Api/reportes/ApiConsolidadoCompras.php - Consolidado de Compras
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
            prov.Proveedor AS Proveedor,
            DATE_FORMAT(ec.FechaEntrega, '%Y-%m-%d') AS FechaCompra,
            ec.PO_Proveedor AS PO,
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
            dpr.Precio_Compra AS PrecioCompra,
            IF(und.IdUnidades = 4,
               dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja * dpr.Precio_Compra,
               dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Compra) AS SubTotal,
            ec.IVA AS TieneIVA,
            IF(ec.IVA <> 0,
               IF(und.IdUnidades = 4,
                  dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja * dpr.Precio_Compra * 0.19,
                  dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Compra * 0.19),
               0) AS ValorIVA,
            IF(ec.IVA <> 0,
               IF(und.IdUnidades = 4,
                  dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja * dpr.Precio_Compra * 1.19,
                  dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Compra * 1.19),
               IF(und.IdUnidades = 4,
                  dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja * dpr.Precio_Compra,
                  dem.Cantidad * dpr.Ramos_Caja * dpr.Precio_Compra)) AS TotalCompra
        FROM SAS_EncabCompra ec
        INNER JOIN GEN_Proveedores prov ON ec.IdProveedor = prov.IdProveedor
        INNER JOIN SAS_DetEmpaqueCompra dem ON ec.IdEncabCompra = dem.IdEncabCompra AND dem.Anulado = 0
        INNER JOIN SAS_DetProductoCompra dpr ON dem.IdDetEmpaque = dpr.IdDetEmpaque AND dpr.Anulado = 0
        INNER JOIN GEN_Productos pro ON dpr.IdProducto = pro.IdProducto
        LEFT JOIN GEN_Variedades var ON dpr.IdVariedad = var.IdVariedad
        LEFT JOIN GEN_Grados gra ON dpr.IdGrado = gra.IdGrado
        INNER JOIN GEN_Unidades und ON dpr.IdUnidad = und.IdUnidades
        INNER JOIN GEN_TipoEmpaque tem ON dem.IdTipoEmpaque = tem.IdTipoEmpaque
        WHERE ec.Anulado = 0
          AND ec.FechaEntrega BETWEEN ? AND ?
        ORDER BY ec.FechaEntrega, ec.IdEncabCompra, dem.IdDetEmpaque, dpr.IdDetProducto
    ";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $stmt->bind_result(
        $proveedor,
        $fechaCompra,
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
        $precioCompra,
        $subTotal,
        $tieneIVA,
        $valorIVA,
        $totalCompra
    );

    $registros = [];
    $totales = [
        'subtotal' => 0,
        'valorIVA' => 0,
        'totalCompra' => 0,
        'totalTallos' => 0,
        'cantidadRegistros' => 0
    ];

    while ($stmt->fetch()) {
        $registros[] = [
            'proveedor' => $proveedor,
            'fechaCompra' => $fechaCompra,
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
            'precioCompra' => $precioCompra,
            'subTotal' => $subTotal,
            'tieneIVA' => $tieneIVA,
            'valorIVA' => $valorIVA,
            'totalCompra' => $totalCompra
        ];
        $totales['subtotal'] += $subTotal;
        $totales['valorIVA'] += $valorIVA;
        $totales['totalCompra'] += $totalCompra;
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
        "message" => "Error al obtener consolidado de compras: " . $e->getMessage()
    ]);
}

$enlace->close();
