<?php
// src/Api/ayudantes/ApiEliminarAyudante.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || !isset($data["idAyudante"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "ID de ayudante no proporcionado"]);
    exit;
}

$idAyudante = intval($data["idAyudante"]);

try {
    // Verificar si el ayudante existe
    $sqlVerificar = "SELECT NomAyudante FROM GEN_Ayudantes WHERE IdAyudante = $idAyudante";
    $resultVerificar = $enlace->query($sqlVerificar);
    
    if (!$resultVerificar || $resultVerificar->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Ayudante no encontrado"
        ]);
        exit;
    }
    
    $ayudante = $resultVerificar->fetch_assoc();
    $nombreAyudante = $ayudante["NomAyudante"];
    
    // ELIMINACIÓN LÓGICA (marcar como inactivo)
    $sql = "UPDATE GEN_Ayudantes SET ACTIVO = 0 WHERE IdAyudante = $idAyudante";
    $result = $enlace->query($sql);
    
    if ($result) {
        echo json_encode([
            "success" => true,
            "message" => "Ayudante '$nombreAyudante' desactivado correctamente",
            "eliminacionLogica" => true
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No se pudo desactivar el ayudante: " . $enlace->error
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error al desactivar ayudante: " . $e->getMessage()
    ]);
}

$enlace->close();
?>