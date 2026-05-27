// src/services/grados/gradosService.js
import { apiUrl } from '../../config/api.js';
const API_URL = apiUrl('grados');
const API_PRODUCTOS = apiUrl('productos');

/**
 * Obtiene productos para el selector (misma función que en variedades)
 */
export async function getProductosParaSelector() {
  try {
    const res = await fetch(`${API_URL}/ApiGetProductosParaSelector.php`, {
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
    return data.success ? data.productos : [];
  } catch (err) {
    console.error("Error al obtener productos:", err);
    return [];
  }
}

/**
 * Obtiene la lista de grados con filtros
 */
export async function getGrados(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetGrados.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al obtener grados");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener grados:", err);
    return {
      success: false,
      grados: [],
      estadisticas: { total: 0, activos: 0, inactivos: 0 },
      total: 0,
      message: err.message
    };
  }
}

/**
 * Obtiene un grado específico por ID
 */
export async function getGradoById(idGrado) {
  try {
    const res = await fetch(`${API_URL}/ApiGetGradoById.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idGrado }),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Grado no encontrado");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener grado:", err);
    throw err;
  }
}

/**
 * Guarda o actualiza un grado
 */
export async function guardarGrado(gradoData) {
  try {
    const datosParaEnviar = {
      ...gradoData,
      ACTIVO: gradoData.ACTIVO ? 1 : 0
    };

    const res = await fetch(`${API_URL}/ApiGuardarGrado.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosParaEnviar),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al guardar grado");
    }

    return data;
  } catch (err) {
    console.error("Error al guardar grado:", err);
    
    let mensajeError = err.message;
    
    if (err.message.includes("Ya existe un grado con ese nombre")) {
      mensajeError = "Ya existe un grado con ese nombre para este producto.";
    } else if (err.message.includes("no puede exceder")) {
      mensajeError = err.message;
    } else if (err.message.includes("Failed to fetch")) {
      mensajeError = "No se pudo conectar con el servidor.";
    }
    
    throw new Error(mensajeError);
  }
}

/**
 * Elimina (desactiva) un grado
 */
export async function eliminarGrado(idGrado) {
  try {
    const res = await fetch(`${API_URL}/ApiEliminarGrado.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idGrado }),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al eliminar grado");
    }

    return data;
  } catch (err) {
    console.error("Error al eliminar grado:", err);
    throw err;
  }
}

/**
 * Valida si un nombre de grado ya existe para un producto
 */
export async function validarNombreGradoExistente(nombre, idProducto, idExcluir = null) {
  try {
    if (!nombre || nombre.trim() === '' || !idProducto) {
      return false;
    }

    const res = await fetch(`${API_URL}/ApiValidarNombreGrado.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        nombre: nombre.trim(),
        idProducto: idProducto,
        idExcluir: idExcluir || 0
      }),
    });

    if (!res.ok) {
      console.warn("Error validando nombre, asumiendo válido:", res.status);
      return false;
    }

    const data = await res.json();
    return data.existe || false;
    
  } catch (err) {
    console.error("Error al validar nombre:", err);
    return false;
  }
}