<?php
// src/Api/pagosProveedores/ApiEliminarPagoProveedor.php
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

if (!$data || !isset($data['idPagoProveedor'])) {
    echo json_encode(["success" => false, "message" => "No se recibió ID de pago"]);
    exit;
}

$idPagoProveedor = intval($data['idPagoProveedor']);

// Iniciar transacción
$enlace->begin_transaction();

try {
    // 1. Verificar que el pago existe y no está anulado
    $sqlCheck = "SELECT Anulado FROM SAS_EncabPagoProveedor WHERE IdEncabPagoProveedor = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    if (!$stmtCheck) {
        throw new Exception("Error preparando consulta de verificación: " . $enlace->error);
    }
    $stmtCheck->bind_param("i", $idPagoProveedor);
    $stmtCheck->execute();
    $stmtCheck->bind_result($anulado);
    $found = $stmtCheck->fetch();
    $stmtCheck->close();

    if (!$found) {
        throw new Exception("Pago no encontrado");
    }

    if ($anulado == 1) {
        throw new Exception("El pago ya está anulado");
    }

    // 2. Marcar como anulado (no eliminar físicamente para mantener historial)
    $sqlUpdate = "UPDATE SAS_EncabPagoProveedor SET Anulado = 1 WHERE IdEncabPagoProveedor = ?";
    $stmtUpdate = $enlace->prepare($sqlUpdate);
    if (!$stmtUpdate) {
        throw new Exception("Error preparando actualización: " . $enlace->error);
    }
    $stmtUpdate->bind_param("i", $idPagoProveedor);
    $stmtUpdate->execute();

    if ($stmtUpdate->affected_rows === 0) {
        throw new Exception("No se pudo anular el pago");
    }

    $stmtUpdate->close();

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "message" => "Pago anulado correctamente",
        "numeroPago" => "PAG-PROV-" . str_pad($idPagoProveedor, 6, "0", STR_PAD_LEFT)
    ]);
} catch (Exception $e) {
    $enlace->rollback();
    error_log("Error en ApiEliminarPagoProveedor.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} finally {
    if (isset($enlace)) $enlace->close();
}
