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

// Verificar si se recibió el número de fitosanitario
if (!isset($input['numeroFitosanitario']) || empty($input['numeroFitosanitario'])) {
    die(json_encode(["error" => "Número de fitosanitario no válido."]));
}

$numeroFito = intval($input['numeroFitosanitario']);

// 🔴 CONSULTA 1: DATOS DEL PEDIDO Y FITOSANITARIO
$sqlPedido = "SELECT
                enc.IdEncabPedido,
                CONCAT('ASF-', LPAD(enc.IdEncabPedido, 6, '0')) AS numero_pedido,
                enc.NoFito,
                CONCAT('FITO-', LPAD(enc.NoFito, 4, '0')) AS numero_fitosanitario,
                enc.FechaVigenciaInicial,
                enc.FechaVigenciaFinal,
                DATE_FORMAT(enc.FechaEntrega, '%d/%m/%Y') AS fecha_despacho,
                cli.NOMBRE AS cliente_nombre,
                cli.NIT AS cliente_nit,
                cli.Direc1 AS direccion_cliente,
                cli.CIUDAD AS ciudad_cliente,
                cli.ESTADO AS estado_cliente,
                cli.PAIS AS pais_cliente,
                cli.TEL1 AS telefono_cliente,
                enc.PO_Cliente,
                enc.AWB,
                COALESCE(aer.NOMAEROLINEA, 'UNITED PARCEL SERVICE') AS aerolinea,
                COALESCE(age.NOMAGENCIA, 'K&M Handling') AS agencia,
                enc.PuertoSalida
            FROM
                SAS_EncabPedido enc 
            INNER JOIN GEN_Clientes cli ON enc.IdCliente = cli.IdCliente
            LEFT JOIN GEN_Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
            LEFT JOIN GEN_Agencias age ON enc.IdAgencia = age.IdAgencia
            WHERE
                enc.NoFito = ?";

$stmtPedido = $enlace->prepare($sqlPedido);
$stmtPedido->bind_param("i", $numeroFito);
$stmtPedido->execute();
$stmtPedido->bind_result(
    $idEncabPedido,
    $numero_pedido,
    $noFito,
    $numero_fitosanitario,
    $fechaVigenciaInicial,
    $fechaVigenciaFinal,
    $fecha_despacho,
    $cliente_nombre,
    $cliente_nit,
    $direccion_cliente,
    $ciudad_cliente,
    $estado_cliente,
    $pais_cliente,
    $telefono_cliente,
    $po_cliente,
    $awb,
    $aerolinea,
    $agencia,
    $puerto_salida
);

if (!$stmtPedido->fetch()) {
    die(json_encode(["error" => "Fitosanitario no encontrado."]));
}
$stmtPedido->close();

// 🔴 CONSULTA 2: DATOS DE LOS PRODUCTOS DEL PEDIDO
$sqlProductos = "SELECT
                    pro.NOMPRODUCTO AS nombre_producto,
                    var.NOMVARIEDAD AS nombre_variedad,
                    gra.NOMGRADO AS nombre_grado,
                    COUNT(DISTINCT dem.IdDetEmpaque) AS num_cajas,
                    SUM(dem.Cantidad) AS total_piezas,
                    SUM(dpr.Tallos_Ramo * dpr.Ramos_Caja * dem.Cantidad) AS total_tallos
                FROM
                    SAS_DetEmpaque dem
                INNER JOIN SAS_DetProducto dpr ON dem.IdDetEmpaque = dpr.IdDetEmpaque
                INNER JOIN GEN_Productos pro ON dpr.IdProducto = pro.IdProducto
                LEFT JOIN GEN_Variedades var ON dpr.IdVariedad = var.IdVariedad
                LEFT JOIN GEN_Grados gra ON dpr.IdGrado = gra.IdGrado
                WHERE
                    dem.IdEncabPedido = ?
                GROUP BY
                    pro.NOMPRODUCTO, var.NOMVARIEDAD, gra.NOMGRADO
                ORDER BY
                    pro.NOMPRODUCTO";

