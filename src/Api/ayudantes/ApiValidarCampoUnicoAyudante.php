<?php
// src/Api/ayudantes/ApiValidarCampoUnicoAyudante.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || !isset($data["campo"]) || !isset($data["valor"])) {
    echo json_encode(["existe" => false]);
    exit;
}

$campo = $enlace->real_escape_string($data["campo"]);
$valor = $data["valor"];
$idExcluir = isset($data["idExcluir"]) ? intval($data["idExcluir"]) : 0;

// Validar que el campo sea permitido
$camposPermitidos = ["NomAyudante"];
if (!in_array($campo, $camposPermitidos)) {
    echo json_encode(["existe" => false, "error" => "Campo no válido"]);
    exit;
}

try {
    if ($campo === "NomAyudante") {
        if (empty($valor)) {
            echo json_encode(["existe" => false]);
            exit;
        }
        $valorEscapado = $enlace->real_escape_string(trim($valor));
        $sql = "SELECT IdAyudante FROM GEN_Ayudantes WHERE UPPER(NomAyudante) = UPPER('$valorEscapado')";
    } else {
        // NoCedula
        if (empty($valor)) {
            echo json_encode(["existe" => false]);
            exit;
        }
        $valor = intval($valor);
        $sql = "SELECT IdAyudante FROM GEN_Ayudantes WHERE NoCedula = $valor";
    }
    
    if ($idExcluir > 0) {
        $sql .= " AND IdAyudante != $idExcluir";
    }
    
    $result = $enlace->query($sql);
    $existe = ($result && $result->num_rows > 0);
    
    echo json_encode([
        "existe" => $existe,
        "campo" => $campo,
        "valor" => $valor
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "existe" => false,
        "error" => $e->getMessage()
    ]);
}

$enlace->close();
?>