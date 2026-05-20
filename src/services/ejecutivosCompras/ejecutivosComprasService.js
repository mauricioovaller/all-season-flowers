// src/services/ejecutivosCompras/ejecutivosComprasService.js

const API_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/ejecutivosCompras";

export async function getEjecutivosCompras(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetEjecutivosCompras.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    if (!data.success)
      throw new Error(data.message || "Error al obtener ejecutivos de compras");
    return data;
  } catch (err) {
    console.error("Error al obtener ejecutivos de compras:", err);
    return {
      success: false,
      compradores: [],
      estadisticas: { total: 0, activos: 0, inactivos: 0 },
      total: 0,
      message: err.message,
    };
  }
}

export async function getEjecutivoCompraById(idComprador) {
  const res = await fetch(`${API_URL}/ApiGetEjecutivosCompras.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idComprador }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message || "Ejecutivo de compras no encontrado");
  return data;
}

export async function guardarEjecutivoCompra(compradorData) {
  try {
    const datosParaEnviar = {
      ...compradorData,
      ACTIVO: compradorData.ACTIVO ? 1 : 0,
    };
    const res = await fetch(`${API_URL}/ApiGuardarEjecutivoCompra.php`, {
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
      throw new Error(data.message || "Error al guardar ejecutivo de compras");
    return data;
  } catch (err) {
    console.error("Error al guardar ejecutivo de compras:", err);
    let mensaje = err.message;
    if (
      err.message.includes("Ya existe un ejecutivo de compras con ese nombre")
    ) {
      mensaje =
        "Ya existe un ejecutivo de compras con ese nombre. Use un nombre diferente.";
    } else if (err.message.includes("Failed to fetch")) {
      mensaje =
        "No se pudo conectar con el servidor. Verifique su conexión a internet.";
    }
    throw new Error(mensaje);
  }
}

export async function eliminarEjecutivoCompra(idComprador) {
  const res = await fetch(`${API_URL}/ApiEliminarEjecutivoCompra.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idComprador }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message || "Error al eliminar ejecutivo de compras");
  return data;
}

export async function validarNombreEjecutivoCompra(nombre, idExcluir = null) {
  try {
    const res = await fetch(`${API_URL}/ApiValidarNombreEjecutivoCompra.php`, {
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
