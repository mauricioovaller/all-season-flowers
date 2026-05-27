# PLANTILLA NUEVO CLIENTE — All Season Flowers App

> Use este documento CADA VEZ que necesite crear un nuevo cliente o modificar datos de un cliente existente.
> 
> 📖 **Guía completa de despliegue:** `scripts/DEPLOY_MULTICLIENTE.md`  
> 📋 **Biblia del proyecto:** `AGENTS.md`

---

## SECCIÓN A — Recolectar datos del nuevo cliente

Llene este formulario. Todos los campos son obligatorios a menos que se indique lo contrario.

### 1. Información general

| # | Campo | Valor | ¿Para qué sirve? |
|---|---|---|---|
| 1.1 | Nombre legal completo | `________________________` | Aparece en PDFs (facturas, órdenes de compra, etc.) |
| 1.2 | Nombre corto | `________________________` | Aparece en PDFs (versión abreviada) |
| 1.3 | Nombre para mostrar | `________________________` | Aparece en el título de la pestaña del navegador, header y sidebar |
| 1.4 | Eslogan / lema | `________________________` | Aparece debajo del nombre en header y sidebar |
| 1.5 | Iniciales (2 letras, ej: AS) | `______` | Aparece en el recuadro del sidebar cuando no carga el logo |
| 1.6 | NIT | `________________________` | Aparece en PDFs |
| 1.7 | Representante legal | `________________________` | Aparece en PDFs |
| 1.8 | CC del representante | `________________________` | Aparece en PDFs |

### 2. Contacto

| # | Campo | Valor | ¿Para qué sirve? |
|---|---|---|---|
| 2.1 | Dirección | `________________________` | Aparece en PDFs |
| 2.2 | Ciudad | `________________________` | Aparece en PDFs |
| 2.3 | Teléfono | `________________________` | Aparece en PDFs |
| 2.4 | Email | `________________________` | Aparece en PDFs |

### 3. ICA / Fitosanitario (solo si aplica)

| # | Campo | Valor |
|---|---|---|
| 3.1 | Registro ICA | `________________________` |
| 3.2 | Cultivo registro ICA | `________________________` |
| 3.3 | Inspector nombre | `________________________` |
| 3.4 | Inspector CC | `________________________` |
| 3.5 | Inspector TP | `________________________` |
| 3.6 | Inspector registro SV | `________________________` |

### 4. Servidor y rutas

| # | Campo | Valor | Ejemplo |
|---|---|---|---|
| 4.1 | Ruta base (APP_BASE_PATH) | `/DatenBankenApp/________/` | `/DatenBankenApp/MiCliente/` |
| 4.2 | URL completa de APIs | `https://______/DatenBankenApp/________/Api` | `https://portal.midominio.com/DatenBankenApp/MiCliente/Api` |
| 4.3 | Ruta pública del logo | `/DatenBankenApp/________/img/Logo________.jpg` | `/DatenBankenApp/MiCliente/img/LogoMiCliente.jpg` |

### 5. Base de datos

| # | Campo | Valor |
|---|---|---|
| 5.1 | Nombre de la BD | `datenban_________________` |
| 5.2 | Usuario MySQL | `datenban_________________` |
| 5.3 | Contraseña MySQL | `________________________` |
| 5.4 | Host MySQL (servidor) | `________________________` |
| 5.5 | Puerto MySQL | `3306` |

### 6. Logo

| # | Campo | Valor |
|---|---|---|
| 6.1 | Nombre del archivo del logo | `Logo________.jpg` |
| 6.2 | Formato | JPG o PNG (recomendado: JPG) |
| 6.3 | Tamaño recomendado | 300x150 píxeles |

---

## SECCIÓN B — Aplicar los cambios (paso a paso)

### 🔴 PASO 1: Crear la base de datos

Desde phpMyAdmin o línea de comandos MySQL:

```sql
CREATE DATABASE datenban_NombreCliente;
CREATE USER 'datenban_Usuario'@'%' IDENTIFIED BY 'contraseña';
GRANT ALL PRIVILEGES ON datenban_NombreCliente.* TO 'datenban_Usuario'@'%';
FLUSH PRIVILEGES;
```

