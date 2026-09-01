<?php
// src/Api/pedidos/helpers/razon_social.php
// ─────────────────────────────────────────────────────────────────────────────
// Soporte multi-cliente para "Empresa Emisora" (múltiples razones sociales)
// en el módulo de Pedidos.
//
// Diseño esquema-dirigido: la funcionalidad se activa SOLO si la base de datos
// tiene la tabla `GEN_RazonesSociales` y la columna `SAS_EncabPedido.IdRazonSocial`.
// Si no existen (ej. otra base de datos de otro cliente), todas las funciones
// retornan null/false y los llamadores usan las constantes de `empresa.php`
// (comportamiento original intacto). No requiere cambios en la configuración
// de otros clientes.
// ─────────────────────────────────────────────────────────────────────────────

if (!function_exists('razon_social_tabla_existe')) {
    /**
     * Indica si existe la tabla GEN_RazonesSociales en la base activa.
     */
    function razon_social_tabla_existe($enlace): bool
    {
        $sql = "SELECT COUNT(*) AS n
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'GEN_RazonesSociales'";
        $stmt = $enlace->prepare($sql);
        if (!$stmt) {
            return false;
        }
        $stmt->execute();
        $stmt->bind_result($n);
        $existe = false;
        if ($stmt->fetch()) {
            $existe = intval($n) > 0;
        }
        $stmt->close();
        return $existe;
    }
}

if (!function_exists('razon_social_columna_existe')) {
    /**
     * Indica si SAS_EncabPedido tiene la columna IdRazonSocial.
     */
    function razon_social_columna_existe($enlace): bool
    {
        $sql = "SELECT COUNT(*) AS n
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'SAS_EncabPedido'
                  AND COLUMN_NAME = 'IdRazonSocial'";
        $stmt = $enlace->prepare($sql);
        if (!$stmt) {
            return false;
        }
        $stmt->execute();
        $stmt->bind_result($n);
        $existe = false;
        if ($stmt->fetch()) {
            $existe = intval($n) > 0;
        }
        $stmt->close();
        return $existe;
    }
}

if (!function_exists('razon_social_disponible')) {
    /**
     * La funcionalidad está disponible solo si existen tabla y columna.
     */
    function razon_social_disponible($enlace): bool
    {
        return razon_social_tabla_existe($enlace) && razon_social_columna_existe($enlace);
    }
}

if (!function_exists('razon_social_obtener')) {
    /**
     * Devuelve la fila de GEN_RazonesSociales (activa) o null.
     * @param mixed $enlace Conexión mysqli
     * @param int|null $idRazonSocial
     * @return array|null
     */
    function razon_social_obtener($enlace, $idRazonSocial): ?array
    {
        $id = intval($idRazonSocial);
        if ($id <= 0 || !razon_social_tabla_existe($enlace)) {
            return null;
        }

        $sql = "SELECT IdRazonSocial, Nombre, NIT, Direccion, Ciudad, Pais,
                       Telefono, Email, Logo, PrefijoInvoice, RegistroICA, CultivoRegistroICA,
                       RepresentanteLegal, CCRepresentante,
                       InspectorNombre, InspectorCC, InspectorTP, InspectorRegSV
                FROM GEN_RazonesSociales
                WHERE IdRazonSocial = ? AND Activo = 1
                LIMIT 1";
        $stmt = $enlace->prepare($sql);
        if (!$stmt) {
            return null;
        }
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $stmt->bind_result(
            $IdRazonSocial, $Nombre, $NIT, $Direccion, $Ciudad, $Pais,
            $Telefono, $Email, $Logo, $PrefijoInvoice, $RegistroICA, $CultivoRegistroICA,
            $RepresentanteLegal, $CCRepresentante,
            $InspectorNombre, $InspectorCC, $InspectorTP, $InspectorRegSV
        );

        $fila = null;
        if ($stmt->fetch()) {
            $fila = [
                'IdRazonSocial'      => intval($IdRazonSocial),
                'Nombre'             => $Nombre,
                'NIT'                => $NIT,
                'Direccion'          => $Direccion,
                'Ciudad'             => $Ciudad,
                'Pais'               => $Pais,
                'Telefono'           => $Telefono,
                'Email'              => $Email,
                'Logo'               => $Logo,
                'PrefijoInvoice'     => $PrefijoInvoice,
                'RegistroICA'        => $RegistroICA,
                'CultivoRegistroICA' => $CultivoRegistroICA,
                'RepresentanteLegal' => $RepresentanteLegal,
                'CCRepresentante'    => $CCRepresentante,
                'InspectorNombre'    => $InspectorNombre,
                'InspectorCC'        => $InspectorCC,
                'InspectorTP'        => $InspectorTP,
                'InspectorRegSV'     => $InspectorRegSV,
            ];
        }
        $stmt->close();
        return $fila;
    }
}

if (!function_exists('razon_social_de_pedido')) {
    /**
     * Resuelve la razón social guardada en un pedido (o null si no aplica).
     * @param mixed $enlace Conexión mysqli
     * @param int $idEncabPedido
     * @return array|null
     */
    function razon_social_de_pedido($enlace, $idEncabPedido): ?array
    {
        $idPedido = intval($idEncabPedido);
        if ($idPedido <= 0 || !razon_social_columna_existe($enlace)) {
            return null;
        }

        $sql = "SELECT IdRazonSocial FROM SAS_EncabPedido WHERE IdEncabPedido = ? LIMIT 1";
        $stmt = $enlace->prepare($sql);
        if (!$stmt) {
            return null;
        }
        $stmt->bind_param('i', $idPedido);
        $stmt->execute();
        $stmt->bind_result($idRazonSocial);
        $hayFila = $stmt->fetch();
        $stmt->close();

        if (!$hayFila || !$idRazonSocial) {
            return null;
        }
        return razon_social_obtener($enlace, $idRazonSocial);
    }
}

if (!function_exists('razon_social_logo_absoluto')) {
    /**
     * Ruta absoluta del logo de la razón social si el archivo existe; si no, null.
     * El campo Logo se guarda relativo a DOCUMENT_ROOT.
     * @param array|null $razonSocial
     * @return string|null
     */
    function razon_social_logo_absoluto($razonSocial): ?string
    {
        if (empty($razonSocial) || empty($razonSocial['Logo'])) {
            return null;
        }
        $ruta = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/\\') . '/' . ltrim((string)$razonSocial['Logo'], '/\\');
        return file_exists($ruta) ? $ruta : null;
    }
}
