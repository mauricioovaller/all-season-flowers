// src/services/pedidos/pedidosService.js
const API_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/pedidos";

/**
 * Obtiene datos para los selects del formulario de pedidos
 */
export async function getDatosSelect() {
  try {
    const res = await fetch(
      `${API_URL}/ApiGetDatosSelect.php`,
      {
        method: "POST",
      }
    );
    
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }
    
    return await res.json();
    
  } catch (err) {
    console.error("Error al cargar datos:", err);
    throw err;
  }
}

/**
 * Obtiene variedades y grados según el producto seleccionado
 * @param {number} idProducto - ID del producto
 * @returns {Promise<Object>} Datos de variedades y grados
 */
export async function getVariedadesYGrados(idProducto) {
  try {
    const res = await fetch(
      `${API_URL}/ApiGetSelecVariedGrado.php`,
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idProducto })
      }
    );
    
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Formatear los datos para que sean consistentes
    return {
      variedades: data.variedades?.map(v => ({
        id: v.id.toString(),
        nombre: v.nombre
      })) || [],
      grados: data.grados?.map(g => ({
        id: g.id.toString(),
        nombre: g.nombre
      })) || []
    };
    
  } catch (err) {
    console.error("Error al cargar variedades y grados:", err);
    throw err;
  }
}

/**
 * Guarda un pedido completo con empaques y productos
 * @param {Object} pedidoData - Datos completos del pedido
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function guardarPedido(pedidoData) {
  try {
    const res = await fetch(
      `${API_URL}/ApiGuardarPedido.php`,
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pedidoData)
      }
    );
    
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }
    
    return await res.json();
    
  } catch (err) {
    console.error("Error al guardar pedido:", err);
    throw err;
  }
}

/**
 * Guarda un pedido completo en la base de datos
 * @param {Object} pedidoData - Datos completos del pedido
 * @returns {Promise<Object>} Respuesta del servidor con ID generado
 */
export async function guardarPedidoCompleto(pedidoData) {
  try {
    console.log("Enviando datos al servidor:", pedidoData);
    
    const res = await fetch(
      `${API_URL}/ApiGuardarPedidoCompleto.php`,
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pedidoData)
      }
    );
    
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }
    
    const respuesta = await res.json();
    console.log("Respuesta del servidor:", respuesta);
    return respuesta;
    
  } catch (err) {
    console.error("Error al guardar pedido completo:", err);
    throw err;
  }
}