$stmtProductos = $enlace->prepare($sqlProductos);
$stmtProductos->bind_param("i", $idEncabPedido);
$stmtProductos->execute();
$stmtProductos->bind_result(
    $nombre_producto,
    $nombre_variedad,
    $nombre_grado,
    $num_cajas,
    $total_piezas,
    $total_tallos
);

$productos = [];
$total_cajas_pedido = 0;
$total_tallos_pedido = 0;

while ($stmtProductos->fetch()) {
    $producto = [
        'nombre' => $nombre_producto,
        'variedad' => $nombre_variedad,
        'grado' => $nombre_grado,
        'cajas' => $num_cajas,
        'piezas' => $total_piezas,
        'tallos' => $total_tallos
    ];
    $productos[] = $producto;

    $total_cajas_pedido += $num_cajas;
    $total_tallos_pedido += $total_tallos;
}
$stmtProductos->close();

// 🔴 CONSULTA 3: DATOS FIJOS DE LA EMPRESA E INSPECTOR
$sqlEmpresa = "SELECT 
                'ALL SEASON FLOWERS SAS' AS empresa_nombre,
                '901.984.016-8' AS nit_empresa,
                'Finca Villa Clemencia Vrd. Prado' AS direccion_empresa,
                'Facatativa, Cundinamarca, Colombia' AS ciudad_empresa,
                '(+057) 3114677282 - 3023090940' AS telefono_empresa,
                'freshfloral.erikajulie@gmail.com' AS email_empresa,
                'REGISTRO ICA 123456' AS registro_ica,
                'JULIO ALBERTO RODRIGUEZ RODRIGUEZ' AS inspector_nombre,
                '79.501.299' AS inspector_cc,
                '16.661' AS inspector_tp,
                '2500496' AS inspector_reg_sv
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
    $registro_ica,
    $inspector_nombre,
    $inspector_cc,
    $inspector_tp,
    $inspector_reg_sv
);
$stmtEmpresa->fetch();
$stmtEmpresa->close();

// 🔴 CONSULTA 4: DATOS DE CULTIVO (por ahora fijos)
$sqlCultivo = "SELECT 
                'ALL SEASON FLOWERS SAS' AS cultivo_nombre,
                'BIC 252440' AS cultivo_registro_ica,
                'INDEFINIDO' AS cultivo_vencimiento
                FROM DUAL";

$stmtCultivo = $enlace->prepare($sqlCultivo);
$stmtCultivo->execute();
$stmtCultivo->bind_result(
    $cultivo_nombre,
    $cultivo_registro_ica,
    $cultivo_vencimiento
);
$stmtCultivo->fetch();
$stmtCultivo->close();

// Clase PDF personalizada para fitosanitario
class PDF_Fitosanitario extends FPDF
{
    function Header()
    {
        global $numero_fitosanitario, $fechaVigenciaInicial;

        // Logo
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg", 20, 10, 65);
        // Configurar fuente
        $this->SetFont('Helvetica', '', 8);

        // NIT y datos empresa (parte superior izquierda)
        $this->SetX(110);
        $this->Cell(100, 4, 'NIT. 901.984.016-8', 0, 1, 'C');
        $this->SetX(110);
        $this->Cell(100, 4, 'Finca Villa Clemencia Vrd. Prado', 0, 1, 'C');
        $this->SetX(110);
        $this->Cell(100, 4, 'Cels. 3114677282 - 3023090940', 0, 1, 'C');
        $this->SetX(110);
        $this->Cell(100, 4, 'Facatativa, Cundinamarca, Colombia', 0, 1, 'C');
        $this->SetX(110);
        $this->Cell(100, 4, 'No.: ' . $numero_fitosanitario, 0, 1, 'C');

        // Título centrado
        $this->SetFont('Helvetica', 'B', 8);
        $this->SetX(110);
        $this->MultiCell(100, 5, 'CONSTANCIA FITOSANITARIA DE MATERIAL VEGETAL DE ORNAMENTALES', 1, 'C');


        // Fecha centrada
        $this->SetFont('Helvetica', 'B', 8);
        $this->SetX(110);
        $fecha_formateada = date('d/m/Y', strtotime($fechaVigenciaInicial));
        $this->Cell(50, 6, 'FECHA ', 1, 0, 'C');
        $this->Cell(50, 6,  $fecha_formateada, 1, 1, 'C');

        // Línea separadora
        //$this->Line(10, 46, 200, 46);

        $this->Ln(5);
    }

