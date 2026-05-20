// src/services/pagosProveedores/pagosProveedoresService.js
const API_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/pagosProveedores";

/**
 * Obtiene el último número de pago a proveedor
 * @returns {Promise<Object>} { success, ultimoNumero, siguienteNumeroFormateado, ... }
 */
export async function obtenerUltimoNumeroPagoProveedor() {
  try {
    const res = await fetch(`${API_URL}/ApiGetUltimoNumeroPagoProveedor.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener último número de pago:", err);
    return {
      success: false,
      ultimoNumero: 0,
      siguienteNumeroFormateado: "PAG-PROV-000001",
    };
  }
}

/**
 * Obtiene compras de un proveedor con saldo pendiente
 * @param {number} idProveedor - ID del proveedor
 * @param {number|null} idPagoExcluir - ID del pago a excluir del cálculo (para edición)
 * @returns {Promise<Object>} { success, compras, total }
 */
export async function getComprasProveedorConSaldo(
  idProveedor,
  idPagoExcluir = null,
) {
  try {
    const body = { idProveedor };
    if (idPagoExcluir) body.idPagoExcluir = idPagoExcluir;
    const res = await fetch(`${API_URL}/ApiGetComprasProveedorConSaldo.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener compras con saldo:", err);
    return {
      success: false,
      compras: [],
      total: 0,
    };
  }
}

/**
 * Guarda un pago a proveedor
 * @param {Object} datosPago - Datos del pago
 * @returns {Promise<Object>} { success, message, idPagoProveedor, numeroPago }
 */
export async function guardarPagoProveedor(datosPago) {
  try {
    const res = await fetch(`${API_URL}/ApiGuardarPagoProveedor.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosPago),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al guardar pago:", err);
    throw err;
  }
}

/**
 * Obtiene un pago específico a proveedor con sus compras asociadas
 * @param {number} idPagoProveedor - ID del pago
 * @returns {Promise<Object>} { success, encabezado, compras }
 */
export async function getPagoProveedorEspecifico(idPagoProveedor) {
  try {
    const res = await fetch(`${API_URL}/ApiGetPagoProveedorEspecifico.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idPagoProveedor }),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener pago específico:", err);
    throw err;
  }
}

/**
 * Busca pagos a proveedores
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Promise<Object>} { success, pagos, total, filtros }
 */
export async function buscarPagosProveedores(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiBuscarPagosProveedores.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al buscar pagos:", err);
    return {
      success: false,
      pagos: [],
      total: 0,
      filtros,
    };
  }
}

/**
 * Genera PDF de pago a proveedor
 * @param {number} idPagoProveedor - ID del pago
 * @returns {Promise<Blob>} Blob del PDF
 */
export async function generarPDFPagoProveedor(idPagoProveedor) {
  try {
    const res = await fetch(`${API_URL}/ApiGenerarPDFPagoProveedor.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idPagoProveedor }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error respuesta API PDF:", errorText);
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const pdfBlob = await res.blob();
    console.log("PDF Pago Proveedor obtenido, tamaño:", pdfBlob.size);
    return pdfBlob;
  } catch (err) {
    console.error("Error al generar PDF:", err);
    throw err;
  }
}

/**
 * Elimina/anula un pago a proveedor
 * @param {number} idPagoProveedor - ID del pago
 * @returns {Promise<Object>} { success, message, numeroPago }
 */
export async function eliminarPagoProveedor(idPagoProveedor) {
  try {
    const res = await fetch(`${API_URL}/ApiEliminarPagoProveedor.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idPagoProveedor }),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al eliminar pago:", err);
    throw err;
  }
}

/**
 * Valida datos de pago antes de guardar
 * @param {Object} header - Encabezado del pago { fecha, idProveedor, idMedioPago }
 * @param {Array} compras - Compras seleccionadas [{ idCompra, valorPago }]
 * @returns {Object} { valido: boolean, errores: string[] }
 */
export function validarPagoProveedor(header, compras = []) {
  const errores = [];

  if (!header.fecha) {
    errores.push("La fecha de pago es obligatoria");
  }

  if (!header.idProveedor || header.idProveedor <= 0) {
    errores.push("Debe seleccionar un proveedor");
  }

  if (!header.idMoneda || header.idMoneda <= 0) {
    errores.push("Debe seleccionar una moneda");
  }

  if (!compras || compras.length === 0) {
    errores.push("Debe seleccionar al menos una compra");
  }

  if (!header.idMedioPago || header.idMedioPago <= 0) {
    errores.push("Debe seleccionar un medio de pago");
  }

  const valorTotal = compras.reduce(
    (sum, c) => sum + (parseFloat(c.valorPago) || 0),
    0,
  );
  if (valorTotal <= 0) {
    errores.push("El valor total del pago debe ser mayor a cero");
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Calcula el total a pagar a partir del arreglo de compras seleccionadas
 * @param {Array} compras - Compras seleccionadas [{ valorPago }]
 * @returns {number} Total a pagar
 */
export function calcularTotalPagoProveedor(compras = []) {
  return compras.reduce((sum, c) => sum + (parseFloat(c.valorPago) || 0), 0);
}

/**
 * Obtiene medios de pago (usa el mismo endpoint que clientes)
 * @returns {Promise<Object>} { success, mediosPago, total }
 */
export async function getMediosPago() {
  try {
    // Usamos el endpoint de pagosClientes ya que es el mismo para ambos
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/pagosClientes/ApiGetMediosPago.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener medios de pago:", err);
    return {
      success: false,
      mediosPago: [],
      total: 0,
    };
  }
}
