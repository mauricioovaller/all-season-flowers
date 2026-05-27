<?php
// src/Api/pedidos/ApiGetFacturasCliente.php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Incluir conexión a la base de datos
require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Leer el ID del cliente
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || !isset($data["idCliente"]) || !is_numeric($data["idCliente"])) {
    echo json_encode(["success" => false, "message" => "ID de cliente no válido"]);
    exit;
}

$idCliente = intval($data["idCliente"]);

try {
    // Consulta para obtener todas las facturas del cliente
    // Incluye las que ya tienen devolución (IdDevolucion no NULL)
    $sql = "SELECT 
                ep.IdEncabPedido,
                ep.Factura,
                ep.FechaSolicitud,
                ep.IdMoneda,
                ep.TRM,
                ep.IdDevolucion,
                c.NOMBRE AS nombreCliente,
                m.Moneda AS nombreMoneda,
                COALESCE(ep.AWB, 'SG') AS guiaMaster
            FROM SAS_EncabPedido ep
            INNER JOIN GEN_Clientes c ON ep.IdCliente = c.IdCliente
            INNER JOIN GEN_Monedas m ON ep.IdMoneda = m.IdMoneda
            WHERE ep.IdCliente = ?
            AND ep.Factura IS NOT NULL          -- Solo registros que tienen número de factura
            AND ep.Factura > 0                   -- Número de factura válido
            ORDER BY ep.FechaSolicitud DESC, ep.IdEncabPedido DESC";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("i", $idCliente);
    $stmt->execute();

    // Vincular resultados
    $stmt->bind_result(
        $idEncabPedido,
        $numeroFactura,
        $fechaFactura,
        $idMoneda,
        $trm,
        $idDevolucion,
        $nombreCliente,
        $nombreMoneda,
        $guiaMaster,
    );

    $facturas = [];

    while ($stmt->fetch()) {
        // Determinar si ya tiene devolución
        $tieneDevolucion = ($idDevolucion !== null && $idDevolucion > 0);

        $facturas[] = [
            "idEncabPedido" => $idEncabPedido,
            "numeroFactura" => $numeroFactura,
            "numeroFacturaFormateado" => "FACT-" . str_pad($numeroFactura, 6, "0", STR_PAD_LEFT),
            "fechaFactura" => $fechaFactura,
            "cliente" => $nombreCliente,
            "idCliente" => $idCliente,
            "moneda" => $nombreMoneda,
            "guia" => $guiaMaster,
            "idMoneda" => $idMoneda,
            "trm" => floatval($trm),
            "tieneDevolucion" => $tieneDevolucion,
            "idDevolucion" => $tieneDevolucion ? $idDevolucion : null
        ];
    }

    $stmt->close();
    $enlace->close();

    echo json_encode([
        "success" => true,
        "facturas" => $facturas,
        "total" => count($facturas)
    ]);

} catch (Exception $e) {
    error_log("Error en ApiGetFacturasCliente.php: " . $e->getMessage());

    if (isset($enlace)) {
        $enlace->close();
    }

    echo json_encode([
        "success" => false,
        "message" => "Error interno del servidor"
    ]);
}
?>