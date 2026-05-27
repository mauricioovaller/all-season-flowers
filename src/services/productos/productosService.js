// src/services/productos/productosService.js 
import { apiUrl } from '../../config/api.js';
const API_URL = apiUrl('productos');

/**
 * Obtiene la lista de productos con filtros
 * @param {Object} filtros - Filtros opcionales {busqueda, estado}
 * @returns {Promise<Object>} {productos, estadisticas, total}
 */
export async function getProductos(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetProductos.php`, {
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
      throw new Error(data.message || "Error al obtener productos");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener productos:", err);
    
    // Fallback: Retornar estructura vacía pero válida
    return {
      success: false,
      productos: [],
      estadisticas: {
        total: 0,
        activos: 0,
        inactivos: 0
      },
      total: 0,
      message: err.message
    };
  }
}

/**
 * Obtiene un producto específico por ID
 * @param {number} idProducto - ID del producto
 * @returns {Promise<Object>} {success, producto}
 */
export async function getProductoById(idProducto) {
  try {
    const res = await fetch(`${API_URL}/ApiGetProductoById.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idProducto }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Producto no encontrado");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener producto:", err);
    throw err;
  }
}

/**
 * Guarda o actualiza un producto
 * @param {Object} productoData - Datos del producto
 * @returns {Promise<Object>} {success, message, idProducto}
 */
export async function guardarProducto(productoData) {
  try {
    // Preparar datos para el backend
    const datosParaEnviar = {
      ...productoData,
      ACTIVO: productoData.ACTIVO ? 1 : 0
    };

    console.log("Enviando datos al servidor:", datosParaEnviar);

    const res = await fetch(`${API_URL}/ApiGuardarProducto.php`, {
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
      throw new Error(data.message || "Error al guardar producto");
    }

    console.log("Respuesta del servidor:", data);
    return data;
  } catch (err) {
    console.error("Error al guardar producto:", err);
    
    // Propagar el error con información útil
    let mensajeError = err.message;
    
    if (err.message.includes("Ya existe un producto con ese nombre")) {
      mensajeError = "Ya existe un producto con ese nombre. Por favor use un nombre diferente.";
    } else if (err.message.includes("no puede exceder")) {
      mensajeError = err.message;
    } else if (err.message.includes("Failed to fetch")) {
      mensajeError = "No se pudo conectar con el servidor. Verifique su conexión a internet.";
    }
    
    throw new Error(mensajeError);
  }
}

/**
 * Elimina (desactiva) un producto
 * @param {number} idProducto - ID del producto a eliminar
 * @returns {Promise<Object>} {success, message}
 */
export async function eliminarProducto(idProducto) {
  try {
    const res = await fetch(`${API_URL}/ApiEliminarProducto.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idProducto }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al eliminar producto");
    }

    return data;
  } catch (err) {
    console.error("Error al eliminar producto:", err);
    throw err;
  }
}

/**
 * Valida si un nombre de producto ya existe
 * @param {string} nombre - Nombre del producto a validar
 * @param {number} idExcluir - ID del producto a excluir (para edición)
 * @returns {Promise<boolean>} true si existe, false si no
 */
export async function validarNombreProductoExistente(nombre, idExcluir = null) {
  try {
    if (!nombre || nombre.trim() === '') {
      return false; // Nombre vacío siempre es válido
    }

    const res = await fetch(`${API_URL}/ApiValidarNombreProducto.php`, {
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

/**
 * Obtiene estadísticas de productos
 * @returns {Promise<Object>} {total, activos, inactivos}
 */
export async function getEstadisticasProductos() {
  try {
    const res = await fetch(`${API_URL}/ApiGetProductos.php`, {
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
        inactivos: 0
      };
    }
    
    return {
      total: 0,
      activos: 0,
      inactivos: 0
    };
    
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    return {
      total: 0,
      activos: 0,
      inactivos: 0
    };
  }
}