Luego importar la estructura y datos desde la BD de AllSeasonFlowers (phpMyAdmin → Exportar → Importar).

---

### 🟠 PASO 2: Crear empresa.php del nuevo cliente

Crear archivo: `src/Api/config/NombreCliente/empresa.php`

> **Importante:** Este archivo se sube manualmente al servidor (no va en el build).  
> En el servidor debe quedar en: `/DatenBankenApp/NombreCliente/Api/config/empresa.php`

Copiar la siguiente plantilla y reemplazar los valores con los del formulario:

```php
<?php
// ── Identidad ────────────────────────────────────────────────────────────────
define('EMPRESA_NOMBRE',            '_____(1.1)_____');
define('EMPRESA_NOMBRE_CORTO',      '_____(1.2)_____');
define('EMPRESA_NOMBRE_TITULO',     '_____(1.3)_____');
define('EMPRESA_LEMA',              '_____(1.4)_____');
define('EMPRESA_INICIALES',         '__(1.5)__');
define('EMPRESA_NIT',               '_____(1.6)_____');
define('EMPRESA_REPRESENTANTE',     '_____(1.7)_____');
define('EMPRESA_CC_REPRESENTANTE',  '_____(1.8)_____');

// ── ICA / Fitosanitario ───────────────────────────────────────────────────────
define('EMPRESA_REGISTRO_ICA',      '_____(3.1)_____');
define('EMPRESA_CULTIVO_REG_ICA',   '_____(3.2)_____');
define('INSPECTOR_NOMBRE',          '_____(3.3)_____');
define('INSPECTOR_CC',              '_____(3.4)_____');
define('INSPECTOR_TP',              '_____(3.5)_____');
define('INSPECTOR_REG_SV',          '_____(3.6)_____');

// ── Contacto ─────────────────────────────────────────────────────────────────
define('EMPRESA_DIRECCION',         '_____(2.1)_____');
define('EMPRESA_CIUDAD',            '_____(2.2)_____');
define('EMPRESA_TELEFONO',          '_____(2.3)_____');
define('EMPRESA_EMAIL',             '_____(2.4)_____');

// ── Rutas del servidor ────────────────────────────────────────────────────────
define('APP_BASE_PATH',             '_____(4.1)_____');

// ── Logo ──────────────────────────────────────────────────────────────────────
define('EMPRESA_LOGO_PATH',         $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'img/_____(6.1)_____');

// ── Conexión BD y FPDF ────────────────────────────────────────────────────────
define('CONEXION_BD_PATH',          $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'conexionBaseDatos/conexionbd.php');
define('FPDF_PATH',                 $_SERVER['DOCUMENT_ROOT'] . '/DatenBankenApp/fpdf/fpdf.php');

// ── Rutas de logo alternativas (legacy) ────────────────────────────────────────
define('EMPRESA_LOGO_PATH_ASSETS',      $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'assets/logos/_____(6.1)_____');
define('EMPRESA_LOGO_PATH_ASSETS_ALT',  $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'public/assets/logos/_____(6.1)_____');
?>
```

---

### 🟠 PASO 3: Crear conexionbd.php del nuevo cliente

Crear archivo: `conexionBaseDatos/conexionbd.php`

> Se sube manualmente al servidor en: `/DatenBankenApp/NombreCliente/conexionBaseDatos/conexionbd.php`

```php
<?php
$enlace = mysqli_connect(
    "_____(5.4)_____",       // host
    "_____(5.2)_____",       // usuario
    "_____(5.3)_____",       // contraseña
    "_____(5.1)_____"        // nombre BD
);
$enlace->set_charset("utf8mb4");
?>
```

---

### 🟡 PASO 4: Crear .env del nuevo cliente (en tu PC local)

Crear archivo en la **raíz del proyecto local**: `.env-nombrecliente`

