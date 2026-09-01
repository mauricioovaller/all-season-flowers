<?php
// src/Api/pagosClientes/ApiGuardarPagoCliente.php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión"]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "No se recibieron datos"]);
    exit;
}

// Validar campos requeridos del encabezado
$fechaPago = $data["fechaPago"] ?? "";
$idCliente = isset($data["idCliente"]) ? intval($data["idCliente"]) : 0;
$idMoneda = isset($data["idMoneda"]) ? intval($data["idMoneda"]) : 0;
$trm = isset($data["trm"]) ? floatval($data["trm"]) : 0;
$idMedioPago = isset($data["idMedioPago"]) ? intval($data["idMedioPago"]) : 0;
$valorTotal = isset($data["valorTotal"]) ? floatval($data["valorTotal"]) : 0;
$costoTransferencia = isset($data["costoTransferencia"]) ? floatval($data["costoTransferencia"]) : 0;
$observaciones = $data["observaciones"] ?? "";

// Validar facturas (array de facturas con invoice y valorPago)
$facturas = isset($data["facturas"]) && is_array($data["facturas"]) ? $data["facturas"] : [];

if (empty($fechaPago) || !$idCliente || !$idMoneda || !$trm || !$idMedioPago || $valorTotal <= 0 || count($facturas) === 0) {
    echo json_encode(["success" => false, "message" => "Faltan datos requeridos, valor total inválido o no hay facturas seleccionadas"]);
    exit;
}

// Detectar si es actualización o inserción
$idEncabPagoClienteExistente = isset($data["idEncabPagoCliente"]) ? intval($data["idEncabPagoCliente"]) : 0;
$esActualizacion = $idEncabPagoClienteExistente > 0;

// Validar cada factura
foreach ($facturas as $factura) {
    $invoice = isset($factura["invoice"]) ? intval($factura["invoice"]) : 0;
    $valorFactura = isset($factura["valorPago"]) ? floatval($factura["valorPago"]) : 0;

    if ($invoice <= 0 || $valorFactura <= 0) {
        echo json_encode(["success" => false, "message" => "Datos inválidos en las facturas"]);
        exit;
    }
}

// Iniciar transacción
$enlace->begin_transaction();

