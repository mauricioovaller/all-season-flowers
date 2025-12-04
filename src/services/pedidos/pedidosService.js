// Servicio para el módulo de pedidos
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