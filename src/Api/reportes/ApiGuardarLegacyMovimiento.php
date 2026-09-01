<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "No se recibieron datos"]);
    exit;
}

$accion = $data['accion'] ?? ''; // 'guardar' | 'eliminar'

try {
    if ($accion === 'eliminar') {
        $id = intval($data['idLegacyMovimiento'] ?? 0);
        if ($id <= 0) {
            throw new Exception("ID inválido");
        }
        $sql = "UPDATE SAS_LegacyMovimientos SET Anulado = 1 WHERE IdLegacyMovimiento = ?";
        $stmt = $enlace->prepare($sql);
        if (!$stmt) throw new Exception("Error preparando: " . $enlace->error);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        if ($stmt->errno) throw new Exception("Error al anular: " . $stmt->error);
        $stmt->close();

        echo json_encode(["success" => true, "message" => "Registro anulado correctamente"]);
    } elseif ($accion === 'guardar') {
        $id         = intval($data['idLegacyMovimiento'] ?? 0);
        $tipo       = $data['tipo'] ?? '';
        $idEntidad  = intval($data['idEntidad'] ?? 0);
        $fecha      = $data['fecha'] ?? '';
        $numDoc     = $data['numeroDocumento'] ?? '';
        $guia       = $data['guia'] ?? '';
        $valor      = floatval($data['valor'] ?? 0);
        $credito    = floatval($data['credito'] ?? 0);
        $pago       = floatval($data['pago'] ?? 0);
        $idMoneda   = intval($data['idMoneda'] ?? 1);
        $trm        = floatval($data['trm'] ?? 1);

        if (!in_array($tipo, ['C', 'P'])) {
            throw new Exception("Tipo inválido. Use 'C' para cliente o 'P' para proveedor");
        }
        if ($idEntidad <= 0) {
            throw new Exception("IdEntidad inválido");
        }
        if (empty($fecha) || empty($numDoc)) {
            throw new Exception("Fecha y Número de Documento son requeridos");
        }

        if ($id > 0) {
            $sql = "UPDATE SAS_LegacyMovimientos SET
                        Tipo = ?, IdEntidad = ?, Fecha = ?, NumeroDocumento = ?, Guia = ?,
                        Valor = ?, Credito = ?, Pago = ?, IdMoneda = ?, TRM = ?
                    WHERE IdLegacyMovimiento = ?";
            $stmt = $enlace->prepare($sql);
            if (!$stmt) throw new Exception("Error preparando: " . $enlace->error);
            $stmt->bind_param("sisssddidii", $tipo, $idEntidad, $fecha, $numDoc, $guia,
                              $valor, $credito, $pago, $idMoneda, $trm, $id);
            $stmt->execute();
            if ($stmt->errno) throw new Exception("Error actualizando: " . $stmt->error);
            $stmt->close();
            echo json_encode(["success" => true, "message" => "Registro actualizado correctamente"]);
        } else {
            $sql = "INSERT INTO SAS_LegacyMovimientos
                    (Tipo, IdEntidad, Fecha, NumeroDocumento, Guia, Valor, Credito, Pago, IdMoneda, TRM, Anulado)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)";
            $stmt = $enlace->prepare($sql);
            if (!$stmt) throw new Exception("Error preparando: " . $enlace->error);
            $stmt->bind_param("sisssddidii", $tipo, $idEntidad, $fecha, $numDoc, $guia,
                              $valor, $credito, $pago, $idMoneda, $trm);
            $stmt->execute();
            if ($stmt->errno) throw new Exception("Error insertando: " . $stmt->error);
            $nuevoId = $enlace->insert_id;
            $stmt->close();
            echo json_encode(["success" => true, "message" => "Registro creado correctamente", "id" => $nuevoId]);
        }
    } else {
        throw new Exception("Acción no válida. Use 'guardar' o 'eliminar'");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

$enlace->close();
