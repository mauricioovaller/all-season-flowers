<?php
// Agregar más memoria para procesar el PDF
ini_set('memory_limit', '256M');
ini_set('max_execution_time', '300');

require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verificar si la petición es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

// Obtener los datos enviados en formato JSON
$input = json_decode(file_get_contents("php://input"), true);

// Verificar si se recibió el ID del pedido
if (!isset($input['idPedido']) || empty($input['idPedido'])) {
    die(json_encode(["error" => "ID de pedido no válido."]));
}

$idPedido = intval($input['idPedido']);

// 🔴 CONSULTA 1: DATOS DEL ENCABEZADO DEL PEDIDO
$sqlEncabezado = "SELECT
                    enc.IdEncabPedido,
                    CONCAT('ASF-', LPAD(enc.IdEncabPedido, 6, '0')) AS numero_pedido,
                    cli.NOMBRE AS cliente_nombre,
                    cli.Direc1 AS direccion_cliente,
                    cli.CIUDAD AS ciudad_cliente,
                    cli.ESTADO AS estado_cliente,
                    cli.PAIS AS pais_cliente,
                    cli.TEL1 AS telefono_cliente,
                    enc.PO_Cliente,
                    enc.AWB,
                    enc.AWB_HIJA,
                    enc.AWB_NIETA,
                    COALESCE(aer.NOMAEROLINEA, 'UNITED PARCEL SERVICE') AS aerolinea,
                    COALESCE(age.NOMAGENCIA, 'K&M Handling') AS agencia,
                    enc.PuertoSalida,
                    mon.Moneda AS moneda_pedido,
                    enc.TRM,
                    DATE_FORMAT(enc.FechaEntrega, '%d-%b-%y') AS fecha_entrega
                FROM
                    SAS_EncabPedido enc 
                INNER JOIN GEN_Clientes cli ON enc.IdCliente = cli.IdCliente
                LEFT JOIN GEN_Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
                LEFT JOIN GEN_Agencias age ON enc.IdAgencia = age.IdAgencia
                LEFT JOIN GEN_Monedas mon ON enc.IdMoneda = mon.IdMoneda
                WHERE
                    enc.IdEncabPedido = ?";

$stmtEncabezado = $enlace->prepare($sqlEncabezado);
$stmtEncabezado->bind_param("i", $idPedido);
$stmtEncabezado->execute();
$stmtEncabezado->bind_result(
    $idEncabPedido,
    $numero_pedido,
    $cliente_nombre,
    $direccion_cliente,
    $ciudad_cliente,
    $estado_cliente,
    $pais_cliente,
    $telefono_cliente,
    $po_cliente,
    $awb,
    $awb_hija,
    $awb_nieta,
    $aerolinea,
    $agencia,
    $puerto_salida,
    $moneda_pedido,
    $trm,
    $fecha_entrega
);

if (!$stmtEncabezado->fetch()) {
    die(json_encode(["error" => "Pedido no encontrado."]));
}
$stmtEncabezado->close();

