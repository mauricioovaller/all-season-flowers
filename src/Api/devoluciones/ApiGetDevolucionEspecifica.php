<?php
// src/Api/pedidos/ApiGetDevolucionEspecifica.php
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
    // Obtener datos del encabezado de la factura (campos de devolución)
    $sqlEnc = "SELECT 
                  IdDevolucion,
                  FechaDevolucion,
                  ObservacionesDevolucion,
                  IdMoneda,
                  TRM
               FROM SAS_EncabPedido 
               WHERE IdEncabPedido = ?";
    $stmtEnc = $enlace->prepare($sqlEnc);
    if (!$stmtEnc) {
        throw new Exception("Error preparando consulta encabezado: " . $enlace->error);
    }
    $stmtEnc->bind_param("i", $idFactura);
    $stmtEnc->execute();
    $stmtEnc->bind_result($idDevolucion, $fechaDevolucion, $observaciones, $idMoneda, $trm);
    if (!$stmtEnc->fetch()) {
        throw new Exception("Factura no encontrada");
    }
    $stmtEnc->close();

    // Obtener el detalle con los campos de devolución
    $sqlDet = "SELECT 
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
                IF(dp.IdUnidad = 4, e.Cantidad * (dp.Tallos_Ramo * dp.Ramos_Caja), e.Cantidad * dp.Ramos_Caja) AS tallosFacturados,
                dp.Precio_Venta,
                dp.Descripcion,
                dp.IdPredio,
                pr.NombrePredio AS nombrePredio,
                dp.TallosDevolucion,
                dp.MotivoDevolucion,
                dp.Flete,
                dp.Fumigacion,
                dp.Otros
            FROM SAS_DetProducto dp
            LEFT JOIN SAS_DetEmpaque e ON dp.IdDetEmpaque = e.IdDetEmpaque
            LEFT JOIN GEN_Productos p ON dp.IdProducto = p.IdProducto
            LEFT JOIN GEN_Variedades v ON dp.IdVariedad = v.IdVariedad
            LEFT JOIN GEN_Grados g ON dp.IdGrado = g.IdGrado
            LEFT JOIN GEN_Unidades u ON dp.IdUnidad = u.IdUnidades
            LEFT JOIN GEN_Predios pr ON dp.IdPredio = pr.IdPredio
            WHERE dp.IdEncabPedido = ?
            ORDER BY dp.IdDetProducto";

    $stmtDet = $enlace->prepare($sqlDet);
    if (!$stmtDet) {
        throw new Exception("Error preparando consulta detalle: " . $enlace->error);
    }
    $stmtDet->bind_param("i", $idFactura);
    $stmtDet->execute();

    $stmtDet->bind_result(
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
        $nombrePredio,
        $tallosDevolucion,
        $motivoDevolucion,
        $flete,
        $fumigacion,
        $otros
    );

    $detalle = [];

    while ($stmtDet->fetch()) {
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
            "tallosDevolucion" => intval($tallosDevolucion ?? 0),
            "motivo" => $motivoDevolucion ?? "",
            "flete" => floatval($flete ?? 0),
            "fumigacion" => floatval($fumigacion ?? 0),
            "otros" => floatval($otros ?? 0)
        ];
    }

    $stmtDet->close();
    $enlace->close();

    echo json_encode([
        "success" => true,
        "encabezado" => [
            "idDevolucion" => $idDevolucion,
            "numeroDevolucion" => "DEV-" . str_pad($idDevolucion, 6, "0", STR_PAD_LEFT),
            "fechaDevolucion" => $fechaDevolucion,
            "observaciones" => $observaciones,
            "idMoneda" => $idMoneda,
            "trm" => floatval($trm)
        ],
        "detalle" => $detalle,
        "total" => count($detalle)
    ]);

} catch (Exception $e) {
    error_log("Error en ApiGetDevolucionEspecifica.php: " . $e->getMessage());
    if (isset($enlace)) $enlace->close();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>