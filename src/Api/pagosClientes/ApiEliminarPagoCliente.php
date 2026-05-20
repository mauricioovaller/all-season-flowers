<?php
// src/Api/pagosClientes/ApiEliminarPagoCliente.php
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

if (!$data || !isset($data['idPagoCliente'])) {
    echo json_encode(["success" => false, "message" => "No se recibió ID de pago"]);
    exit;
}

$idPagoCliente = intval($data['idPagoCliente']);

// Iniciar transacción
$enlace->begin_transaction();

try {
    // 1. Verificar que el pago existe y no está anulado
    $sqlCheck = "SELECT IdEncabPagoCliente, Anulado FROM SAS_EncabPagoCliente WHERE IdEncabPagoCliente = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    if (!$stmtCheck) {
        throw new Exception("Error preparando consulta de verificación: " . $enlace->error);
    }
    $stmtCheck->bind_param("i", $idPagoCliente);
    $stmtCheck->execute();
    $stmtCheck->bind_result($idEncabPagoCliente, $anulado);
    $stmtCheck->fetch();
    $stmtCheck->close();

    if (!$idEncabPagoCliente) {
        throw new Exception("Pago no encontrado");
    }

    if ($anulado == 1) {
        throw new Exception("El pago ya está anulado");
    }

    // 2. Marcar como anulado el encabezado (no eliminar físicamente para mantener historial)
    $sqlUpdate = "UPDATE SAS_EncabPagoCliente SET Anulado = 1 WHERE IdEncabPagoCliente = ?";
    $stmtUpdate = $enlace->prepare($sqlUpdate);
    if (!$stmtUpdate) {
        throw new Exception("Error preparando actualización: " . $enlace->error);
    }
    $stmtUpdate->bind_param("i", $idPagoCliente);
    $stmtUpdate->execute();

    if ($stmtUpdate->affected_rows === 0) {
        throw new Exception("No se pudo anular el pago");
    }
    $stmtUpdate->close();

    // 3. Anular también los detalles hijos para que los saldos se recalculen correctamente
    $sqlUpdateDet = "UPDATE SAS_DetPagoCliente SET Anulado = 1 WHERE IdEncabPagoCliente = ?";
    $stmtUpdateDet = $enlace->prepare($sqlUpdateDet);
    if (!$stmtUpdateDet) {
        throw new Exception("Error preparando actualización de detalles: " . $enlace->error);
    }
    $stmtUpdateDet->bind_param("i", $idPagoCliente);
    $stmtUpdateDet->execute();
    $stmtUpdateDet->close();

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "message" => "Pago anulado correctamente",
        "idEncabPagoCliente" => $idEncabPagoCliente
    ]);
} catch (Exception $e) {
    $enlace->rollback();
    error_log("Error en ApiEliminarPagoCliente.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} finally {
    if (isset($enlace)) $enlace->close();
}
