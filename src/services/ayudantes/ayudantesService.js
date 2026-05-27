// src/services/ayudantes/ayudantesService.js
import { apiUrl } from '../../config/api.js';
const API_URL = apiUrl('ayudantes');

/**
 * Obtiene la lista de ayudantes con filtros
 */
export async function getAyudantes(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetAyudantes.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al obtener ayudantes");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener ayudantes:", err);
    return {
      success: false,
      ayudantes: [],
      estadisticas: { total: 0, activos: 0, inactivos: 0 },
      total: 0,
      message: err.message
    };
  }
}

/**
 * Obtiene un ayudante específico por ID
 */
export async function getAyudanteById(idAyudante) {
  try {
    const res = await fetch(`${API_URL}/ApiGetAyudanteById.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idAyudante }),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Ayudante no encontrado");
    }

    return data;
  } catch (err) {
    console.error("Error al obtener ayudante:", err);
    throw err;
  }
}

/**
 * Guarda o actualiza un ayudante
 */
export async function guardarAyudante(ayudanteData) {
  try {
    const datosParaEnviar = {
      ...ayudanteData,
      ACTIVO: ayudanteData.ACTIVO ? 1 : 0
    };

    // Convertir NoCedula a número o null
    if (datosParaEnviar.NoCedula !== undefined && datosParaEnviar.NoCedula !== '') {
      datosParaEnviar.NoCedula = parseInt(datosParaEnviar.NoCedula);
    } else {
      datosParaEnviar.NoCedula = null;
    }

    const res = await fetch(`${API_URL}/ApiGuardarAyudante.php`, {
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
      throw new Error(data.message || "Error al guardar ayudante");
    }

    return data;
  } catch (err) {
    console.error("Error al guardar ayudante:", err);
    
    let mensajeError = err.message;
    
    if (err.message.includes("Ya existe un ayudante con ese nombre")) {
      mensajeError = "Ya existe un ayudante con ese nombre.";
    } else if (err.message.includes("Ya existe un ayudante con esa cédula")) {
      mensajeError = "Ya existe un ayudante con esa cédula.";
    } else if (err.message.includes("no puede exceder")) {
      mensajeError = err.message;
    } else if (err.message.includes("Failed to fetch")) {
      mensajeError = "No se pudo conectar con el servidor.";
    }
    
    throw new Error(mensajeError);
  }
}

/**
 * Elimina (desactiva) un ayudante
 */
export async function eliminarAyudante(idAyudante) {
  try {
    const res = await fetch(`${API_URL}/ApiEliminarAyudante.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idAyudante }),
    });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error al eliminar ayudante");
    }

    return data;
  } catch (err) {
    console.error("Error al eliminar ayudante:", err);
    throw err;
  }
}

/**
 * Valida si un campo único ya existe
 */
export async function validarCampoUnicoAyudante(campo, valor, idExcluir = null) {
  try {
    if (!valor || valor === '' || !campo) {
      return false;
    }

    const res = await fetch(`${API_URL}/ApiValidarCampoUnicoAyudante.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        campo: campo,
        valor: campo === "NoCedula" ? parseInt(valor) : valor.trim(),
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
 * Obtiene estadísticas de ayudantes
 */
export async function getEstadisticasAyudantes() {
  try {
    const res = await fetch(`${API_URL}/ApiGetAyudantes.php`, {
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