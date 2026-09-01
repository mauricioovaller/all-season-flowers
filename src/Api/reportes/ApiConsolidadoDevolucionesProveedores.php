<?php
// src/Api/reportes/ApiConsolidadoDevolucionesProveedores.php - Consolidado de Devoluciones de Proveedores
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
            DATE_FORMAT(ec.FechaDevolucion, '%Y-%m-%d') AS FechaDevolucion,
            ec.IdDevolucion AS IdDevolucion,
            ec.IdEncabCompra AS NumeroCompra,
            ec.PO_Proveedor AS PO,
            pro.NOMPRODUCTO AS Producto,
            COALESCE(var.NOMVARIEDAD, '') AS Variedad,
            COALESCE(gra.NOMGRADO, '') AS Grado,
            und.DescripUnidad AS UnidadFacturacion,
            tem.Descripcion AS TipoEmpaque,
            dpc.TallosDevolucion AS TallosDevueltos,
            dpc.Precio_Compra AS PrecioCompra,
            COALESCE(dpc.MotivoDevolucion, '') AS Motivo,
            (dpc.TallosDevolucion * dpc.Precio_Compra) AS SubTotal,
            ec.IVA AS TieneIVA,
            IF(ec.IVA <> 0,
               dpc.TallosDevolucion * dpc.Precio_Compra * 0.19,
               0) AS ValorIVA,
            IF(ec.IVA <> 0,
               dpc.TallosDevolucion * dpc.Precio_Compra * 1.19,
               dpc.TallosDevolucion * dpc.Precio_Compra) AS TotalDevolucion
        FROM SAS_EncabCompra ec
        INNER JOIN GEN_Proveedores prov ON ec.IdProveedor = prov.IdProveedor
        INNER JOIN SAS_DetEmpaqueCompra dem ON ec.IdEncabCompra = dem.IdEncabCompra AND dem.Anulado = 0
        INNER JOIN SAS_DetProductoCompra dpc ON dem.IdDetEmpaque = dpc.IdDetEmpaque AND dpc.Anulado = 0
        INNER JOIN GEN_Productos pro ON dpc.IdProducto = pro.IdProducto
        LEFT JOIN GEN_Variedades var ON dpc.IdVariedad = var.IdVariedad
        LEFT JOIN GEN_Grados gra ON dpc.IdGrado = gra.IdGrado
        INNER JOIN GEN_Unidades und ON dpc.IdUnidad = und.IdUnidades
        INNER JOIN GEN_TipoEmpaque tem ON dem.IdTipoEmpaque = tem.IdTipoEmpaque
        WHERE ec.Anulado = 0
          AND ec.IdDevolucion IS NOT NULL
          AND ec.IdDevolucion > 0
          AND dpc.TallosDevolucion > 0
          AND ec.FechaDevolucion BETWEEN ? AND ?
        ORDER BY ec.FechaDevolucion, ec.IdEncabCompra, dem.IdDetEmpaque, dpc.IdDetProducto
    ";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $stmt->bind_result(
        $proveedor,
        $fechaDevolucion,
        $idDevolucion,
        $numeroCompra,
        $po,
        $producto,
        $variedad,
        $grado,
        $unidadFacturacion,
        $tipoEmpaque,
        $tallosDevueltos,
        $precioCompra,
        $motivo,
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
            'proveedor' => $proveedor,
            'fechaDevolucion' => $fechaDevolucion,
            'idDevolucion' => $idDevolucion,
            'numeroCompra' => $numeroCompra,
            'po' => $po,
            'producto' => $producto,
            'variedad' => $variedad,
            'grado' => $grado,
            'unidadFacturacion' => $unidadFacturacion,
            'tipoEmpaque' => $tipoEmpaque,
            'tallosDevueltos' => $tallosDevueltos,
            'precioCompra' => $precioCompra,
            'motivo' => $motivo,
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
        "message" => "Error al obtener consolidado de devoluciones de proveedores: " . $e->getMessage()
    ]);
}

$enlace->close();
