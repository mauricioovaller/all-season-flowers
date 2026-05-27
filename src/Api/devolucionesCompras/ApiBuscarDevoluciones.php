<?php
/**
 * ApiBuscarDevoluciones.php - API para buscar devoluciones de compras
 * 
 * Este endpoint permite buscar devoluciones de compras con filtros por número,
 * proveedor, fecha y estado. Retorna compras que tienen IdDevolucion asignado.
 * 
 * @package AllSeasonFlowers
 * @category API
 * @subpackage DevolucionesCompras
 */

header("Content-Type: application/json");

// Validar método HTTP
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Incluir conexión a base de datos
require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión a la base de datos"]);
    exit;
}

// Obtener y validar datos JSON
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "No se recibieron datos JSON válidos"]);
    exit;
}

// Obtener filtros con valores por defecto
$filtroNumero = $data["filtroNumero"] ?? "";
$filtroProveedor = $data["filtroProveedor"] ?? "";
$filtroFecha = $data["filtroFecha"] ?? "";
$filtroEstado = $data["filtroEstado"] ?? "";

try {
    // Construir consulta base: compras que tienen IdDevolucion no nulo
    $sql = "SELECT 
                ec.IdEncabCompra AS idCompra,
                ec.IdDevolucion,
                ec.IdEncabCompra AS numeroCompra,
                ec.FechaSolicitud AS fechaCompra,
                ec.FechaDevolucion,
                ec.ObservacionesDevolucion,
                p.Proveedor AS nombreProveedor,
                ec.IdProveedor,
                ec.Estado,
                ec.PO_Proveedor,
                c.NomComprador AS nombreComprador
            FROM SAS_EncabCompra ec
            INNER JOIN GEN_Proveedores p ON ec.IdProveedor = p.IdProveedor
            LEFT JOIN GEN_Compradores c ON ec.IdComprador = c.IdComprador
            WHERE ec.IdDevolucion IS NOT NULL 
              AND ec.IdDevolucion > 0
              AND ec.Anulado = 0";
    
    $params = [];
    $types = "";
    
    // Aplicar filtros dinámicos
    if (!empty($filtroNumero)) {
        $sql .= " AND (ec.IdEncabCompra LIKE ? OR ec.PO_Proveedor LIKE ? OR ec.IdDevolucion LIKE ?)";
        $params[] = "%$filtroNumero%";
        $params[] = "%$filtroNumero%";
        $params[] = "%$filtroNumero%";
        $types .= "sss";
    }
    
    if (!empty($filtroProveedor)) {
        $sql .= " AND p.Proveedor LIKE ?";
        $params[] = "%$filtroProveedor%";
        $types .= "s";
    }
    
    if (!empty($filtroFecha)) {
        $sql .= " AND ec.FechaDevolucion = ?";
        $params[] = $filtroFecha;
        $types .= "s";
    }
    
    if (!empty($filtroEstado)) {
        $sql .= " AND ec.Estado = ?";
        $params[] = $filtroEstado;
        $types .= "s";
    }
    
    $sql .= " ORDER BY ec.FechaDevolucion DESC, ec.IdDevolucion DESC";
    
    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }
    
    // Vincular parámetros si existen
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    
    $stmt->bind_result(
        $idCompra,
        $idDevolucion,
        $numeroCompra,
        $fechaCompra,
        $fechaDevolucion,
        $observacionesDevolucion,
        $nombreProveedor,
        $idProveedor,
        $estado,
        $poProveedor,
        $nombreComprador
    );
    
    $devoluciones = [];
    while ($stmt->fetch()) {
        $devoluciones[] = [
            "idCompra" => $idCompra,
            "idDevolucion" => $idDevolucion,
            "numeroCompra" => $numeroCompra,
            "fechaCompra" => $fechaCompra,
            "fechaDevolucion" => $fechaDevolucion,
            "observacionesDevolucion" => $observacionesDevolucion,
            "nombreProveedor" => $nombreProveedor,
            "idProveedor" => $idProveedor,
            "estado" => $estado,
            "poProveedor" => $poProveedor,
            "nombreComprador" => $nombreComprador,
            "numeroDevolucion" => "DEV-" . str_pad($idDevolucion, 6, "0", STR_PAD_LEFT)
        ];
    }
    
    $stmt->close();
    
    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "devoluciones" => $devoluciones,
        "total" => count($devoluciones),
        "filtrosAplicados" => [
            "numero" => !empty($filtroNumero),
            "proveedor" => !empty($filtroProveedor),
            "fecha" => !empty($filtroFecha),
            "estado" => !empty($filtroEstado)
        ]
    ]);
    
} catch (Exception $e) {
    // Log de error y respuesta de error
    error_log("Error en ApiBuscarDevoluciones.php (Compras): " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Error al buscar devoluciones: " . $e->getMessage()
    ]);
} finally {
    // Cerrar conexión
    if (isset($enlace)) {
        $enlace->close();
    }
}
?>