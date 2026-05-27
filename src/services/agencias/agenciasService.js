// src/services/agencias/agenciasService.js
import { apiUrl } from '../../config/api.js';
const API_URL = apiUrl('agencias');

export async function getAgencias(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetAgencias.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    if (!data.success)
      throw new Error(data.message || "Error al obtener agencias");
    return data;
  } catch (err) {
    console.error("Error al obtener agencias:", err);
    return {
      success: false,
      agencias: [],
      estadisticas: { total: 0 },
      total: 0,
      message: err.message,
    };
  }
}

export async function guardarAgencia(agenciaData) {
  try {
    const res = await fetch(`${API_URL}/ApiGuardarAgencia.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agenciaData),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error HTTP ${res.status}: ${errorText}`);
    }
    const data = await res.json();
    if (!data.success)
      throw new Error(data.message || "Error al guardar agencia");
    return data;
  } catch (err) {
    console.error("Error al guardar agencia:", err);
    let mensaje = err.message;
    if (err.message.includes("Ya existe una agencia con ese nombre")) {
      mensaje =
        "Ya existe una agencia con ese nombre. Use un nombre diferente.";
    } else if (err.message.includes("Failed to fetch")) {
      mensaje =
        "No se pudo conectar con el servidor. Verifique su conexión a internet.";
    }
    throw new Error(mensaje);
  }
}

export async function eliminarAgencia(idAgencia) {
  const res = await fetch(`${API_URL}/ApiEliminarAgencia.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idAgencia }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message || "Error al eliminar agencia");
  return data;
}

export async function validarNombreAgencia(nombre, idExcluir = null) {
  try {
    const res = await fetch(`${API_URL}/ApiValidarNombreAgencia.php`, {
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
