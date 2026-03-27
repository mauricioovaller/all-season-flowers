<?php
// src/Api/compras/ApiGuardarCompraCompleta.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Solo POST permitido
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Conexión a la base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Leer JSON
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos JSON no válidos"]);
    exit;
}

// Funciones de sanitización (igual que en pedidos)
function limpiar_texto($txt)
{
    return trim($txt);
}

function validar_entero($valor)
{
    if ($valor === null || $valor === '') {
        return 0;
    }
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : 0;
}

function validar_flotante($valor)
{
    if ($valor === null || $valor === '') {
        return null;
    }
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : null;
}

function validar_tinyint($valor)
{
    if ($valor === true || $valor === 1 || $valor === '1') {
        return 1;
    }
    return 0;
}

// Extraer datos
$encabezado = $data["encabezado"] ?? [];
$empaques = $data["empaques"] ?? [];

// Validar datos mínimos
if (empty($encabezado) || empty($empaques)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios"]);
    exit;
}

// Validar campos obligatorios del encabezado para COMPRAS
if (
    !isset($encabezado["TipoCompra"]) || !isset($encabezado["IdProveedor"]) ||
    !isset($encabezado["IdComprador"]) || !isset($encabezado["FechaSolicitud"]) ||
    !isset($encabezado["FechaEntrega"]) || !isset($encabezado["IdMoneda"])
) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Faltan campos obligatorios en el encabezado"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // ==================== 1. INSERTAR O ACTUALIZAR ENCABEZADO ====================
    $esActualizacion = isset($encabezado["IdEncabCompra"]) && !empty($encabezado["IdEncabCompra"]);

    if ($esActualizacion) {
        // ACTUALIZAR compra existente
        $idEncabCompra = validar_entero($encabezado["IdEncabCompra"]);

        $sqlEnc = "UPDATE SAS_EncabCompra SET 
            TipoCompra = ?,
            IdProveedor = ?, 
            IdComprador = ?, 
            IdMoneda = ?, 
            TRM = ?, 
            FechaSolicitud = ?, 
            FechaEntrega = ?, 
            PO_Proveedor = ?, 
            Observaciones = ?, 
            Anulado = ?,
            IVA = ?
            WHERE IdEncabCompra = ?";

        $stmtEnc = $enlace->prepare($sqlEnc);

        // Limpiar y validar datos del encabezado para COMPRAS
        $TipoCompra = limpiar_texto($encabezado["TipoCompra"]);
        $IdProveedor = validar_entero($encabezado["IdProveedor"]);
        $IdComprador = validar_entero($encabezado["IdComprador"]);
        $IdMoneda = validar_entero($encabezado["IdMoneda"]);
        $TRM = validar_flotante($encabezado["TRM"] ?? 0);
        $FechaSolicitud = limpiar_texto($encabezado["FechaSolicitud"]);
        $FechaEntrega = limpiar_texto($encabezado["FechaEntrega"]);
        $PO_Proveedor = limpiar_texto($encabezado["PO_Proveedor"] ?? "");
        $Observaciones = limpiar_texto($encabezado["Observaciones"] ?? "");
        $Anulado = validar_tinyint($encabezado["Anulado"] ?? 0);
        $IVA = validar_tinyint($encabezado["IVA"] ?? 0);

        $stmtEnc->bind_param(
            "siiidssssiii",
            $TipoCompra,
            $IdProveedor,
            $IdComprador,
            $IdMoneda,
            $TRM,
            $FechaSolicitud,
            $FechaEntrega,
            $PO_Proveedor,
            $Observaciones,
            $Anulado,
            $IVA,
            $idEncabCompra
        );

        $stmtEnc->execute();

        if ($stmtEnc->errno) {
            throw new Exception("Error al actualizar el encabezado de la compra: " . $stmtEnc->error);
        }

        // ELIMINAR empaques, productos y recetas anteriores (se reinsertarán)
        $tablas = ['SAS_DetRecetaCompra', 'SAS_DetProductoCompra', 'SAS_DetEmpaqueCompra'];
        foreach ($tablas as $tabla) {
            $sqlDelete = "DELETE FROM $tabla WHERE IdEncabCompra = ?";
            $stmtDelete = $enlace->prepare($sqlDelete);
            $stmtDelete->bind_param("i", $idEncabCompra);
            $stmtDelete->execute();
            
            if ($stmtDelete->errno) {
                throw new Exception("Error al eliminar registros anteriores de $tabla: " . $stmtDelete->error);
            }
            
            $stmtDelete->close();
        }
    } else {
        // INSERTAR nueva compra
        $sqlEnc = "INSERT INTO SAS_EncabCompra 
            (TipoCompra, IdProveedor, IdComprador, IdMoneda, TRM, FechaSolicitud, 
             FechaEntrega, PO_Proveedor, Observaciones, Anulado, IVA) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmtEnc = $enlace->prepare($sqlEnc);

        // Limpiar y validar datos del encabezado para COMPRAS
        $TipoCompra = limpiar_texto($encabezado["TipoCompra"]);
        $IdProveedor = validar_entero($encabezado["IdProveedor"]);
        $IdComprador = validar_entero($encabezado["IdComprador"]);
        $IdMoneda = validar_entero($encabezado["IdMoneda"]);
        $TRM = validar_flotante($encabezado["TRM"] ?? 0);
        $FechaSolicitud = limpiar_texto($encabezado["FechaSolicitud"]);
        $FechaEntrega = limpiar_texto($encabezado["FechaEntrega"]);
        $PO_Proveedor = limpiar_texto($encabezado["PO_Proveedor"] ?? "");
        $Observaciones = limpiar_texto($encabezado["Observaciones"] ?? "");
        $Anulado = validar_tinyint($encabezado["Anulado"] ?? 0);
        $IVA = validar_tinyint($encabezado["IVA"] ?? 0);

        $stmtEnc->bind_param(
            "siiidssssii",
            $TipoCompra,
            $IdProveedor,
            $IdComprador,
            $IdMoneda,
            $TRM,
            $FechaSolicitud,
            $FechaEntrega,
            $PO_Proveedor,
            $Observaciones,
            $Anulado,
            $IVA
        );

        $stmtEnc->execute();

        if ($stmtEnc->affected_rows <= 0) {
            throw new Exception("Error al insertar el encabezado de la compra");
        }

        $idEncabCompra = $enlace->insert_id;
    }

    // ==================== 2. PROCESAR EMPAQUES ====================
    foreach ($empaques as $empaqueData) {
        $empaque = $empaqueData["empaque"] ?? [];
        $productos = $empaqueData["productos"] ?? [];

        if (empty($empaque) || empty($productos)) {
            throw new Exception("Datos de empaque incompletos");
        }

        // Insertar empaque en tabla específica de compras
        $sqlEmp = "INSERT INTO SAS_DetEmpaqueCompra 
            (IdEncabCompra, IdTipoEmpaque, Cantidad, PO_Empaque, Anulado) 
            VALUES (?, ?, ?, ?, 0)";

        $stmtEmp = $enlace->prepare($sqlEmp);

        $IdTipoEmpaque = validar_entero($empaque["IdTipoEmpaque"]);
        $Cantidad = validar_entero($empaque["Cantidad"] ?? 1);
        $PO_Empaque = limpiar_texto($empaque["PO_Empaque"] ?? "");

        $stmtEmp->bind_param("iiis", $idEncabCompra, $IdTipoEmpaque, $Cantidad, $PO_Empaque);
        $stmtEmp->execute();

        if ($stmtEmp->affected_rows <= 0) {
            throw new Exception("Error al insertar empaque");
        }

        $idDetEmpaque = $enlace->insert_id;

        // ==================== 3. PROCESAR PRODUCTOS ====================
        foreach ($productos as $productoData) {
            $producto = $productoData["producto"] ?? [];
            $receta = $productoData["receta"] ?? [];

            if (empty($producto)) {
                throw new Exception("Datos de producto incompletos");
            }

            // Insertar producto en tabla específica de compras - CON CAMPO PRECIO_COMPRA
            $sqlProd = "INSERT INTO SAS_DetProductoCompra 
                (IdDetEmpaque, IdEncabCompra, IdProducto, IdVariedad, IdGrado, 
                 Descripcion, IdUnidad, IdPredio, Tallos_Ramo, Ramos_Caja, 
                 Precio_Compra, Anulado) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)";

            $stmtProd = $enlace->prepare($sqlProd);

            $IdProducto = validar_entero($producto["IdProducto"]);
            $IdVariedad = validar_entero($producto["IdVariedad"] ?? 0);
            $IdGrado = validar_entero($producto["IdGrado"] ?? 0);
            $Descripcion = limpiar_texto($producto["Descripcion"] ?? "");
            $IdUnidad = validar_entero($producto["IdUnidad"]);
            $IdPredio = validar_entero($producto["IdPredio"] ?? 0);
            $Tallos_Ramo = validar_entero($producto["Tallos_Ramo"] ?? 0);
            $Ramos_Caja = validar_entero($producto["Ramos_Caja"] ?? 0);
            $Precio_Compra = validar_flotante($producto["Precio_Compra"] ?? 0);

            $stmtProd->bind_param(
                "iiiiissiiid",
                $idDetEmpaque,
                $idEncabCompra,
                $IdProducto,
                $IdVariedad,
                $IdGrado,
                $Descripcion,
                $IdUnidad,
                $IdPredio,
                $Tallos_Ramo,
                $Ramos_Caja,
                $Precio_Compra
            );

            $stmtProd->execute();

            if ($stmtProd->affected_rows <= 0) {
                throw new Exception("Error al insertar producto");
            }

            $idDetProducto = $enlace->insert_id;

            // ==================== 4. PROCESAR RECETA (si es bouquet) ====================
            if (!empty($receta)) {
                foreach ($receta as $ingrediente) {
                    // Insertar receta en tabla específica de compras
                    $sqlRec = "INSERT INTO SAS_DetRecetaCompra 
                        (IdDetProducto, IdDetEmpaque, IdEncabCompra, 
                         IdProducto, IdVariedad, Cantidad, Anulado) 
                        VALUES (?, ?, ?, ?, ?, ?, 0)";

                    $stmtRec = $enlace->prepare($sqlRec);

                    $IdProductoIng = validar_entero($ingrediente["IdProducto"]);
                    $IdVariedadIng = validar_entero($ingrediente["IdVariedad"] ?? 0);
                    $CantidadIng = validar_entero($ingrediente["Cantidad"] ?? 0);

                    $stmtRec->bind_param(
                        "iiiiii",
                        $idDetProducto,
                        $idDetEmpaque,
                        $idEncabCompra,
                        $IdProductoIng,
                        $IdVariedadIng,
                        $CantidadIng
                    );

                    $stmtRec->execute();

                    if ($stmtRec->affected_rows <= 0) {
                        throw new Exception("Error al insertar ingrediente de receta");
                    }
                }
            }
        }
    }

    $enlace->commit();

    // Respuesta exitosa
    echo json_encode([
        "success" => true,
        "message" => "Compra guardada correctamente",
        "idEncabCompra" => $idEncabCompra,
        "fechaRegistro" => date("Y-m-d H:i:s")
    ]);
    exit;

} catch (Exception $e) {
    $enlace->rollback();

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage(),
        "line" => $e->getLine()
    ]);
    exit;
}

$enlace->close();
?>