<?php
// src/Api/devoluciones/ApiGuardarDevolucion.php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión"]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "No se recibieron datos"]);
    exit;
}

// Validar campos requeridos
$idFactura = isset($data["idFactura"]) ? intval($data["idFactura"]) : 0;
$fechaDevolucion = $data["fechaDevolucion"] ?? "";
$observaciones = $data["observaciones"] ?? "";
$detalles = $data["detalles"] ?? [];

if (!$idFactura || empty($fechaDevolucion) || empty($detalles)) {
    echo json_encode(["success" => false, "message" => "Faltan datos requeridos"]);
    exit;
}

// Iniciar transacción
$enlace->begin_transaction();

try {
    // 0. Guard: no permitir devoluciones sobre pedidos anulados
    $sqlGuard = "SELECT Anulado FROM SAS_EncabPedido WHERE IdEncabPedido = ?";
    $stmtGuard = $enlace->prepare($sqlGuard);
    if (!$stmtGuard) {
        throw new Exception("Error preparando consulta de validación: " . $enlace->error);
    }
    $stmtGuard->bind_param("i", $idFactura);
    $stmtGuard->execute();
    $stmtGuard->bind_result($anuladoPedido);
    $stmtGuard->fetch();
    $stmtGuard->close();

    if ($anuladoPedido == 1) {
        throw new Exception("No se puede registrar la devolución: el pedido está anulado");
    }

    // 1. Verificar si la factura ya tiene un IdDevolucion asignado
    $sqlCheck = "SELECT IdDevolucion FROM SAS_EncabPedido WHERE IdEncabPedido = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    if (!$stmtCheck) {
        throw new Exception("Error preparando consulta de verificación: " . $enlace->error);
    }
    $stmtCheck->bind_param("i", $idFactura);
    $stmtCheck->execute();
    $stmtCheck->bind_result($idDevolucionExistente);
    $stmtCheck->fetch();
    $stmtCheck->close();

    // Determinar el número de devolución a usar
    if ($idDevolucionExistente !== null && $idDevolucionExistente > 0) {
        // Ya existe: usar el mismo número
        $idDevolucion = $idDevolucionExistente;
        $esNueva = false;
    } else {
        // Es nueva: obtener el siguiente número
        $queryUltimo = "SELECT MAX(IdDevolucion) as ultimo FROM SAS_EncabPedido";
        $result = $enlace->query($queryUltimo);
        if (!$result) {
            throw new Exception("Error al obtener último número: " . $enlace->error);
        }
        $row = $result->fetch_assoc();
        $idDevolucion = ($row['ultimo'] ? (int)$row['ultimo'] : 0) + 1;
        $esNueva = true;
    }

    // Formatear para mostrar (solo para respuesta)
    $numeroDevolucionFormateado = "DEV-" . str_pad($idDevolucion, 6, "0", STR_PAD_LEFT);

    // 2. Actualizar el encabezado de la factura (SAS_EncabPedido)
    if ($esNueva) {
        // Incluir IdDevolucion
        $sqlUpdateEnc = "UPDATE SAS_EncabPedido 
                         SET IdDevolucion = ?, 
                             FechaDevolucion = ?, 
                             ObservacionesDevolucion = ? 
                         WHERE IdEncabPedido = ?";
        $stmtEnc = $enlace->prepare($sqlUpdateEnc);
        if (!$stmtEnc) {
            throw new Exception("Error preparando actualización de encabezado (nueva): " . $enlace->error);
        }
        $stmtEnc->bind_param("issi", $idDevolucion, $fechaDevolucion, $observaciones, $idFactura);
    } else {
        // No modificar IdDevolucion
        $sqlUpdateEnc = "UPDATE SAS_EncabPedido 
                         SET FechaDevolucion = ?, 
                             ObservacionesDevolucion = ? 
                         WHERE IdEncabPedido = ?";
        $stmtEnc = $enlace->prepare($sqlUpdateEnc);
        if (!$stmtEnc) {
            throw new Exception("Error preparando actualización de encabezado (existente): " . $enlace->error);
        }
        $stmtEnc->bind_param("ssi", $fechaDevolucion, $observaciones, $idFactura);
    }

    $stmtEnc->execute();
    if ($stmtEnc->errno) {
        throw new Exception("Error ejecutando actualización de encabezado: " . $stmtEnc->error);
    }
    $stmtEnc->close();

    // 3. Actualizar cada detalle (SAS_DetProducto)
    foreach ($detalles as $det) {
        $idDetProducto = isset($det["idDetProducto"]) ? intval($det["idDetProducto"]) : 0;
        $tallosDevolucion = isset($det["tallosDevolucion"]) ? intval($det["tallosDevolucion"]) : 0;
        $motivo = $det["motivo"] ?? "";
        $flete = isset($det["flete"]) ? floatval($det["flete"]) : 0;
        $fumigacion = isset($det["fumigacion"]) ? floatval($det["fumigacion"]) : 0;
        $otros = isset($det["otros"]) ? floatval($det["otros"]) : 0;

        if (!$idDetProducto) {
            throw new Exception("Detalle sin ID de producto");
        }

        $sqlUpdateDet = "UPDATE SAS_DetProducto 
                         SET TallosDevolucion = ?, 
                             MotivoDevolucion = ?, 
                             Flete = ?, 
                             Fumigacion = ?, 
                             Otros = ? 
                         WHERE IdDetProducto = ?";
        $stmtDet = $enlace->prepare($sqlUpdateDet);
        if (!$stmtDet) {
            throw new Exception("Error preparando actualización de detalle: " . $enlace->error);
        }
        $stmtDet->bind_param("isdddi", $tallosDevolucion, $motivo, $flete, $fumigacion, $otros, $idDetProducto);
        $stmtDet->execute();
        if ($stmtDet->errno) {
            throw new Exception("Error actualizando detalle ID $idDetProducto: " . $stmtDet->error);
        }
        $stmtDet->close();
    }

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "message" => $esNueva ? "Devolución guardada correctamente" : "Devolución actualizada correctamente",
        "idDevolucion" => $idDevolucion,
        "numeroDevolucion" => $numeroDevolucionFormateado
    ]);

} catch (Exception $e) {
    $enlace->rollback();
    error_log("Error en ApiGuardarDevolucion.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} finally {
    if (isset($enlace)) $enlace->close();
}
?>