// 🔴 CONSULTA 2 MODIFICADA: DETALLES DE LOS EMPAQUES Y PRODUCTOS (AGREGADOS)
$sqlDetalle = "SELECT
                dem.IdDetEmpaque,
                tem.Abreviatura AS tipo_empaque,
                tem.Descripcion AS descripcion_empaque,
                tem.EquivFull AS equiv_full,
                dem.Cantidad AS cantidad_empaques,
                dem.PO_Empaque,
                
                -- Agrupar productos (separados por coma)
                GROUP_CONCAT(DISTINCT pro.NOMPRODUCTO SEPARATOR ', ') AS productos_nombres,
                GROUP_CONCAT(DISTINCT var.NOMVARIEDAD SEPARATOR ', ') AS variedades_nombres,
                COUNT(DISTINCT dpr.IdDetProducto) AS num_productos_empaque,
                
                -- Tomar el primer producto como referencia (para campos individuales)
                MAX(pro.NOMPRODUCTO) AS nombre_producto_ejemplo,
                MAX(var.NOMVARIEDAD) AS nombre_variedad_ejemplo,
                MAX(gra.NOMGRADO) AS nombre_grado,
                MAX(und.DescripUnidad) AS unidad_facturacion,
                MAX(dpr.Descripcion) AS descripcion_producto,
                MAX(pre.NombrePredio) AS nombre_predio,
                
                -- Para Mix/Assorted, se necesita saber si hay múltiples productos
                MAX(dpr.Tallos_Ramo) AS tallos_ramo_ejemplo,
                MAX(dpr.Ramos_Caja) AS ramos_caja_ejemplo,
                MAX(dpr.Precio_Venta) AS precio_venta_ejemplo,
                
                -- SUMAR TOTAL DE TALLOS POR EMPAQUE (todos los productos)
                SUM(dpr.Tallos_Ramo * dpr.Ramos_Caja) AS total_tallos_por_empaque,
                SUM(dem.Cantidad * dpr.Tallos_Ramo * dpr.Ramos_Caja) AS total_tallos_empaque_completo,
                
                ROW_NUMBER() OVER (ORDER BY dem.IdDetEmpaque) AS item_global
            FROM
                SAS_DetEmpaque dem 
            INNER JOIN GEN_TipoEmpaque tem ON dem.IdTipoEmpaque = tem.IdTipoEmpaque
            INNER JOIN SAS_DetProducto dpr ON dem.IdDetEmpaque = dpr.IdDetEmpaque
            INNER JOIN GEN_Productos pro ON dpr.IdProducto = pro.IdProducto
            LEFT JOIN GEN_Variedades var ON dpr.IdVariedad = var.IdVariedad
            LEFT JOIN GEN_Grados gra ON dpr.IdGrado = gra.IdGrado
            INNER JOIN GEN_Unidades und ON dpr.IdUnidad = und.IdUnidades
            LEFT JOIN GEN_Predios pre ON dpr.IdPredio = pre.IdPredio
            WHERE
                dem.IdEncabPedido = ?
            GROUP BY 
                dem.IdDetEmpaque,
                tem.Abreviatura,
                tem.Descripcion,
                tem.EquivFull,
                dem.Cantidad,
                dem.PO_Empaque
            ORDER BY 
                dem.IdDetEmpaque";

$stmtDetalle = $enlace->prepare($sqlDetalle);
$stmtDetalle->bind_param("i", $idPedido);
$stmtDetalle->execute();

// 🔴 ACTUALIZAR bind_result() para que coincida con la nueva consulta
$stmtDetalle->bind_result(
    $idDetEmpaque,
    $tipo_empaque,
    $descripcion_empaque,
    $equiv_full,
    $cantidad_empaques,
    $po_empaque,
    $productos_nombres,
    $variedades_nombres,
    $num_productos_empaque,
    $nombre_producto_ejemplo,
    $nombre_variedad_ejemplo,
    $nombre_grado,
    $unidad_facturacion,
    $descripcion_producto,
    $nombre_predio,
    $tallos_ramo_ejemplo,
    $ramos_caja_ejemplo,
    $precio_venta_ejemplo,
    $total_tallos_por_empaque,
    $total_tallos_empaque_completo,
    $item_global
);

// VERSIÓN OPTIMIZADA - Procesar resultados de detalle
$detalles = [];
$total_piezas = 0;

while ($stmtDetalle->fetch()) {
    $detalle_item = [
        'idDetEmpaque' => $idDetEmpaque,
        'tipo_empaque' => $tipo_empaque,
        'descripcion_empaque' => $descripcion_empaque,
        'equiv_full' => $equiv_full,
        'cantidad_empaques' => $cantidad_empaques,
        'po_empaque' => $po_empaque,
        'productos_nombres' => $productos_nombres,
        'variedades_nombres' => $variedades_nombres,
        'num_productos_empaque' => $num_productos_empaque,
        'nombre_producto_ejemplo' => $nombre_producto_ejemplo,
        'nombre_variedad_ejemplo' => $nombre_variedad_ejemplo,
        'nombre_grado' => $nombre_grado,
        'unidad_facturacion' => $unidad_facturacion,
        'descripcion_producto' => $descripcion_producto,
        'nombre_predio' => $nombre_predio,
        'tallos_ramo_ejemplo' => $tallos_ramo_ejemplo,
        'ramos_caja_ejemplo' => $ramos_caja_ejemplo,
        'precio_venta_ejemplo' => $precio_venta_ejemplo,
        'total_tallos_por_empaque' => $total_tallos_por_empaque,
        'total_tallos_empaque_completo' => $total_tallos_empaque_completo,
        'item_global' => $item_global
    ];

    $detalles[] = $detalle_item;
    $total_piezas += $cantidad_empaques;
}
$stmtDetalle->close();

if (count($detalles) === 0) {
    die(json_encode(["error" => "El pedido no tiene productos."]));
}

