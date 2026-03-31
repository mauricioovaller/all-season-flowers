<?php
/**
 * ApiGetFacturasCliente.php - API para obtener compras de un proveedor
 * 
 * Este endpoint obtiene todas las compras de un proveedor específico
 * para poder seleccionar una compra y procesar su devolución.
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

// Incluir conexión a la base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión a la base de datos"]);
    exit;
}

// Obtener y validar datos JSON
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || !isset($data["idProveedor"]) || !is_numeric($data["idProveedor"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de proveedor no válido"]);
    exit;
}

$idProveedor = intval($data["idProveedor"]);

try {
    // Consulta para obtener todas las compras del proveedor
    // Incluye las que ya tienen devolución (IdDevolucion no NULL)
    $sql = "SELECT 
                ec.IdEncabCompra,
                ec.IdEncabCompra AS numeroCompra,
                ec.FechaSolicitud,
                ec.IdMoneda,
                ec.TRM,
                ec.IdDevolucion,
                p.Proveedor AS nombreProveedor,
                m.Moneda AS nombreMoneda,
                ec.PO_Proveedor,
                ec.Estado,
                c.NomComprador AS nombreComprador
            FROM SAS_EncabCompra ec
            INNER JOIN GEN_Proveedores p ON ec.IdProveedor = p.IdProveedor
            INNER JOIN GEN_Monedas m ON ec.IdMoneda = m.IdMoneda
            LEFT JOIN GEN_Compradores c ON ec.IdComprador = c.IdComprador
            WHERE ec.IdProveedor = ?
            AND ec.Anulado = 0                    -- Solo compras no anuladas            
            ORDER BY ec.FechaSolicitud DESC, ec.IdEncabCompra DESC";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("i", $idProveedor);
    $stmt->execute();

    $stmt->bind_result(
        $idEncabCompra,
        $numeroCompra,
        $fechaSolicitud,
        $idMoneda,
        $trm,
        $idDevolucion,
        $nombreProveedor,
        $nombreMoneda,
        $poProveedor,
        $estado,
        $nombreComprador
    );

    $compras = [];
    while ($stmt->fetch()) {
        $compras[] = [
            "idCompra" => $idEncabCompra,
            "numeroCompra" => $numeroCompra,
            "fecha" => $fechaSolicitud,
            "idMoneda" => $idMoneda,
            "nombreMoneda" => $nombreMoneda,
            "trm" => $trm,
            "idDevolucion" => $idDevolucion,
            "nombreProveedor" => $nombreProveedor,
            "poProveedor" => $poProveedor,
            "estado" => $estado,
            "nombreComprador" => $nombreComprador,
            "tieneDevolucion" => ($idDevolucion !== null && $idDevolucion > 0)
        ];
    }

    $stmt->close();

    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "compras" => $compras,
        "total" => count($compras),
        "proveedor" => [
            "idProveedor" => $idProveedor,
            "nombreProveedor" => $nombreProveedor ?? "Desconocido"
        ]
    ]);

} catch (Exception $e) {
    // Log de error y respuesta de error
    error_log("Error en ApiGetFacturasCliente.php (Compras): " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Error al obtener compras del proveedor: " . $e->getMessage()
    ]);
} finally {
    // Cerrar conexión
    if (isset($enlace)) {
        $enlace->close();
    }
}
?>