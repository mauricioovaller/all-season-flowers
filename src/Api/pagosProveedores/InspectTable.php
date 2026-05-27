<?php
header("Content-Type: text/plain; charset=UTF-8");
require_once __DIR__ . '/../config/empresa.php';
require_once CONEXION_BD_PATH;

$tablas = [
    'SAS_EncabPagoProveedor',
    'SAS_DetPagoProveedor',
    'SAS_DetProductoCompra',
    'SAS_EncabCompra',
    'GEN_Proveedores',
    'GEN_Monedas',
    'GEN_MedioPagos'
];

foreach ($tablas as $tabla) {
    $result = $enlace->query("DESCRIBE `$tabla`");
    if ($result) {
        echo "=== $tabla ===\n";
        while ($row = $result->fetch_assoc()) {
            $pk = ($row['Key'] === 'PRI') ? ' [PK]' : '';
            echo "  " . $row['Field'] . " (" . $row['Type'] . ")" . $pk . "\n";
        }
        echo "\n";
    } else {
        echo "=== $tabla === ERROR: " . $enlace->error . "\n\n";
    }
}

$enlace->close();
?>