// 🔴 CONSULTA 3: INFORMACIÓN DE LA EMPRESA
$sqlEmpresa = "SELECT 
                'ALL SEASON FLOWERS SAS' AS empresa_nombre,
                '901.984.016-8' AS nit_empresa,
                'Finca Villa Clemencia Vrd. Prado' AS direccion_empresa,
                'Facatativa, Cundinamarca, Colombia' AS ciudad_empresa,
                '(+057) 3114677282 - 3023090940' AS telefono_empresa,
                'freshfloral.erikajulie@gmail.com' AS email_empresa,
                'REGISTRO ICA 123456' AS registro_ica
                FROM DUAL";

$stmtEmpresa = $enlace->prepare($sqlEmpresa);
$stmtEmpresa->execute();
$stmtEmpresa->bind_result(
    $empresa_nombre,
    $nit_empresa,
    $direccion_empresa,
    $ciudad_empresa,
    $telefono_empresa,
    $email_empresa,
    $registro_ica
);
$stmtEmpresa->fetch();
$stmtEmpresa->close();

// Clase PDF personalizada para etiquetas
class PDF_Etiqueta extends FPDF
{
    private $current_box = 0;
    private $total_boxes = 0;
    private $empresa_data = [];
    private $pedido_data = [];

    function setDatos($empresa, $pedido, $total_boxes)
    {
        $this->empresa_data = $empresa;
        $this->pedido_data = $pedido;
        $this->total_boxes = $total_boxes;
    }

    function Header()
    {
        // No header en cada página
    }

    function Footer()
    {
        // No footer en cada página
    }

