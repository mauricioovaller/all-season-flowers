<?php
// ApiGuardarPedidoCompleto.php
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

// Funciones de sanitización
function limpiar_texto($txt) {
    return trim($txt);
}

function validar_entero($valor) {
    if ($valor === null || $valor === '') {
        return null;
    }
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}

function validar_flotante($valor) {
    if ($valor === null || $valor === '') {
        return null;
    }
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : null;
}

function validar_tinyint($valor) {
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
if (!isset($encabezado["IdCliente"]) || !isset($encabezado["IdEjecutivo"]) || 
    !isset($encabezado["FechaSolicitud"]) || !isset($encabezado["FechaEntrega"]) || 
    !isset($encabezado["IdMoneda"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Faltan campos obligatorios en el encabezado"]);
    exit;
}

try {
    $enlace->begin_transaction();
    
    // ==================== 1. INSERTAR ENCABEZADO ====================
    $sqlEnc = "INSERT INTO SAS_EncabPedido 
        (IdCliente, IdEjecutivo, IdMoneda, TRM, FechaSolicitud, FechaEntrega, 
         PO_Cliente, Observaciones, AWB, AWB_HIJA, AWB_NIETA, 
         IdAerolinea, IdAgencia, PuertoSalida, IVA, Estado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmtEnc = $enlace->prepare($sqlEnc);
    
    // Limpiar y validar datos del encabezado
    $IdCliente = validar_entero($encabezado["IdCliente"]);
    $IdEjecutivo = validar_entero($encabezado["IdEjecutivo"]);
    $IdMoneda = limpiar_texto($encabezado["IdMoneda"]);
    $TRM = validar_flotante($encabezado["TRM"] ?? 0);
    $FechaSolicitud = limpiar_texto($encabezado["FechaSolicitud"]);
    $FechaEntrega = limpiar_texto($encabezado["FechaEntrega"]);
    $PO_Cliente = limpiar_texto($encabezado["PO_Cliente"] ?? "");
    $Observaciones = limpiar_texto($encabezado["Observaciones"] ?? "");
    $AWB = limpiar_texto($encabezado["AWB"] ?? "");
    $AWB_HIJA = limpiar_texto($encabezado["AWB_HIJA"] ?? "");
    $AWB_NIETA = limpiar_texto($encabezado["AWB_NIETA"] ?? "");
    $IdAerolinea = validar_entero($encabezado["IdAerolinea"] ?? null);
    $IdAgencia = validar_entero($encabezado["IdAgencia"] ?? null);
    $PuertoSalida = limpiar_texto($encabezado["PuertoSalida"] ?? "");
    $IVA = validar_tinyint($encabezado["IVA"] ?? 0);
    $Estado = limpiar_texto($encabezado["Estado"] ?? "Pendiente");
    
    $stmtEnc->bind_param(
        "iisdsssssssiisss",
        $IdCliente, $IdEjecutivo, $IdMoneda, $TRM,
        $FechaSolicitud, $FechaEntrega, $PO_Cliente, $Observaciones,
        $AWB, $AWB_HIJA, $AWB_NIETA, $IdAerolinea, $IdAgencia,
        $PuertoSalida, $IVA, $Estado
    );
    
    $stmtEnc->execute();
    
    if ($stmtEnc->affected_rows <= 0) {
        throw new Exception("Error al insertar el encabezado del pedido");
    }
    
    $idEncabPedido = $enlace->insert_id;
    // NO usar echo aquí - solo para debug interno
    // error_log("ID Encabezado generado: " . $idEncabPedido);
    
    // ==================== 2. PROCESAR EMPAQUES ====================
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
                $idDetEmpaque, $idEncabPedido, $IdProducto, $IdVariedad, $IdGrado,
                $Descripcion, $IdUnidad, $IdPredio, $Tallos_Ramo, $Ramos_Caja,
                $Precio_Venta
            );
            
            $stmtProd->execute();
            
            if ($stmtProd->affected_rows <= 0) {
                throw new Exception("Error al insertar producto");
            }
            
            $idDetProducto = $enlace->insert_id;
            
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
                        $idDetProducto, $idDetEmpaque, $idEncabPedido,
                        $IdProductoIng, $IdVariedadIng, $CantidadIng
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
?>