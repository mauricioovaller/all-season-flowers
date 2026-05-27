// src/services/clientes/clientesService.js 
import { apiUrl } from '../../config/api.js';
const API_URL = apiUrl('clientes');

/**
 * Obtiene la lista de clientes con filtros
 * @param {Object} filtros - Filtros opcionales {busqueda, estado, conIVA}
 * @returns {Promise<Object>} {clientes, estadisticas, total}
 */
export async function getClientes(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetClientes.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al obtener clientes");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener clientes:", err);
    
    // Fallback: Retornar estructura vacía pero válida
    return {
      success: false,
      clientes: [],
      estadisticas: {
        total: 0,
        activos: 0,
        conIVA: 0,
        inactivos: 0
      },
      total: 0,
      message: err.message
    };
  }
}

/**
 * Obtiene un cliente específico por ID
 * @param {number} idCliente - ID del cliente
 * @returns {Promise<Object>} {success, cliente}
 */
export async function getClienteById(idCliente) {
  try {
    const res = await fetch(`${API_URL}/ApiGetClienteById.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idCliente }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Cliente no encontrado");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener cliente:", err);
    throw err;
  }
}

/**
 * Guarda o actualiza un cliente
 * @param {Object} clienteData - Datos del cliente
 * @returns {Promise<Object>} {success, message, idCliente, fechaRegistro}
 */
export async function guardarCliente(clienteData) {
  try {
    // Preparar datos para el backend
    const datosParaEnviar = {
      ...clienteData,
      // Asegurar que los campos bit sean números
      ACTIVO: clienteData.ACTIVO ? 1 : 0,
      IVA: clienteData.IVA ? 1 : 0
    };

    console.log("Enviando datos al servidor:", datosParaEnviar);

    const res = await fetch(`${API_URL}/ApiGuardarCliente.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosParaEnviar),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error respuesta API:", errorText);
      throw new Error(`Error HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al guardar cliente");
    }

    console.log("Respuesta del servidor:", data);
    return data;
  } catch (err) {
    console.error("Error al guardar cliente:", err);
    
    // Propagar el error con información útil
    let mensajeError = err.message;
    
    if (err.message.includes("NIT ya está registrado")) {
      mensajeError = "El NIT ya está registrado para otro cliente. Por favor verifique.";
    } else if (err.message.includes("Ya existe un cliente con ese nombre")) {
      mensajeError = "Ya existe un cliente con ese nombre. Por favor use un nombre diferente.";
    } else if (err.message.includes("Failed to fetch")) {
      mensajeError = "No se pudo conectar con el servidor. Verifique su conexión a internet.";
    }
    
    throw new Error(mensajeError);
  }
}

/**
 * Elimina (desactiva) un cliente
 * @param {number} idCliente - ID del cliente a eliminar
 * @returns {Promise<Object>} {success, message}
 */
export async function eliminarCliente(idCliente) {
  try {
    const res = await fetch(`${API_URL}/ApiEliminarCliente.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idCliente }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al eliminar cliente");
    }

    return data;
  } catch (err) {
    console.error("Error al eliminar cliente:", err);
    throw err;
  }
}

/**
 * Obtiene el último código de cliente generado
 * @returns {Promise<Object>} {success, ultimoCodigo, siguiente, siguienteCodigo}
 */
export async function getUltimoCodigoCliente() {
  try {
    const res = await fetch(`${API_URL}/ApiGetUltimoCodigoCliente.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();
    
    // Si falla, retornar valores por defecto
    if (!data.success) {
      console.warn("API falló, usando valores por defecto:", data.message);
      return {
        success: true,
        ultimoCodigo: "CLI-000",
        siguiente: 1,
        siguienteCodigo: "CLI-001"
      };
    }

    return data;
  } catch (err) {
    console.error("Error al obtener último código:", err);
    
    // Fallback: Valores por defecto
    return {
      success: true,
      ultimoCodigo: "CLI-000",
      siguiente: 1,
      siguienteCodigo: "CLI-001",
      message: "Usando valor por defecto por error de conexión"
    };
  }
}

/**
 * Valida si un NIT ya existe
 * @param {string} nit - NIT a validar
 * @param {number} idExcluir - ID del cliente a excluir (para edición)
 * @returns {Promise<boolean>} true si existe, false si no
 */
export async function validarNITExistente(nit, idExcluir = null) {
  try {
    if (!nit || nit.trim() === '') {
      return false; // NIT vacío siempre es válido
    }

    const res = await fetch(`${API_URL}/ApiValidarNIT.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        nit: nit.trim(),
        idExcluir: idExcluir || 0
      }),
    });

    if (!res.ok) {
      console.warn("Error validando NIT, asumiendo válido:", res.status);
      return false; // Por seguridad, no bloquear
    }

    const data = await res.json();
    return data.existe || false;
    
  } catch (err) {
    console.error("Error al validar NIT:", err);
    return false; // Por seguridad, no bloquear por error de validación
  }
}

/**
 * Genera un nuevo código de cliente automáticamente
 * @returns {Promise<string>} Código generado (ej: "CLI-001")
 */
export async function generarCodigoCliente() {
  try {
    const data = await getUltimoCodigoCliente();
    return data.siguienteCodigo;
  } catch (err) {
    console.error("Error generando código:", err);
    // Generar código aleatorio como fallback
    const randomNum = Math.floor(Math.random() * 999) + 1;
    return `CLI-${String(randomNum).padStart(3, '0')}`;
  }
}

/**
 * Obtiene estadísticas de clientes
 * @returns {Promise<Object>} {total, activos, conIVA, inactivos}
 */
export async function getEstadisticasClientes() {
  try {
    const res = await fetch(`${API_URL}/ApiGetClientes.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();
    
    if (data.success) {
      return data.estadisticas || {
        total: 0,
        activos: 0,
        conIVA: 0,
        inactivos: 0
      };
    }
    
    return {
      total: 0,
      activos: 0,
      conIVA: 0,
      inactivos: 0
    };
    
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    return {
      total: 0,
      activos: 0,
      conIVA: 0,
      inactivos: 0
    };
  }
}

/**
 * Valida si un nombre de cliente ya existe
 * @param {string} nombre - Nombre del cliente a validar
 * @param {number} idExcluir - ID del cliente a excluir (para edición)
 * @returns {Promise<boolean>} true si existe, false si no
 */
export async function validarNombreClienteExistente(nombre, idExcluir = null) {
  try {
    if (!nombre || nombre.trim() === '') {
      return false; // Nombre vacío siempre es válido
    }

    const res = await fetch(`${API_URL}/ApiValidarNombreCliente.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        nombre: nombre.trim(),
        idExcluir: idExcluir || 0
      }),
    });

    if (!res.ok) {
      console.warn("Error validando nombre, asumiendo válido:", res.status);
      return false; // Por seguridad, no bloquear
    }

    const data = await res.json();
    return data.existe || false;
    
  } catch (err) {
    console.error("Error al validar nombre:", err);
    return false; // Por seguridad, no bloquear por error de validación
  }
}