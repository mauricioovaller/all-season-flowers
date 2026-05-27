<?php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

$filtroNumero = $data["filtroNumero"] ?? "";
$filtroFecha = $data["filtroFecha"] ?? "";
$filtroMotivo = $data["filtroMotivo"] ?? "";

try {
    $sql = "SELECT
                eb.IdEncabBaja,
                eb.Fecha,
                eb.MotivoGeneral,
                eb.QuienAutoriza,
                eb.Anulado,
                COALESCE(SUM(db.Tallos), 0) AS TotalTallos,
                COUNT(db.IdDetBaja) AS TotalItems
            FROM SAS_EncabBaja eb
            LEFT JOIN SAS_DetBaja db ON eb.IdEncabBaja = db.IdEncabBaja
            WHERE eb.Anulado = 0";

    $params = [];
    $types = "";

    if (!empty($filtroNumero)) {
        if (is_numeric($filtroNumero)) {
            $sql .= " AND eb.IdEncabBaja = ?";
            $params[] = $filtroNumero;
            $types .= "i";
        }
    }

    if (!empty($filtroFecha)) {
        $sql .= " AND DATE(eb.Fecha) = ?";
        $params[] = $filtroFecha;
        $types .= "s";
    }

    if (!empty($filtroMotivo)) {
        $sql .= " AND eb.MotivoGeneral LIKE ?";
        $params[] = "%" . $filtroMotivo . "%";
        $types .= "s";
    }

    $sql .= " GROUP BY eb.IdEncabBaja ORDER BY eb.IdEncabBaja DESC LIMIT 100";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $stmt->bind_result($idBaja, $fecha, $motivo, $autoriza, $anulado, $totalTallos, $totalItems);

    $bajas = [];
    while ($stmt->fetch()) {
        $bajas[] = [
            "idBaja" => $idBaja,
            "numeroBaja" => "BAJA-" . str_pad($idBaja, 6, "0", STR_PAD_LEFT),
            "fecha" => $fecha,
            "motivoGeneral" => $motivo,
            "quienAutoriza" => $autoriza,
            "anulado" => $anulado,
            "totalTallos" => $totalTallos,
            "totalItems" => $totalItems,
        ];
    }

    $stmt->close();
    $enlace->close();

    echo json_encode([
        "success" => true,
        "bajas" => $bajas,
        "total" => count($bajas)
    ]);

} catch (Exception $e) {
    if (isset($enlace)) $enlace->close();
    echo json_encode(["success" => false, "message" => "Error interno: " . $e->getMessage()]);
}
?>
