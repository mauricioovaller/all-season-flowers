import { apiUrl } from '../../config/api.js';

const API_URL = apiUrl('ventasComision/pedidos');

/**
 * Obtiene datos para selects del formulario
 * @returns {Promise<Object>}
 */
export async function getDatosSelect() {
  try {
    const res = await fetch(`${API_URL}/ApiGetDatosSelect.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    if (data.success) return data;
    throw new Error(data.message || 'Error al obtener datos');
  } catch (err) {
    console.error('Error al obtener datos select:', err);
    return {
      success: false,
      clientes: [],
      ejecutivos: [],
      monedas: [],
      productos: [],
      variedades: [],
      grados: [],
      tipoEmpaque: [],
      unidades: [],
      predios: [],
      aerolineas: [],
      agencias: [],
    };
  }
}

/**
 * Obtiene variedades y grados para un producto
 * @param {number} idProducto
 * @returns {Promise<Object>}
 */
export async function getVariedadesYGrados(idProducto) {
  try {
    const res = await fetch(`${API_URL}/ApiGetSelecVariedGrado.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idProducto }),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error al obtener variedades y grados:', err);
    return { success: false, variedades: [], grados: [] };
  }
}

/**
 * Guarda un pedido completo (encabezado + empaques + productos + recetas)
 * @param {Object} datos
 * @returns {Promise<Object>}
 */
export async function guardarPedidoCompleto(datos) {
  const res = await fetch(`${API_URL}/ApiGuardarPedidoCompleto.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  return await res.json();
}

/**
 * Busca pedidos con filtros
 * @param {Object} filtros
 * @returns {Promise<Object>}
 */
export async function buscarPedidos(filtros) {
  try {
    const res = await fetch(`${API_URL}/ApiGetPedidos.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error al buscar pedidos:', err);
    return { success: false, pedidos: [], total: 0, message: err.message };
  }
}

/**
 * Obtiene un pedido específico por ID
 * @param {number} idPedido
 * @returns {Promise<Object>}
 */
export async function getPedidoEspecifico(idPedido) {
  const res = await fetch(`${API_URL}/ApiGetPedidoEspecifico.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idPedido }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Error al obtener pedido');
  return data;
}

/**
 * Obtiene el último número de pedido
 * @returns {Promise<Object>}
 */
export async function obtenerUltimoNumeroPedido() {
  try {
    const res = await fetch(`${API_URL}/ApiGetUltimoNumeroPedido.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error al obtener último número:', err);
    return { success: false, ultimoNumero: 0, siguienteNumeroFormateado: 'PEC-000001' };
  }
}

/**
 * Genera PDF de un pedido
 * @param {number} idPedido
 * @returns {Promise<Blob>}
 */
export async function generarPDFPedido(idPedido) {
  const res = await fetch(`${API_URL}/ApiGenerarPDFPedido.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idPedido }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  return await res.blob();
}
