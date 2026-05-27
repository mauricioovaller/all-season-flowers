<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

$fechaInicio = $data["fechaInicio"] ?? date("Y-m-01");
$fechaFin = $data["fechaFin"] ?? date("Y-m-d");
$nivel = intval($data["nivel"] ?? 1);

try {
    // ========================================================================
    // 1. ENTRADAS: COMPRAS (sin devolución, no anuladas)
    // ========================================================================
    $sqlCompras = "SELECT
        dp.IdProducto,
        IFNULL(dp.IdVariedad, 0) AS IdVariedad,
        IFNULL(dp.IdGrado, 0) AS IdGrado,
        SUM(IF(dp.IdUnidad = 4, de.Cantidad * dp.Ramos_Caja * dp.Tallos_Ramo, de.Cantidad * dp.Ramos_Caja)) AS tallos,
        ec.FechaEntrega AS fecha,
        'Compra' AS tipoDocumento,
        CONCAT('COMP-', LPAD(ec.IdEncabCompra, 6, '0')) AS numeroDocumento
    FROM SAS_EncabCompra ec
    INNER JOIN SAS_DetEmpaqueCompra de ON de.IdEncabCompra = ec.IdEncabCompra
    INNER JOIN SAS_DetProductoCompra dp ON dp.IdDetEmpaque = de.IdDetEmpaque
    WHERE ec.Anulado = 0
      AND (ec.IdDevolucion IS NULL OR ec.IdDevolucion = 0)
      AND ec.FechaEntrega >= ?
      AND ec.FechaEntrega <= ?
    GROUP BY dp.IdProducto, IdVariedad, IdGrado, ec.IdEncabCompra";

    $stmt = $enlace->prepare($sqlCompras);
    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $stmt->bind_result($idProd, $idVar, $idGra, $tallos, $fecha, $tipoDoc, $numDoc);

    $movimientos = [];
    $totalEntradas = 0;
    $totalSalidas = 0;

    while ($stmt->fetch()) {
        $movimientos[] = [
            "idProducto" => $idProd,
            "idVariedad" => $idVar,
            "idGrado" => $idGra,
            "tallos" => $tallos,
            "direccion" => "entrada",
            "fecha" => $fecha,
            "tipoDocumento" => $tipoDoc,
            "numeroDocumento" => $numDoc,
        ];
        $totalEntradas += $tallos;
    }
    $stmt->close();

    // ========================================================================
    // 2. ENTRADAS: DEVOLUCIONES VENTAS (solo clientes Colombia)
    // ========================================================================
    $sqlDevVentas = "SELECT
        dp.IdProducto,
        IFNULL(dp.IdVariedad, 0) AS IdVariedad,
        IFNULL(dp.IdGrado, 0) AS IdGrado,
        SUM(IFNULL(dp.TallosDevolucion, 0)) AS tallos,
        ep.FechaDevolucion AS fecha,
        'Devolución Venta' AS tipoDocumento,
        CONCAT('PED-', LPAD(ep.IdEncabPedido, 6, '0')) AS numeroDocumento
    FROM SAS_EncabPedido ep
    INNER JOIN GEN_Clientes c ON ep.IdCliente = c.IdCliente
    INNER JOIN SAS_DetEmpaque de ON de.IdEncabPedido = ep.IdEncabPedido
    INNER JOIN SAS_DetProducto dp ON dp.IdDetEmpaque = de.IdDetEmpaque
    WHERE ep.IdDevolucion IS NOT NULL AND ep.IdDevolucion > 0
      AND c.PAIS = 'Colombia'
      AND ep.FechaDevolucion >= ?
      AND ep.FechaDevolucion <= ?
    GROUP BY dp.IdProducto, IdVariedad, IdGrado, ep.IdEncabPedido";

    $stmt = $enlace->prepare($sqlDevVentas);
    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $stmt->bind_result($idProd, $idVar, $idGra, $tallos, $fecha, $tipoDoc, $numDoc);

    while ($stmt->fetch()) {
        $movimientos[] = [
            "idProducto" => $idProd,
            "idVariedad" => $idVar,
            "idGrado" => $idGra,
            "tallos" => $tallos,
            "direccion" => "entrada",
            "fecha" => $fecha,
            "tipoDocumento" => $tipoDoc,
            "numeroDocumento" => $numDoc,
        ];
        $totalEntradas += $tallos;
    }
    $stmt->close();

    // ========================================================================
    // 3. SALIDAS: PEDIDOS (sin devolución, no anulados)
    // ========================================================================
    $sqlPedidos = "SELECT
        dp.IdProducto,
        IFNULL(dp.IdVariedad, 0) AS IdVariedad,
        IFNULL(dp.IdGrado, 0) AS IdGrado,
        SUM(IF(dp.IdUnidad = 4, de.Cantidad * dp.Ramos_Caja * dp.Tallos_Ramo, de.Cantidad * dp.Ramos_Caja)) AS tallos,
        ep.FechaEntrega AS fecha,
        'Pedido' AS tipoDocumento,
        CONCAT('PED-', LPAD(ep.IdEncabPedido, 6, '0')) AS numeroDocumento
    FROM SAS_EncabPedido ep
    INNER JOIN SAS_DetEmpaque de ON de.IdEncabPedido = ep.IdEncabPedido
    INNER JOIN SAS_DetProducto dp ON dp.IdDetEmpaque = de.IdDetEmpaque
    WHERE ep.Anulado = 0
      AND (ep.IdDevolucion IS NULL OR ep.IdDevolucion = 0)
      AND ep.FechaEntrega >= ?
      AND ep.FechaEntrega <= ?
    GROUP BY dp.IdProducto, IdVariedad, IdGrado, ep.IdEncabPedido";

    $stmt = $enlace->prepare($sqlPedidos);
    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $stmt->bind_result($idProd, $idVar, $idGra, $tallos, $fecha, $tipoDoc, $numDoc);

    while ($stmt->fetch()) {
        $movimientos[] = [
            "idProducto" => $idProd,
            "idVariedad" => $idVar,
            "idGrado" => $idGra,
            "tallos" => $tallos,
            "direccion" => "salida",
            "fecha" => $fecha,
            "tipoDocumento" => $tipoDoc,
            "numeroDocumento" => $numDoc,
        ];
        $totalSalidas += $tallos;
    }
    $stmt->close();

    // ========================================================================
    // 4. SALIDAS: DEVOLUCIONES COMPRAS
    // ========================================================================
    $sqlDevCompras = "SELECT
        dp.IdProducto,
        IFNULL(dp.IdVariedad, 0) AS IdVariedad,
        IFNULL(dp.IdGrado, 0) AS IdGrado,
        SUM(IFNULL(dp.TallosDevolucion, 0)) AS tallos,
        ec.FechaDevolucion AS fecha,
        'Devolución Compra' AS tipoDocumento,
        CONCAT('COMP-', LPAD(ec.IdEncabCompra, 6, '0')) AS numeroDocumento
    FROM SAS_EncabCompra ec
    INNER JOIN SAS_DetEmpaqueCompra de ON de.IdEncabCompra = ec.IdEncabCompra
    INNER JOIN SAS_DetProductoCompra dp ON dp.IdDetEmpaque = de.IdDetEmpaque
    WHERE ec.IdDevolucion IS NOT NULL AND ec.IdDevolucion > 0
      AND ec.FechaDevolucion >= ?
      AND ec.FechaDevolucion <= ?
    GROUP BY dp.IdProducto, IdVariedad, IdGrado, ec.IdEncabCompra";

    $stmt = $enlace->prepare($sqlDevCompras);
    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $stmt->bind_result($idProd, $idVar, $idGra, $tallos, $fecha, $tipoDoc, $numDoc);

    while ($stmt->fetch()) {
        $movimientos[] = [
            "idProducto" => $idProd,
            "idVariedad" => $idVar,
            "idGrado" => $idGra,
            "tallos" => $tallos,
            "direccion" => "salida",
            "fecha" => $fecha,
            "tipoDocumento" => $tipoDoc,
            "numeroDocumento" => $numDoc,
        ];
        $totalSalidas += $tallos;
    }
    $stmt->close();

    // ========================================================================
    // 5. SALIDAS: BAJAS
    // ========================================================================
    $sqlBajas = "SELECT
        db.IdProducto,
        IFNULL(db.IdVariedad, 0) AS IdVariedad,
        IFNULL(db.IdGrado, 0) AS IdGrado,
        SUM(db.Tallos) AS tallos,
        eb.Fecha AS fecha,
        'Baja' AS tipoDocumento,
        CONCAT('BAJA-', LPAD(eb.IdEncabBaja, 6, '0')) AS numeroDocumento
    FROM SAS_EncabBaja eb
    INNER JOIN SAS_DetBaja db ON db.IdEncabBaja = eb.IdEncabBaja
    WHERE eb.Anulado = 0
      AND eb.Fecha >= ?
      AND eb.Fecha <= ?
    GROUP BY db.IdProducto, IdVariedad, IdGrado, eb.IdEncabBaja";

    $stmt = $enlace->prepare($sqlBajas);
    $stmt->bind_param("ss", $fechaInicio, $fechaFin);
    $stmt->execute();
    $stmt->bind_result($idProd, $idVar, $idGra, $tallos, $fecha, $tipoDoc, $numDoc);

    while ($stmt->fetch()) {
        $movimientos[] = [
            "idProducto" => $idProd,
            "idVariedad" => $idVar,
            "idGrado" => $idGra,
            "tallos" => $tallos,
            "direccion" => "salida",
            "fecha" => $fecha,
            "tipoDocumento" => $tipoDoc,
            "numeroDocumento" => $numDoc,
        ];
        $totalSalidas += $tallos;
    }
    $stmt->close();

    // ========================================================================
    // 6. DATOS DE PRODUCTOS, VARIEDADES Y GRADOS
    // ========================================================================
    $productosMap = [];
    $sqlP = "SELECT IdProducto, NOMPRODUCTO, CODPRODUCTO FROM GEN_Productos";
    $stmtP = $enlace->prepare($sqlP);
    $stmtP->execute();
    $stmtP->bind_result($idP, $nomP, $codP);
    while ($stmtP->fetch()) {
        $productosMap[$idP] = ["nombre" => $nomP, "codigo" => $codP];
    }
    $stmtP->close();

    $variedadesMap = [];
    $sqlV = "SELECT IdVariedad, IdProducto, NOMVARIEDAD FROM GEN_Variedades";
    $stmtV = $enlace->prepare($sqlV);
    $stmtV->execute();
    $stmtV->bind_result($idV, $idProdV, $nomV);
    while ($stmtV->fetch()) {
        $variedadesMap[$idV] = ["idProducto" => $idProdV, "nombre" => $nomV];
    }
    $stmtV->close();

    $gradosMap = [];
    $sqlG = "SELECT IdGrado, IdProducto, NOMGRADO FROM GEN_Grados";
    $stmtG = $enlace->prepare($sqlG);
    $stmtG->execute();
    $stmtG->bind_result($idG, $idProdG, $nomG);
    while ($stmtG->fetch()) {
        $gradosMap[$idG] = ["idProducto" => $idProdG, "nombre" => $nomG];
    }
    $stmtG->close();

    $enlace->close();

    // ========================================================================
    // 7. AGRUPAR POR NIVEL
    // ========================================================================
    $grupos = [];

    foreach ($movimientos as $m) {
        $key = "";
        if ($nivel == 1) {
            $key = "p" . $m["idProducto"];
        } elseif ($nivel == 2) {
            $key = "p" . $m["idProducto"] . "_v" . $m["idVariedad"];
        } else {
            $key = "p" . $m["idProducto"] . "_v" . $m["idVariedad"] . "_g" . $m["idGrado"];
        }

        if (!isset($grupos[$key])) {
            $prodInfo = $productosMap[$m["idProducto"]] ?? ["nombre" => "Desconocido", "codigo" => ""];
            $varInfo = ($m["idVariedad"] > 0 && isset($variedadesMap[$m["idVariedad"]]))
                ? $variedadesMap[$m["idVariedad"]]["nombre"] : null;
            $graInfo = ($m["idGrado"] > 0 && isset($gradosMap[$m["idGrado"]]))
                ? $gradosMap[$m["idGrado"]]["nombre"] : null;

            $grupos[$key] = [
                "idProducto" => $m["idProducto"],
                "producto" => $prodInfo["nombre"],
                "codigoProducto" => $prodInfo["codigo"],
                "idVariedad" => $m["idVariedad"] > 0 ? $m["idVariedad"] : null,
                "variedad" => $varInfo,
                "idGrado" => $m["idGrado"] > 0 ? $m["idGrado"] : null,
                "grado" => $graInfo,
                "entradas" => 0,
                "salidas" => 0,
                "saldo" => 0,
                "movimientos" => [],
            ];
        }

        $tallos = $m["tallos"];
        if ($m["direccion"] === "entrada") {
            $grupos[$key]["entradas"] += $tallos;
        } else {
            $grupos[$key]["salidas"] += $tallos;
        }

        $grupos[$key]["movimientos"][] = [
            "fecha" => $m["fecha"],
            "tipoDocumento" => $m["tipoDocumento"],
            "numeroDocumento" => $m["numeroDocumento"],
            "tallos" => $tallos,
            "direccion" => $m["direccion"],
        ];
    }

    // Calcular saldos y ordenar
    $inventarios = [];
    foreach ($grupos as $g) {
        $g["saldo"] = $g["entradas"] - $g["salidas"];
        $inventarios[] = $g;
    }

    usort($inventarios, function ($a, $b) {
        return strcmp($a["producto"], $b["producto"]);
    });

    echo json_encode([
        "success" => true,
        "nivel" => $nivel,
        "fechaInicio" => $fechaInicio,
        "fechaFin" => $fechaFin,
        "inventarios" => $inventarios,
        "resumen" => [
            "totalEntradas" => $totalEntradas,
            "totalSalidas" => $totalSalidas,
            "totalSaldo" => $totalEntradas - $totalSalidas,
        ],
    ]);

} catch (Exception $e) {
    if (isset($enlace)) $enlace->close();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>
