<?php
// src/Api/compras/ApiGetCompraEspecifica.php
header("Content-Type: application/json");

// Activar logs para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Conexión a la base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Leer datos
$json = file_get_contents("php://input");
$data = json_decode($json, true);
$idCompra = intval($data["idCompra"] ?? 0);

if ($idCompra <= 0) {
    echo json_encode(["success" => false, "message" => "ID de compra inválido"]);
    exit;
}

try {
    // ==============================================
    // 1. ENCABEZADO DE LA COMPRA (SIEMPRE 1 REGISTRO)
    // ==============================================
    $sqlEnc = "SELECT 
        ec.IdEncabCompra,
        ec.TipoCompra,
        ec.IdProveedor,
        ec.IdComprador,
        ec.FechaSolicitud,
        ec.FechaEntrega,
        ec.IdMoneda,
        ec.TRM,
        ec.PO_Proveedor,
        ec.Observaciones,
        ec.Anulado,
        ec.IVA    
    FROM SAS_EncabCompra ec
    WHERE ec.IdEncabCompra = ?";
    
    $stmtEnc = $enlace->prepare($sqlEnc);
    if (!$stmtEnc) {
        throw new Exception("Error preparando encabezado: " . $enlace->error);
    }
    
    $stmtEnc->bind_param("i", $idCompra);
    $stmtEnc->execute();
    $stmtEnc->store_result();
    
    // Verificar si existe la compra
    if ($stmtEnc->num_rows == 0) {
        $stmtEnc->close();
        echo json_encode(["success" => false, "message" => "Compra no encontrada"]);
        exit;
    }
    
    // Obtener el encabezado
    $stmtEnc->bind_result(
        $idEncabCompra, $tipoCompra, $idProveedor, $idComprador, $fechaSolicitud, $fechaEntrega,
        $idMoneda, $trm, $poProveedor, $observaciones, $anulado, $iva
    );
    
    $stmtEnc->fetch();
    $stmtEnc->close();
    
    // ==============================================
    // 2. EMPAQUES DE LA COMPRA (0-N REGISTROS)
    // ==============================================
    $sqlEmp = "SELECT 
        dek.IdDetEmpaque,
        dek.IdEncabCompra,
        dek.IdTipoEmpaque,
        dek.Cantidad,
        dek.PO_Empaque,
        dek.Anulado    
    FROM SAS_DetEmpaqueCompra dek
    WHERE dek.IdEncabCompra = ?
    AND dek.Anulado = 0";  // Solo empaques no anulados
    
    $stmtEmp = $enlace->prepare($sqlEmp);
    if (!$stmtEmp) {
        throw new Exception("Error preparando empaques: " . $enlace->error);
    }
    
    $stmtEmp->bind_param("i", $idCompra);
    $stmtEmp->execute();
    $stmtEmp->store_result();
    
    // Inicializar array de empaques (puede estar vacío)
    $empaques = [];
    
    // Solo procesar si hay empaques
    if ($stmtEmp->num_rows > 0) {
        $stmtEmp->bind_result(
            $idDetEmpaque, $idEncabCompraEmp, $idTipoEmpaque, $cantidad, 
            $poEmpaque, $anuladoEmp
        );
        
        while ($stmtEmp->fetch()) {
            $empaqueId = $idDetEmpaque;
            
            // ==============================================
            // 3. PRODUCTOS DE CADA EMPAQUE (0-N REGISTROS)
            // ==============================================
            $sqlProd = "SELECT 
                dpc.IdDetProducto,
                dpc.IdDetEmpaque,
                dpc.IdEncabCompra,
                dpc.IdProducto,
                dpc.IdVariedad,
                dpc.IdGrado,
                dpc.Descripcion,
                dpc.IdUnidad,
                dpc.IdPredio,
                dpc.Tallos_Ramo,
                dpc.Ramos_Caja,
                dpc.Precio_Compra,
                dpc.Anulado
            FROM SAS_DetProductoCompra dpc    
            WHERE dpc.IdDetEmpaque = ?
            AND dpc.Anulado = 0";  // Solo productos no anulados
            
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
                        $idDetProducto, $idDetEmpaqueProd, $idEncabCompraProd, $idProducto,
                        $idVariedad, $idGrado, $descripcion, $idUnidad, $idPredio,
                        $tallosRamo, $ramosCaja, $precioCompra, $anuladoProd
                    );
                    
                    while ($stmtProd->fetch()) {
                        $productoId = $idDetProducto;
                        
                        // ==============================================
                        // 4. RECETA (BOUQUET) - (0-N REGISTROS)
                        // ==============================================
                        $receta = [];
                        
                        // Verificar si este producto tiene receta (es bouquet)
                        $sqlRec = "SELECT 
                            drc.IdDetReceta,
                            drc.IdDetProducto,
                            drc.IdDetEmpaque,
                            drc.IdEncabCompra,
                            drc.IdProducto,
                            drc.IdVariedad,
                            drc.Cantidad,
                            drc.Anulado
                        FROM SAS_DetRecetaCompra drc
                        WHERE drc.IdDetProducto = ?
                        AND drc.Anulado = 0";
                        
                        $stmtRec = $enlace->prepare($sqlRec);
                        if ($stmtRec) {
                            $stmtRec->bind_param("i", $productoId);
                            $stmtRec->execute();
                            $stmtRec->store_result();
                            
                            // Solo procesar si hay recetas
                            if ($stmtRec->num_rows > 0) {
                                $stmtRec->bind_result(
                                    $idDetReceta, $idDetProductoRec, $idDetEmpaqueRec,
                                    $idEncabCompraRec, $idProductoRec, $idVariedadRec,
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
                            "precioCompra" => $precioCompra,  // Nota: precioCompra en lugar de precioVenta
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
        "compra" => [
            "header" => [
                "IdEncabCompra" => $idEncabCompra,
                "TipoCompra" => $tipoCompra,
                "IdProveedor" => $idProveedor,
                "IdComprador" => $idComprador,
                "FechaSolicitud" => $fechaSolicitud,
                "FechaEntrega" => $fechaEntrega,
                "IdMoneda" => $idMoneda,
                "TRM" => $trm,
                "PO_Proveedor" => $poProveedor,
                "Observaciones" => $observaciones,
                "Anulado" => $anulado,
                "IVA" => $iva,
            ],
            "empaques" => $empaques  // Puede ser array vacío
        ]
    ];
    
    $enlace->close();
    
    echo json_encode($response);
    
} catch (Exception $e) {
    // Limpieza y error
    //if (isset($stmtEnc) && $stmtEnc) $stmtEnc->close();
    //if (isset($stmtEmp) && $stmtEmp) $stmtEmp->close();
    //if (isset($enlace) && $enlace) $enlace->close();
    
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>