```
MYSQL_HOST=_____(5.4)_____
MYSQL_PORT=3306
MYSQL_USER=_____(5.2)_____
MYSQL_PASS=_____(5.3)_____
MYSQL_DB=_____(5.1)_____

VITE_API_BASE=_____(4.2)_____
VITE_BASE_PATH=_____(4.1)_____

VITE_EMPRESA_NOMBRE=_____(1.1)_____
VITE_EMPRESA_NOMBRE_CORTO=_____(1.2)_____
VITE_EMPRESA_NOMBRE_LARGO=_____(1.1)_____
VITE_EMPRESA_TITLE=_____(1.3)_____
VITE_EMPRESA_LEMA=_____(1.4)_____
VITE_EMPRESA_INICIALES=__(1.5)__
VITE_EMPRESA_LOGO=_____(4.3)_____
```

---

### 🟡 PASO 5: Agregar script de build en package.json

Abrir `package.json` en la raíz del proyecto local. Dentro de `"scripts"`, agregar una línea como esta:

```json
"build:nombrecliente": "cross-env VITE_BASE_PATH=_____(4.1)_____ VITE_API_BASE=_____(4.2)_____ VITE_EMPRESA_NOMBRE=\"_____(1.1)_____\" VITE_EMPRESA_NOMBRE_CORTO=\"_____(1.2)_____\" VITE_EMPRESA_NOMBRE_LARGO=\"_____(1.1)_____\" VITE_EMPRESA_TITLE=\"_____(1.3)_____\" VITE_EMPRESA_LEMA=\"_____(1.4)_____\" VITE_EMPRESA_INICIALES=__(1.5)__ VITE_EMPRESA_LOGO=_____(4.3)_____ npm run build",
```

> **Nota:** Esta línea es larga pero es una sola línea en el JSON. Los valores con espacios deben ir entre comillas dobles escapadas `\"...\"`.

---

### 🟢 PASO 6: Compilar el build

```bash
npm run build:nombrecliente
```

Esto ejecutará:
1. ✅ **263 tests** — si fallan, el build se detiene (algo está mal)
2. ✅ **Build de Vite** — genera la carpeta `dist/`

Verificar que `dist/index.html` tenga los datos correctos:
```html
<title>_____(1.3)_____</title>
<script src="_____(4.1)_____assets/index-xxx.js"></script>
```

---

### 🟢 PASO 7: Subir todo al servidor

Crear la carpeta del cliente en el servidor y subir:

```
/DatenBankenApp/NombreCliente/
├── index.html              ← del dist/
├── assets/                 ← del dist/
│
├── Api/                    ← copiar de AllSeasonFlowers (todos los PHP)
│   └── config/
│       └── empresa.php     ← el que creamos en PASO 2
│
├── conexionBaseDatos/
│   └── conexionbd.php      ← el que creamos en PASO 3
│
└── img/
    └── LogoNombreCliente.jpg  ← logo
```

> **Importante:** `Api/` completo se copia igual para todos los clientes.  
> Solo cambian `empresa.php`, `conexionbd.php`, `img/` y el `dist/`.

---

### 🟢 PASO 8: Probar

1. Abrir `https://tudominio.com/DatenBankenApp/NombreCliente/`
2. Verificar que el título de la pestaña sea `_____(1.3)_____`
3. Verificar que el header muestre el nombre, lema y logo correctos
4. Verificar que el sidebar muestre las iniciales y nombre correctos
5. Generar al menos un PDF y verificar logo, nombre, NIT

---

## SECCIÓN C — Cómo MODIFICAR un cliente existente

| Si quieres cambiar... | Archivo a modificar | ¿Requiere nuevo build? |
|---|---|---|
| Nombre, NIT, dirección, teléfono, email, logo, ICA, inspector | `Api/config/NombreCliente/empresa.php` en el servidor | ❌ No (solo PDFs) |
| Nombre para mostrar, lema, iniciales (header, sidebar, pestaña) | `Api/config/NombreCliente/empresa.php` + `.env-nombrecliente` | ✅ Sí (hay que recompilar) |
| Logo (la imagen) | Reemplazar `img/Logo.jpg` en el servidor | ❌ No |
| Contraseña de BD | `conexionBaseDatos/conexionbd.php` en el servidor | ❌ No |
| URL de API o ruta base | `.env-nombrecliente` + `empresa.php` | ✅ Sí |

---

## SECCIÓN D — Cómo AGREGAR un nuevo dato de la empresa no contemplado

Ejemplo: "Ahora necesito que aparezca el **código postal** en los PDFs y en el frontend".

