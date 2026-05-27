// src/services/proveedores/proveedoresService.js
import { apiUrl } from '../../config/api.js';
const API_URL = apiUrl('proveedores');

/**
 * Obtiene la lista de proveedores con filtros
 * @param {Object} filtros - Filtros opcionales {busqueda, estado, conIVA}
 * @returns {Promise<Object>} {proveedores, estadisticas, total}
 */
export async function getProveedores(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetProveedores.php`, {
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
      throw new Error(data.message || "Error al obtener proveedores");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener proveedores:", err);

    // Fallback: Retornar estructura vacía pero válida
    return {
      success: false,
      proveedores: [],
      estadisticas: {
        total: 0,
        activos: 0,
        conIVA: 0,
        inactivos: 0,
      },
      total: 0,
      message: err.message,
    };
  }
}

/**
 * Obtiene un proveedor específico por ID
 * @param {number} idProveedor - ID del proveedor
 * @returns {Promise<Object>} {success, proveedor}
 */
export async function getProveedorById(idProveedor) {
  try {
    const res = await fetch(`${API_URL}/ApiGetProveedorById.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idProveedor }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Proveedor no encontrado");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener proveedor:", err);
    throw err;
  }
}

/**
 * Guarda o actualiza un proveedor
 * @param {Object} proveedorData - Datos del proveedor
 * @returns {Promise<Object>} {success, message, idProveedor, fechaRegistro}
 */
