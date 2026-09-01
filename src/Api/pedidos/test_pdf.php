<?php
// Script de prueba para generar PDF y ver errores exactos
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/empresa.php';
require_once FPDF_PATH;
require_once CONEXION_BD_PATH;
$enlace->set_charset("utf8mb4");

// Usar número de planilla válido de prueba (ajusta según tu BD)
$numeroPlanilla = 1; // Cambia esto al número que quieras probar

$sql = "SELECT 
            enc.IdEncabPedido,
            CONCAT('PLAN-', LPAD(enc.NoPlanilla, 4, '0')) AS numero_planilla,
            DATE_FORMAT(NOW(), '%d/%m/%Y') AS fecha_actual,
            DATE_FORMAT(enc.FechaEntrega, '%d/%m/%Y') AS fecha_entrega,
            '" . EMPRESA_NOMBRE . "' AS empresa_nombre,
            '" . EMPRESA_NIT . "' AS nit,
            '" . EMPRESA_REPRESENTANTE . "' AS representante_legal,
            '" . EMPRESA_CC_REPRESENTANTE . "' AS cc_representante,
            '" . EMPRESA_CC_REPRESENTANTE . "' AS cc_completo,
            '" . EMPRESA_TELEFONO . "' AS telefono_empresa,
            '" . EMPRESA_DIRECCION . "' AS direccion_empresa,
            '" . EMPRESA_CIUDAD . "' AS ciudad_empresa,
            cli.NOMBRE AS cliente_nombre,
            CONCAT(cli.Direc1, ', ', cli.CIUDAD, ', ', cli.ESTADO, ', ', cli.PAIS) AS direccion_cliente,
            enc.PO_Cliente,
            enc.AWB,
            enc.AWB_HIJA,
            enc.AWB_NIETA,
            COALESCE(aer.NOMAEROLINEA, 'UNITED PARCEL SERVICE') AS aerolinea,
            COALESCE(age.NOMAGENCIA, 'K&M Handling') AS agencia,
            'ESTADOS UNIDOS' AS destino_pais,
            CONCAT(cli.Direc1,', ', cli.CIUDAD, ', ', cli.ESTADO, ', ', cli.PAIS) AS destino_completo,
            COALESCE(empaques.TotalPiezas, 0) AS TotalPiezas,
            COALESCE(empaques.EquivalenciaFulles, 0) AS EquivalenciaFulles,
            COALESCE(productos.TotalTallos, 0) AS TotalTallos,
            enc.Factura,
            CONCAT('FACT-', LPAD(enc.Factura, 6, '0')) AS numero_factura,
            'FLORES FRESCAS CORTADAS' AS descripcion_mercancia,
            con.NombreConductor AS conductor_nombre,
            con.NoCedula AS conductor_cedula,
            ayu.NomAyudante AS ayudante_nombre,
            ayu.NoCedula AS ayudante_cedula,
            enc.Placa,
            enc.Precinto
        FROM SAS_EncabPedido enc
        LEFT JOIN (
            SELECT 
                deq.IdEncabPedido,
                SUM(deq.Cantidad) AS TotalPiezas,
                SUM(deq.Cantidad * COALESCE(teq.EquivFull, 0)) AS EquivalenciaFulles
            FROM SAS_DetEmpaque deq
            LEFT JOIN GEN_TipoEmpaque teq ON deq.IdTipoEmpaque = teq.IdTipoEmpaque
            WHERE deq.Anulado = 0
            GROUP BY deq.IdEncabPedido
        ) empaques ON enc.IdEncabPedido = empaques.IdEncabPedido
        LEFT JOIN (
            SELECT 
                dpr.IdEncabPedido,
                SUM(deq1.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja) AS TotalTallos
            FROM SAS_DetProducto dpr
            INNER JOIN SAS_DetEmpaque deq1 ON dpr.IdDetEmpaque = deq1.IdDetEmpaque
            WHERE dpr.Anulado = 0
            GROUP BY dpr.IdEncabPedido
        ) productos ON enc.IdEncabPedido = productos.IdEncabPedido
        LEFT JOIN GEN_Clientes cli ON enc.IdCliente = cli.IdCliente
        LEFT JOIN GEN_Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
        LEFT JOIN GEN_Agencias age ON enc.IdAgencia = age.IdAgencia
        LEFT JOIN GEN_Conductores con ON enc.IdConductor = con.IdConductor
        LEFT JOIN GEN_Ayudantes ayu ON enc.IdAyudante = ayu.IdAyudante
        WHERE enc.NoPlanilla = ?";

try {
    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error en preparación: " . $enlace->error);
    }

    $stmt->bind_param("i", $numeroPlanilla);
    if (!$stmt->execute()) {
        throw new Exception("Error al ejecutar: " . $stmt->error);
    }

    $stmt->bind_result(
        $idEncabPedido,
        $numero_planilla,
        $fecha_actual,
        $fecha_entrega,
        $empresa_nombre,
        $nit,
        $representante_legal,
        $cc_representante,
        $cc_completo,
        $telefono_empresa,
        $direccion_empresa,
        $ciudad_empresa,
        $cliente_nombre,
        $direccion_cliente,
        $po_cliente,
        $awb,
        $awb_hija,
        $awb_nieta,
        $aerolinea,
        $agencia,
        $destino_pais,
        $destino_completo,
        $total_piezas,
        $equivalencia_fulles,
        $total_tallos,
        $factura,
        $numero_factura,
        $descripcion_mercancia,
        $conductor_nombre,
        $conductor_cedula,
        $ayudante_nombre,
        $ayudante_cedula,
        $placa,
        $precinto
    );

    if (!$stmt->fetch()) {
        throw new Exception("Planilla no encontrada");
    }
    $stmt->close();

    echo "<h2>Datos cargados correctamente:</h2>";
    echo "Planilla: " . htmlspecialchars($numero_planilla) . "<br>";
    echo "Conductor: " . htmlspecialchars($conductor_nombre) . "<br>";
    echo "Cédula: " . htmlspecialchars($conductor_cedula) . "<br>";
    echo "Aerolínea: " . htmlspecialchars($aerolinea) . "<br>";
    echo "<h3>✅ Datos válidos - La BD está bien</h3>";
} catch (Exception $e) {
    echo "<h2>❌ Error encontrado:</h2>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
}
