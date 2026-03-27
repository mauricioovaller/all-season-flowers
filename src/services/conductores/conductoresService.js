// src/services/conductores/conductoresService.js
const API_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/conductores";

/**
 * Obtiene la lista de conductores con filtros
 */
export async function getConductores(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetConductores.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al obtener conductores");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener conductores:", err);
    return {
      success: false,
      conductores: [],
      estadisticas: { total: 0, activos: 0, inactivos: 0 },
      total: 0,
      message: err.message
    };
  }
}

/**
 * Obtiene un conductor específico por ID
 */
export async function getConductorById(idConductor) {
  try {
    const res = await fetch(`${API_URL}/ApiGetConductorById.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idConductor }),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Conductor no encontrado");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener conductor:", err);
    throw err;
  }
}

/**
 * Guarda o actualiza un conductor
 */
export async function guardarConductor(conductorData) {
  try {
    const datosParaEnviar = {
      ...conductorData,
      ACTIVO: conductorData.ACTIVO ? 1 : 0
    };

    const res = await fetch(`${API_URL}/ApiGuardarConductor.php`, {
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
      throw new Error(data.message || "Error al guardar conductor");
    }

    return data;
  } catch (err) {
    console.error("Error al guardar conductor:", err);
    
    let mensajeError = err.message;
    
    if (err.message.includes("Ya existe un conductor con ese nombre")) {
      mensajeError = "Ya existe un conductor con ese nombre.";
    } else if (err.message.includes("Ya existe un conductor con esa cédula")) {
      mensajeError = "Ya existe un conductor con esa cédula.";
    } else if (err.message.includes("Ya existe un conductor con esas placas")) {
      mensajeError = "Ya existe un conductor con esas placas.";
    } else if (err.message.includes("no puede exceder")) {
      mensajeError = err.message;
    } else if (err.message.includes("Failed to fetch")) {
      mensajeError = "No se pudo conectar con el servidor.";
    }
    
    throw new Error(mensajeError);
  }
}

/**
 * Elimina (desactiva) un conductor
 */
export async function eliminarConductor(idConductor) {
  try {
    const res = await fetch(`${API_URL}/ApiEliminarConductor.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idConductor }),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al eliminar conductor");
    }

    return data;
  } catch (err) {
    console.error("Error al eliminar conductor:", err);
    throw err;
  }
}

/**
 * Valida si un campo único ya existe
 */
export async function validarCampoUnico(campo, valor, idExcluir = null) {
  try {
    if (!valor || valor.trim() === '' || !campo) {
      return false;
    }

    const res = await fetch(`${API_URL}/ApiValidarCampoUnico.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        campo: campo,
        valor: valor.trim(),
        idExcluir: idExcluir || 0
      }),
    });

    if (!res.ok) {
      console.warn("Error validando campo único, asumiendo válido:", res.status);
      return false;
    }

    const data = await res.json();
    return data.existe || false;
    
  } catch (err) {
    console.error("Error al validar campo único:", err);
    return false;
  }
}

/**
 * Obtiene estadísticas de conductores
 */
export async function getEstadisticasConductores() {
  try {
    const res = await fetch(`${API_URL}/ApiGetConductores.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

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