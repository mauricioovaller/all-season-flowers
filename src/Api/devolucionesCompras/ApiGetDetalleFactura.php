<?php
/**
 * ApiGetDetalleFactura.php - API para obtener detalle de compra para devolución
 * 
 * Este endpoint obtiene los detalles de productos de una compra específica
 * para poder procesar devoluciones. Incluye información de productos, variedades,
 * grados, unidades y empaques.
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
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

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
    // Obtener el detalle de la compra con toda la información necesaria
    $sql = "SELECT 
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
                dpc.TallosDevolucion,
                dpc.MotivoDevolucion,
                IF(dpc.IdUnidad = 4, 
                   ec.Cantidad * (dpc.Tallos_Ramo * IFNULL(dpc.Ramos_Caja, 1)), 
                   ec.Cantidad * IFNULL(dpc.Ramos_Caja, 1)
                ) AS tallosComprados,
                dpc.Precio_Compra,
                dpc.IdPredio,
                pr.NombrePredio AS nombrePredio
            FROM SAS_DetProductoCompra dpc
            LEFT JOIN SAS_DetEmpaqueCompra ec ON dpc.IdDetEmpaque = ec.IdDetEmpaque
            LEFT JOIN GEN_Productos p ON dpc.IdProducto = p.IdProducto
            LEFT JOIN GEN_Variedades v ON dpc.IdVariedad = v.IdVariedad
            LEFT JOIN GEN_Grados g ON dpc.IdGrado = g.IdGrado
            LEFT JOIN GEN_Unidades u ON dpc.IdUnidad = u.IdUnidades
            LEFT JOIN GEN_Predios pr ON dpc.IdPredio = pr.IdPredio
            WHERE dpc.IdEncabCompra = ?
            ORDER BY dpc.IdDetProducto";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("i", $idCompra);
    $stmt->execute();

    $stmt->bind_result(
        $idDetProducto,
        $idProducto,
        $nombreProducto,
        $idVariedad,
        $nombreVariedad,
        $idGrado,
        $nombreGrado,
        $idUnidad,
        $nombreUnidad,
        $tallosRamo,
        $tallosDevolucion,
        $motivoDevolucion,
        $tallosComprados,
        $precioCompra,
        $idPredio,
        $nombrePredio
    );

    $detalles = [];
    while ($stmt->fetch()) {
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

    $stmt->close();

    // Calcular total de tallos comprados
    $totalTallos = array_sum(array_column($detalles, "tallosComprados"));

    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "detalle" => $detalles,
        "total" => $totalTallos,
        "count" => count($detalles)
    ]);

} catch (Exception $e) {
    // Log de error y respuesta de error
    error_log("Error en ApiGetDetalleFactura.php (Compras): " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Error al obtener detalle de compra: " . $e->getMessage()
    ]);
} finally {
    // Cerrar conexión
    if (isset($enlace)) {
        $enlace->close();
    }
}
?>