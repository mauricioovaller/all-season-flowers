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
require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

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

        // Guard: no permitir editar una compra anulada
        $sqlAnulado = "SELECT Anulado FROM SAS_EncabCompra WHERE IdEncabCompra = ?";
        $stmtAnulado = $enlace->prepare($sqlAnulado);
        if (!$stmtAnulado) {
            throw new Exception("Error preparando consulta de anulación: " . $enlace->error);
        }
        $stmtAnulado->bind_param("i", $idEncabCompra);
        $stmtAnulado->execute();
        $stmtAnulado->bind_result($anuladoExistente);
        $stmtAnulado->fetch();
        $stmtAnulado->close();

        if ($anuladoExistente == 1) {
            throw new Exception("La compra está anulada y no puede modificarse");
        }

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

        // ==================== 1.1 CAPTURAR DEVOLUCIONES ANTES DE ELIMINAR ====================
        // Si la compra tiene datos de devolución en el detalle, se capturan para
        // restaurarlos después de la reinserción (el INSERT no los incluye y se perderían).

        // Índice absoluto de cada empaque (posición dentro de la compra)
        $empaqueOrden = [];
        $sqlEmpOrder = "SELECT IdDetEmpaque FROM SAS_DetEmpaqueCompra WHERE IdEncabCompra = ? ORDER BY IdDetEmpaque";
        $stmtEmpOrder = $enlace->prepare($sqlEmpOrder);
        if (!$stmtEmpOrder) {
            throw new Exception("Error preparando consulta de empaques: " . $enlace->error);
        }
        $stmtEmpOrder->bind_param("i", $idEncabCompra);
        $stmtEmpOrder->execute();
        $stmtEmpOrder->bind_result($idEmpOrder);
        $idxEmp = 0;
        while ($stmtEmpOrder->fetch()) {
            if (!isset($empaqueOrden[$idEmpOrder])) {
                $empaqueOrden[$idEmpOrder] = $idxEmp;
            }
            $idxEmp++;
        }
        $stmtEmpOrder->close();

        $devolucionesViejas = [];
        $sqlDev = "SELECT de.IdDetEmpaque, dp.IdProducto, dp.IdVariedad, dp.IdGrado,
                          dp.TallosDevolucion, dp.MotivoDevolucion, dp.Flete, dp.Fumigacion, dp.Otros
                   FROM SAS_DetEmpaqueCompra de
                   INNER JOIN SAS_DetProductoCompra dp ON de.IdDetEmpaque = dp.IdDetEmpaque
                   WHERE de.IdEncabCompra = ?
                     AND dp.Anulado = 0
                     AND (dp.TallosDevolucion > 0 OR dp.Flete > 0 OR dp.Fumigacion > 0 OR dp.Otros > 0
                          OR (dp.MotivoDevolucion IS NOT NULL AND dp.MotivoDevolucion != ''))
                   ORDER BY de.IdDetEmpaque, dp.IdDetProducto";

        $stmtDev = $enlace->prepare($sqlDev);
        if (!$stmtDev) {
            throw new Exception("Error preparando consulta de devoluciones: " . $enlace->error);
        }
        $stmtDev->bind_param("i", $idEncabCompra);
        $stmtDev->execute();
        $stmtDev->bind_result(
            $idDetEmpaqueOld,
            $devIdProducto,
            $devIdVariedad,
            $devIdGrado,
            $devTallosDevolucion,
            $devMotivoDevolucion,
            $devFlete,
            $devFumigacion,
            $devOtros
        );

        while ($stmtDev->fetch()) {
            $eIdx = $empaqueOrden[$idDetEmpaqueOld] ?? null;
            if ($eIdx === null) {
                continue; // Empaque no encontrado en la compra (no debería ocurrir)
            }
            $devolucionesViejas[$eIdx][] = [
                'IdProducto'         => $devIdProducto,
                'IdVariedad'         => $devIdVariedad,
                'IdGrado'            => $devIdGrado,
                'TallosDevolucion'   => $devTallosDevolucion,
                'MotivoDevolucion'   => $devMotivoDevolucion,
                'Flete'              => $devFlete,
                'Fumigacion'         => $devFumigacion,
                'Otros'              => $devOtros,
            ];
        }
        $stmtDev->close();

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
    // Registro de filas reinsertadas para restaurar devoluciones después
    $empIdx = 0;
    $nuevosIds = [];
    $nuevosDetalles = [];
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
        $prodIdx = 0;
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

            // Registrar fila nueva para restaurar devoluciones después
            $nuevosIds[$empIdx][$prodIdx] = $idDetProducto;
            $nuevosDetalles[$empIdx][$prodIdx] = [
                'IdProducto' => $IdProducto,
                'IdVariedad' => $IdVariedad,
                'IdGrado'    => $IdGrado,
            ];

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

            $prodIdx++;
        }

        $empIdx++;
    }

    // ==================== 5. RESTAURAR DEVOLUCIONES Y VALIDAR ====================
    // Las devoluciones registradas antes de la actualización deben conservarse.
    // Si la línea con devolución fue modificada o eliminada, se bloquea el guardado.
    if (!empty($devolucionesViejas)) {
        foreach ($devolucionesViejas as $empIdxDev => $productosDev) {
            if (!isset($nuevosDetalles[$empIdxDev])) {
                throw new Exception("No se puede guardar: se eliminó el empaque que contenía la devolución. Registre o elimine la devolución antes de guardar la compra.");
            }

            $nuevosEmp = $nuevosDetalles[$empIdxDev];
            $usados = [];
            foreach ($productosDev as $devInfo) {
                // Buscar la línea nueva con el mismo producto/variedad/grado dentro del empaque
                // (por contenido, no por posición, para permitir agregar/quitar otras líneas)
                $idxEncontrado = -1;
                foreach ($nuevosEmp as $pi => $nuevo) {
                    if (in_array($pi, $usados, true)) {
                        continue;
                    }
                    if ($nuevo['IdProducto'] == $devInfo['IdProducto']
                     && $nuevo['IdVariedad'] == $devInfo['IdVariedad']
                     && $nuevo['IdGrado']    == $devInfo['IdGrado']) {
                        $idxEncontrado = $pi;
                        break;
                    }
                }

                if ($idxEncontrado === -1) {
                    throw new Exception("No se puede guardar: la línea con devolución del producto {$devInfo['IdProducto']} (variedad {$devInfo['IdVariedad']}, grado {$devInfo['IdGrado']}) fue modificada o eliminada. Registre o elimine la devolución antes de guardar la compra.");
                }

                $usados[] = $idxEncontrado;

                // Restaurar los datos de devolución en la fila reinsertada
                $sqlRest = "UPDATE SAS_DetProductoCompra
                            SET TallosDevolucion = ?, MotivoDevolucion = ?,
                                Flete = ?, Fumigacion = ?, Otros = ?
                            WHERE IdDetProducto = ?";
                $stmtRest = $enlace->prepare($sqlRest);
                if (!$stmtRest) {
                    throw new Exception("Error preparando restauración de devolución: " . $enlace->error);
                }

                $tallosRest = intval($devInfo['TallosDevolucion'] ?? 0);
                $motivoRest = $devInfo['MotivoDevolucion'] ?? '';
                $fleteRest   = floatval($devInfo['Flete'] ?? 0);
                $fumigRest   = floatval($devInfo['Fumigacion'] ?? 0);
                $otrosRest   = floatval($devInfo['Otros'] ?? 0);
                $nuevoDetId  = $nuevosIds[$empIdxDev][$idxEncontrado];

                $stmtRest->bind_param("isdddi", $tallosRest, $motivoRest, $fleteRest, $fumigRest, $otrosRest, $nuevoDetId);
                $stmtRest->execute();

                if ($stmtRest->errno) {
                    throw new Exception("Error al restaurar la devolución: " . $stmtRest->error);
                }
                $stmtRest->close();
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