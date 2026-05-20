// src/services/empaques/empaquesService.js

const API_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/empaques";

export async function getEmpaques(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetEmpaques.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    if (!data.success)
      throw new Error(data.message || "Error al obtener empaques");
    return data;
  } catch (err) {
    console.error("Error al obtener empaques:", err);
    return {
      success: false,
      empaques: [],
      estadisticas: { total: 0 },
      total: 0,
      message: err.message,
    };
  }
}

export async function guardarEmpaque(empaqueData) {
  try {
    const datosParaEnviar = {
      ...empaqueData,
      EquivFull: parseFloat(empaqueData.EquivFull) || 0,
    };
    const res = await fetch(`${API_URL}/ApiGuardarEmpaque.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosParaEnviar),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error HTTP ${res.status}: ${errorText}`);
    }
    const data = await res.json();
    if (!data.success)
      throw new Error(data.message || "Error al guardar empaque");
    return data;
  } catch (err) {
    console.error("Error al guardar empaque:", err);
    let mensaje = err.message;
    if (err.message.includes("Ya existe un empaque con esa abreviatura")) {
      mensaje =
        "Ya existe un empaque con esa abreviatura. Use una abreviatura diferente.";
    } else if (err.message.includes("Failed to fetch")) {
      mensaje =
        "No se pudo conectar con el servidor. Verifique su conexión a internet.";
    }
    throw new Error(mensaje);
  }
}

export async function eliminarEmpaque(idTipoEmpaque) {
  const res = await fetch(`${API_URL}/ApiEliminarEmpaque.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idTipoEmpaque }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message || "Error al eliminar empaque");
  return data;
}

export async function validarAbreviatura(abreviatura, idExcluir = null) {
  try {
    const res = await fetch(`${API_URL}/ApiValidarAbreviatura.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ abreviatura, idExcluir }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.existe === true;
  } catch {
    return false;
  }
}