### D.1 — Si solo se necesita en PDFs (backend PHP)

```php
// PASO 1: Agregar la constante en empresa.php
// Archivo: src/Api/config/AllSeasonFlowers/empresa.php
define('EMPRESA_CODIGO_POSTAL', '12345');

// PASO 2: Usarla en el PHP del PDF que corresponda
// Archivo: src/Api/pedidos/ApiGenerarPDFFactura.php (ejemplo)
$pdf->Cell(0, 10, 'Código Postal: ' . EMPRESA_CODIGO_POSTAL);
```

> **No requiere build.** Solo subir `empresa.php` y el PDF modificado al servidor.

### D.2 — Si también se necesita en el frontend (header, sidebar, dashboard, etc.)

```php
// PASO 1: Agregar la constante en empresa.php (backend)
define('EMPRESA_CODIGO_POSTAL', '12345');
```

```env
// PASO 2: Agregar variable en el .env del cliente
// Archivo: .env-allseason (o .env-flagracol)
VITE_EMPRESA_CODIGO_POSTAL=12345
```

```js
// PASO 3: Agregar al objeto CLIENTE
// Archivo: src/config/cliente.js
codigoPostal: import.meta.env.VITE_EMPRESA_CODIGO_POSTAL || '',
```

```jsx
// PASO 4: Usarlo en el componente React
// Archivo: src/components/layout/Header.jsx (ejemplo)
<span>{CLIENTE.codigoPostal}</span>
```

```json
// PASO 5: Actualizar el script de build en package.json
"build:allseason": "cross-env ... VITE_EMPRESA_CODIGO_POSTAL=12345 npm run build",
```

> **Requiere build.** Ejecutar `npm run build:allseason` y subir `dist/`.

### D.3 — Resumen visual

```
¿El nuevo dato se necesita SOLO en los PDFs?
│
├── Sí → Solo modificar empresa.php + el PHP del PDF
│         ❌ No requiere build
│
└── No → También se necesita en frontend (header, sidebar, etc.)
         ├── Modificar empresa.php
         ├── Modificar .env del cliente
         ├── Modificar src/config/cliente.js
         ├── Modificar el componente React donde se muestra
         └── ✅ Requiere build y subir dist/
```

---

## SECCIÓN D — Clientes existentes (referencia)

| Dato | All Season Flowers | Flagracol SAS |
|---|---|---|
| **Ruta servidor** | `/DatenBankenApp/AllSeasonFlowers/` | `/DatenBankenApp/FlagracolSAS/` |
| **URL API** | `.../AllSeasonFlowers/Api` | `.../FlagracolSAS/Api` |
| **Script build** | `npm run build:allseason` | `npm run build:flagracol` |
| **Archivo .env** | `.env-allseason` | `.env-flagracol` |
| **Archivo empresa.php** | `config/AllSeasonFlowers/empresa.php` | `config/FlagracolSAS/empresa.php` |
| **Base de datos** | `datenban_AllSeasonFlowers` | `datenban_FlagracolSAS` |
| **Nombre legal** | ALL SEASON FLOWERS SAS | FLAGRACOL SAS |
| **Nombre corto** | ALL SEASON FLOWERS | FLAGRACOL |
| **Título frontend** | All Season Flowers | Flagracol SAS |
| **Lema** | Flowers & Ornamentals | Flores de Colombia |
| **Iniciales** | AS | FS |
| **Logo** | `img/LogoAllSeason.jpg` | `img/LogoFlagracol.jpg` |
| **NIT** | 901.984.016-8 | 901.104.002-0 |
| **Dirección** | Finca Villa Clemencia Vrd. Prado | CALLE 163 N 50-80 INT 10 OF 233 |
| **Teléfono** | (+057) 3114677282 - 3023090940 | (+057) 316 507 95 27 |
| **Email** | freshfloral.erikajuley@gmail.com | logística@flagracol.com.co |
| **Host MySQL** | www.datenbankensoluciones.com.co | www.datanbankensoluciones.com.co |
| **BD** | datenban_AllSeasonFlowers | datenban_FlagracolSAS |

---

> **Última actualización:** Mayo 2026  
> Si encuentra información desactualizada, actualice este documento.
