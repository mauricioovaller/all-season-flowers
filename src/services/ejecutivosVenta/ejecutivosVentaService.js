// src/services/ejecutivosVenta/ejecutivosVentaService.js

const API_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/ejecutivosVenta";

export async function getEjecutivosVenta(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetEjecutivosVenta.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    if (!data.success)
      throw new Error(data.message || "Error al obtener ejecutivos de venta");
    return data;
  } catch (err) {
    console.error("Error al obtener ejecutivos de venta:", err);
    return {
      success: false,
      ejecutivos: [],
      estadisticas: { total: 0, activos: 0, inactivos: 0 },
      total: 0,
      message: err.message,
    };
  }
}

export async function getEjecutivoVentaById(idEjecutivo) {
  const res = await fetch(`${API_URL}/ApiGetEjecutivosVenta.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idEjecutivo }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Ejecutivo no encontrado");
  return data;
}

export async function guardarEjecutivoVenta(ejecutivoData) {
  try {
    const datosParaEnviar = {
      ...ejecutivoData,
      ACTIVO: ejecutivoData.ACTIVO ? 1 : 0,
    };
    const res = await fetch(`${API_URL}/ApiGuardarEjecutivoVenta.php`, {
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
      throw new Error(data.message || "Error al guardar ejecutivo de venta");
    return data;
  } catch (err) {
    console.error("Error al guardar ejecutivo de venta:", err);
    let mensaje = err.message;
    if (
      err.message.includes("Ya existe un ejecutivo de venta con ese nombre")
    ) {
      mensaje =
        "Ya existe un ejecutivo de venta con ese nombre. Use un nombre diferente.";
    } else if (err.message.includes("Failed to fetch")) {
      mensaje =
        "No se pudo conectar con el servidor. Verifique su conexión a internet.";
    }
    throw new Error(mensaje);
  }
}

export async function eliminarEjecutivoVenta(idEjecutivo) {
  const res = await fetch(`${API_URL}/ApiEliminarEjecutivoVenta.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idEjecutivo }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message || "Error al eliminar ejecutivo de venta");
  return data;
}

export async function validarNombreEjecutivoVenta(nombre, idExcluir = null) {
  try {
    const res = await fetch(`${API_URL}/ApiValidarNombreEjecutivoVenta.php`, {
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
