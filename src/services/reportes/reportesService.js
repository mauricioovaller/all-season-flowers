// src/services/reportes/reportesService.js
import { apiUrl } from '../../config/api.js';
const API_URL = apiUrl('reportes');

/**
 * Obtiene el estado de cuenta de un cliente en un rango de fechas
 * @param {Object} filtros - { idCliente, fechaInicio, fechaFin }
 * @returns {Promise<Object>} { success, cliente, movimientos, totales }
 */
export async function getEstadoCuentaCliente(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiEstadoCuentaCliente.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(
        data.message || "Error al obtener estado de cuenta del cliente",
      );
    }

    return data;
  } catch (err) {
    console.error("Error al obtener estado de cuenta cliente:", err);
    return {
      success: false,
      cliente: null,
      movimientos: [],
      totales: {
        valorBase: 0,
        valorBaseCOP: 0,
        valorDevolucion: 0,
        valorDevolucionCOP: 0,
        valorPagado: 0,
        valorPagadoCOP: 0,
        saldo: 0,
        saldoCOP: 0,
      },
      message: err.message,
    };
  }
}

/**
 * Obtiene el estado de cuenta de un proveedor en un rango de fechas
 * @param {Object} filtros - { idProveedor, fechaInicio, fechaFin }
 * @returns {Promise<Object>} { success, proveedor, movimientos, totales }
 */
export async function getEstadoCuentaProveedor(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiEstadoCuentaProveedor.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(
        data.message || "Error al obtener estado de cuenta del proveedor",
      );
    }

    return data;
  } catch (err) {
    console.error("Error al obtener estado de cuenta proveedor:", err);
    return {
      success: false,
      proveedor: null,
      movimientos: [],
      totales: {
        valorBase: 0,
        valorBaseCOP: 0,
        valorDevolucion: 0,
        valorDevolucionCOP: 0,
        valorPagado: 0,
        valorPagadoCOP: 0,
        saldo: 0,
        saldoCOP: 0,
      },
      message: err.message,
    };
  }
}
