<?php
// ApiGuardarCliente.php - VERSIÓN ULTRA SIMPLE
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

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos JSON no válidos"]);
    exit;
}

try {
    // Validar campos obligatorios
    if (empty($data["NOMBRE"])) {
        throw new Exception("El nombre del cliente es obligatorio");
    }

    // Escapar todos los datos
    $CodCliente = $enlace->real_escape_string($data["CodCliente"] ?? '');
    $NOMBRE = $enlace->real_escape_string($data["NOMBRE"]);
    $NIT = $enlace->real_escape_string($data["NIT"] ?? '');
    $DV = $enlace->real_escape_string($data["DV"] ?? '');
    $Contaco = $enlace->real_escape_string($data["Contaco"] ?? '');
    $Direc1 = $enlace->real_escape_string($data["Direc1"] ?? '');
    $CIUDAD = $enlace->real_escape_string($data["CIUDAD"] ?? '');
    $ESTADO = $enlace->real_escape_string($data["ESTADO"] ?? 'Activo');
    $PAIS = $enlace->real_escape_string($data["PAIS"] ?? 'Colombia');
    $TEL1 = $enlace->real_escape_string($data["TEL1"] ?? '');
    $E_MAIL = $enlace->real_escape_string($data["E_MAIL"] ?? '');
    $ACTIVO = isset($data["ACTIVO"]) && $data["ACTIVO"] ? 1 : 0;
    $IVA = isset($data["IVA"]) && $data["IVA"] ? 1 : 0;

    // Validar NIT único si se proporciona
    if (!empty($NIT)) {
        $idExcluir = isset($data["IdCliente"]) ? intval($data["IdCliente"]) : 0;
        $sqlVerificar = "SELECT IdCliente FROM GEN_Clientes WHERE NIT = '$NIT'";

        if ($idExcluir > 0) {
            $sqlVerificar .= " AND IdCliente != $idExcluir";
        }

        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("El NIT ya está registrado para otro cliente");
        }
    }

    // Validar nombre único si es creación o si el nombre cambió
    if (!isset($data["IdCliente"])) {
        // Para nuevo cliente: siempre validar
        $sqlVerificarNombre = "SELECT IdCliente FROM GEN_Clientes WHERE UPPER(NOMBRE) = UPPER('$NOMBRE')";
        $result = $enlace->query($sqlVerificarNombre);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe un cliente con ese nombre");
        }
    } else {
        // Para edición: validar solo si el nombre cambió
        $idCliente = intval($data["IdCliente"]);

        // Obtener el nombre actual
        $sqlNombreActual = "SELECT NOMBRE FROM GEN_Clientes WHERE IdCliente = $idCliente";
        $resultActual = $enlace->query($sqlNombreActual);
        if ($resultActual && $row = $resultActual->fetch_assoc()) {
            $nombreActual = $row["NOMBRE"];

            // Si el nombre cambió, validar que no exista
            if (strtoupper($nombreActual) !== strtoupper($NOMBRE)) {
                $sqlVerificarNombre = "SELECT IdCliente FROM GEN_Clientes 
                                   WHERE UPPER(NOMBRE) = UPPER('$NOMBRE') 
                                   AND IdCliente != $idCliente";
                $result = $enlace->query($sqlVerificarNombre);
                if ($result && $result->num_rows > 0) {
                    throw new Exception("Ya existe otro cliente con ese nombre");
                }
            }
        }
    }

    if (isset($data["IdCliente"]) && !empty($data["IdCliente"])) {
        // ACTUALIZAR
        $idCliente = intval($data["IdCliente"]);

        $sql = "UPDATE GEN_Clientes SET 
                CodCliente = '$CodCliente',
                NOMBRE = '$NOMBRE',
                NIT = '$NIT',
                DV = '$DV',
                Contaco = '$Contaco',
                Direc1 = '$Direc1',
                CIUDAD = '$CIUDAD',
                ESTADO = '$ESTADO',
                PAIS = '$PAIS',
                TEL1 = '$TEL1',
                E_MAIL = '$E_MAIL',
                ACTIVO = $ACTIVO,
                IVA = $IVA
                WHERE IdCliente = $idCliente";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al actualizar cliente: " . $enlace->error);
        }

        $idClienteResultado = $idCliente;
    } else {
        // CREAR
        $sql = "INSERT INTO GEN_Clientes 
                (CodCliente, NOMBRE, NIT, DV, Contaco, Direc1, CIUDAD, 
                 ESTADO, PAIS, TEL1, E_MAIL, ACTIVO, IVA) 
                VALUES (
                '$CodCliente',
                '$NOMBRE',
                '$NIT',
                '$DV',
                '$Contaco',
                '$Direc1',
                '$CIUDAD',
                '$ESTADO',
                '$PAIS',
                '$TEL1',
                '$E_MAIL',
                $ACTIVO,
                $IVA)";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al crear cliente: " . $enlace->error);
        }

        $idClienteResultado = $enlace->insert_id;
    }

    echo json_encode([
        "success" => true,
        "message" => isset($data["IdCliente"]) ? "Cliente actualizado correctamente" : "Cliente creado correctamente",
        "idCliente" => $idClienteResultado,
        "fechaRegistro" => date("Y-m-d H:i:s")
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}

$enlace->close();
