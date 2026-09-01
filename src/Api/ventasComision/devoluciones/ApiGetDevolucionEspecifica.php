<?php
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['success'=>false]); exit; }

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;

$input = json_decode(file_get_contents('php://input'), true);
$idFactura = intval($input['idFactura'] ?? 0);
if ($idFactura <= 0) { echo json_encode(['success'=>false,'message'=>'ID invÃ¡lido']); exit; }

try {
    $result = $enlace->query("SELECT IdEncabPedidoComision, NumeroPedido, IdCliente, IdMoneda, TRM,
        FechaSolicitud, FechaEntrega, Estado, PorcentajeComision,
        IdDevolucion, FechaDevolucion, ObservacionesDevolucion
        FROM SAS_EncabPedidoComision WHERE IdEncabPedidoComision = $idFactura");
    $encab = $result->fetch_assoc();

    if (!$encab) { echo json_encode(['success'=>false,'message'=>'No encontrado']); exit; }

    $numeroDevolucion = 'DEV-' . str_pad(intval($encab['IdDevolucion'] ?? 0), 6, '0', STR_PAD_LEFT);

    // Obtener detalle con devoluciones
    $result = $enlace->query("SELECT dp.IdDetProductoComision AS idDetProducto,
        dp.Descripcion AS producto, pr.NOMPRODUCTO AS nomProducto,
        v.NOMVARIEDAD AS variedad, g.NOMGRADO AS grado,
        dp.IdProducto, dp.IdVariedad, dp.IdGrado, dp.IdUnidad,
        dp.Tallos_Ramo, dp.Ramos_Caja, dp.Precio_Venta,
        (dp.Tallos_Ramo * dp.Ramos_Caja * de.Cantidad) AS tallosFacturados,
        COALESCE(dp.TallosDevolucion, 0) AS tallosDevolucion,
        COALESCE(dp.MotivoDevolucion, '') AS motivo,
        COALESCE(dp.Flete, 0) AS flete,
        COALESCE(dp.Fumigacion, 0) AS fumigacion,
        COALESCE(dp.Otros, 0) AS otros
        FROM SAS_DetProductoComision dp
        INNER JOIN SAS_DetEmpaqueComision de ON dp.IdDetEmpaqueComision = de.IdDetEmpaqueComision
        LEFT JOIN GEN_Productos pr ON dp.IdProducto = pr.IdProducto
        LEFT JOIN GEN_Variedades v ON dp.IdVariedad = v.IdVariedad
        LEFT JOIN GEN_Grados g ON dp.IdGrado = g.IdGrado
        WHERE dp.IdEncabPedidoComision = $idFactura
        AND (dp.Anulado IS NULL OR dp.Anulado = 0)
        AND (de.Anulado IS NULL OR de.Anulado = 0)");
    $detalle = [];
    while ($row = $result->fetch_assoc()) {
        $detalle[] = $row;
    }

    echo json_encode([
        'success'=>true,
        'idDevolucion'=>intval($encab['IdDevolucion'] ?? 0),
        'numeroDevolucion'=>$numeroDevolucion,
        'encabezado'=>[
            'idDevolucion'=>intval($encab['IdDevolucion'] ?? 0),
            'numeroDevolucion'=>$numeroDevolucion,
            'fechaDevolucion'=>$encab['FechaDevolucion'],
            'observaciones'=>$encab['ObservacionesDevolucion'],
            'moneda'=>$encab['IdMoneda'],
            'trm'=>$encab['TRM'],
        ],
        'detalle'=>$detalle,
    ]);
} catch (Exception $e) {
    echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
