// src/services/variedades/variedadesService.js 
const API_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/variedades";
const API_PRODUCTOS = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/productos";

/**
 * Obtiene productos para el selector
 * @returns {Promise<Array>} Lista de productos activos
 */
export async function getProductosParaSelector() {
  try {
    const res = await fetch(`${API_PRODUCTOS}/ApiGetProductosParaSelector.php`, {
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
 * Obtiene la lista de variedades con filtros
 */
export async function getVariedades(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetVariedades.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al obtener variedades");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener variedades:", err);
    return {
      success: false,
      variedades: [],
      estadisticas: { total: 0, activos: 0, inactivos: 0 },
      total: 0,
      message: err.message
    };
  }
}

/**
 * Obtiene una variedad específica por ID
 */
export async function getVariedadById(idVariedad) {
  try {
    const res = await fetch(`${API_URL}/ApiGetVariedadById.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idVariedad }),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Variedad no encontrada");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener variedad:", err);
    throw err;
  }
}

/**
 * Guarda o actualiza una variedad
 */
export async function guardarVariedad(variedadData) {
  try {
    const datosParaEnviar = {
      ...variedadData,
      ACTIVO: variedadData.ACTIVO ? 1 : 0
    };

    const res = await fetch(`${API_URL}/ApiGuardarVariedad.php`, {
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
      throw new Error(data.message || "Error al guardar variedad");
    }

    return data;
  } catch (err) {
    console.error("Error al guardar variedad:", err);
    
    let mensajeError = err.message;
    
    if (err.message.includes("Ya existe una variedad con ese nombre")) {
      mensajeError = "Ya existe una variedad con ese nombre para este producto.";
    } else if (err.message.includes("no puede exceder")) {
      mensajeError = err.message;
    } else if (err.message.includes("Failed to fetch")) {
      mensajeError = "No se pudo conectar con el servidor.";
    }
    
    throw new Error(mensajeError);
  }
}

/**
 * Elimina (desactiva) una variedad
 */
export async function eliminarVariedad(idVariedad) {
  try {
    const res = await fetch(`${API_URL}/ApiEliminarVariedad.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idVariedad }),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al eliminar variedad");
    }

    return data;
  } catch (err) {
    console.error("Error al eliminar variedad:", err);
    throw err;
  }
}

/**
 * Valida si un nombre de variedad ya existe para un producto
 */
export async function validarNombreVariedadExistente(nombre, idProducto, idExcluir = null) {
  try {
    if (!nombre || nombre.trim() === '' || !idProducto) {
      return false;
    }

    const res = await fetch(`${API_URL}/ApiValidarNombreVariedad.php`, {
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