    function generarEtiqueta($producto, $box_num)
    {
        // Desactivar el salto automático de página
        $this->SetAutoPageBreak(false, 0);
        // Configurar página para etiqueta
        $this->AddPage('P', array(80, 100));

        // Margen pequeño
        $this->SetMargins(1, 1, 1);

        // ========== ENCABEZADO DE LA EMPRESA ==========
        $this->SetFont('Helvetica', 'B', 9);
        $this->SetTextColor(0, 0, 0);

        // Logo
        $logo_path = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg";
        if (file_exists($logo_path)) {
            $this->Image($logo_path, 1, 9, 25);
        }

        // Nombre de la empresa
        $this->SetXY(25, 7);
        $this->Cell(25, 3, $this->empresa_data['nombre'], 0, 1, 'L');

        // Dirección de la empresa
        $this->SetFont('Helvetica', '', 7);
        $this->SetX(25);
        $this->Cell(25, 3, $this->empresa_data['direccion'], 0, 1, 'L');

        // Ciudad y país
        $this->SetX(25);
        $this->Cell(25, 3, $this->empresa_data['ciudad'], 0, 1, 'L');
        
        // Registro ICA
        $this->SetFont('Helvetica', 'B', 7);
        $this->SetX(25);
        $this->Cell(25, 3, $this->empresa_data['registro_ica'], 0, 1, 'L');

        // Email
        $this->SetFont('Helvetica', '', 7);
        $this->SetX(25);
        $this->Cell(25, 3, $this->empresa_data['email'], 0, 1, 'L');

        // Teléfono
        $this->SetX(25);
        $this->Cell(25, 3, 'Phone ' . $this->empresa_data['telefono'], 0, 1, 'L');
        
        // Línea separadora
        $this->SetLineWidth(0.3);
        $this->SetDrawColor(0, 0, 0);
        $this->Line(8, 26, 75, 26);

        // ========== INFORMACIÓN DEL CLIENTE ==========
        $this->SetFont('Helvetica', 'B', 8);
        $this->SetY(27);
        $this->Cell(15, 10, 'Client:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(0, 10, substr($this->pedido_data['cliente_nombre'], 0, 50), 0, 1, 'L');

        // AWB
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(15, 5, 'AWB:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(0, 5, !empty($this->pedido_data['awb']) ? $this->pedido_data['awb'] : 'N/A', 0, 1, 'L');

        // HAWB (AWB_HIJA)
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(15, 5, 'HAWB:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(0, 5, !empty($this->pedido_data['awb_hija']) ? $this->pedido_data['awb_hija'] : 'N/A', 0, 1, 'L');

        // PO (Purchase Order)
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(15, 5, 'P.O.:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $po_value = !empty($this->pedido_data['po_cliente']) ? $this->pedido_data['po_cliente'] : 'N_A';
        $this->Cell(0, 5, $po_value, 0, 1, 'L');

        // Código
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(15, 5, 'Code:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $code_value = !empty($producto['po_empaque']) ? $producto['po_empaque'] : 'N_A';
        $this->Cell(0, 5, 'Code 1.: ' . substr($code_value, 0, 15), 0, 1, 'L');

        // Línea separadora
        $this->SetLineWidth(0.3);
        $this->Line(8, 56, 75, 56);

        // ========== INFORMACIÓN DEL PRODUCTO ==========
        $this->SetY(56);

        // Packing (Tipo de empaque)
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(15, 5, 'Packing:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $packing_text = !empty($producto['descripcion_empaque']) ?
            $producto['descripcion_empaque'] :
            $producto['tipo_empaque'];
        $this->Cell(0, 5, $packing_text, 0, 1, 'L');

        // Product - Manejar múltiples productos
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(15, 5, 'Product:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 8);

        if ($producto['num_productos_empaque'] > 1) {
            // Si hay más de un producto, mostrar "Mix" o "Assorted"
            $this->Cell(0, 5, 'MIX / ASSORTED', 0, 1, 'L');

            // Opcional: Mostrar la cantidad de productos diferentes
            $this->SetFont('Helvetica', 'I', 7);
            $this->Cell(15, 3, '', 0, 0, 'L');
            $this->Cell(0, 3, '(' . $producto['num_productos_empaque'] . ' items)', 0, 1, 'L');
            $this->SetFont('Helvetica', '', 8);
        } else {
            // Si solo hay un producto, mostrar su nombre
            $this->Cell(0, 5, $producto['nombre_producto_ejemplo'], 0, 1, 'L');
        }

        // Variet (Variedad) - Manejar múltiples variedades
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(15, 5, 'Variet:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 8);

        if ($producto['num_productos_empaque'] > 1) {
            // Si hay múltiples productos, mostrar "Assorted"
            $this->Cell(0, 5, 'ASSORTED', 0, 1, 'L');
        } else {
            // Si solo hay una variedad
            $variety_text = !empty($producto['nombre_variedad_ejemplo']) ?
                $producto['nombre_variedad_ejemplo'] :
                'N/A';
            $this->Cell(0, 5, $variety_text, 0, 1, 'L');
        }

        // Grade
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(15, 5, 'Grade:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 8);

        if ($producto['num_productos_empaque'] > 1) {
            $this->Cell(0, 5, 'MIXED', 0, 1, 'L');
        } else {
            $grade_text = !empty($producto['nombre_grado']) ?
                $producto['nombre_grado'] :
                'N/A';
            $this->Cell(0, 5, $grade_text, 0, 1, 'L');
        }

        // Stems - Usar el total sumado de todos los productos
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(15, 5, 'Stems:', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(0, 5, $producto['total_tallos_por_empaque'], 0, 1, 'L');

        // Línea separadora gruesa
        $this->SetLineWidth(0.5);
        $this->SetDrawColor(0, 0, 0);
        $this->Line(8, 86, 75, 86);

        // ========== NÚMERO DE CAJA ==========
        $this->SetY(92);
        $this->SetFont('Helvetica', 'B', 12);
        $this->Cell(75, 5, 'BOX #  ' . $box_num . '   de   ' . $this->total_boxes, 0, 0, 'C');

        // Línea final en el borde inferior
        $this->SetLineWidth(0.2);
        $this->Line(5, 97, 75, 97);
    }
}

// Preparar datos para el PDF
$empresa_data = [
    'nombre' => $empresa_nombre,
    'direccion' => $direccion_empresa,
    'ciudad' => $ciudad_empresa,
    'registro_ica' => $registro_ica,
    'email' => $email_empresa,
    'telefono' => $telefono_empresa
];

$pedido_data = [
    'numero_pedido' => $numero_pedido,
    'cliente_nombre' => $cliente_nombre,
    'awb' => $awb,
    'awb_hija' => $awb_hija,
    'awb_nieta' => $awb_nieta,
    'po_cliente' => $po_cliente,
    'aerolinea' => $aerolinea,
    'agencia' => $agencia,
    'fecha_entrega' => $fecha_entrega
];

// Crear PDF
$pdf = new PDF_Etiqueta('P', 'mm', array(80, 100));
$pdf->SetMargins(1, 1, 1);
$pdf->setDatos($empresa_data, $pedido_data, $total_piezas);

// Generar etiquetas - VERSIÓN SIMPLIFICADA
$box_counter = 0;

// Eliminé la sección de $empaques_agrupados ya que ya está agrupado en la consulta
// Generar etiquetas directamente desde $detalles
foreach ($detalles as $producto_info) {
    // Generar una etiqueta por cada caja de este empaque
    for ($i = 1; $i <= $producto_info['cantidad_empaques']; $i++) {
        $box_counter++;
        $pdf->generarEtiqueta($producto_info, $box_counter);
    }
}

// Generar PDF
$nombre_archivo = 'Etiquetas_' . $numero_pedido . '.pdf';
$pdf->Output('I', $nombre_archivo);