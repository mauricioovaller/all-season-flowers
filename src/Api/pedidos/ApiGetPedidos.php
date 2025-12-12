<?php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Incluir conexión a la base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Leer parámetros de filtro
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "No se recibieron datos JSON válidos"]);
    exit;
}

$filtroNumero = $data["filtroNumero"] ?? "";
$filtroCliente = $data["filtroCliente"] ?? "";
$filtroFecha = $data["filtroFecha"] ?? "";
$filtroEstado = $data["filtroEstado"] ?? "";

try {
    // Construir consulta base
    $sql = "SELECT 
                ep.IdEncabPedido AS idPedido,
                ep.IdEncabPedido AS NumeroPedido,
                ep.FechaSolicitud,
                ep.FechaEntrega,
                c.NOMBRE AS nombreCliente,
                e.NOMEJECUTIVO AS nombreEjecutivo,
                ep.Estado,
                ep.PO_Cliente
            FROM SAS_EncabPedido ep
            INNER JOIN GEN_Clientes c ON ep.IdCliente = c.IdCliente
            LEFT JOIN GEN_Ejecutivos e ON ep.IdEjecutivo = e.IdEjecutivo
            WHERE 1=1";
    
    // Aplicar filtros
    $params = [];
    $types = "";
    
    if (!empty($filtroNumero)) {
        if (is_numeric($filtroNumero)) {
            $sql .= " AND ep.IdEncabPedido = ?";
            $params[] = $filtroNumero;
            $types .= "i";
        } else {
            $sql .= " AND ep.NumeroPedido LIKE ?";
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
        $sql .= " AND DATE(ep.FechaSolicitud) = ?";
        $params[] = $filtroFecha;
        $types .= "s";
    }
    
    if (!empty($filtroEstado) && $filtroEstado !== "todos") {
        $sql .= " AND ep.Estado = ?";
        $params[] = $filtroEstado;
        $types .= "s";
    }
    
    $sql .= " ORDER BY ep.IdEncabPedido DESC LIMIT 100";
    
    // Preparar y ejecutar
    $stmt = $enlace->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    
    // Vincular resultados
    $stmt->bind_result(
        $idPedido,
        $numeroPedido,
        $fechaSolicitud,
        $fechaEntrega,
        $nombreCliente,
        $nombreEjecutivo,
        $estado,
        $po_cliente
    );
    
    $pedidos = [];
    
    // Obtener resultados
    while ($stmt->fetch()) {
        $pedidos[] = [
            "idPedido" => $idPedido,
            "numeroPedido" => $numeroPedido ?? "PED-" . str_pad($idPedido, 6, "0", STR_PAD_LEFT),
            "fechaSolicitud" => $fechaSolicitud,
            "fechaEntrega" => $fechaEntrega,
            "cliente" => $nombreCliente,
            "ejecutivo" => $nombreEjecutivo,
            "estado" => $estado ?? "Pendiente",
            "purchaseOrder" => $po_cliente,
            "valorTotal" => 0  // Valor por defecto
        ];
    }
    
    $stmt->close();
    $enlace->close();
    
    echo json_encode([
        "success" => true,
        "pedidos" => $pedidos,
        "total" => count($pedidos)
    ]);
    
} catch (Exception $e) {
    error_log("Error en buscarPedidos.php: " . $e->getMessage());
    
    if (isset($enlace)) {
        $enlace->close();
    }
    
    echo json_encode([
        "success" => false,
        "message" => "Error interno del servidor"
    ]);
}
?>