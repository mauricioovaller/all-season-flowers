<?php
// ApiGuardarProveedor.php - VERSIÓN ULTRA SIMPLE
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
    if (empty($data["Proveedor"])) {
        throw new Exception("El nombre del proveedor es obligatorio");
    }

    // Escapar todos los datos
    $CodProveedor = $enlace->real_escape_string($data["CodProveedor"] ?? '');
    $Proveedor = $enlace->real_escape_string($data["Proveedor"]);
    $NIT = $enlace->real_escape_string($data["NIT"] ?? '');
    $DV = $enlace->real_escape_string($data["DV"] ?? '');
    $Contacto = $enlace->real_escape_string($data["Contacto"] ?? '');
    $Direccion = $enlace->real_escape_string($data["Direccion"] ?? '');
    $CIUDAD = $enlace->real_escape_string($data["CIUDAD"] ?? '');
    $ESTADO = $enlace->real_escape_string($data["ESTADO"] ?? 'Activo');
    $PAIS = $enlace->real_escape_string($data["PAIS"] ?? 'Colombia');
    $Telefono = $enlace->real_escape_string($data["Telefono"] ?? '');
    $Email = $enlace->real_escape_string($data["Email"] ?? '');
    
    // Determinar si es creación o edición
    $esCreacion = !isset($data["IdProveedor"]) || empty($data["IdProveedor"]);
    
    // Para nuevos registros, siempre ACTIVO = 1
    // Para ediciones, usar el valor enviado si existe, sino 1
    $ACTIVO = isset($data["ACTIVO"]) && $data["ACTIVO"] ? 1 : ($esCreacion ? 1 : 0);
    $IVA = isset($data["IVA"]) && $data["IVA"] ? 1 : 0;

    // Validar NIT único si se proporciona
    if (!empty($NIT)) {
        $idExcluir = isset($data["IdProveedor"]) ? intval($data["IdProveedor"]) : 0;
        $sqlVerificar = "SELECT IdProveedor FROM GEN_Proveedores WHERE NIT = '$NIT'";

        if ($idExcluir > 0) {
            $sqlVerificar .= " AND IdProveedor != $idExcluir";
        }

        $result = $enlace->query($sqlVerificar);
        if ($result && $result->num_rows > 0) {
            throw new Exception("El NIT ya está registrado para otro proveedor");
        }
    }

    // Validar nombre único si es creación o si el nombre cambió
    if (!isset($data["IdProveedor"])) {
        // Para nuevo proveedor: siempre validar
        $sqlVerificarNombre = "SELECT IdProveedor FROM GEN_Proveedores WHERE UPPER(Proveedor) = UPPER('$Proveedor')";
        $result = $enlace->query($sqlVerificarNombre);
        if ($result && $result->num_rows > 0) {
            throw new Exception("Ya existe un proveedor con ese nombre");
        }
    } else {
        // Para edición: validar solo si el nombre cambió
        $idProveedor = intval($data["IdProveedor"]);

        // Obtener el nombre actual
        $sqlNombreActual = "SELECT Proveedor FROM GEN_Proveedores WHERE IdProveedor = $idProveedor";
        $resultActual = $enlace->query($sqlNombreActual);
        if ($resultActual && $row = $resultActual->fetch_assoc()) {
            $nombreActual = $row["Proveedor"];

            // Si el nombre cambió, validar que no exista
            if (strtoupper($nombreActual) !== strtoupper($Proveedor)) {
                $sqlVerificarNombre = "SELECT IdProveedor FROM GEN_Proveedores
WHERE UPPER(Proveedor) = UPPER('$Proveedor')
AND IdProveedor != $idProveedor";
                $result = $enlace->query($sqlVerificarNombre);
                if ($result && $result->num_rows > 0) {
                    throw new Exception("Ya existe otro proveedor con ese nombre");
                }
            }
        }
    }

    if (isset($data["IdProveedor"]) && !empty($data["IdProveedor"])) {
        // ACTUALIZAR
        $idProveedor = intval($data["IdProveedor"]);

        $sql = "UPDATE GEN_Proveedores SET
CodProveedor = '$CodProveedor',
Proveedor = '$Proveedor',
NIT = '$NIT',
DV = '$DV',
Contacto = '$Contacto',
Direccion = '$Direccion',
CIUDAD = '$CIUDAD',
ESTADO = '$ESTADO',
PAIS = '$PAIS',
Telefono = '$Telefono',
Email = '$Email',
ACTIVO = $ACTIVO,
IVA = $IVA
WHERE IdProveedor = $idProveedor";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al actualizar proveedor: " . $enlace->error);
        }

        $idProveedorResultado = $idProveedor;
    } else {
        // CREAR
        $sql = "INSERT INTO GEN_Proveedores
(CodProveedor, Proveedor, NIT, DV, Contacto, Direccion, CIUDAD,
ESTADO, PAIS, Telefono, Email, ACTIVO, IVA)
VALUES (
'$CodProveedor',
'$Proveedor',
'$NIT',
'$DV',
'$Contacto',
'$Direccion',
'$CIUDAD',
'$ESTADO',
'$PAIS',
'$Telefono',
'$Email',
$ACTIVO,
$IVA)";

        $result = $enlace->query($sql);

        if (!$result) {
            throw new Exception("Error al crear proveedor: " . $enlace->error);
        }

        $idProveedorResultado = $enlace->insert_id;
    }

    echo json_encode([
        "success" => true,
        "message" => isset($data["IdProveedor"]) ? "Proveedor actualizado correctamente" : "Proveedor creado correctamente",
        "idProveedor" => $idProveedorResultado,
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
