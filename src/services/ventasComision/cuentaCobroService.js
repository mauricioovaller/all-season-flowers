import { apiUrl } from '../../config/api.js';

const API_URL = apiUrl('ventasComision/cuentaCobro');

/**
 * Obtiene pedidos para cuenta de cobro en un rango de fechas
 * @param {Object} filtros { fechaInicio, fechaFin, idCliente (opcional) }
 * @returns {Promise<Object>}
 */
export async function getPedidosParaCobro(filtros) {
  try {
    const res = await fetch(`${API_URL}/ApiGetPedidosParaCobro.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error al obtener pedidos para cobro:', err);
    return { success: false, pedidos: [], totalPedidos: 0, message: err.message };
  }
}

/**
 * Genera PDF de cuenta de cobro consolidada
 * @param {Object} datos { fechaInicio, fechaFin, idCliente, pedidos }
 * @returns {Promise<Blob>}
 */
export async function generarPDFCuentaCobro(datos) {
  const res = await fetch(`${API_URL}/ApiGenerarPDFCuentaCobro.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  return await res.blob();
}

/**
 * Marca pedidos como facturados (excluirlos de futuras cuentas de cobro)
 * @param {number[]} idsPedidos
 * @returns {Promise<Object>}
 */
export async function marcarPedidosFacturados(idsPedidos) {
  const res = await fetch(`${API_URL}/ApiMarcarPedidosFacturados.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idsPedidos }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  return await res.json();
}
