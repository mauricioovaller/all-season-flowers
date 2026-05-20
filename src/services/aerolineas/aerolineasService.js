// src/services/aerolineas/aerolineasService.js

const API_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/aerolineas";

export async function getAerolineas(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetAerolineas.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    if (!data.success)
      throw new Error(data.message || "Error al obtener aerolíneas");
    return data;
  } catch (err) {
    console.error("Error al obtener aerolíneas:", err);
    return {
      success: false,
      aerolineas: [],
      estadisticas: { total: 0 },
      total: 0,
      message: err.message,
    };
  }
}

export async function guardarAerolinea(aerolineaData) {
  try {
    const res = await fetch(`${API_URL}/ApiGuardarAerolinea.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aerolineaData),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error HTTP ${res.status}: ${errorText}`);
    }
    const data = await res.json();
    if (!data.success)
      throw new Error(data.message || "Error al guardar aerolínea");
    return data;
  } catch (err) {
    console.error("Error al guardar aerolínea:", err);
    let mensaje = err.message;
    if (err.message.includes("Ya existe una aerolínea con ese nombre")) {
      mensaje =
        "Ya existe una aerolínea con ese nombre. Use un nombre diferente.";
    } else if (err.message.includes("Failed to fetch")) {
      mensaje =
        "No se pudo conectar con el servidor. Verifique su conexión a internet.";
    }
    throw new Error(mensaje);
  }
}

export async function eliminarAerolinea(idAerolinea) {
  const res = await fetch(`${API_URL}/ApiEliminarAerolinea.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idAerolinea }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message || "Error al eliminar aerolínea");
  return data;
}

export async function validarNombreAerolinea(nombre, idExcluir = null) {
  try {
    const res = await fetch(`${API_URL}/ApiValidarNombreAerolinea.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, idExcluir }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.existe === true;
  } catch {
    return false;
  }
}
