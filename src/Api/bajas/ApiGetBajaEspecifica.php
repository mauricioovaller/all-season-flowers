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
$idBaja = intval($data["idBaja"] ?? 0);

if ($idBaja <= 0) {
    echo json_encode(["success" => false, "message" => "ID de baja inválido"]);
    exit;
}

try {
    $sqlEnc = "SELECT
        eb.IdEncabBaja,
        eb.Fecha,
        eb.MotivoGeneral,
        eb.Observaciones,
        eb.QuienAutoriza,
        eb.Anulado
    FROM SAS_EncabBaja eb
    WHERE eb.IdEncabBaja = ?";

    $stmtEnc = $enlace->prepare($sqlEnc);
    if (!$stmtEnc) {
        throw new Exception("Error preparando encabezado: " . $enlace->error);
    }

    $stmtEnc->bind_param("i", $idBaja);
    $stmtEnc->execute();
    $stmtEnc->store_result();

    if ($stmtEnc->num_rows == 0) {
        $stmtEnc->close();
        echo json_encode(["success" => false, "message" => "Baja no encontrada"]);
        exit;
    }

    $stmtEnc->bind_result($idEncab, $fecha, $motivo, $observaciones, $autoriza, $anulado);
    $stmtEnc->fetch();
    $stmtEnc->close();

    $sqlDet = "SELECT
        db.IdDetBaja,
        db.IdEncabBaja,
        db.IdProducto,
        db.IdVariedad,
        db.IdGrado,
        db.Tallos,
        db.MotivoSalida,
        p.NOMPRODUCTO AS nombreProducto,
        v.NOMVARIEDAD AS nombreVariedad,
        g.NOMGRADO AS nombreGrado
    FROM SAS_DetBaja db
    LEFT JOIN GEN_Productos p ON db.IdProducto = p.IdProducto
    LEFT JOIN GEN_Variedades v ON db.IdVariedad = v.IdVariedad
    LEFT JOIN GEN_Grados g ON db.IdGrado = g.IdGrado
    WHERE db.IdEncabBaja = ?";

    $stmtDet = $enlace->prepare($sqlDet);
    if (!$stmtDet) {
        throw new Exception("Error preparando detalle: " . $enlace->error);
    }

    $stmtDet->bind_param("i", $idBaja);
    $stmtDet->execute();
    $stmtDet->bind_result($idDet, $idEnc, $idProd, $idVar, $idGra, $tallos, $motivoSal, $nomProd, $nomVar, $nomGra);

    $detalles = [];
    while ($stmtDet->fetch()) {
        $detalles[] = [
            "id" => $idDet,
            "producto" => $idProd,
            "variedad" => $idVar ?? 0,
            "grado" => $idGra ?? 0,
            "tallos" => $tallos,
            "motivoSalida" => $motivoSal ?? "",
            "nombreProducto" => $nomProd ?? "",
            "nombreVariedad" => $nomVar ?? "",
            "nombreGrado" => $nomGra ?? "",
        ];
    }

    $stmtDet->close();
    $enlace->close();

    echo json_encode([
        "success" => true,
        "baja" => [
            "header" => [
                "IdEncabBaja" => $idEncab,
                "Fecha" => $fecha,
                "MotivoGeneral" => $motivo,
                "Observaciones" => $observaciones,
                "QuienAutoriza" => $autoriza,
                "Anulado" => $anulado,
            ],
            "detalles" => $detalles
        ]
    ]);

} catch (Exception $e) {
    if (isset($enlace)) $enlace->close();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>
