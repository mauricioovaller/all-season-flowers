<?php
// src/Api/pedidos/ApiGetDetalleFactura.php
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

if (!$data || !isset($data["idFactura"]) || !is_numeric($data["idFactura"])) {
    echo json_encode(["success" => false, "message" => "ID de factura no válido"]);
    exit;
}

$idFactura = intval($data["idFactura"]);

try {
    // Obtener el detalle de la factura (pedido) con toda la información necesaria
    $sql = "SELECT 
                dp.IdDetProducto,
                dp.IdProducto,
                p.NOMPRODUCTO AS nombreProducto,
                dp.IdVariedad,
                v.NOMVARIEDAD AS nombreVariedad,
                dp.IdGrado,
                g.NOMGRADO AS nombreGrado,
                dp.IdUnidad,
                u.DescripUnidad AS nombreUnidad,
                dp.Tallos_Ramo,
                dp.Ramos_Caja,
                IF(dp.IdUnidad = 4, e.Cantidad * (dp.Tallos_Ramo * dp.Ramos_Caja), e.Cantidad * 	    dp.Ramos_Caja) AS tallosFacturados,
                dp.Precio_Venta,
                dp.Descripcion,
                dp.IdPredio,
                pr.NombrePredio AS nombrePredio
            FROM SAS_DetProducto dp
            LEFT JOIN SAS_DetEmpaque e ON dp.IdDetEmpaque = e.IdDetEmpaque
            LEFT JOIN GEN_Productos p ON dp.IdProducto = p.IdProducto
            LEFT JOIN GEN_Variedades v ON dp.IdVariedad = v.IdVariedad
            LEFT JOIN GEN_Grados g ON dp.IdGrado = g.IdGrado
            LEFT JOIN GEN_Unidades u ON dp.IdUnidad = u.IdUnidades
            LEFT JOIN GEN_Predios pr ON dp.IdPredio = pr.IdPredio
            WHERE dp.IdEncabPedido = ?
            ORDER BY dp.IdDetProducto";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param("i", $idFactura);
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
        $ramosCaja,
        $tallosFacturados,
        $precioVenta,
        $descripcion,
        $idPredio,
        $nombrePredio
    );

    $detalle = [];

    while ($stmt->fetch()) {
        $detalle[] = [
            "idDetProducto" => $idDetProducto,
            "idProducto" => $idProducto,
            "producto" => $nombreProducto,
            "idVariedad" => $idVariedad,
            "variedad" => $nombreVariedad,
            "idGrado" => $idGrado,
            "grado" => $nombreGrado,
            "idUnidad" => $idUnidad,
            "unidad" => $nombreUnidad,
            "tallosRamo" => $tallosRamo,
            "ramosCaja" => $ramosCaja,
            "tallosFacturados" => intval($tallosFacturados),
            "precioUnitario" => floatval($precioVenta),
            "descripcion" => $descripcion,
            "idPredio" => $idPredio,
            "predio" => $nombrePredio,
            // Campos para la devolución (inicializados en 0/vacío)
            "tallosDevolucion" => 0,
            "motivo" => "",
            "flete" => 0,
            "fumigacion" => 0,
            "otros" => 0
        ];
    }

    $stmt->close();
    $enlace->close();

    echo json_encode([
        "success" => true,
        "detalle" => $detalle,
        "total" => count($detalle)
    ]);

} catch (Exception $e) {
    error_log("Error en ApiGetDetalleFactura.php: " . $e->getMessage());
    if (isset($enlace)) $enlace->close();
    echo json_encode(["success" => false, "message" => "Error interno del servidor"]);
}
?>