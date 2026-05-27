<?php
// src/Api/pagosProveedores/ApiGetComprasProveedorConSaldo.php
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

if (!$data || !isset($data['idProveedor'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    exit;
}

$idProveedor = intval($data['idProveedor']);
$idPagoExcluir = isset($data['idPagoExcluir']) ? intval($data['idPagoExcluir']) : 0;

// Condición para excluir el pago actual del cálculo de saldo (para edición)
$condExcluir = $idPagoExcluir > 0 ? "AND dpp_paid.IdEncabPagoProveedor != $idPagoExcluir" : "";

try {
    // Consulta para obtener compras con saldo pendiente
    $query = "
        SELECT 
            ec.IdEncabCompra as idCompra,
            CONCAT('COMP-', LPAD(ec.IdEncabCompra, 6, '0')) as numeroCompraFormateado,
            ec.FechaEntrega as fechaCompra,
            p.Proveedor as proveedor,
            ec.IdMoneda as idMoneda,
            m.Moneda as moneda,
            ec.TRM as trm,
            
            -- Valor total de la compra
            COALESCE((SELECT SUM(dc.Tallos_Ramo * dc.Ramos_Caja * dc.Precio_Compra) 
                      FROM SAS_DetProductoCompra dc 
                      WHERE dc.IdEncabCompra = ec.IdEncabCompra
                      AND dc.Anulado = 0), 0) as valorCompra,
            
            -- Valor total de devoluciones
            COALESCE((SELECT SUM(dc2.TallosDevolucion * dc2.Precio_Compra) 
                      FROM SAS_DetProductoCompra dc2 
                      WHERE dc2.IdEncabCompra = ec.IdEncabCompra 
                      AND dc2.TallosDevolucion > 0
                      AND dc2.Anulado = 0), 0) as valorDevolucion,
            
            -- Pagos realizados por esta compra
            COALESCE((SELECT SUM(dpp_paid.ValorPago)
                      FROM SAS_DetPagoProveedor dpp_paid
                      WHERE dpp_paid.IdEncabCompra = ec.IdEncabCompra
                      AND dpp_paid.Anulado = 0
                      $condExcluir), 0) as valorPagado,
            
            -- Saldo pendiente = Valor Compra - Devoluciones - Pagos
            (COALESCE((SELECT SUM(dc3.Tallos_Ramo * dc3.Ramos_Caja * dc3.Precio_Compra) 
                       FROM SAS_DetProductoCompra dc3 
                       WHERE dc3.IdEncabCompra = ec.IdEncabCompra
                       AND dc3.Anulado = 0), 0)
             - COALESCE((SELECT SUM(dc4.TallosDevolucion * dc4.Precio_Compra) 
                         FROM SAS_DetProductoCompra dc4 
                         WHERE dc4.IdEncabCompra = ec.IdEncabCompra 
                         AND dc4.TallosDevolucion > 0
                         AND dc4.Anulado = 0), 0)
             - COALESCE((SELECT SUM(dpp_saldo.ValorPago)
                         FROM SAS_DetPagoProveedor dpp_saldo
                         WHERE dpp_saldo.IdEncabCompra = ec.IdEncabCompra
                         AND dpp_saldo.Anulado = 0
                         $condExcluir), 0)) as saldoPendiente
            
        FROM SAS_EncabCompra ec
        INNER JOIN GEN_Proveedores p ON ec.IdProveedor = p.IdProveedor
        LEFT JOIN GEN_Monedas m ON ec.IdMoneda = m.IdMoneda
        WHERE ec.IdProveedor = ?
        AND ec.Anulado = 0
        HAVING saldoPendiente > 0
        ORDER BY ec.FechaEntrega DESC
    ";

    $stmt = $enlace->prepare($query);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("i", $idProveedor);
    $stmt->execute();

    // Vincular resultados
    $stmt->bind_result(
        $idCompra,
        $numeroCompraFormateado,
        $fechaCompra,
        $proveedor,
        $idMoneda,
        $moneda,
        $trm,
        $valorCompra,
        $valorDevolucion,
        $valorPagado,
        $saldoPendiente
    );

    $compras = [];

    // Obtener resultados
    while ($stmt->fetch()) {
        $saldo = floatval($saldoPendiente);
        // Solo incluir si hay saldo pendiente positivo
        if ($saldo > 0) {
            $compras[] = [
                'idCompra' => intval($idCompra),
                'numeroCompraFormateado' => $numeroCompraFormateado,
                'fechaCompra' => $fechaCompra,
                'proveedor' => $proveedor,
                'idMoneda' => intval($idMoneda),
                'moneda' => $moneda,
                'trm' => floatval($trm),
                'valorCompra' => floatval($valorCompra),
                'valorDevolucion' => floatval($valorDevolucion),
                'valorPagado' => floatval($valorPagado),
                'saldoPendiente' => $saldo
            ];
        }
    }

    $stmt->close();

    echo json_encode([
        'success' => true,
        'compras' => $compras,
        'total' => count($compras)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'compras' => [],
        'total' => 0
    ]);
}

$enlace->close();
