<?php
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST"); 
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/Delaware/conexionBaseDatos/conexionbd.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['idProducto']) || !is_numeric($input['idProducto'])) {
    http_response_code(400);
    echo json_encode(["error" => "ID de producto inválido"]);
    exit;
}

$idProducto = (int) $input['idProducto'];

// Función para obtener datos usando bind_result()
function obtenerDatos($enlace, $query, $idProducto) {
    $stmt = $enlace->prepare($query);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Error en la preparación de la consulta: " . $enlace->error]);
        exit;
    }

    $stmt->bind_param("i", $idProducto);
    $stmt->execute();
    $id = null;
    $nombre = null;

    // Vincula las columnas del resultado a las variables
    $stmt->bind_result($id, $nombre);

    $datos = [];
    while ($stmt->fetch()) {
        $datos[] = [
            "id" => $id,
            "nombre" => $nombre
        ];
    }

    $stmt->close();
    return $datos;
}

// Consultas a la base de datos
$variedades = obtenerDatos($enlace, "SELECT IdVariedad, NOMVARIEDAD FROM GEN_Variedades WHERE IdProducto = ? ORDER BY NOMVARIEDAD", $idProducto);
$grados = obtenerDatos($enlace, "SELECT IdGrado, NOMGRADO FROM GEN_Grados WHERE IdProducto = ? ORDER BY NOMGRADO", $idProducto);

// Responder con los datos en formato JSON
echo json_encode([
    'variedades' => $variedades,
    'grados' => $grados
]);

$enlace->close();
?>