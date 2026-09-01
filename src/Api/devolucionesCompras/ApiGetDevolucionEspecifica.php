<?php
/**
 * ApiGetDevolucionEspecifica.php - API para obtener datos específicos de una devolución de compra
 * 
 * Este endpoint obtiene los datos completos de una devolución de compra específica,
 * incluyendo encabezado y detalles con información de devolución.
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

if (!$data || !isset($data["idCompra"]) || !is_numeric($data["idCompra"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de compra no válido"]);
    exit;
}

$idCompra = intval($data["idCompra"]);

try {
    // 1. Obtener datos del encabezado de la compra (campos de devolución)
    $sqlEnc = "SELECT 
                  ec.IdDevolucion,
                  ec.FechaDevolucion,
                  ec.ObservacionesDevolucion,
                  ec.IdMoneda,
                  ec.TRM,
                  ec.IdProveedor,
                  p.Proveedor AS nombreProveedor,
                  ec.PO_Proveedor,
                  ec.Estado,
                  COALESCE(m.Moneda, '') AS monedaNombre
               FROM SAS_EncabCompra ec
               LEFT JOIN GEN_Proveedores p ON ec.IdProveedor = p.IdProveedor
               LEFT JOIN GEN_Monedas m ON ec.IdMoneda = m.IdMoneda
               WHERE ec.IdEncabCompra = ?";
    
    $stmtEnc = $enlace->prepare($sqlEnc);
    if (!$stmtEnc) {
        throw new Exception("Error preparando consulta encabezado: " . $enlace->error);
    }
    $stmtEnc->bind_param("i", $idCompra);
    $stmtEnc->execute();
    
    $stmtEnc->bind_result(
        $idDevolucion, $fechaDevolucion, $observaciones, $idMoneda, $trm,
        $idProveedor, $nombreProveedor, $poProveedor, $estado, $monedaNombre
    );
    
    if (!$stmtEnc->fetch()) {
        throw new Exception("Compra no encontrada");
    }
    $stmtEnc->close();

    // 2. Obtener el detalle con los campos de devolución
    $sqlDet = "SELECT 
                  dpc.IdDetProducto,
                  dpc.IdProducto,
                  p.NOMPRODUCTO AS nombreProducto,
                  dpc.IdVariedad,
                  v.NOMVARIEDAD AS nombreVariedad,
                  dpc.IdGrado,
                  g.NOMGRADO AS nombreGrado,
                  dpc.IdUnidad,
                  u.DescripUnidad AS nombreUnidad,
                  dpc.Tallos_Ramo,
                  IF(dpc.IdUnidad = 4, 
                     ec.Cantidad * (dpc.Tallos_Ramo * IFNULL(dpc.Ramos_Caja, 1)), 
                     ec.Cantidad * IFNULL(dpc.Ramos_Caja, 1)
                  ) AS tallosComprados,
                  dpc.Precio_Compra,
                  dpc.IdPredio,
                  pr.NombrePredio AS nombrePredio,
                  dpc.TallosDevolucion,
                  dpc.MotivoDevolucion
               FROM SAS_DetProductoCompra dpc
               LEFT JOIN SAS_DetEmpaqueCompra ec ON dpc.IdDetEmpaque = ec.IdDetEmpaque
               LEFT JOIN GEN_Productos p ON dpc.IdProducto = p.IdProducto
               LEFT JOIN GEN_Variedades v ON dpc.IdVariedad = v.IdVariedad
               LEFT JOIN GEN_Grados g ON dpc.IdGrado = g.IdGrado
               LEFT JOIN GEN_Unidades u ON dpc.IdUnidad = u.IdUnidades
               LEFT JOIN GEN_Predios pr ON dpc.IdPredio = pr.IdPredio
               WHERE dpc.IdEncabCompra = ?
               ORDER BY dpc.IdDetProducto";

    $stmtDet = $enlace->prepare($sqlDet);
    if (!$stmtDet) {
        throw new Exception("Error preparando consulta detalle: " . $enlace->error);
    }
    $stmtDet->bind_param("i", $idCompra);
    $stmtDet->execute();

    $stmtDet->bind_result(
        $idDetProducto, $idProducto, $nombreProducto, $idVariedad, $nombreVariedad,
        $idGrado, $nombreGrado, $idUnidad, $nombreUnidad, $tallosRamo,
        $tallosComprados, $precioCompra, $idPredio, $nombrePredio,
        $tallosDevolucion, $motivoDevolucion
    );

    $detalles = [];
    while ($stmtDet->fetch()) {
        $detalles[] = [
            "idDetProducto" => $idDetProducto,
            "idProducto" => $idProducto,
            "nombreProducto" => $nombreProducto,
            "idVariedad" => $idVariedad,
            "nombreVariedad" => $nombreVariedad,
            "idGrado" => $idGrado,
            "nombreGrado" => $nombreGrado,
            "idUnidad" => $idUnidad,
            "nombreUnidad" => $nombreUnidad,
            "tallosRamo" => $tallosRamo,
            "tallosComprados" => $tallosComprados,
            "precioCompra" => $precioCompra,
            "idPredio" => $idPredio,
            "nombrePredio" => $nombrePredio,
            "tallosDevolucion" => $tallosDevolucion ?: 0,
            "motivo" => $motivoDevolucion ?: ""
        ];
    }
    $stmtDet->close();

    // 3. Calcular totales
    $totalProductos = count($detalles);
    $totalTallosComprados = array_sum(array_column($detalles, "tallosComprados"));
    $totalTallosDevolucion = array_sum(array_column($detalles, "tallosDevolucion"));

    // 4. Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "encabezado" => [
            "idDevolucion" => $idDevolucion,
            "fechaDevolucion" => $fechaDevolucion,
            "observaciones" => $observaciones,
            "idMoneda" => $idMoneda,
            "monedaNombre" => $monedaNombre,
            "trm" => $trm,
            "idProveedor" => $idProveedor,
            "nombreProveedor" => $nombreProveedor,
            "poProveedor" => $poProveedor,
            "estado" => $estado,
            "numeroDevolucion" => "DEV-" . str_pad($idDevolucion, 6, "0", STR_PAD_LEFT)
        ],
        "detalle" => $detalles,
        "totales" => [
            "totalProductos" => $totalProductos,
            "totalTallosComprados" => $totalTallosComprados,
            "totalTallosDevolucion" => $totalTallosDevolucion
        ]
    ]);

} catch (Exception $e) {
    // Log de error y respuesta de error
    error_log("Error en ApiGetDevolucionEspecifica.php (Compras): " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Error al obtener devolución específica: " . $e->getMessage()
    ]);
} finally {
    // Cerrar conexión
    if (isset($enlace)) {
        $enlace->close();
    }
}
?>