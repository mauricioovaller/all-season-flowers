<?php
//src/Api/pedidos/ApiGuardarPedidoCompleto.php
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
// Helper multi-cliente de razones sociales ("Empresa Emisora").
// Si la carpeta helpers/ no está desplegada en el servidor de un cliente,
// no debe romper el endpoint: se definen fallbacks seguros que desactivan
// la funcionalidad y todo cae a las constantes de empresa.php (original).
if (file_exists(__DIR__ . '/helpers/razon_social.php')) {
    require_once __DIR__ . '/helpers/razon_social.php';
}
if (!function_exists('razon_social_columna_existe')) {
    function razon_social_tabla_existe($enlace): bool { return false; }
    function razon_social_columna_existe($enlace): bool { return false; }
    function razon_social_disponible($enlace): bool { return false; }
    function razon_social_obtener($enlace, $idRazonSocial): ?array { return null; }
    function razon_social_de_pedido($enlace, $idEncabPedido): ?array { return null; }
    function razon_social_logo_absoluto($razonSocial): ?string { return null; }
}

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

// Funciones de sanitización
function limpiar_texto($txt)
{
    return trim($txt);
}

function validar_entero($valor)
{
    if ($valor === null || $valor === '') {
        return 0;  // ← CAMBIADO: Retorna 0 en lugar de null
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

// Validar campos obligatorios del encabezado
if (
    !isset($encabezado["IdCliente"]) || !isset($encabezado["IdEjecutivo"]) ||
    !isset($encabezado["FechaSolicitud"]) || !isset($encabezado["FechaEntrega"]) ||
    !isset($encabezado["IdMoneda"])
) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Faltan campos obligatorios en el encabezado"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // ==================== 1. INSERTAR O ACTUALIZAR ENCABEZADO ====================
    // Verificar si existe IdEncabPedido (actualización) o es nuevo
    $esActualizacion = isset($encabezado["IdEncabPedido"]) && !empty($encabezado["IdEncabPedido"]);

    // Razón social ("Empresa Emisora") — multi-cliente: solo se persiste si la
    // columna existe en la base. Los pedidos antiguos quedan con NULL (→ All Season).
    $conRazonSocial = razon_social_columna_existe($enlace);
    $IdRazonSocial = isset($encabezado["IdRazonSocial"]) ? validar_entero($encabezado["IdRazonSocial"]) : 0;
    if ($IdRazonSocial <= 0) {
        $IdRazonSocial = null;
    }

    if ($esActualizacion) {
        // ACTUALIZAR pedido existente
        $idEncabPedido = validar_entero($encabezado["IdEncabPedido"]);

        // Guard: no permitir editar un pedido anulado
        $sqlAnulado = "SELECT Anulado FROM SAS_EncabPedido WHERE IdEncabPedido = ?";
        $stmtAnulado = $enlace->prepare($sqlAnulado);
        if (!$stmtAnulado) {
            throw new Exception("Error preparando consulta de anulación: " . $enlace->error);
        }
        $stmtAnulado->bind_param("i", $idEncabPedido);
        $stmtAnulado->execute();
        $stmtAnulado->bind_result($anuladoExistente);
        $stmtAnulado->fetch();
        $stmtAnulado->close();

        if ($anuladoExistente == 1) {
            throw new Exception("El pedido está anulado y no puede modificarse");
        }

        $sqlEnc = "UPDATE SAS_EncabPedido SET 
        IdCliente = ?, 
        IdEjecutivo = ?, 
        IdMoneda = ?, 
        TRM = ?, 
        FechaSolicitud = ?, 
        FechaEntrega = ?, 
        PO_Cliente = ?, 
        Observaciones = ?, 
        AWB = ?, 
        AWB_HIJA = ?, 
        AWB_NIETA = ?, 
        IdAerolinea = ?, 
        IdAgencia = ?, 
        PuertoSalida = ?, 
        IVA = ?, 
        Estado = ? 
        WHERE IdEncabPedido = ?";

        $stmtEnc = $enlace->prepare($sqlEnc);

        // Limpiar y validar datos del encabezado
        $IdCliente = validar_entero($encabezado["IdCliente"]);
        $IdEjecutivo = validar_entero($encabezado["IdEjecutivo"]);
        $IdMoneda = validar_entero($encabezado["IdMoneda"]);
        $TRM = validar_flotante($encabezado["TRM"] ?? 0);
        $FechaSolicitud = limpiar_texto($encabezado["FechaSolicitud"]);
        $FechaEntrega = limpiar_texto($encabezado["FechaEntrega"]);
        $PO_Cliente = limpiar_texto($encabezado["PO_Cliente"] ?? "");
        $Observaciones = limpiar_texto($encabezado["Observaciones"] ?? "");
        $AWB = limpiar_texto($encabezado["AWB"] ?? "");
        $AWB_HIJA = limpiar_texto($encabezado["AWB_HIJA"] ?? "");
        $AWB_NIETA = limpiar_texto($encabezado["AWB_NIETA"] ?? "");
        $IdAerolinea = validar_entero($encabezado["IdAerolinea"] ?? 0);
        $IdAgencia = validar_entero($encabezado["IdAgencia"] ?? 0);
        $PuertoSalida = limpiar_texto($encabezado["PuertoSalida"] ?? "");
        $IVA = validar_tinyint($encabezado["IVA"] ?? 0);
        $Estado = limpiar_texto($encabezado["Estado"] ?? "Pendiente");

        $stmtEnc->bind_param(
            "iiidsssssssiisisi",
            $IdCliente,
            $IdEjecutivo,
            $IdMoneda,
            $TRM,
            $FechaSolicitud,
            $FechaEntrega,
            $PO_Cliente,
            $Observaciones,
            $AWB,
            $AWB_HIJA,
            $AWB_NIETA,
            $IdAerolinea,
            $IdAgencia,
            $PuertoSalida,
            $IVA,
            $Estado,
            $idEncabPedido
        );

        $stmtEnc->execute();

        // CORRECCIÓN: Solo verificar errores reales, no si no hubo cambios
        if ($stmtEnc->errno) {
            throw new Exception("Error al actualizar el encabezado del pedido: " . $stmtEnc->error);
        }

        // ==================== 1.1 CAPTURAR DEVOLUCIONES ANTES DE ELIMINAR ====================
        // Si el pedido tiene datos de devolución en el detalle, se capturan para
        // restaurarlos después de la reinserción (el INSERT no los incluye y se perderían).

        // Índice absoluto de cada empaque (posición dentro del pedido)
        $empaqueOrden = [];
        $sqlEmpOrder = "SELECT IdDetEmpaque FROM SAS_DetEmpaque WHERE IdEncabPedido = ? ORDER BY IdDetEmpaque";
        $stmtEmpOrder = $enlace->prepare($sqlEmpOrder);
        if (!$stmtEmpOrder) {
            throw new Exception("Error preparando consulta de empaques: " . $enlace->error);
        }
        $stmtEmpOrder->bind_param("i", $idEncabPedido);
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
                   FROM SAS_DetEmpaque de
                   INNER JOIN SAS_DetProducto dp ON de.IdDetEmpaque = dp.IdDetEmpaque
                   WHERE de.IdEncabPedido = ?
                     AND dp.Anulado = 0
                     AND (dp.TallosDevolucion > 0 OR dp.Flete > 0 OR dp.Fumigacion > 0 OR dp.Otros > 0
                          OR (dp.MotivoDevolucion IS NOT NULL AND dp.MotivoDevolucion != ''))
                   ORDER BY de.IdDetEmpaque, dp.IdDetProducto";

        $stmtDev = $enlace->prepare($sqlDev);
        if (!$stmtDev) {
            throw new Exception("Error preparando consulta de devoluciones: " . $enlace->error);
        }
        $stmtDev->bind_param("i", $idEncabPedido);
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
                continue; // Empaque no encontrado en el pedido (no debería ocurrir)
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

        // ELIMINAR empaques, productos y recetas anteriores (se reinsertarán) CON CONSULTAS PREPARADAS
        $tablas = ['SAS_DetReceta', 'SAS_DetProducto', 'SAS_DetEmpaque'];
        foreach ($tablas as $tabla) {
            $sqlDelete = "DELETE FROM $tabla WHERE IdEncabPedido = ?";
            $stmtDelete = $enlace->prepare($sqlDelete);
            $stmtDelete->bind_param("i", $idEncabPedido);
            $stmtDelete->execute();
            
            // Verificar errores en DELETE
            if ($stmtDelete->errno) {
                throw new Exception("Error al eliminar registros anteriores de $tabla: " . $stmtDelete->error);
            }
            
            $stmtDelete->close();
        }
    } else {
        // INSERTAR nuevo pedido
        $sqlEnc = "INSERT INTO SAS_EncabPedido 
        (IdCliente, IdEjecutivo, IdMoneda, TRM, FechaSolicitud, FechaEntrega, 
         PO_Cliente, Observaciones, AWB, AWB_HIJA, AWB_NIETA, 
         IdAerolinea, IdAgencia, PuertoSalida, IVA, Estado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmtEnc = $enlace->prepare($sqlEnc);

        // Limpiar y validar datos del encabezado
        $IdCliente = validar_entero($encabezado["IdCliente"]);
        $IdEjecutivo = validar_entero($encabezado["IdEjecutivo"]);
        $IdMoneda = validar_entero($encabezado["IdMoneda"]);
        $TRM = validar_flotante($encabezado["TRM"] ?? 0);
        $FechaSolicitud = limpiar_texto($encabezado["FechaSolicitud"]);
        $FechaEntrega = limpiar_texto($encabezado["FechaEntrega"]);
        $PO_Cliente = limpiar_texto($encabezado["PO_Cliente"] ?? "");
        $Observaciones = limpiar_texto($encabezado["Observaciones"] ?? "");
        $AWB = limpiar_texto($encabezado["AWB"] ?? "");
        $AWB_HIJA = limpiar_texto($encabezado["AWB_HIJA"] ?? "");
        $AWB_NIETA = limpiar_texto($encabezado["AWB_NIETA"] ?? "");
        $IdAerolinea = validar_entero($encabezado["IdAerolinea"] ?? 0);
        $IdAgencia = validar_entero($encabezado["IdAgencia"] ?? 0);
        $PuertoSalida = limpiar_texto($encabezado["PuertoSalida"] ?? "");
        $IVA = validar_tinyint($encabezado["IVA"] ?? 0);
        $Estado = limpiar_texto($encabezado["Estado"] ?? "Pendiente");

        $stmtEnc->bind_param(
            "iiidsssssssiisis",
            $IdCliente,
            $IdEjecutivo,
            $IdMoneda,
            $TRM,
            $FechaSolicitud,
            $FechaEntrega,
            $PO_Cliente,
            $Observaciones,
            $AWB,
            $AWB_HIJA,
            $AWB_NIETA,
            $IdAerolinea,
            $IdAgencia,
            $PuertoSalida,
            $IVA,
            $Estado
        );

        $stmtEnc->execute();

        if ($stmtEnc->affected_rows <= 0) {
            throw new Exception("Error al insertar el encabezado del pedido");
        }

        $idEncabPedido = $enlace->insert_id;
    }

    // ==================== 1.2 RAZÓN SOCIAL (Empresa Emisora) ====================
    // Escritura adicional condicional para no alterar el SQL original del
    // encabezado (compatibilidad con bases que no tienen la columna).
    if ($conRazonSocial) {
        $sqlRs = "UPDATE SAS_EncabPedido SET IdRazonSocial = ? WHERE IdEncabPedido = ?";
        $stmtRs = $enlace->prepare($sqlRs);
        if (!$stmtRs) {
            throw new Exception("Error preparando actualización de razón social: " . $enlace->error);
        }
        $stmtRs->bind_param("ii", $IdRazonSocial, $idEncabPedido);
        $stmtRs->execute();
        if ($stmtRs->errno) {
            throw new Exception("Error actualizando razón social: " . $stmtRs->error);
        }
        $stmtRs->close();
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

        // Insertar empaque
        $sqlEmp = "INSERT INTO SAS_DetEmpaque 
            (IdEncabPedido, IdTipoEmpaque, Cantidad, PO_Empaque, Anulado) 
            VALUES (?, ?, ?, ?, 0)";

        $stmtEmp = $enlace->prepare($sqlEmp);

        $IdTipoEmpaque = validar_entero($empaque["IdTipoEmpaque"]);
        $Cantidad = validar_entero($empaque["Cantidad"] ?? 1);
        $PO_Empaque = limpiar_texto($empaque["PO_Empaque"] ?? "");

        $stmtEmp->bind_param("iiis", $idEncabPedido, $IdTipoEmpaque, $Cantidad, $PO_Empaque);
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

            // Insertar producto
            $sqlProd = "INSERT INTO SAS_DetProducto 
                (IdDetEmpaque, IdEncabPedido, IdProducto, IdVariedad, IdGrado, 
                 Descripcion, IdUnidad, IdPredio, Tallos_Ramo, Ramos_Caja, 
                 Precio_Venta, Anulado) 
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
            $Precio_Venta = validar_flotante($producto["Precio_Venta"] ?? 0);

            $stmtProd->bind_param(
                "iiiiissiiid",
                $idDetEmpaque,
                $idEncabPedido,
                $IdProducto,
                $IdVariedad,
                $IdGrado,
                $Descripcion,
                $IdUnidad,
                $IdPredio,
                $Tallos_Ramo,
                $Ramos_Caja,
                $Precio_Venta
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
                    $sqlRec = "INSERT INTO SAS_DetReceta 
                        (IdDetProducto, IdDetEmpaque, IdEncabPedido, 
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
                        $idEncabPedido,
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
                throw new Exception("No se puede guardar: se eliminó el empaque que contenía la devolución. Registre o elimine la devolución antes de guardar el pedido.");
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
                    throw new Exception("No se puede guardar: la línea con devolución del producto {$devInfo['IdProducto']} (variedad {$devInfo['IdVariedad']}, grado {$devInfo['IdGrado']}) fue modificada o eliminada. Registre o elimine la devolución antes de guardar el pedido.");
                }

                $usados[] = $idxEncontrado;

                // Restaurar los datos de devolución en la fila reinsertada
                $sqlRest = "UPDATE SAS_DetProducto
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

    // Respuesta exitosa - SOLO JSON, nada más
    echo json_encode([
        "success" => true,
        "message" => "Pedido guardado correctamente",
        "idEncabPedido" => $idEncabPedido,
        "fechaRegistro" => date("Y-m-d H:i:s")
    ]);
    exit; // Importante: salir después del JSON

} catch (Exception $e) {
    $enlace->rollback();

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage(),
        "line" => $e->getLine()
    ]);
    exit; // Importante: salir después del JSON

    // Log detallado para debugging (no se envía al cliente)
    error_log("Error en ApiGuardarPedidoCompleto: " . $e->getMessage() . " en línea " . $e->getLine());
}

$enlace->close();