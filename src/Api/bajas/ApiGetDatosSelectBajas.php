<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

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

try {
    $productos = [];
    $sqlProd = "SELECT IdProducto, CODPRODUCTO, NOMPRODUCTO FROM GEN_Productos WHERE ACTIVO = 1 ORDER BY NOMPRODUCTO ASC";
    $stmt = $enlace->prepare($sqlProd);
    $stmt->execute();
    $stmt->bind_result($id, $cod, $nom);
    while ($stmt->fetch()) {
        $productos[] = ["id" => $id, "codigo" => $cod, "nombre" => $nom];
    }
    $stmt->close();

    $variedades = [];
    $sqlVar = "SELECT v.IdVariedad, v.IdProducto, v.NOMVARIEDAD, v.COLOR FROM GEN_Variedades v WHERE v.ACTIVO = 1 ORDER BY v.NOMVARIEDAD ASC";
    $stmt = $enlace->prepare($sqlVar);
    $stmt->execute();
    $stmt->bind_result($id, $idProd, $nom, $color);
    while ($stmt->fetch()) {
        $variedades[] = ["id" => $id, "idProducto" => $idProd, "nombre" => $nom, "color" => $color];
    }
    $stmt->close();

    $grados = [];
    $sqlGra = "SELECT g.IdGrado, g.IdProducto, g.NOMGRADO, g.TAMGRADO FROM GEN_Grados g WHERE g.ACTIVO = 1 ORDER BY g.NOMGRADO ASC";
    $stmt = $enlace->prepare($sqlGra);
    $stmt->execute();
    $stmt->bind_result($id, $idProd, $nom, $tam);
    while ($stmt->fetch()) {
        $grados[] = ["id" => $id, "idProducto" => $idProd, "nombre" => $nom, "tamano" => $tam];
    }
    $stmt->close();

    $enlace->close();

    echo json_encode([
        "success" => true,
        "productos" => $productos,
        "variedades" => $variedades,
        "grados" => $grados
    ]);

} catch (Exception $e) {
    if (isset($enlace)) $enlace->close();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>