try {
    // 1. Verificar que todas las facturas existan y tengan saldo pendiente
    $advertencias = [];
    $facturasValidadas = [];

    $idLegacyActualizados = [];

    foreach ($facturas as $factura) {
        $invoice = intval($factura["invoice"]);
        $valorPagoFactura = floatval($factura["valorPago"]);
        $esLegacy = !empty($factura["esLegacy"]);

        if ($esLegacy) {
            // ── FACTURA LEGACY ──
            $sqlLegacy = "SELECT leg.IdLegacyMovimiento, leg.IdMoneda, m.Moneda, leg.IdEntidad,
                                 leg.Valor, leg.Credito, leg.Pago,
                                 (leg.Valor - leg.Credito - leg.Pago) as saldoPendiente
                          FROM SAS_LegacyMovimientos leg
                          LEFT JOIN GEN_Monedas m ON leg.IdMoneda = m.IdMoneda
                          WHERE leg.Tipo = 'C'
                            AND leg.NumeroDocumento = ?
                            AND leg.IdEntidad = ?
                            AND leg.Anulado = 0
                          LIMIT 1";
            $stmtLeg = $enlace->prepare($sqlLegacy);
            if (!$stmtLeg) {
                throw new Exception("Error preparando consulta legacy: " . $enlace->error);
            }
            $invoiceStr = $factura["invoiceString"] ?? (string)$invoice;
            $stmtLeg->bind_param("si", $invoiceStr, $idCliente);
            $stmtLeg->execute();
            $stmtLeg->bind_result($idLegacyMov, $idMonedaFactura, $monedaFactura, $idEntidadLegacy, $valorLeg, $creditoLeg, $pagoLeg, $saldoLeg);
            if (!$stmtLeg->fetch()) {
                $stmtLeg->close();
                throw new Exception("Factura legacy $invoice no encontrada");
            }
            $stmtLeg->close();
            $saldoPendiente = floatval($saldoLeg);

            if ($idEntidadLegacy != $idCliente) {
                throw new Exception("La factura legacy $invoice no pertenece al cliente seleccionado");
            }
            if ($idMonedaFactura != $idMoneda) {
                throw new Exception("La factura legacy $invoice tiene moneda diferente a la seleccionada para el pago");
            }
            if ($saldoPendiente <= 0) {
                throw new Exception("La factura legacy $invoice no tiene saldo pendiente");
            }
            if ($valorPagoFactura > $saldoPendiente) {
                $advertencias[] = "El valor a pagar de la factura legacy $invoice ($valorPagoFactura) excede el saldo pendiente ($saldoPendiente)";
            }

            $facturasValidadas[] = [
                'invoice' => $invoice,
                'valorPago' => $valorPagoFactura,
                'idEncabPedido' => 0,
                'saldoPendiente' => $saldoPendiente,
                'esLegacy' => true,
                'idLegacyMov' => $idLegacyMov
            ];
            $idLegacyActualizados[] = $idLegacyMov;
        } else {
            // ── FACTURA ACTUAL ──
            $sqlInfoFactura = "SELECT ep.IdEncabPedido, ep.IdMoneda, m.Moneda, ep.IdCliente, ep.Anulado 
                              FROM SAS_EncabPedido ep 
                              LEFT JOIN GEN_Monedas m ON ep.IdMoneda = m.IdMoneda 
                              WHERE ep.Factura = ?";
            $stmtInfo = $enlace->prepare($sqlInfoFactura);
            if (!$stmtInfo) {
                throw new Exception("Error preparando consulta de información de factura: " . $enlace->error);
            }
            $stmtInfo->bind_param("i", $invoice);
            $stmtInfo->execute();
            $stmtInfo->bind_result($idEncabPedido, $idMonedaFactura, $monedaFactura, $idClienteFactura, $anuladoFactura);

            if (!$stmtInfo->fetch()) {
                $stmtInfo->close();
                throw new Exception("Factura $invoice no encontrada");
            }
            $stmtInfo->close();

            if ($idClienteFactura != $idCliente) {
                throw new Exception("La factura $invoice no pertenece al cliente seleccionado");
            }
            if ($idMonedaFactura != $idMoneda) {
                throw new Exception("La factura $invoice tiene moneda diferente a la seleccionada para el pago");
            }
            if ($anuladoFactura == 1) {
                throw new Exception("La factura $invoice pertenece a un pedido anulado y no puede pagarse");
            }

            $sqlSaldo = "
                SELECT 
                    (
                        COALESCE((
                            SELECT SUM(
                                CASE 
                                    WHEN dp.IdUnidad = 4 THEN de.Cantidad * (dp.Tallos_Ramo * dp.Ramos_Caja) * dp.Precio_Venta
                                    ELSE de.Cantidad * dp.Ramos_Caja * dp.Precio_Venta
                                END
                            )
                            FROM SAS_DetEmpaque de
                            INNER JOIN SAS_DetProducto dp ON de.IdDetEmpaque = dp.IdDetEmpaque
                            WHERE de.IdEncabPedido = ?
                        ), 0)
                        - COALESCE((
                            SELECT SUM(
                                (COALESCE(dp.TallosDevolucion, 0) * COALESCE(dp.Precio_Venta, 0)) + 
                                COALESCE(dp.Flete, 0) + 
                                COALESCE(dp.Fumigacion, 0) + 
                                COALESCE(dp.Otros, 0)
                            )
                            FROM SAS_DetEmpaque de
                            INNER JOIN SAS_DetProducto dp ON de.IdDetEmpaque = dp.IdDetEmpaque
                            WHERE de.IdEncabPedido = ?
                            AND COALESCE(dp.TallosDevolucion, 0) > 0
                        ), 0)
                        - COALESCE((
                            SELECT SUM(dpc.ValorPago)
                            FROM SAS_EncabPagoCliente epc
                            INNER JOIN SAS_DetPagoCliente dpc ON epc.IdEncabPagoCliente = dpc.IdEncabPagoCliente
                            WHERE dpc.Invoice = ?
                            AND epc.Anulado = 0
                            AND epc.IdEncabPagoCliente != ?
                        ), 0)
                    ) as saldoPendiente
            ";

            $stmtSaldo = $enlace->prepare($sqlSaldo);
            if (!$stmtSaldo) {
                throw new Exception("Error preparando consulta de saldo: " . $enlace->error);
            }
            $stmtSaldo->bind_param("iiii", $idEncabPedido, $idEncabPedido, $invoice, $idEncabPagoClienteExistente);
            $stmtSaldo->execute();
            $stmtSaldo->bind_result($saldoPendiente);
            $stmtSaldo->fetch();
            $stmtSaldo->close();

            if ($saldoPendiente <= 0) {
                throw new Exception("La factura $invoice no tiene saldo pendiente");
            }
            if ($valorPagoFactura > $saldoPendiente) {
                $advertencias[] = "El valor a pagar de la factura $invoice ($valorPagoFactura) excede el saldo pendiente ($saldoPendiente)";
            }

            $facturasValidadas[] = [
                'invoice' => $invoice,
                'valorPago' => $valorPagoFactura,
                'idEncabPedido' => $idEncabPedido,
                'saldoPendiente' => $saldoPendiente,
                'esLegacy' => false
            ];
        }
    }

    // Convertir fecha a formato datetime si es solo fecha
    $fechaPagoDatetime = $fechaPago;
    if (strlen($fechaPago) === 10) {
        $fechaPagoDatetime = $fechaPago . " 00:00:00";
    }

    if ($esActualizacion) {
        // 2a. Verificar que el pago existe y no está anulado
        $stmtVerifica = $enlace->prepare("SELECT IdEncabPagoCliente FROM SAS_EncabPagoCliente WHERE IdEncabPagoCliente = ? AND Anulado = 0");
        if (!$stmtVerifica) throw new Exception("Error preparando verificación de pago: " . $enlace->error);
        $stmtVerifica->bind_param("i", $idEncabPagoClienteExistente);
        $stmtVerifica->execute();
        $stmtVerifica->bind_result($idVerificado);
        if (!$stmtVerifica->fetch()) {
            $stmtVerifica->close();
            throw new Exception("El pago no existe o ya fue anulado");
        }
        $stmtVerifica->close();

        $idEncabPagoCliente = $idEncabPagoClienteExistente;
        $numeroPagoFormateado = "PAG-CLI-" . str_pad($idEncabPagoCliente, 6, "0", STR_PAD_LEFT);

        // 3a. Actualizar encabezado del pago
        $sqlUpdateEnc = "UPDATE SAS_EncabPagoCliente SET 
            Fecha = ?, IdCliente = ?, MedioPago = ?, IdMoneda = ?, TRM = ?, 
            CostoTransferencia = ?, Observaciones = ?
            WHERE IdEncabPagoCliente = ? AND Anulado = 0";
        $stmtEnc = $enlace->prepare($sqlUpdateEnc);
        if (!$stmtEnc) throw new Exception("Error preparando actualización de encabezado: " . $enlace->error);
        $stmtEnc->bind_param(
            "siiidssi",
            $fechaPagoDatetime,
            $idCliente,
            $idMedioPago,
            $idMoneda,
            $trm,
            $costoTransferencia,
            $observaciones,
            $idEncabPagoCliente
        );
        $stmtEnc->execute();
        if ($stmtEnc->errno) throw new Exception("Error actualizando encabezado: " . $stmtEnc->error);
        $stmtEnc->close();

        // Eliminar detalles anteriores (se reemplazan por los nuevos)
        // No se usa Anulado=1 aquí: ese campo es exclusivo de la anulación total del pago
        $sqlDeleteDet = "DELETE FROM SAS_DetPagoCliente WHERE IdEncabPagoCliente = ?";
        $stmtDelete = $enlace->prepare($sqlDeleteDet);
        if (!$stmtDelete) throw new Exception("Error preparando eliminación de detalles: " . $enlace->error);
        $stmtDelete->bind_param("i", $idEncabPagoCliente);
        $stmtDelete->execute();
        if ($stmtDelete->errno) throw new Exception("Error eliminando detalles anteriores: " . $stmtDelete->error);
        $stmtDelete->close();
    } else {
        // 2b. Obtener el siguiente número de pago
        $queryUltimo = "SELECT MAX(IdEncabPagoCliente) as ultimo FROM SAS_EncabPagoCliente";
        $result = $enlace->query($queryUltimo);
        if (!$result) {
            throw new Exception("Error al obtener último número: " . $enlace->error);
        }
        $row = $result->fetch_assoc();
        $idEncabPagoCliente = ($row['ultimo'] ? (int)$row['ultimo'] : 0) + 1;

        // Formatear número de pago
        $numeroPagoFormateado = "PAG-CLI-" . str_pad($idEncabPagoCliente, 6, "0", STR_PAD_LEFT);

        // 3b. Insertar encabezado del pago
        $sqlInsertEnc = "INSERT INTO SAS_EncabPagoCliente 
            (IdEncabPagoCliente, Fecha, IdCliente, MedioPago, IdMoneda, TRM, 
             CostoTransferencia, Observaciones, Anulado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)";
        $stmtEnc = $enlace->prepare($sqlInsertEnc);
        if (!$stmtEnc) throw new Exception("Error preparando inserción de encabezado: " . $enlace->error);
        $stmtEnc->bind_param(
            "isiiidss",
            $idEncabPagoCliente,
            $fechaPagoDatetime,
            $idCliente,
            $idMedioPago,
            $idMoneda,
            $trm,
            $costoTransferencia,
            $observaciones
        );
        $stmtEnc->execute();
        if ($stmtEnc->errno) throw new Exception("Error ejecutando inserción de encabezado: " . $stmtEnc->error);
        $stmtEnc->close();
    }

    // 4. Insertar nuevos detalles del pago (una fila por factura)
    // No se especifica IdDetPagoCliente — la BD lo asigna automáticamente (auto_increment)
    foreach ($facturasValidadas as $factura) {
        $sqlInsertDet = "INSERT INTO SAS_DetPagoCliente 
            (IdEncabPagoCliente, Invoice, ValorPago, Anulado) 
            VALUES (?, ?, ?, 0)";

        $stmtDet = $enlace->prepare($sqlInsertDet);
        if (!$stmtDet) {
            throw new Exception("Error preparando inserción de detalle: " . $enlace->error);
        }
        $stmtDet->bind_param("iid", $idEncabPagoCliente, $factura['invoice'], $factura['valorPago']);
        $stmtDet->execute();
        if ($stmtDet->errno) {
            throw new Exception("Error ejecutando inserción de detalle: " . $stmtDet->error);
        }
        $stmtDet->close();
    }

    // 5. Actualizar Pago en SAS_LegacyMovimientos para facturas legacy
    //    Se recalcula desde SAS_DetPagoCliente para reflejar pagos nuevos/editados/anulados
    foreach ($idLegacyActualizados as $idLegMov) {
        $sqlRecalcPago = "
            UPDATE SAS_LegacyMovimientos leg
            SET leg.Pago = COALESCE((
                SELECT SUM(dpc.ValorPago)
                FROM SAS_DetPagoCliente dpc
                INNER JOIN SAS_EncabPagoCliente epc ON dpc.IdEncabPagoCliente = epc.IdEncabPagoCliente
                WHERE dpc.Invoice = CAST(leg.NumeroDocumento AS UNSIGNED)
                  AND dpc.Anulado = 0
                  AND epc.Anulado = 0
            ), 0)
            WHERE leg.IdLegacyMovimiento = ?";
        $stmtRecalc = $enlace->prepare($sqlRecalcPago);
        if (!$stmtRecalc) {
            throw new Exception("Error preparando actualización de pago legacy: " . $enlace->error);
        }
        $stmtRecalc->bind_param("i", $idLegMov);
        $stmtRecalc->execute();
        if ($stmtRecalc->errno) {
            throw new Exception("Error actualizando pago legacy: " . $stmtRecalc->error);
        }
        $stmtRecalc->close();
    }

    $enlace->commit();

    // Preparar respuesta
    $mensajeBase = $esActualizacion ? "Pago actualizado correctamente" : "Pago guardado correctamente";
    $response = [
        "success" => true,
        "message" => $mensajeBase,
        "idEncabPagoCliente" => $idEncabPagoCliente,
        "numeroPago" => $numeroPagoFormateado,
        "valorTotal" => $valorTotal,
        "cantidadFacturas" => count($facturasValidadas),
        "esActualizacion" => $esActualizacion
    ];

    // Agregar advertencias si las hay
    if (!empty($advertencias)) {
        $response["advertencias"] = $advertencias;
        $response["message"] = $esActualizacion ? "Pago actualizado con advertencias" : "Pago guardado con advertencias";
    }

    echo json_encode($response);
} catch (Exception $e) {
    $enlace->rollback();
    error_log("Error en ApiGuardarPagoCliente.php: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} finally {
    if (isset($enlace)) $enlace->close();
}
