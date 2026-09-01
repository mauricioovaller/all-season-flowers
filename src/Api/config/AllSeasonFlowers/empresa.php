<?php
// src/Api/config/empresa.php
// ─────────────────────────────────────────────────────────────────────────────
// Datos de la empresa que se imprimen en los PDFs.
// Para adaptar la app a otro cliente, solo cambie los valores de este archivo.
// Todos los PHP de generación de PDFs hacen require_once de este archivo.
// ─────────────────────────────────────────────────────────────────────────────

// ── Identidad ────────────────────────────────────────────────────────────────
define('EMPRESA_NOMBRE',            'ALL SEASON FLOWERS SAS');
define('EMPRESA_NOMBRE_CORTO',      'ALL SEASON FLOWERS');
define('EMPRESA_NOMBRE_TITULO',     'All Season Flowers');      // Para título de pestaña y header
define('EMPRESA_LEMA',              'Flowers & Ornamentals');   // Eslogan
define('EMPRESA_INICIALES',         'AS');                      // Iniciales para sidebar
define('EMPRESA_NIT',               '901.984.016-8');
define('EMPRESA_REPRESENTANTE',     'ERIKA JULEY GONZALEZ CHINGATE');
define('EMPRESA_CC_REPRESENTANTE',  '1.073.525.441');
define('EMPRESA_PREFIJO_INVOICE',  'ASF');

// ── ICA / Fitosanitario ───────────────────────────────────────────────────────
define('EMPRESA_REGISTRO_ICA',      'REGISTRO ICA EXP250201');
define('EMPRESA_CULTIVO_REG_ICA',   'EXP250201');
define('INSPECTOR_NOMBRE',          'JOSE YAIR FONSECA CAMACHO');
define('INSPECTOR_CC',              '1073514261');
define('INSPECTOR_TP',              '091019-0567503');
define('INSPECTOR_REG_SV',          '2502027');

// ── Contacto ─────────────────────────────────────────────────────────────────
define('EMPRESA_DIRECCION',         'Finca Villa Clemencia Vrd. Prado');
define('EMPRESA_CIUDAD',            'Facatativa, Cundinamarca, Colombia');
define('EMPRESA_TELEFONO',          '(+057) 3114677282 - 3023090940');
define('EMPRESA_EMAIL',             'freshfloral.erikajuley@gmail.com');

// ── Rutas del servidor ────────────────────────────────────────────────────────
// Ruta relativa al DOCUMENT_ROOT donde está alojada la aplicación.
// Ejemplo para otro cliente: '/OtroCliente/'
define('APP_BASE_PATH',             '/DatenBankenApp/AllSeasonFlowers/');

// ── Logo ──────────────────────────────────────────────────────────────────────
// Reemplazar el archivo en esta ruta para cambiar el logo de cada cliente.
define('EMPRESA_LOGO_PATH',         $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'img/LogoAllSeason.jpg');

// ── Conexión a base de datos ──────────────────────────────────────────────────
// Ruta absoluta al archivo de conexión. Cambia APP_BASE_PATH por cliente.
define('CONEXION_BD_PATH',          $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'conexionBaseDatos/conexionbd.php');

// ── FPDF (librería externa compartida) ─────────────────────────────────────────
// Esta ruta NO depende de APP_BASE_PATH porque fpdf está en una ubicación fija.
define('FPDF_PATH',                 $_SERVER['DOCUMENT_ROOT'] . '/DatenBankenApp/fpdf/fpdf.php');

// ── Rutas de logo alternativas (legacy) ────────────────────────────────────────
define('EMPRESA_LOGO_PATH_ASSETS',      $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'assets/logos/LogoAllSeason.jpg');
define('EMPRESA_LOGO_PATH_ASSETS_ALT',  $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'public/assets/logos/LogoAllSeason.jpg');
