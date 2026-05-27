<?php
// src/Api/config/empresa.php
// ─────────────────────────────────────────────────────────────────────────────
// Datos de la empresa que se imprimen en los PDFs.
// Para adaptar la app a otro cliente, solo cambie los valores de este archivo.
// Todos los PHP de generación de PDFs hacen require_once de este archivo.
// ─────────────────────────────────────────────────────────────────────────────

// ── Identidad ────────────────────────────────────────────────────────────────
define('EMPRESA_NOMBRE',            'FLAGRACOL SAS');
define('EMPRESA_NOMBRE_CORTO',      'FLAGRACOL');
define('EMPRESA_NOMBRE_TITULO',     'Flagracol SAS');        // Para título de pestaña y header
define('EMPRESA_LEMA',              'Flores de Colombia');   // Eslogan
define('EMPRESA_INICIALES',         'FS');                   // Iniciales para sidebar
define('EMPRESA_NIT',               '901.104.002-0');
define('EMPRESA_REPRESENTANTE',     'DANIEL ALBERTO LOPEZ');
define('EMPRESA_CC_REPRESENTANTE',  '80.096.240');

// ── ICA / Fitosanitario ───────────────────────────────────────────────────────
define('EMPRESA_REGISTRO_ICA',      'REGISTRO ICA 25123386');
define('EMPRESA_CULTIVO_REG_ICA',   '25123386');
define('INSPECTOR_NOMBRE',          'DANIEL ROBERTO LOPEZ RODRIGUEZ');
define('INSPECTOR_CC',              '4.092.426');
define('INSPECTOR_TP',              '5106');
define('INSPECTOR_REG_SV',          '00000');

// ── Contacto ─────────────────────────────────────────────────────────────────
define('EMPRESA_DIRECCION',         'CALLE 163 N 50-80 INT 10 OF 233');
define('EMPRESA_CIUDAD',            'Bogotá, Colombia');
define('EMPRESA_TELEFONO',          '(+057) 316 507 95 27');
define('EMPRESA_EMAIL',             'logística@flagracol.com.co');

// ── Rutas del servidor ────────────────────────────────────────────────────────
// Ruta relativa al DOCUMENT_ROOT donde está alojada la aplicación.
// Ejemplo para otro cliente: '/OtroCliente/'
define('APP_BASE_PATH',             '/DatenBankenApp/FlagracolSAS/');

// ── Logo ──────────────────────────────────────────────────────────────────────
// Reemplazar el archivo en esta ruta para cambiar el logo de cada cliente.
define('EMPRESA_LOGO_PATH',         $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'img/LogoFlagracol.jpg');

// ── Conexión a base de datos ──────────────────────────────────────────────────
// Ruta absoluta al archivo de conexión. Cambia APP_BASE_PATH por cliente.
define('CONEXION_BD_PATH',          $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'conexionBaseDatos/conexionbd.php');

// ── FPDF (librería externa compartida) ─────────────────────────────────────────
// Esta ruta NO depende de APP_BASE_PATH porque fpdf está en una ubicación fija.
define('FPDF_PATH',                 $_SERVER['DOCUMENT_ROOT'] . '/DatenBankenApp/fpdf/fpdf.php');

// ── Rutas de logo alternativas (legacy) ────────────────────────────────────────
define('EMPRESA_LOGO_PATH_ASSETS',      $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'assets/logos/LogoFlagracol.jpg');
define('EMPRESA_LOGO_PATH_ASSETS_ALT',  $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'public/assets/logos/LogoFlagracol.jpg');