    function Footer()
    {
         global $inspector_nombre, $inspector_cc, $inspector_tp, $inspector_reg_sv, $fechaVigenciaInicial, $fechaVigenciaFinal;
        
        // Pie de página
        $this->SetY(-120);

        $this->SetFont('Helvetica', '', 9);
        $this->MultiCell(200, 5, utf8_decode('EL SUSCRITO ASISTENTE TÉCNICO CERTIFICA QUE LAS PLANTAS O CARGAMENTO DESCRITOS ARRIBA SE HAN INSPECCIONADO DE ACUERDO CON LOS PROCEDIMIENTOS ORDENADOS Y SE CONSIDERAN EXENTOS DE PLAGAS CUARENTENARIAS Y SE ENCUENTRA APARENTEMENTE LIBRE DE OTROS ORGANISMOS DAÑINOS.'), 1, 'L');

        // Tabla de datos del inspector
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(100, 6, utf8_decode('DATOS ASISTENTE TÉCNICO'), 'LTR', 0);
        $this->Cell(100, 6, 'VALIDEZ (DOS DIAS)', 'LTR', 1, 'C');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(25, 5, 'NOMBRE:', 'L', 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(75, 5, $inspector_nombre, 'R', 0, 'L');
        $fecha_inicio = date('d/m/Y', strtotime($fechaVigenciaInicial));
        $this->Cell(15, 5, '', 'L', 0, 'L');
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'DESDE EL DIA', 0, 0, 'L');
        $this->Cell(55, 5, $fecha_inicio, 'R', 1, 'L');

        $this->Cell(25, 5, 'CC No.:', 'L', 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(75, 5, $inspector_cc, 'R', 0, 'L');
        $fecha_fin = date('d/m/Y', strtotime($fechaVigenciaFinal));
        $this->Cell(15, 5, '', 'L', 0, 'L');
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'HASTA EL DIA', 0, 0, 'L');
        $this->Cell(55, 5, $fecha_fin, 'R', 1, 'L');

        $this->Cell(25, 5, 'TP No.:', 'L', 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(75, 5, $inspector_tp, 'R', 0, 'L');
        $this->Cell(100, 5, '', 'LR', 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(25, 5, 'REG. SV:', 'L', 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(75, 5, $inspector_reg_sv, 'R', 0, 'L');
        $this->Cell(100, 5, '', 'LR', 1, 'L');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(100, 10, 'FIRMA', 'LBR', 0, 'C');
        $this->Cell(100, 10, '', 'LBR', 1, 'L');         

        $this->SetFont('Helvetica', 'B', 10);
        $this->MultiCell(200, 6, 'ESTA CONSTANCIA SE EXPIDE Y DILIGENCIA EN CUMPLIMIENTO DE LO DISPUESTO EN LA RESOLUCION No 063625 DEL 12 DE MARZO DE 2020, DEL ICA. CUALQUIER ENMENDADURA ANULA LA VALIDEZ DEL MISMO. VALIDO SOLO PARA COLOMBIA ', 1, 'L');
        $this->MultiCell(200, 12, 'OBSERVACIONES :', 1, 'L');
        $this->Cell(200, 6, 'FECHA DE RECIBO', 'LR', 1, 'L');
        $this->Cell(25, 6, 'DIA', 'L', 0, 'L');
        $this->Cell(40, 6, '', 'B', 0);
        $this->Cell(25, 6, 'MES', 0, 0, 'L');
        $this->Cell(40, 6, '', 'B', 0, 'L');
        $this->Cell(30, 6, 'AÑO', 0, 0, 'L');
        $this->Cell(40, 6, '', 'BR', 1, 'L');
        $this->Cell(200, 3, '', 'LBR', 1);
        $this->Cell(200, 3, '', 'LR', 1, 'L');
        $this->Cell(25, 6, 'NOMBRE', 'L', 0, 'L');
        $this->Cell(75, 6, '', 'B', 0);
        $this->Cell(25, 6, 'FIRMA', 0, 0, 'L');
        $this->Cell(75, 6, '', 'BR', 1);
        $this->Cell(200, 3, '', 'LBR', 1);
    }

    function agregarSeccionDestinatario($cliente_nombre, $cliente_nit, $direccion_cliente, $ciudad_cliente, $telefono_cliente, $pais_cliente, $puerto_salida)
    {
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'DATOS DEL DESTINATARIO', 'LT', 0);
        $this->Cell(70, 5, '', 'TR', 0);
        $this->Cell(30, 5, '', 'T', 0);
        $this->Cell(70, 5, '', 'TR', 1);
        $this->Cell(30, 5, 'RAZON SOCIAL', 'L', 0, 'L');
        $this->Cell(70, 5, $cliente_nombre, 'R', 0, 'L');
        $this->Cell(40, 5, 'PUERTO DE ENTRADA', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(60, 5, $puerto_salida ?: 'BOGOTA - COLOMBIA', 'R', 1, 'L');
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'NIT', 'L', 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(70, 5, $cliente_nit, 'R', 0, 'L');
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(40, 5, 'PAIS', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(60, 5, $pais_cliente ?: 'ESTADOS UNIDOS', 'R', 1, 'L');
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'DIRECCION', 'L', 0, 'L');
        $direccion_completa = $direccion_cliente . ' ' . $ciudad_cliente;
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(70, 5, substr($direccion_completa, 0, 40), 'R', 0, 'L');
        $this->Cell(30, 5, '', 0, 0);
        $this->Cell(70, 5, '', 'R', 1);
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 5, 'TELEFONO', 'LB', 0, 'L');
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(70, 5, $telefono_cliente, 'BR', 0, 'L');
        $this->Cell(30, 5, '', 'B', 0);
        $this->Cell(70, 5, '', 'BR', 1);

        $this->Ln(5);
    }

    function agregarSeccionExportadorCultivo($empresa_nombre, $nit_empresa, $cultivo_nombre, $cultivo_registro_ica, $cultivo_vencimiento)
    {
        // Sección exportador y cultivo
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(40, 5, 'DATOS DEL EXPORTADOR', 'LT', 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(60, 5, $empresa_nombre, 'TR', 0, 'L');
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(40, 5, 'DATOS DEL CULTIVO', 'T', 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(60, 5, $cultivo_nombre, 'TR', 1, 'L');
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(40, 5, 'NO REGISTRO ICA', 'L', 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(60, 5, 'BIC 252440', 'R', 0, 'L');
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(40, 5, 'NO REGISTRO ICA', 0, 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(60, 5, $cultivo_registro_ica, 'R', 1, 'L');
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(40, 5, 'FECHA DE VENCIMIENTO', 'LB', 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(60, 5, 'INDEFINIDO', 'BR', 0, 'L');
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(40, 5, 'FECHA DE VENCIMIENTO', 'B', 0, 'L');
        $this->SetFont('Helvetica', '', 8);
        $this->Cell(60, 5, $cultivo_vencimiento, 'BR', 1, 'L');

        $this->Ln(5);
    }

    function agregarTablaCargamento($productos, $fecha_despacho, $agencia_carga, $total_cajas, $total_tallos)
    {
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(200, 6, 'DESCRIPCION DEL CARGAMENTO', 1, 1, 'C');
        $this->SetFont('Helvetica', '', 8);



        // Encabezados de la tabla
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(55, 6, 'ESPECIE', 1, 0, 'C');
        $this->Cell(30, 6, 'NUMERO DE CAJAS', 1, 0, 'C');
        $this->Cell(35, 6, 'FECHA DE DESPACHO', 1, 0, 'C');
        $this->Cell(50, 6, 'AGENCIA DE CARGA', 1, 0, 'C');
        $this->Cell(30, 6, 'NUMERO DE TALLOS', 1, 1, 'C');

        $this->SetFont('Helvetica', '', 8);

        // Agrupar productos similares
        $productos_agrupados = [];
        foreach ($productos as $producto) {
            $key = $producto['nombre'] . '|' . $producto['variedad'];
            if (!isset($productos_agrupados[$key])) {
                $productos_agrupados[$key] = [
                    'nombre' => $producto['nombre'],
                    'variedad' => $producto['variedad'],
                    'cajas' => 0,
                    'tallos' => 0
                ];
            }
            $productos_agrupados[$key]['cajas'] += $producto['cajas'];
            $productos_agrupados[$key]['tallos'] += $producto['tallos'];
        }

        // Mostrar productos agrupados
        foreach ($productos_agrupados as $producto) {
            $this->Cell(55, 6, substr($producto['nombre'] . ' ' . $producto['variedad'], 0, 25), 1, 0, 'L');
            $this->Cell(30, 6, number_format($producto['cajas'], 2), 1, 0, 'C');
            $this->Cell(35, 6, $fecha_despacho, 1, 0, 'C');
            $this->Cell(50, 6, $agencia_carga ?: 'APOLLO FREIGHT SERVICES COL', 1, 0, 'L');
            $this->Cell(30, 6, number_format($producto['tallos']), 1, 1, 'C');
        }

        // Fila de totales
        $this->SetFont('Helvetica', 'B', 8);
        $this->Cell(55, 6, 'TOTAL', 1, 0, 'L');
        $this->Cell(30, 6, number_format($total_cajas, 2), 1, 0, 'C');
        $this->Cell(35, 6, '', 1, 0, 'C');
        $this->Cell(50, 6, '', 1, 0, 'C');
        $this->Cell(30, 6, number_format($total_tallos), 1, 1, 'C');

        $this->Ln(5);
    }

    function agregarDeclaracion()
    {
        
    }

    function agregarSeccionInspector($inspector_nombre, $inspector_cc, $inspector_tp, $inspector_reg_sv, $fechaVigenciaInicial, $fechaVigenciaFinal)
    {
        
    }
}

// Crear PDF
$pdf = new PDF_Fitosanitario('P', 'mm', 'LETTER');
$pdf->SetMargins(10, 10, 10);
$pdf->AddPage();

// Agregar secciones
$pdf->agregarSeccionDestinatario(
    $cliente_nombre,
    $cliente_nit,
    $direccion_cliente,
    $ciudad_cliente,
    $telefono_cliente,
    $pais_cliente,
    $puerto_salida
);

$pdf->agregarSeccionExportadorCultivo(
    $empresa_nombre,
    $nit_empresa,
    $cultivo_nombre,
    $cultivo_registro_ica,
    $cultivo_vencimiento
);

$pdf->agregarTablaCargamento(
    $productos,
    $fecha_despacho,
    $agencia,
    $total_cajas_pedido,
    $total_tallos_pedido
);

$pdf->agregarDeclaracion();

$pdf->agregarSeccionInspector(
    $inspector_nombre,
    $inspector_cc,
    $inspector_tp,
    $inspector_reg_sv,
    $fechaVigenciaInicial,
    $fechaVigenciaFinal
);


// Generar PDF como Blob
$pdfContent = $pdf->Output('S'); // 'S' retorna el PDF como string

// Configurar headers para retornar Blob
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="Fitosanitario_' . $numero_fitosanitario . '.pdf"');
header('Content-Length: ' . strlen($pdfContent));

// Enviar el PDF
echo $pdfContent;