export async function guardarProveedor(proveedorData) {
  try {
    // Preparar datos para el backend
    const datosParaEnviar = {
      ...proveedorData,
      // Asegurar que el campo bit sea número
      IVA: proveedorData.IVA ? 1 : 0,
      // Asegurar que Estado sea string
      Estado: proveedorData.Estado || "Activo",
    };

    console.log("Enviando datos al servidor:", datosParaEnviar);

    const res = await fetch(`${API_URL}/ApiGuardarProveedor.php`, {
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
      throw new Error(data.message || "Error al guardar proveedor");
    }

    console.log("Respuesta del servidor:", data);
    return data;
  } catch (err) {
    console.error("Error al guardar proveedor:", err);

    // Propagar el error con información útil
    let mensajeError = err.message;

    if (err.message.includes("NIT ya está registrado")) {
      mensajeError =
        "El NIT ya está registrado para otro proveedor. Por favor verifique.";
    } else if (err.message.includes("Ya existe un proveedor con ese nombre")) {
      mensajeError =
        "Ya existe un proveedor con ese nombre. Por favor use un nombre diferente.";
    } else if (err.message.includes("Failed to fetch")) {
      mensajeError =
        "No se pudo conectar con el servidor. Verifique su conexión a internet.";
    }

    throw new Error(mensajeError);
  }
}

/**
 * Elimina (desactiva) un proveedor
 * @param {number} idProveedor - ID del proveedor a eliminar
 * @returns {Promise<Object>} {success, message}
 */
export async function eliminarProveedor(idProveedor) {
  try {
    const res = await fetch(`${API_URL}/ApiEliminarProveedor.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idProveedor }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Error al eliminar proveedor");
    }

    return data;
  } catch (err) {
    console.error("Error al eliminar proveedor:", err);
    throw err;
  }
}

/**
 * Obtiene el último código de proveedor generado
 * @returns {Promise<Object>} {success, ultimoCodigo, siguiente, siguienteCodigo}
 */
export async function getUltimoCodigoProveedor() {
  try {
    const res = await fetch(`${API_URL}/ApiGetUltimoCodigoProveedor.php`, {
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
        ultimoCodigo: "PROV-000",
        siguiente: 1,
        siguienteCodigo: "PROV-001",
      };
    }

    return data;
  } catch (err) {
    console.error("Error al obtener último código:", err);

    // Fallback: Valores por defecto
    return {
      success: true,
      ultimoCodigo: "PROV-000",
      siguiente: 1,
      siguienteCodigo: "PROV-001",
      message: "Usando valor por defecto por error de conexión",
    };
  }
}

/**
 * Valida si un NIT ya existe para proveedores
 * @param {string|number} nit - NIT a validar
 * @param {number} idExcluir - ID del proveedor a excluir (para edición)
 * @returns {Promise<boolean>} true si existe, false si no
 */
export async function validarNITExistente(nit, idExcluir = null) {
  try {
    if (!nit || nit.toString().trim() === "") {
      return false; // NIT vacío siempre es válido
    }

    const res = await fetch(`${API_URL}/ApiValidarNIT.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nit: nit.toString().trim(),
        idExcluir: idExcluir || 0,
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
 * Genera un nuevo código de proveedor automáticamente
 * @returns {Promise<string>} Código generado (ej: "PROV-001")
 */
export async function generarCodigoProveedor() {
  try {
    const data = await getUltimoCodigoProveedor();
    return data.siguienteCodigo;
  } catch (err) {
    console.error("Error generando código:", err);
    // Generar código aleatorio como fallback
    const randomNum = Math.floor(Math.random() * 999) + 1;
    return `PROV-${String(randomNum).padStart(3, "0")}`;
  }
}

/**
 * Obtiene estadísticas de proveedores
 * @returns {Promise<Object>} {total, activos, conIVA, inactivos}
 */
export async function getEstadisticasProveedores() {
  try {
    const res = await fetch(`${API_URL}/ApiGetProveedores.php`, {
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
      return (
        data.estadisticas || {
          total: 0,
          activos: 0,
          conIVA: 0,
          inactivos: 0,
        }
      );
    }

    return {
      total: 0,
      activos: 0,
      conIVA: 0,
      inactivos: 0,
    };
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    return {
      total: 0,
      activos: 0,
      conIVA: 0,
      inactivos: 0,
    };
  }
}

/**
 * Valida si un nombre de proveedor ya existe
 * @param {string} nombre - Nombre del proveedor a validar
 * @param {number} idExcluir - ID del proveedor a excluir (para edición)
 * @returns {Promise<boolean>} true si existe, false si no
 */
export async function validarNombreProveedorExistente(
  nombre,
  idExcluir = null,
) {
  try {
    if (!nombre || nombre.trim() === "") {
      return false; // Nombre vacío siempre es válido
    }

    const res = await fetch(`${API_URL}/ApiValidarNombreProveedor.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre: nombre.trim(),
        idExcluir: idExcluir || 0,
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

/**
 * Activa un proveedor (cambia estado a 'Activo')
 * @param {number} idProveedor - ID del proveedor a activar
 * @returns {Promise<Object>} {success, message}
 */
export async function activarProveedor(idProveedor) {
  try {
    const res = await fetch(`${API_URL}/ApiActivarProveedor.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idProveedor }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Error al activar proveedor");
    }

    return data;
  } catch (err) {
    console.error("Error al activar proveedor:", err);
    throw err;
  }
}

/**
 * Desactiva un proveedor (cambia estado a 'Inactivo')
 * @param {number} idProveedor - ID del proveedor a desactivar
 * @returns {Promise<Object>} {success, message}
 */
export async function desactivarProveedor(idProveedor) {
  try {
    const res = await fetch(`${API_URL}/ApiDesactivarProveedor.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idProveedor }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Error al desactivar proveedor");
    }

    return data;
  } catch (err) {
    console.error("Error al desactivar proveedor:", err);
    throw err;
  }
}

/**
 * Obtiene proveedores con IVA activo
 * @returns {Promise<Array>} Lista de proveedores con IVA
 */
export async function getProveedoresConIVA() {
  try {
    const res = await fetch(`${API_URL}/ApiGetProveedoresConIVA.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (data.success) {
      return data.proveedores || [];
    }

    return [];
  } catch (err) {
    console.error("Error al obtener proveedores con IVA:", err);
    return [];
  }
}

/**
 * Obtiene proveedores por ciudad
 * @param {string} ciudad - Ciudad a filtrar
 * @returns {Promise<Array>} Lista de proveedores en la ciudad
 */
export async function getProveedoresPorCiudad(ciudad) {
  try {
    const res = await fetch(`${API_URL}/ApiGetProveedoresPorCiudad.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ciudad }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (data.success) {
      return data.proveedores || [];
    }

    return [];
  } catch (err) {
    console.error("Error al obtener proveedores por ciudad:", err);
    return [];
  }
}
