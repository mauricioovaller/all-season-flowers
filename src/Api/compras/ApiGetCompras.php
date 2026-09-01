<?php
// src/Api/compras/ApiGetCompras.php
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

// Leer parámetros de filtro
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "No se recibieron datos JSON válidos"]);
    exit;
}

$filtroNumero = $data["filtroNumero"] ?? "";
$filtroProveedor = $data["filtroProveedor"] ?? "";
$filtroFecha = $data["filtroFecha"] ?? "";
$filtroTipo = $data["filtroTipo"] ?? "";

try {
    // Construir consulta base para COMPRAS
    $sql = "SELECT 
                ec.IdEncabCompra AS idCompra,
                ec.TipoCompra,
                ec.FechaSolicitud,
                ec.FechaEntrega,
                p.Proveedor AS nombreProveedor,
                c.NomComprador AS nombreComprador,
                ec.PO_Proveedor,
                ec.Anulado
            FROM SAS_EncabCompra ec
            INNER JOIN GEN_Proveedores p ON ec.IdProveedor = p.IdProveedor
            INNER JOIN GEN_Compradores c ON ec.IdComprador = c.IdComprador
            WHERE 1=1"; // Se muestran también las anuladas (marcadas con badge)
    
    // Aplicar filtros
    $params = [];
    $types = "";
    
    if (!empty($filtroNumero)) {
        if (is_numeric($filtroNumero)) {
            $sql .= " AND ec.IdEncabCompra = ?";
            $params[] = $filtroNumero;
            $types .= "i";
        } else {
            // Si no es numérico, buscar en otros campos
            $sql .= " AND (ec.PO_Proveedor LIKE ?)";
            $params[] = "%" . $filtroNumero . "%";
            $types .= "s";
        }
    }
    
    if (!empty($filtroProveedor)) {
        $sql .= " AND p.Proveedor LIKE ?";
        $params[] = "%" . $filtroProveedor . "%";
        $types .= "s";
    }
    
    if (!empty($filtroFecha)) {
        $sql .= " AND DATE(ec.FechaEntrega) = ?";
        $params[] = $filtroFecha;
        $types .= "s";
    }
    
    if (!empty($filtroTipo) && $filtroTipo !== "todos") {
        $sql .= " AND ec.TipoCompra = ?";
        $params[] = $filtroTipo;
        $types .= "s";
    }
    
    $sql .= " ORDER BY ec.IdEncabCompra DESC LIMIT 100";
    
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
        $idCompra,
        $tipoCompra,
        $fechaSolicitud,
        $fechaEntrega,
        $nombreProveedor,
        $nombreComprador,
        $po_proveedor,
        $anulado
    );
    
    $compras = [];
    
    // Obtener resultados
    while ($stmt->fetch()) {
        $compras[] = [
            "idCompra" => $idCompra,
            "numeroCompra" => "COMP-" . str_pad($idCompra, 6, "0", STR_PAD_LEFT),
            "tipoCompra" => $tipoCompra,
            "fechaSolicitud" => $fechaSolicitud,
            "fechaEntrega" => $fechaEntrega,
            "proveedor" => $nombreProveedor,
            "comprador" => $nombreComprador,
            "purchaseOrder" => $po_proveedor,
            "anulado" => $anulado,
            "valorTotal" => 0  // Se calculará en consulta separada si es necesario
        ];
    }
    
    $stmt->close();
    
    // Calcular totales para cada compra (opcional - mejora)
    foreach ($compras as &$compra) {
        $sqlTotal = "SELECT SUM(dpc.Ramos_Caja * dpc.Precio_Compra * dek.Cantidad) as total
                     FROM SAS_DetEmpaqueCompra dek
                     INNER JOIN SAS_DetProductoCompra dpc ON dek.IdDetEmpaque = dpc.IdDetEmpaque
                     WHERE dek.IdEncabCompra = ? AND dek.Anulado = 0 AND dpc.Anulado = 0";
        
        $stmtTotal = $enlace->prepare($sqlTotal);
        $stmtTotal->bind_param("i", $compra['idCompra']);
        $stmtTotal->execute();
        $stmtTotal->bind_result($total);
        $stmtTotal->fetch();
        $stmtTotal->close();
        
        $compra['valorTotal'] = $total ? floatval($total) : 0;
    }
    
    $enlace->close();
    
    echo json_encode([
        "success" => true,
        "compras" => $compras,
        "total" => count($compras)
    ]);
    
} catch (Exception $e) {
    error_log("Error en ApiGetCompras.php: " . $e->getMessage());
    
    if (isset($enlace)) {
        $enlace->close();
    }
    
    echo json_encode([
        "success" => false,
        "message" => "Error interno del servidor: " . $e->getMessage()
    ]);
}
?>