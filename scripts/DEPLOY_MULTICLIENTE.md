# Guía de despliegue multi-cliente

> Documento paso a paso para crear un build y desplegar la aplicación para un nuevo cliente sin afectar a los existentes.
>
> 📋 **Antes de empezar, use** `scripts/PLANTILLA_NUEVO_CLIENTE.md`  
> Ese documento contiene el formulario para recolectar datos y el paso a paso completo.  
> Esta guía es el respaldo con detalles técnicos adicionales.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Crear la base de datos del nuevo cliente](#2-crear-la-base-de-datos-del-nuevo-cliente)
3. [Configurar los archivos del proyecto](#3-configurar-los-archivos-del-proyecto)
4. [Compilar el build](#4-compilar-el-build)
5. [Desplegar en el servidor](#5-desplegar-en-el-servidor)
6. [Probar en producción](#6-probar-en-producción)
7. [Referencia rápida](#7-referencia-rápida)

---

## 1. Requisitos previos

Antes de empezar necesitas:

- [ ] Acceso al servidor web (FTP, SSH, o cPanel)
- [ ] Acceso a phpMyAdmin o MySQL para crear/importar bases de datos
- [ ] El repositorio clonado en tu PC local
- [ ] Node.js instalado (v18+)
- [ ] npm instalado

---

## 2. Crear la base de datos del nuevo cliente

### 2.1. Crear la BD vacía

Desde phpMyAdmin, cPanel, o línea de comandos MySQL:

```sql
CREATE DATABASE datenban_NombreCliente;
CREATE USER 'datenban_UsuarioCliente'@'%' IDENTIFIED BY 'contraseña_segura';
GRANT ALL PRIVILEGES ON datenban_NombreCliente.* TO 'datenban_UsuarioCliente'@'%';
FLUSH PRIVILEGES;
```

### 2.2. Clonar la estructura y datos desde AllSeasonFlowers

#### Opción A: phpMyAdmin (recomendada)

1. Entrar a phpMyAdmin
2. Seleccionar la BD `datenban_AllSeasonFlowers`
3. Ir a "Exportar" → método "Rápido" → formato "SQL"
4. Descargar el archivo `.sql`
5. Seleccionar la BD nueva (`datenban_NombreCliente`)
6. Ir a "Importar" → seleccionar el archivo `.sql` → "Continuar"

#### Opción B: Línea de comandos

```bash
# Exportar desde AllSeasonFlowers
mysqldump -h host -u usuario -p datenban_AllSeasonFlowers > respaldo_allseason.sql

# Importar a la nueva BD
mysql -h host -u usuario -p datenban_NombreCliente < respaldo_allseason.sql
```

> **Verificar:** La nueva BD debe tener las mismas 34 tablas que la original.

---

## 3. Configurar los archivos del proyecto

### 3.1. Datos de la empresa

Editar `src/Api/config/empresa.php` con los datos del nuevo cliente:

```php
define('APP_BASE_PATH',             '/DatenBankenApp/NombreCliente/');

// ── Identidad ────────────────────────────────────────────────────────────
define('EMPRESA_NOMBRE',            'NOMBRE LEGAL SAS');
define('EMPRESA_NOMBRE_CORTO',      'NOMBRE CORTO');
define('EMPRESA_NOMBRE_TITULO',     'Nombre para mostrar');
define('EMPRESA_LEMA',              'Eslogan del cliente');
define('EMPRESA_INICIALES',         'NC');
define('EMPRESA_NIT',               '123.456.789-0');
define('EMPRESA_REPRESENTANTE',     'Nombre del representante');
define('EMPRESA_CC_REPRESENTANTE',  'Número de cédula');

// ── Contacto ─────────────────────────────────────────────────────────────
define('EMPRESA_DIRECCION',         'Dirección del nuevo cliente');
define('EMPRESA_CIUDAD',            'Ciudad, País');
define('EMPRESA_TELEFONO',          '300 000 00 00');
define('EMPRESA_EMAIL',             'contacto@nuevocliente.com');

// ── Logo ─────────────────────────────────────────────────────────────────
define('EMPRESA_LOGO_PATH',         $_SERVER['DOCUMENT_ROOT'] . APP_BASE_PATH . 'img/LogoNuevoCliente.jpg');
```

> **Nota:** `EMPRESA_NOMBRE_TITULO`, `EMPRESA_LEMA` y `EMPRESA_INICIALES` controlan lo que se muestra en el header, sidebar y dashboard del frontend.

### 3.2. Logo

Colocar el archivo del logo en `img/LogoNuevoCliente.jpg` (relativo a la raíz del proyecto PHP en el servidor).

Formatos aceptados: JPG, PNG. Tamaño recomendado: 300x150 px.

### 3.3. Conexión a base de datos

Crear `conexionBaseDatos/conexionbd.php` con las credenciales de la nueva BD:

```php
<?php
$enlace = mysqli_connect(
    "servidor",
    "datenban_UsuarioCliente",
    "contraseña_segura",
    "datenban_NombreCliente"
);
$enlace->set_charset("utf8mb4");
?>
```

### 3.4. Variables de entorno del frontend (.env)

Crear archivo `.env-nombrecliente` en la raíz del proyecto:

```
MYSQL_HOST=servidor
MYSQL_PORT=3306
MYSQL_USER=datenban_UsuarioCliente
MYSQL_PASS=contraseña_segura
MYSQL_DB=datenban_NombreCliente

VITE_API_BASE=https://tudominio.com/DatenBankenApp/NombreCliente/Api
VITE_BASE_PATH=/DatenBankenApp/NombreCliente/

# Datos de la empresa para el frontend (header, sidebar, dashboard, título)
VITE_EMPRESA_NOMBRE=NOMBRE LEGAL SAS
VITE_EMPRESA_NOMBRE_CORTO=NOMBRE CORTO
VITE_EMPRESA_NOMBRE_LARGO=NOMBRE LEGAL S.A.S
VITE_EMPRESA_TITLE=Nombre para mostrar
VITE_EMPRESA_LEMA=Eslogan del cliente
VITE_EMPRESA_INICIALES=NC
VITE_EMPRESA_LOGO=/DatenBankenApp/NombreCliente/img/LogoNuevoCliente.jpg
```

> **Importante:** No modificar `.gitignore`. El patrón `.env-*` ya excluye estos archivos.

### 3.5. Agregar script de build en package.json

En `package.json`, dentro de `"scripts"`, agregar:

```json
"build:nombrecliente": "cross-env VITE_BASE_PATH=/DatenBankenApp/NombreCliente/ VITE_API_BASE=https://tudominio.com/DatenBankenApp/NombreCliente/Api VITE_EMPRESA_NOMBRE=\"NOMBRE LEGAL SAS\" VITE_EMPRESA_NOMBRE_CORTO=\"NOMBRE CORTO\" VITE_EMPRESA_NOMBRE_LARGO=\"NOMBRE LEGAL S.A.S\" VITE_EMPRESA_TITLE=\"Nombre para mostrar\" VITE_EMPRESA_LEMA=\"Eslogan del cliente\" VITE_EMPRESA_INICIALES=NC VITE_EMPRESA_LOGO=/DatenBankenApp/NombreCliente/img/LogoNuevoCliente.jpg npm run build",
```

---

## 4. Compilar el build

### 4.1. Ejecutar el build

```bash
npm run build:nombrecliente
```

Esto ejecutará:
1. **Tests** (263 tests) — si fallan, el build se detiene
2. **Build de Vite** — genera la carpeta `dist/`

### 4.2. Verificar el resultado

Abrir `dist/index.html` y confirmar que las rutas apunten al nuevo cliente:

```html
<!-- Debe decir NombreCliente, no AllSeasonFlowers -->
<script src="/DatenBankenApp/NombreCliente/assets/index-xxxx.js"></script>
<link href="/DatenBankenApp/NombreCliente/assets/index-xxxx.css" rel="stylesheet">
```

---

## 5. Desplegar en el servidor

### 5.1. Subir archivos al servidor

La carpeta `dist/` se despliega en el servidor en la ruta del nuevo cliente, por ejemplo:

```
/DatenBankenApp/NombreCliente/
├── index.html
├── vite.svg
└── assets/
    ├── index-xxxx.js
    ├── index-xxxx.css
    └── ...
```

### 5.2. Subir archivos PHP y configuración

Además del build, debes subir (o copiar del cliente base) los siguientes archivos PHP:

```
/DatenBankenApp/NombreCliente/
├── index.html              (del build)
├── vite.svg                (del build)
├── assets/                 (del build)
├── Api/                    (todos los PHP, copiar de AllSeasonFlowers)
├── conexionBaseDatos/
│   └── conexionbd.php      (con credenciales de la nueva BD)
├── config/
│   └── empresa.php         (con datos del nuevo cliente)
└── img/
    └── LogoNuevoCliente.jpg
```

### 5.3. Archivo .htaccess (Apache)

Crear `.htaccess` en la raíz del nuevo cliente (`/DatenBankenApp/NombreCliente/.htaccess`):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /DatenBankenApp/NombreCliente/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /DatenBankenApp/NombreCliente/index.html [L]
</IfModule>
```

---

## 6. Probar en producción

### 6.1. Prueba básica

- [ ] Abrir `https://tudominio.com/DatenBankenApp/NombreCliente/index.html`
- [ ] Verificar que la aplicación carga sin errores en la consola del navegador
- [ ] Verificar que el nombre de la empresa aparece correctamente

### 6.2. Probar cada módulo

| Módulo | Prueba |
|---|---|
| Clientes | Listar, crear, editar, eliminar |
| Productos | Listar, crear, editar, eliminar |
| Variedades | Listar, crear, editar, eliminar |
| Grados | Listar, crear, editar, eliminar |
| Proveedores | Listar, crear, editar, eliminar |
| Conductores | Listar, crear, editar, eliminar |
| Ayudantes | Listar, crear, editar, eliminar |
| Pedidos | Listar, crear, ver PDFs (factura, planilla, fitosanitario, etiqueta) |
| Compras | Listar, crear, ver PDF orden de compra |
| Devoluciones (ventas) | Listar, crear, ver PDF |
| Devoluciones (compras) | Listar, crear, ver PDF |
| Pagos clientes | Listar, crear, editar, eliminar, ver PDF |
| Pagos proveedores | Listar, crear, editar, eliminar, ver PDF |
| Dashboard | Verificar que carguen datos |
| Catálogos (empaques, agencias, etc.) | Listar, crear, editar, eliminar |

### 6.3. Verificar PDFs

Generar al menos un PDF de cada tipo y verificar que muestren:
- [ ] Logo del nuevo cliente
- [ ] Nombre de la empresa correcto
- [ ] NIT correcto
- [ ] Dirección y teléfono correctos

---

## 7. Referencia rápida

### Comandos disponibles

```bash
npm run dev                  # Desarrollo local
npm test                     # Ejecutar 263 tests
npm run build                # Compilar (usa .env actual)
npm run build:allseason      # Compilar para AllSeasonFlowers
npm run build:flagracol      # Compilar para FlagracolSAS
npm run build:no-test        # Compilar sin tests
```

### Esquema de carpetas en el servidor

```
www.dominio.com/
└── /DatenBankenApp/
    ├── AllSeasonFlowers/     ← Cliente 1
    │   ├── index.html
    │   ├── assets/
    │   ├── Api/
    │   ├── conexionBaseDatos/
    │   └── img/
    │
    ├── FlagracolSAS/          ← Cliente 2
    │   ├── index.html
    │   ├── assets/
    │   ├── Api/
    │   ├── conexionBaseDatos/
    │   └── img/
    │
    └── NombreCliente/        ← Cliente N (nuevo)
        ├── index.html
        ├── assets/
        ├── Api/
        ├── conexionBaseDatos/
        └── img/
```

### Archivos que cambian por cliente

| Archivo | Cambia por cliente | Descripción |
|---|---|---|
| `.env-nombrecliente` | ✅ Sí | Variables de entorno para el build |
| `Api/config/empresa.php` | ✅ Sí | Datos de la empresa (nombre, NIT, logo, lema, iniciales) |
| `conexionBaseDatos/conexionbd.php` | ✅ Sí | Credenciales de la BD |
| `img/Logo*.jpg` | ✅ Sí | Logo |
| `Api/` (PHP) | ❌ No | Mismos archivos para todos |
| `src/` (JS/React) | ❌ No | Mismo código para todos |
| `package.json` | ❌ No | Solo se agrega el script de build |
| `dist/` | ✅ Se genera automáticamente | Build resultado de `npm run build:*` |

### Solución de problemas comunes

| Error | Causa | Solución |
|---|---|---|
| `Failed to load module script... MIME type text/html` | El servidor no encuentra los archivos JS | Verificar `.htaccess` y que `dist/` esté completo |
| `Router basename... not able to match the URL` | El build se hizo con el path equivocado | Recompilar con `build:nombrecliente` |
| `Error de conexión a la base de datos` | Credenciales incorrectas en `conexionbd.php` | Verificar usuario/contraseña/BD |
| Los PDFs no muestran el logo | Ruta del logo incorrecta en `empresa.php` | Verificar `EMPRESA_LOGO_PATH` |
| El header/sidebar muestra datos de otro cliente | Las variables VITE_EMPRESA_* no se inyectaron | Verificar el script `build:nombrecliente` en `package.json` |
| El título de la pestaña es genérico | `%VITE_EMPRESA_TITLE%` no se reemplazó en el build | Recompilar con las variables correctas |
| Los tests fallan al compilar | Hay un error en el código | Ejecutar `npm test` para ver cuál test falla |

---

> **Última actualización:** Mayo 2026
