<?php
/**
 * ApiGuardarDevolucion.php - API para guardar devoluciones de compras
 * 
 * Este endpoint maneja la creación y actualización de devoluciones para compras.
 * Actualiza los campos de devolución en SAS_EncabCompra y SAS_DetProductoCompra.
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
    echo json_encode(["success" => false, "message" => "No se recibieron datos válidos"]);
    exit;
}

// Validar campos requeridos
$idCompra = isset($data["idCompra"]) ? intval($data["idCompra"]) : 0;
$fechaDevolucion = $data["fechaDevolucion"] ?? "";
$observaciones = $data["observaciones"] ?? "";
$detalles = $data["detalles"] ?? [];

if (!$idCompra || empty($fechaDevolucion) || empty($detalles)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Faltan datos requeridos: idCompra, fechaDevolucion o detalles"]);
    exit;
}

// Iniciar transacción para garantizar integridad de datos
$enlace->begin_transaction();

try {
    // 1. Verificar si la compra ya tiene un IdDevolucion asignado
    $sqlCheck = "SELECT IdDevolucion FROM SAS_EncabCompra WHERE IdEncabCompra = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    if (!$stmtCheck) {
        throw new Exception("Error preparando consulta de verificación: " . $enlace->error);
    }
    $stmtCheck->bind_param("i", $idCompra);
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
        $queryUltimo = "SELECT MAX(IdDevolucion) as ultimo FROM SAS_EncabCompra";
        $result = $enlace->query($queryUltimo);
        if (!$result) {
            throw new Exception("Error al obtener último número: " . $enlace->error);
        }
        $row = $result->fetch_assoc();
        $idDevolucion = ($row['ultimo'] ? (int)$row['ultimo'] : 0) + 1;
        $esNueva = true;
    }

    // Formatear número de devolución para mostrar
    $numeroDevolucionFormateado = "DEV-" . str_pad($idDevolucion, 6, "0", STR_PAD_LEFT);

    // 2. Actualizar el encabezado de la compra (SAS_EncabCompra)
    if ($esNueva) {
        // Incluir IdDevolucion para nueva devolución
        $sqlUpdateEnc = "UPDATE SAS_EncabCompra 
                         SET IdDevolucion = ?, 
                             FechaDevolucion = ?, 
                             ObservacionesDevolucion = ? 
                         WHERE IdEncabCompra = ?";
        $stmtEnc = $enlace->prepare($sqlUpdateEnc);
        if (!$stmtEnc) {
            throw new Exception("Error preparando actualización de encabezado (nueva): " . $enlace->error);
        }
        $stmtEnc->bind_param("issi", $idDevolucion, $fechaDevolucion, $observaciones, $idCompra);
    } else {
        // No modificar IdDevolucion para devolución existente
        $sqlUpdateEnc = "UPDATE SAS_EncabCompra 
                         SET FechaDevolucion = ?, 
                             ObservacionesDevolucion = ? 
                         WHERE IdEncabCompra = ?";
        $stmtEnc = $enlace->prepare($sqlUpdateEnc);
        if (!$stmtEnc) {
            throw new Exception("Error preparando actualización de encabezado (existente): " . $enlace->error);
        }
        $stmtEnc->bind_param("ssi", $fechaDevolucion, $observaciones, $idCompra);
    }

    $stmtEnc->execute();
    if ($stmtEnc->errno) {
        throw new Exception("Error ejecutando actualización de encabezado: " . $stmtEnc->error);
    }
    $stmtEnc->close();

    // 3. Actualizar cada detalle de producto (SAS_DetProductoCompra)
    foreach ($detalles as $det) {
        $idDetProducto = isset($det["idDetProducto"]) ? intval($det["idDetProducto"]) : 0;
        $tallosDevolucion = isset($det["tallosDevolucion"]) ? intval($det["tallosDevolucion"]) : 0;
        $motivo = $det["motivo"] ?? "";

        if (!$idDetProducto) {
            throw new Exception("Detalle sin ID de producto válido");
        }

        // Actualizar solo los campos de devolución (no existen Flete, Fumigacion, Otros en compras)
        $sqlUpdateDet = "UPDATE SAS_DetProductoCompra 
                         SET TallosDevolucion = ?, 
                             MotivoDevolucion = ? 
                         WHERE IdDetProducto = ?";
        $stmtDet = $enlace->prepare($sqlUpdateDet);
        if (!$stmtDet) {
            throw new Exception("Error preparando actualización de detalle: " . $enlace->error);
        }
        $stmtDet->bind_param("isi", $tallosDevolucion, $motivo, $idDetProducto);
        $stmtDet->execute();
        if ($stmtDet->errno) {
            throw new Exception("Error actualizando detalle ID $idDetProducto: " . $stmtDet->error);
        }
        $stmtDet->close();
    }

    // Confirmar transacción
    $enlace->commit();

    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => $esNueva ? "Devolución de compra guardada correctamente" : "Devolución de compra actualizada correctamente",
        "idDevolucion" => $idDevolucion,
        "numeroDevolucion" => $numeroDevolucionFormateado,
        "idCompra" => $idCompra
    ]);

} catch (Exception $e) {
    // Revertir transacción en caso de error
    $enlace->rollback();
    error_log("Error en ApiGuardarDevolucion.php (Compras): " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Error interno del servidor: " . $e->getMessage()
    ]);
} finally {
    // Cerrar conexión
    if (isset($enlace)) {
        $enlace->close();
    }
}
?>