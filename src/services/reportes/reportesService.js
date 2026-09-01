// src/services/reportes/reportesService.js
import { apiUrl } from "../../config/api.js";
const API_URL = apiUrl("reportes");

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
        valorUSD: 0,
        valorCOP: 0,
        devolucionUSD: 0,
        devolucionCOP: 0,
        pagadoUSD: 0,
        pagadoCOP: 0,
        saldoUSD: 0,
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
        valorUSD: 0,
        valorCOP: 0,
        devolucionUSD: 0,
        devolucionCOP: 0,
        pagadoUSD: 0,
        pagadoCOP: 0,
        saldoUSD: 0,
        saldoCOP: 0,
      },
      message: err.message,
    };
  }
}

/**
 * Obtiene los despachos aeropuerto para la planilla de entrega en un rango de fechas
 * @param {Object} filtros - { fechaInicio, fechaFin }
 * @returns {Promise<Object>} { success, despachos, totales }
 */
export async function getPlanillaDespacho(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiPlanillaDespacho.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Error al obtener planilla de despacho");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener planilla de despacho:", err);
    return {
      success: false,
      despachos: [],
      totales: { fb: 0, hb: 0, qb: 0, eb: 0, fulles: 0 },
      message: err.message,
    };
  }
}

/**
 * Obtiene las solicitudes muiscas (clientes, guías, agencias, aerolíneas) en un rango de fechas
 * @param {Object} filtros - { fechaInicio, fechaFin }
 * @returns {Promise<Object>} { success, solicitudes, total }
 */
/**
 * Obtiene el consolidado de ventas en un rango de fechas
 * @param {Object} filtros - { fechaInicio, fechaFin }
 * @returns {Promise<Object>} { success, registros, totales }
 */
export async function getConsolidadoVentas(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiConsolidadoVentas.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Error al obtener consolidado de ventas");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener consolidado de ventas:", err);
    return {
      success: false,
      registros: [],
      totales: { subtotal: 0, valorIVA: 0, totalVenta: 0, totalTallos: 0, cantidadRegistros: 0 },
      message: err.message,
    };
  }
}

/**
 * Obtiene el consolidado de ingresos recibidos (pagos de clientes) en un rango de fechas
 * Muestra un renglón por factura pagada, con el costo de transferencia prorrateado y el neto recibido.
 * @param {Object} filtros - { fechaInicio, fechaFin, idCliente?, idMedioPago? }
 * @returns {Promise<Object>} { success, registros, totales }
 */
export async function getIngresosRecibidos(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiIngresosRecibidos.php`, {
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
        data.message || "Error al obtener ingresos recibidos",
      );
    }

    return data;
  } catch (err) {
    console.error("Error al obtener ingresos recibidos:", err);
    return {
      success: false,
      registros: [],
      totales: { porMoneda: {}, cantidadRegistros: 0, cantidadPagos: 0 },
      message: err.message,
    };
  }
}

/**
 * Obtiene el consolidado de compras en un rango de fechas
 * @param {Object} filtros - { fechaInicio, fechaFin }
 * @returns {Promise<Object>} { success, registros, totales }
 */
export async function getConsolidadoCompras(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiConsolidadoCompras.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Error al obtener consolidado de compras");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener consolidado de compras:", err);
    return {
      success: false,
      registros: [],
      totales: { subtotal: 0, valorIVA: 0, totalCompra: 0, totalTallos: 0, cantidadRegistros: 0 },
      message: err.message,
    };
  }
}

/**
 * Obtiene el consolidado de devoluciones de clientes en un rango de fechas
 * @param {Object} filtros - { fechaInicio, fechaFin }
 * @returns {Promise<Object>} { success, registros, totales }
 */
export async function getConsolidadoDevolucionesClientes(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiConsolidadoDevolucionesClientes.php`, {
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
        data.message || "Error al obtener consolidado de devoluciones de clientes",
      );
    }

    return data;
  } catch (err) {
    console.error("Error al obtener consolidado de devoluciones de clientes:", err);
    return {
      success: false,
      registros: [],
      totales: {
        tallosDevueltos: 0,
        subtotal: 0,
        valorIVA: 0,
        totalDevolucion: 0,
        cantidadRegistros: 0,
      },
      message: err.message,
    };
  }
}

/**
 * Obtiene el consolidado de devoluciones de proveedores en un rango de fechas
 * @param {Object} filtros - { fechaInicio, fechaFin }
 * @returns {Promise<Object>} { success, registros, totales }
 */
export async function getConsolidadoDevolucionesProveedores(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiConsolidadoDevolucionesProveedores.php`, {
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
        data.message || "Error al obtener consolidado de devoluciones de proveedores",
      );
    }

    return data;
  } catch (err) {
    console.error("Error al obtener consolidado de devoluciones de proveedores:", err);
    return {
      success: false,
      registros: [],
      totales: {
        tallosDevueltos: 0,
        subtotal: 0,
        valorIVA: 0,
        totalDevolucion: 0,
        cantidadRegistros: 0,
      },
      message: err.message,
    };
  }
}

export async function getSolicitudMuiscas(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiSolicitudMuiscas.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Error al obtener solicitud muiscas");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener solicitud muiscas:", err);
    return {
      success: false,
      solicitudes: [],
      total: 0,
      message: err.message,
    };
  }
}
