<?php
//src/Api/pedidos/ApiGetPedidoEspecifico.php
// ===================
// CONFIGURACIÓN
// ===================
header("Content-Type: application/json");

// Activar logs para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ===================
// CONEXIÓN
// ===================
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
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// ===================
// LEER DATOS
// ===================
$json = file_get_contents("php://input");
$data = json_decode($json, true);
$idPedido = intval($data["idPedido"] ?? 0);

if ($idPedido <= 0) {
    echo json_encode(["success" => false, "message" => "ID de pedido inválido"]);
    exit;
}

try {
    // ==============================================
    // 1. ENCABEZADO DEL PEDIDO (SIEMPRE 1 REGISTRO)
    // ==============================================
    // Razón social ("Empresa Emisora"): columna condicional (multi-cliente)
    $conRazonSocial = razon_social_columna_existe($enlace);
    $columnaRazonSocial = $conRazonSocial ? ", ep.IdRazonSocial" : "";

    $sqlEnc = "SELECT 
        ep.IdEncabPedido,
        ep.IdCliente,
        ep.IdEjecutivo,
        ep.FechaSolicitud,
        ep.FechaEntrega,
        ep.IdMoneda,
        ep.TRM,
        ep.PO_Cliente,
        ep.Observaciones,
        ep.AWB,
        ep.AWB_HIJA,
        ep.AWB_NIETA,
        ep.IdAerolinea,
        ep.IdAgencia,
        ep.PuertoSalida,
        ep.IVA,
        ep.Estado,
        ep.Factura,
        ep.NoPlanilla,
        ep.NoFito,
        ep.Anulado,
        COALESCE(m.Moneda, '') AS monedaNombre
        " . $columnaRazonSocial . "
    FROM SAS_EncabPedido ep
    LEFT JOIN GEN_Monedas m ON ep.IdMoneda = m.IdMoneda
    WHERE ep.IdEncabPedido = ?";
    
    $stmtEnc = $enlace->prepare($sqlEnc);
    if (!$stmtEnc) {
        throw new Exception("Error preparando encabezado: " . $enlace->error);
    }
    
    $stmtEnc->bind_param("i", $idPedido);
    $stmtEnc->execute();
    $stmtEnc->store_result();
    
    // Verificar si existe el pedido
    if ($stmtEnc->num_rows == 0) {
        $stmtEnc->close();
        echo json_encode(["success" => false, "message" => "Pedido no encontrado"]);
        exit;
    }
    
    // Obtener el encabezado
    $idRazonSocial = null;
    if ($conRazonSocial) {
        $stmtEnc->bind_result(
            $idEncabPedido, $idCliente, $idEjecutivo, $fechaSolicitud, $fechaEntrega,
            $idMoneda, $trm, $poCliente, $observaciones, $awb, $awbHija, $awbNieta,
            $idAerolinea, $idAgencia, $puertoSalida, $iva, $estado, $factura,
            $noPlanilla, $noFito, $anulado, $monedaNombre, $idRazonSocial
        );
    } else {
        $stmtEnc->bind_result(
            $idEncabPedido, $idCliente, $idEjecutivo, $fechaSolicitud, $fechaEntrega,
            $idMoneda, $trm, $poCliente, $observaciones, $awb, $awbHija, $awbNieta,
            $idAerolinea, $idAgencia, $puertoSalida, $iva, $estado, $factura,
            $noPlanilla, $noFito, $anulado, $monedaNombre
        );
    }
    
    $stmtEnc->fetch();
    $stmtEnc->close();
    
    // ==============================================
    // 2. EMPAQUES DEL PEDIDO (0-N REGISTROS)
    // ==============================================
    $sqlEmp = "SELECT 
        de.IdDetEmpaque,
        de.IdEncabPedido,
        de.IdTipoEmpaque,
        de.Cantidad,
        de.PO_Empaque,
        de.Anulado    
    FROM SAS_DetEmpaque de
    WHERE de.IdEncabPedido = ?
    AND de.Anulado = 0";  // Solo empaques no anulados
    
    $stmtEmp = $enlace->prepare($sqlEmp);
    if (!$stmtEmp) {
        throw new Exception("Error preparando empaques: " . $enlace->error);
    }
    
    $stmtEmp->bind_param("i", $idPedido);
    $stmtEmp->execute();
    $stmtEmp->store_result();
    
    // Inicializar array de empaques (puede estar vacío)
    $empaques = [];
    
    // Solo procesar si hay empaques
    if ($stmtEmp->num_rows > 0) {
        $stmtEmp->bind_result(
            $idDetEmpaque, $idEncabPedidoEmp, $idTipoEmpaque, $cantidad, 
            $poEmpaque, $anuladoEmp
        );
        
        while ($stmtEmp->fetch()) {
            $empaqueId = $idDetEmpaque;
            
            // ==============================================
            // 3. PRODUCTOS DE CADA EMPAQUE (0-N REGISTROS)
            // ==============================================
            // CORRECCIÓN: Usar solo columnas que existen
            $sqlProd = "SELECT 
                dp.IdDetProducto,
                dp.IdDetEmpaque,
                dp.IdEncabPedido,
                dp.IdProducto,
                dp.IdVariedad,
                dp.IdGrado,
                dp.Descripcion,
                dp.IdUnidad,
                dp.IdPredio,
                dp.Tallos_Ramo,
                dp.Ramos_Caja,
                dp.Precio_Venta,
                dp.Anulado
            FROM SAS_DetProducto dp    
            WHERE dp.IdDetEmpaque = ?
            AND dp.Anulado = 0";  // Solo productos no anulados
            
            $stmtProd = $enlace->prepare($sqlProd);
            if ($stmtProd) {
                $stmtProd->bind_param("i", $empaqueId);
                $stmtProd->execute();
                $stmtProd->store_result();
                
                // Inicializar array de productos (puede estar vacío)
                $productos = [];
                
                // Solo procesar si hay productos
                if ($stmtProd->num_rows > 0) {
                    $stmtProd->bind_result(
                        $idDetProducto, $idDetEmpaqueProd, $idEncabPedidoProd, $idProducto,
                        $idVariedad, $idGrado, $descripcion, $idUnidad, $idPredio,
                        $tallosRamo, $ramosCaja, $precioVenta, $anuladoProd
                    );
                    
                    while ($stmtProd->fetch()) {
                        $productoId = $idDetProducto;
                        
                        // ==============================================
                        // 4. RECETA (BOUQUET) - (0-N REGISTROS)
                        // ==============================================
                        $receta = [];
                        
                        // Verificar si este producto tiene receta (es bouquet)
                        $sqlRec = "SELECT 
                            dr.IdDetReceta,
                            dr.IdDetProducto,
                            dr.IdDetEmpaque,
                            dr.IdEncabPedido,
                            dr.IdProducto,
                            dr.IdVariedad,
                            dr.Cantidad,
                            dr.Anulado
                        FROM SAS_DetReceta dr
                        WHERE dr.IdDetProducto = ?
                        AND dr.Anulado = 0";
                        
                        $stmtRec = $enlace->prepare($sqlRec);
                        if ($stmtRec) {
                            $stmtRec->bind_param("i", $productoId);
                            $stmtRec->execute();
                            $stmtRec->store_result();
                            
                            // Solo procesar si hay recetas
                            if ($stmtRec->num_rows > 0) {
                                $stmtRec->bind_result(
                                    $idDetReceta, $idDetProductoRec, $idDetEmpaqueRec,
                                    $idEncabPedidoRec, $idProductoRec, $idVariedadRec,
                                    $cantidadRec, $anuladoRec
                                );
                                
                                while ($stmtRec->fetch()) {
                                    $receta[] = [
                                        "id" => $idDetReceta,
                                        "producto" => $idProductoRec,
                                        "variedad" => $idVariedadRec,
                                        "tallosPorBouquet" => $cantidadRec
                                    ];
                                }
                            }
                            $stmtRec->close();
                        }
                        
                        // Determinar si es bouquet basado en si tiene recetas
                        $esBouquet = !empty($receta);
                        
                        $productos[] = [
                            "id" => $productoId,
                            "producto" => $idProducto,
                            "variedad" => $idVariedad,
                            "grado" => $idGrado,
                            "unidadFacturacion" => $idUnidad,
                            "predio" => $idPredio,
                            "tallosRamo" => $tallosRamo,
                            "ramosCaja" => $ramosCaja,
                            "precioVenta" => $precioVenta,
                            "descripcion" => $descripcion,
                            "esBouquet" => $esBouquet,
                            "receta" => $receta  // Puede ser array vacío
                        ];
                    }
                }
                
                $stmtProd->close();
            }
            
            // Agregar empaque (aunque puede tener productos vacíos)
            $empaques[] = [
                "id" => $empaqueId,
                "tipoEmpaque" => $idTipoEmpaque,
                "cantidadEmpaque" => $cantidad,
                "poCodeEmpaque" => $poEmpaque,
                "items" => $productos  // Puede ser array vacío
            ];
        }
    }
    
    $stmtEmp->close();
    
    // ===================
    // RESPUESTA FINAL
    // ===================
    $response = [
        "success" => true,
        "pedido" => [
            "header" => [
                "IdEncabPedido" => $idEncabPedido,
                "IdCliente" => $idCliente,
                "IdEjecutivo" => $idEjecutivo,
                "FechaSolicitud" => $fechaSolicitud,
                "FechaEntrega" => $fechaEntrega,
                "IdMoneda" => $idMoneda,
                "MonedaNombre" => $monedaNombre,
                "TRM" => $trm,
                "PO_Cliente" => $poCliente,
                "Observaciones" => $observaciones,
                "AWB" => $awb,
                "AWB_HIJA" => $awbHija,
                "AWB_NIETA" => $awbNieta,
                "IdAerolinea" => $idAerolinea,
                "IdAgencia" => $idAgencia,
                "PuertoSalida" => $puertoSalida,
                "IVA" => $iva,
                "Estado" => $estado,
                "Factura" => $factura,
                "NoPlanilla" => $noPlanilla,
                "NoFito" => $noFito,
                "Anulado" => $anulado,
                "IdRazonSocial" => $conRazonSocial ? $idRazonSocial : null
            ],
            "empaques" => $empaques  // Puede ser array vacío
        ]
    ];
    
    $enlace->close();
    
    echo json_encode($response);
    
} catch (Exception $e) {
    // Limpieza y error
    if (isset($stmtEnc) && $stmtEnc) $stmtEnc->close();
    if (isset($stmtEmp) && $stmtEmp) $stmtEmp->close();
    if (isset($enlace) && $enlace) $enlace->close();
    
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>