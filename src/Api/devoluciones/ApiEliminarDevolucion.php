<?php
// src/Api/devoluciones/ApiEliminarDevolucion.php
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

if (!$data || !isset($data["idDevolucion"])) {
    echo json_encode(["success" => false, "message" => "Datos inválidos. Se requiere idDevolucion"]);
    exit;
}

$idDevolucion = $data["idDevolucion"];

try {
    // Iniciar transacción
    $enlace->begin_transaction();
    
    // 1. Buscar la factura asociada a esta devolución
    $sqlBuscar = "SELECT IdEncabPedido FROM SAS_EncabPedido WHERE IdDevolucion = ?";
    $stmtBuscar = $enlace->prepare($sqlBuscar);
    if (!$stmtBuscar) {
        throw new Exception("Error preparando consulta de búsqueda: " . $enlace->error);
    }
    
    $stmtBuscar->bind_param("i", $idDevolucion);
    $stmtBuscar->execute();
    $stmtBuscar->bind_result($idFactura);
    $stmtBuscar->fetch();
    $stmtBuscar->close();
    
    if (!$idFactura) {
        throw new Exception("No se encontró la factura asociada a esta devolución");
    }
    
    // 2. Eliminar los registros de devolución en el detalle (SAS_DetProducto)
    $sqlDetalle = "UPDATE SAS_DetProducto SET 
                   TallosDevolucion = NULL, 
                   MotivoDevolucion = NULL 
                   WHERE IdEncabPedido = ?";
    $stmtDetalle = $enlace->prepare($sqlDetalle);
    if (!$stmtDetalle) {
        throw new Exception("Error preparando actualización de detalle: " . $enlace->error);
    }
    
    $stmtDetalle->bind_param("i", $idFactura);
    if (!$stmtDetalle->execute()) {
        throw new Exception("Error actualizando detalle: " . $stmtDetalle->error);
    }
    $stmtDetalle->close();
    
    // 3. Eliminar los registros de devolución en el encabezado (SAS_EncabPedido)
    $sqlEncabezado = "UPDATE SAS_EncabPedido SET 
                      IdDevolucion = NULL, 
                      FechaDevolucion = NULL, 
                      ObservacionesDevolucion = NULL 
                      WHERE IdEncabPedido = ?";
    $stmtEncabezado = $enlace->prepare($sqlEncabezado);
    if (!$stmtEncabezado) {
        throw new Exception("Error preparando actualización de encabezado: " . $enlace->error);
    }
    
    $stmtEncabezado->bind_param("i", $idFactura);
    if (!$stmtEncabezado->execute()) {
        throw new Exception("Error actualizando encabezado: " . $stmtEncabezado->error);
    }
    $stmtEncabezado->close();
    
    // Confirmar transacción
    $enlace->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Devolución eliminada correctamente",
        "idDevolucion" => $idDevolucion,
        "idFactura" => $idFactura
    ]);
    
} catch (Exception $e) {
    // Revertir transacción en caso de error
    if (isset($enlace)) {
        $enlace->rollback();
    }
    
    error_log("Error en ApiEliminarDevolucion.php: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Error al eliminar la devolución: " . $e->getMessage()
    ]);
} finally {
    if (isset($enlace)) {
        $enlace->close();
    }
}
?>