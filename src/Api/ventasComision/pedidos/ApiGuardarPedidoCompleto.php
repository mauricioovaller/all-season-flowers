<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'MÃ©todo no permitido']);
    exit;
}

require_once __DIR__ . '/../../config/empresa.php';
require_once CONEXION_BD_PATH;

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Datos de entrada invÃ¡lidos']);
    exit;
}

$encabezado = $input['encabezado'] ?? [];
$empaques = $input['empaques'] ?? [];
$idPedido = intval($input['idPedido'] ?? 0);

$enlace->begin_transaction();

try {
    if ($idPedido > 0) {
        // --- ACTUALIZACIÃ“N ---
        $stmt = $enlace->prepare("UPDATE SAS_EncabPedidoComision SET
            IdCliente = ?, IdEjecutivo = ?, IdMoneda = ?, TRM = ?,
            FechaSolicitud = ?, FechaEntrega = ?, PO_Cliente = ?,
            Observaciones = ?, IVA = ?, Estado = ?, PorcentajeComision = ?
            WHERE IdEncabPedidoComision = ?");
        $stmt->bind_param("iiidsssssdsi",
            $encabezado['IdCliente'], $encabezado['IdEjecutivo'],
            $encabezado['IdMoneda'], $encabezado['TRM'],
            $encabezado['FechaSolicitud'], $encabezado['FechaEntrega'],
            $encabezado['PO_Cliente'], $encabezado['Observaciones'],
            $encabezado['IVA'], $encabezado['Estado'],
            $encabezado['PorcentajeComision'], $idPedido
        );
        $stmt->execute();
        $stmt->close();

        // Eliminar detalle anterior (UPDATE anulado = 1)
        $enlace->query("UPDATE SAS_DetRecetaComision SET Anulado = 1 WHERE IdEncabPedidoComision = $idPedido");
        $enlace->query("UPDATE SAS_DetProductoComision SET Anulado = 1 WHERE IdEncabPedidoComision = $idPedido");
        $enlace->query("UPDATE SAS_DetEmpaqueComision SET Anulado = 1 WHERE IdEncabPedidoComision = $idPedido");
    } else {
        // --- NUEVO PEDIDO ---
        $result = $enlace->query("SELECT MAX(CAST(SUBSTRING(NumeroPedido, 5) AS UNSIGNED)) AS ultimo FROM SAS_EncabPedidoComision");
        $row = $result->fetch_assoc();
        $ultimoNumero = intval($row['ultimo'] ?? 0);
        $sig = $ultimoNumero + 1;
        $numeroPedido = 'PEC-' . str_pad($sig, 6, '0', STR_PAD_LEFT);

        $stmt = $enlace->prepare("INSERT INTO SAS_EncabPedidoComision (
            NumeroPedido, IdCliente, IdEjecutivo, IdMoneda, TRM,
            FechaSolicitud, FechaEntrega, PO_Cliente, Observaciones,
            IVA, Estado, PorcentajeComision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("siiidsssssds",
            $numeroPedido,
            $encabezado['IdCliente'], $encabezado['IdEjecutivo'],
            $encabezado['IdMoneda'], $encabezado['TRM'],
            $encabezado['FechaSolicitud'], $encabezado['FechaEntrega'],
            $encabezado['PO_Cliente'], $encabezado['Observaciones'],
            $encabezado['IVA'], $encabezado['Estado'],
            $encabezado['PorcentajeComision']
        );
        $stmt->execute();
        $idPedido = $enlace->insert_id;
        $stmt->close();
    }

    // --- GUARDAR EMPAQUES ---
    foreach ($empaques as $emp) {
        $e = $emp['empaque'];
        $productos = $emp['productos'] ?? [];

        $stmt = $enlace->prepare("INSERT INTO SAS_DetEmpaqueComision (IdEncabPedidoComision, IdTipoEmpaque, Cantidad, PO_Empaque, Anulado) VALUES (?, ?, ?, ?, 0)");
        $stmt->bind_param("iiis", $idPedido, $e['IdTipoEmpaque'], $e['Cantidad'], $e['PO_Empaque']);
        $stmt->execute();
        $idDetEmpaque = $enlace->insert_id;
        $stmt->close();

        foreach ($productos as $prod) {
            $p = $prod['producto'];
            $receta = $prod['receta'] ?? [];

            // Insert sin PorcentajeComision (se actualiza despuÃ©s si es necesario)
            $stmt = $enlace->prepare("INSERT INTO SAS_DetProductoComision (
                IdDetEmpaqueComision, IdEncabPedidoComision, IdProducto, IdVariedad, IdGrado,
                Descripcion, IdUnidad, IdPredio, Tallos_Ramo, Ramos_Caja, Precio_Venta, Anulado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)");
            $stmt->bind_param("iiiisssiiid",
                $idDetEmpaque, $idPedido,
                $p['IdProducto'], $p['IdVariedad'], $p['IdGrado'],
                $p['Descripcion'], $p['IdUnidad'], $p['IdPredio'],
                $p['Tallos_Ramo'], $p['Ramos_Caja'], $p['Precio_Venta']
            );
            $stmt->execute();
            $idDetProducto = $enlace->insert_id;
            $stmt->close();

            // Actualizar PorcentajeComision si tiene valor
            if (isset($p['PorcentajeComision']) && $p['PorcentajeComision'] !== null && $p['PorcentajeComision'] !== '') {
                $stmt2 = $enlace->prepare("UPDATE SAS_DetProductoComision SET PorcentajeComision = ? WHERE IdDetProductoComision = ?");
                $pctVal = floatval($p['PorcentajeComision']);
                $stmt2->bind_param("di", $pctVal, $idDetProducto);
                $stmt2->execute();
                $stmt2->close();
            }

            foreach ($receta as $rec) {
                $stmt = $enlace->prepare("INSERT INTO SAS_DetRecetaComision (IdDetProductoComision, IdDetEmpaqueComision, IdEncabPedidoComision, IdProducto, IdVariedad, Cantidad, Anulado) VALUES (?, ?, ?, ?, ?, ?, 0)");
                $stmt->bind_param("iiiisi", $idDetProducto, $idDetEmpaque, $idPedido, $rec['IdProducto'], $rec['IdVariedad'], $rec['Cantidad']);
                $stmt->execute();
                $stmt->close();
            }
        }
    }

    $enlace->commit();

    // Obtener nÃºmero de pedido
    $result = $enlace->query("SELECT NumeroPedido FROM SAS_EncabPedidoComision WHERE IdEncabPedidoComision = $idPedido");
    $row = $result->fetch_assoc();

    echo json_encode([
        'success' => true,
        'idPedido' => $idPedido,
        'numeroPedido' => $row['NumeroPedido'] ?? 'PEC-000000',
        'message' => 'Pedido guardado exitosamente',
    ]);
} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar pedido: ' . $e->getMessage(),
    ]);
}
