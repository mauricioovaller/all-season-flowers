<?php
// Test script for PDF generation debug
// Access via: http://localhost/Proyectos_React/all-season-flowers/src/Api/pedidos/test_debug.php?numero=1

// Enable all error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '1');

echo "<pre>";
echo "=== PDF DEBUG TEST ===\n\n";

try {
    // Try to fetch planilla data using a test number
    echo "Step 1: Testing database connection...\n";

    require_once('../../config/AllSeasonFlowers/conexionbd.php');
    require_once('../../config/AllSeasonFlowers/empresa.php');

    if (!$enlace) {
        die("No database connection");
    }

    echo "✓ Database connected\n\n";

    // Test with a simple query
    echo "Step 2: Testing query...\n";
    $testQuery = "SELECT COUNT(*) as total FROM SAS_EncabPedido LIMIT 1";
    $result = $enlace->query($testQuery);
    if (!$result) {
        die("Query failed: " . $enlace->error);
    }
    $row = $result->fetch_assoc();
    echo "✓ Total pedidos: " . $row['total'] . "\n\n";

    // Get a real planilla number for testing
    echo "Step 3: Getting first planilla...\n";
    $query = "SELECT IdEncabPedido, NumeroplanillaCarga FROM SAS_EncabPedido LIMIT 1";
    $result = $enlace->query($query);

    if (!$result || $result->num_rows == 0) {
        die("No planillas found");
    }

    $row = $result->fetch_assoc();
    $testNumber = $row['NumeroplanillaCarga'];
    echo "✓ Using planilla: " . $testNumber . "\n\n";

    // Now try to generate the PDF
    echo "Step 4: Including PDF class...\n";
    define('FPDF_PATH', dirname(__FILE__) . '/../../');
    require_once(FPDF_PATH . 'node_modules/fpdf/fpdf.php');
    echo "✓ FPDF loaded\n\n";

    echo "Step 5: Testing safeUtf8Decode function...\n";

    function safeUtf8Decode($value)
    {
        if ($value === null || $value === '') {
            return '';
        }
        return utf8_decode((string)$value);
    }

    $testStr = "Nombre con ñ: José";
    $encoded = utf8_encode($testStr);
    $decoded = safeUtf8Decode($encoded);
    echo "✓ Test string decoded: $decoded\n\n";

    echo "Step 6: Attempting PDF generation...\n";

    // Call the actual PDF generation
    include('ApiGenerarPDFPlanilla.php');

    echo "✓ PDF generation completed\n";
} catch (Exception $e) {
    echo "\n❌ EXCEPTION CAUGHT:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
} catch (Error $e) {
    echo "\n❌ ERROR CAUGHT:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}

echo "</pre>";
