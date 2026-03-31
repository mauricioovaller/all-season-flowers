// src/services/devolucionesCompras/devolucionesComprasService.js
const API_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/devolucionesCompras";

/**
 * Obtiene el último número de devolución de compras (IdDevolucion) y el siguiente formateado
 * @returns {Promise<Object>} { success, ultimoNumero, siguienteNumeroFormateado, ... }
 */
export async function obtenerUltimoNumeroDevolucion() {
  try {
    const res = await fetch(`${API_URL}/ApiGetUltimoNumeroDevolucion.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener último número de devolución de compras:", err);
    return {
      success: false,
      ultimoNumero: 0,
      siguienteNumeroFormateado: "DEV-000001",
    };
  }
}

/**
 * Obtiene el detalle de una compra (productos) para devolución
 * @param {number} idCompra - ID de la compra (IdEncabCompra)
 * @returns {Promise<Object>} { success, detalle, total }
 */
export async function getDetalleCompra(idCompra) {
  try {
    const res = await fetch(`${API_URL}/ApiGetDetalleFactura.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idCompra }),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener detalle de compra:", err);
    throw err;
  }
}

/**
 * Guarda una devolución de compra (actualiza compra y detalles)
 * @param {Object} datosDevolucion - Datos de la devolución
 * @returns {Promise<Object>} { success, message, idDevolucion, numeroDevolucion, idCompra }
 */
export async function guardarDevolucionCompra(datosDevolucion) {
  try {
    const res = await fetch(`${API_URL}/ApiGuardarDevolucion.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosDevolucion),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al guardar devolución de compra:", err);
    throw err;
  }
}

/**
 * Obtiene los datos de una devolución de compra existente (para editar)
 * @param {number} idCompra - ID de la compra (IdEncabCompra)
 * @returns {Promise<Object>} { success, encabezado, detalle, totales }
 */
export async function getDevolucionCompraEspecifica(idCompra) {
  try {
    const res = await fetch(`${API_URL}/ApiGetDevolucionEspecifica.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idCompra }),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener devolución de compra específica:", err);
    throw err;
  }
}

/**
 * Busca devoluciones de compras (compras con IdDevolucion no nulo)
 * @param {Object} filtros - Filtros de búsqueda { filtroNumero, filtroProveedor, filtroFecha, filtroEstado }
 * @returns {Promise<Object>} { success, devoluciones, total, filtrosAplicados }
 */
export async function buscarDevolucionesCompras(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiBuscarDevoluciones.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al buscar devoluciones de compras:", err);
    throw err;
  }
}

/**
 * Obtiene las compras de un proveedor específico.
 * Incluye todas, incluso las que ya tienen devolución, con indicador 'tieneDevolucion'.
 * @param {number} idProveedor - ID del proveedor
 * @returns {Promise<Object>} { success, compras, total, proveedor }
 */
export async function getComprasProveedor(idProveedor) {
  try {
    const res = await fetch(`${API_URL}/ApiGetFacturasCliente.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idProveedor }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error al obtener compras del proveedor:", err);
    throw err;
  }
}

/**
 * Genera el PDF de una devolución de compra
 * @param {number} idCompra - ID de la compra (IdEncabCompra)
 * @returns {Promise<Blob>} Blob del PDF
 */
export async function generarPDFDevolucionCompra(idCompra) {
  try {
    const res = await fetch(`${API_URL}/ApiGenerarPDFDevolucion.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idCompra }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error respuesta API (compras):", errorText);
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const pdfBlob = await res.blob();
    console.log("PDF Devolución de compra obtenido, tamaño:", pdfBlob.size);
    return pdfBlob;
  } catch (err) {
    console.error("Error en generarPDFDevolucionCompra:", err);
    throw err;
  }
}

/**
 * Valida los datos de una devolución de compra antes de guardar
 * @param {Object} datosDevolucion - Datos a validar
 * @returns {Object} { valido: boolean, errores: string[] }
 */
export function validarDevolucionCompra(datosDevolucion) {
  const errores = [];

  if (!datosDevolucion.idCompra || datosDevolucion.idCompra <= 0) {
    errores.push("ID de compra no válido");
  }

  if (!datosDevolucion.fechaDevolucion) {
    errores.push("Fecha de devolución requerida");
  }

  if (!datosDevolucion.detalles || datosDevolucion.detalles.length === 0) {
    errores.push("Debe incluir al menos un producto para devolución");
  } else {
    datosDevolucion.detalles.forEach((detalle, index) => {
      if (!detalle.idDetProducto || detalle.idDetProducto <= 0) {
        errores.push(`Producto ${index + 1}: ID de detalle no válido`);
      }
      if (!detalle.tallosDevolucion || detalle.tallosDevolucion <= 0) {
        errores.push(`Producto ${index + 1}: Cantidad de tallos no válida`);
      }
    });
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Calcula los totales de una devolución de compra
 * @param {Array} detalles - Array de detalles de productos
 * @returns {Object} { totalProductos, totalTallosDevolucion, valorDevolucion }
 */
export function calcularTotalesDevolucionCompra(detalles) {
  const totalProductos = detalles.length;
  const totalTallosDevolucion = detalles.reduce((sum, det) => sum + (det.tallosDevolucion || 0), 0);
  const valorDevolucion = detalles.reduce((sum, det) => {
    const precio = det.precioCompra || 0;
    const tallos = det.tallosDevolucion || 0;
    return sum + (precio * tallos);
  }, 0);

  return {
    totalProductos,
    totalTallosDevolucion,
    valorDevolucion: parseFloat(valorDevolucion.toFixed(2))
  };
}

/**
 * Elimina una devolución de compra (anula los campos de devolución en encabezado y detalle)
 * @param {number} idDevolucion - ID de la devolución a eliminar
 * @returns {Promise<Object>} { success, message, idDevolucion, idCompra }
 */
export async function eliminarDevolucionCompra(idDevolucion) {
  try {
    const res = await fetch(`${API_URL}/ApiEliminarDevolucion.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idDevolucion }),
    });
    
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("Error al eliminar devolución de compra:", err);
    throw err;
  }
}