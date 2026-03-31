// src/services/devoluciones/devolucionesService.js
const API_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/devoluciones";
/**
 * Obtiene el último número de devolución (IdDevolucion) y el siguiente formateado
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
    console.error("Error al obtener último número de devolución:", err);
    return {
      success: false,
      ultimoNumero: 0,
      siguienteNumeroFormateado: "DEV-000001",
    };
  }
}

/**
 * Obtiene el detalle de una factura (productos) para devolución
 * @param {number} idFactura - ID de la factura (IdEncabPedido)
 * @returns {Promise<Object>} { success, detalle, total }
 */
export async function getDetalleFactura(idFactura) {
  try {
    const res = await fetch(`${API_URL}/ApiGetDetalleFactura.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idFactura }),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener detalle de factura:", err);
    throw err;
  }
}

/**
 * Guarda una devolución (actualiza factura y detalles)
 * @param {Object} datosDevolucion
 * @returns {Promise<Object>}
 */
export async function guardarDevolucion(datosDevolucion) {
  try {
    const res = await fetch(`${API_URL}/ApiGuardarDevolucion.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosDevolucion),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al guardar devolución:", err);
    throw err;
  }
}

/**
 * Obtiene los datos de una devolución existente (para editar)
 * @param {number} idFactura - ID de la factura (IdEncabPedido)
 * @returns {Promise<Object>} { success, encabezado, detalle }
 */
export async function getDevolucionEspecifica(idFactura) {
  try {
    const res = await fetch(`${API_URL}/ApiGetDevolucionEspecifica.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idFactura }),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener devolución específica:", err);
    throw err;
  }
}

/**
 * Busca devoluciones (facturas con IdDevolucion no nulo)
 * @param {Object} filtros
 * @returns {Promise<Object>}
 */
export async function buscarDevoluciones(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiBuscarDevoluciones.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al buscar devoluciones:", err);
    throw err;
  }
}

/**
 * Obtiene las facturas (con número de factura) de un cliente específico.
 * Incluye todas, incluso las que ya tienen devolución, con indicador 'tieneDevolucion'.
 * @param {number} idCliente - ID del cliente
 * @returns {Promise<Object>} Respuesta con array de facturas
 */
export async function getFacturasCliente(idCliente) {
  try {
    const res = await fetch(`${API_URL}/ApiGetFacturasCliente.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idCliente }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error al obtener facturas del cliente:", err);
    throw err;
  }
}

/**
 * Genera el PDF de una devolución
 * @param {number} idFactura - ID de la factura (IdEncabPedido)
 * @returns {Promise<Blob>} Blob del PDF
 */
export async function generarPDFDevolucion(idFactura) {
  try {
    const res = await fetch(`${API_URL}/ApiGenerarPDFDevolucion.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idFactura }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error respuesta API:", errorText);
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const pdfBlob = await res.blob();
    console.log("PDF Devolución obtenido, tamaño:", pdfBlob.size);
    return pdfBlob;
  } catch (err) {
    console.error("Error en generarPDFDevolucion:", err);
    throw err;
  }
}

/**
 * Elimina una devolución (anula los campos de devolución en encabezado y detalle)
 * @param {number} idDevolucion - ID de la devolución a eliminar
 * @returns {Promise<Object>} { success, message, idDevolucion, idFactura }
 */
export async function eliminarDevolucion(idDevolucion) {
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
    console.error("Error al eliminar devolución:", err);
    throw err;
  }
}
