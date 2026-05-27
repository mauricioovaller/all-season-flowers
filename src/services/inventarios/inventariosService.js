import { apiUrl } from '../../config/api.js';
const API_URL = apiUrl('inventarios');

/**
 * Obtiene el inventario en el nivel y rango de fechas especificados
 * @param {Object} filtros - { fechaInicio, fechaFin, nivel } donde nivel es 1, 2 o 3
 * @returns {Promise<Object>} { success, inventarios, resumen }
 */
export async function getInventario(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiInventario.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Error al obtener inventario");

    return data;
  } catch (err) {
    console.error("Error al obtener inventario:", err);
    return {
      success: false,
      nivel: filtros.nivel || 1,
      fechaInicio: filtros.fechaInicio || "",
      fechaFin: filtros.fechaFin || "",
      inventarios: [],
      resumen: { totalEntradas: 0, totalSalidas: 0, totalSaldo: 0 },
      message: err.message,
    };
  }
}
