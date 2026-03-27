<?php
// src/Api/pedidos/ApiBuscarDevoluciones.php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión"]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "No se recibieron datos JSON válidos"]);
    exit;
}

$filtroNumero = $data["filtroNumero"] ?? "";
$filtroCliente = $data["filtroCliente"] ?? "";
$filtroFecha = $data["filtroFecha"] ?? "";
$filtroEstado = $data["filtroEstado"] ?? ""; // Podría usarse para filtrar por estado de la devolución (si tuviera campo, pero por ahora no)

try {
    // Construir consulta base: facturas que tienen IdDevolucion no nulo
    $sql = "SELECT 
                ec.IdEncabCompra AS idFactura,
                ec.IdDevolucion,
                ec.IdEncabCompra AS Factura,
                ec.FechaSolicitud AS fechaFactura,
                ec.FechaDevolucion,
                ec.ObservacionesDevolucion,
                p.Proveedor AS nombreProveedor,
                ec.IdProveedor,
                ec.Estado,
                ec.PO_Proveedor
            FROM SAS_EncabCompra ec
            INNER JOIN GEN_Proveedores p ON ec.IdProveedor = p.IdProveedor
            WHERE ec.IdDevolucion IS NOT NULL 
              AND ec.IdDevolucion > 0";
    
    $params = [];
    $types = "";
    
    if (!empty($filtroNumero)) {
        if (is_numeric($filtroNumero)) {
            $sql .= " AND ep.IdDevolucion = ?";
            $params[] = $filtroNumero;
            $types .= "i";
        } else {
            $sql .= " AND ep.IdDevolucion LIKE ?";
            $params[] = "%" . $filtroNumero . "%";
            $types .= "s";
        }
    }
    
    if (!empty($filtroCliente)) {
        $sql .= " AND c.NOMBRE LIKE ?";
        $params[] = "%" . $filtroCliente . "%";
        $types .= "s";
    }
    
    if (!empty($filtroFecha)) {
        $sql .= " AND DATE(ep.FechaDevolucion) = ?";
        $params[] = $filtroFecha;
        $types .= "s";
    }
    
    $sql .= " ORDER BY ep.IdDevolucion DESC LIMIT 100";
    
    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    
    $stmt->bind_result(
        $idFactura,
        $idDevolucion,
        $facturaNumero,
        $fechaFactura,
        $fechaDevolucion,
        $observaciones,
        $nombreProveedor,
        $idProveedor,
        $estado,
        $poProveedor
    );
    
    $devoluciones = [];
    
    while ($stmt->fetch()) {
        $devoluciones[] = [
            "idFactura" => $idFactura,
            "idDevolucion" => $idDevolucion,
            "numeroDevolucion" => "DEV-" . str_pad($idDevolucion, 6, "0", STR_PAD_LEFT),
            "numeroFactura" => $facturaNumero ? "FACT-" . str_pad($facturaNumero, 6, "0", STR_PAD_LEFT) : "Sin factura",
            "fechaFactura" => $fechaFactura,
            "fechaDevolucion" => $fechaDevolucion,
            "proveedor" => $nombreProveedor,
            "idProveedor" => $idProveedor,
            "observaciones" => $observaciones,
            "estado" => $estado,
            "poProveedor" => $poProveedor
        ];
    }
    
    $stmt->close();
    $enlace->close();
    
    echo json_encode([
        "success" => true,
        "devoluciones" => $devoluciones,
        "total" => count($devoluciones)
    ]);
    
} catch (Exception $e) {
    error_log("Error en ApiBuscarDevoluciones.php: " . $e->getMessage());
    if (isset($enlace)) $enlace->close();
    echo json_encode(["success" => false, "message" => "Error interno del servidor"]);
}
?>