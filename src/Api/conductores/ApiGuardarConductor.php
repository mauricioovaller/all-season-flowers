<?php
// src/Api/conductores/ApiGuardarConductor.php
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

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos JSON no válidos"]);
    exit;
}

try {
    // Validar campos obligatorios
    $camposObligatorios = ["NombreConductor", "NoCedula", "Telefono", "Placas"];
    foreach ($camposObligatorios as $campo) {
        if (empty($data[$campo])) {
            throw new Exception("El campo '$campo' es obligatorio");
        }
    }

    // Escapar datos
    $NombreConductor = $enlace->real_escape_string(trim($data["NombreConductor"]));
    $NoCedula = $enlace->real_escape_string(trim($data["NoCedula"]));
    $Telefono = $enlace->real_escape_string(trim($data["Telefono"]));
    $TipoVehiculo = $enlace->real_escape_string($data["TipoVehiculo"] ?? '');
    $Marca = $enlace->real_escape_string($data["Marca"] ?? '');
    $Color = $enlace->real_escape_string($data["Color"] ?? '');
    $Placas = $enlace->real_escape_string(trim($data["Placas"]));
    $ACTIVO = isset($data["ACTIVO"]) && $data["ACTIVO"] ? 1 : 0;
    
    // Determinar si es edición o creación
    $idExcluir = 0;
    $esEdicion = false;
    
    if (isset($data["IdConductor"]) && !empty($data["IdConductor"])) {
        $idExcluir = intval($data["IdConductor"]);
        $esEdicion = ($idExcluir > 0);
    }

    // Validar longitud máxima
    $longitudes = [
        "NombreConductor" => [100, $NombreConductor],
        "NoCedula" => [50, $NoCedula],
        "Telefono" => [50, $Telefono],
        "TipoVehiculo" => [50, $TipoVehiculo],
        "Marca" => [50, $Marca],
        "Color" => [50, $Color],
        "Placas" => [50, $Placas]
    ];
    
    foreach ($longitudes as $campo => [$max, $valor]) {
        if (strlen($valor) > $max) {
            throw new Exception("El campo '$campo' no puede exceder $max caracteres");
        }
    }

    // SOLO VALIDAR NOMBRE ÚNICO (como en Productos)
    $sqlVerificarNombre = "SELECT IdConductor FROM GEN_Conductores 
                          WHERE UPPER(NombreConductor) = UPPER('$NombreConductor')";
    
    if ($idExcluir > 0) {
        $sqlVerificarNombre .= " AND IdConductor != $idExcluir";
    }
    
    $result = $enlace->query($sqlVerificarNombre);
    if ($result && $result->num_rows > 0) {
        throw new Exception("Ya existe un conductor con ese nombre");
    }

    if ($esEdicion) {
        // ACTUALIZAR
        $sql = "UPDATE GEN_Conductores SET 
                NombreConductor = '$NombreConductor',
                NoCedula = '$NoCedula',
                Telefono = '$Telefono',
                TipoVehiculo = '$TipoVehiculo',
                Marca = '$Marca',
                Color = '$Color',
                Placas = '$Placas',
                ACTIVO = $ACTIVO
                WHERE IdConductor = $idExcluir";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al actualizar conductor: " . $enlace->error);
        }

        $idConductorResultado = $idExcluir;
    } else {
        // CREAR
        $sql = "INSERT INTO GEN_Conductores 
                (NombreConductor, NoCedula, Telefono, TipoVehiculo, Marca, Color, Placas, ACTIVO) 
                VALUES (
                '$NombreConductor',
                '$NoCedula',
                '$Telefono',
                '$TipoVehiculo',
                '$Marca',
                '$Color',
                '$Placas',
                $ACTIVO)";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al crear conductor: " . $enlace->error);
        }

        $idConductorResultado = $enlace->insert_id;
    }

    echo json_encode([
        "success" => true,
        "message" => $esEdicion ? "Conductor actualizado correctamente" : "Conductor creado correctamente",
        "idConductor" => $idConductorResultado
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}

$enlace->close();
?>