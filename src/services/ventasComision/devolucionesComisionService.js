import { apiUrl } from '../../config/api.js';

const API_URL = apiUrl('ventasComision/devoluciones');

/**
 * Obtiene el último número de devolución
 * @returns {Promise<{success: boolean, ultimoNumero: number, siguienteNumeroFormateado: string}>}
 */
export async function obtenerUltimoNumeroDevolucion() {
  try {
    const res = await fetch(`${API_URL}/ApiGetUltimoNumeroDevolucion.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const text = await res.text();
    const data = JSON.parse(text);

    if (data.success) {
      const sig = (data.ultimoNumero || 0) + 1;
      data.siguienteNumeroFormateado = `DEV-${String(sig).padStart(6, '0')}`;
    }
    return data;
  } catch (err) {
    console.error('Error al obtener último número de devolución:', err);
    return { success: false, ultimoNumero: 0, siguienteNumeroFormateado: 'DEV-000001' };
  }
}

/**
 * Obtiene facturas (pedidos facturados) de un cliente
 * @param {number} idCliente
 * @returns {Promise<Object>}
 */
export async function getFacturasCliente(idCliente) {
  try {
    const res = await fetch(`${API_URL}/ApiGetFacturasCliente.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idCliente }),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error al obtener facturas del cliente:', err);
    return { success: false, facturas: [], total: 0, message: err.message };
  }
}

/**
 * Obtiene el detalle de una factura para una nueva devolución
 * @param {number} idFactura
 * @returns {Promise<Object>}
 */
export async function getDetalleFactura(idFactura) {
  const res = await fetch(`${API_URL}/ApiGetDetalleFactura.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idFactura }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  return await res.json();
}

/**
 * Guarda (crea o actualiza) una devolución
 * @param {Object} datosDevolucion
 * @returns {Promise<Object>}
 */
export async function guardarDevolucion(datosDevolucion) {
  const res = await fetch(`${API_URL}/ApiGuardarDevolucion.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosDevolucion),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Error al guardar devolución');
  return data;
}

/**
 * Obtiene una devolución específica para edición
 * @param {number} idFactura
 * @returns {Promise<Object>}
 */
export async function getDevolucionEspecifica(idFactura) {
  const res = await fetch(`${API_URL}/ApiGetDevolucionEspecifica.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idFactura }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Error al obtener devolución');
  return data;
}

/**
 * Busca devoluciones con filtros
 * @param {Object} filtros
 * @returns {Promise<Object>}
 */
export async function buscarDevoluciones(filtros) {
  try {
    const res = await fetch(`${API_URL}/ApiBuscarDevoluciones.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error al buscar devoluciones:', err);
    return { success: false, devoluciones: [], total: 0, message: err.message };
  }
}

/**
 * Genera PDF de una devolución
 * @param {number} idFactura
 * @returns {Promise<Blob>}
 */
export async function generarPDFDevolucion(idFactura) {
  const res = await fetch(`${API_URL}/ApiGenerarPDFDevolucion.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idFactura }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  return await res.blob();
}

/**
 * Elimina (anula) una devolución
 * @param {number} idDevolucion
 * @returns {Promise<Object>}
 */
export async function eliminarDevolucion(idDevolucion) {
  const res = await fetch(`${API_URL}/ApiEliminarDevolucion.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idDevolucion }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  return await res.json();
}
