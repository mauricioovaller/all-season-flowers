import { apiUrl } from '../../config/api.js';
const API_URL = apiUrl('bajas');

export async function getDatosSelectBajas() {
  try {
    const res = await fetch(`${API_URL}/ApiGetDatosSelectBajas.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Error al obtener datos");
    return data;
  } catch (err) {
    console.error("Error al obtener datos select bajas:", err);
    return {
      success: false,
      productos: [],
      variedades: [],
      grados: [],
      message: err.message,
    };
  }
}

export async function guardarBaja(datos) {
  try {
    const res = await fetch(`${API_URL}/ApiGuardarBaja.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Error al guardar baja");
    return data;
  } catch (err) {
    console.error("Error al guardar baja:", err);
    throw err;
  }
}

export async function getBajas(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetBajas.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Error al obtener bajas");
    return data;
  } catch (err) {
    console.error("Error al obtener bajas:", err);
    return { success: false, bajas: [], total: 0, message: err.message };
  }
}

export async function getBajaEspecifica(idBaja) {
  try {
    const res = await fetch(`${API_URL}/ApiGetBajaEspecifica.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idBaja }),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Error al obtener baja");
    return data;
  } catch (err) {
    console.error("Error al obtener baja específica:", err);
    throw err;
  }
}

export function validarBaja(encabezado, detalles) {
  const errores = [];
  if (!encabezado.Fecha) errores.push("La fecha es obligatoria");
  if (!encabezado.MotivoGeneral) errores.push("El motivo general es obligatorio");
  if (!detalles || detalles.length === 0) {
    errores.push("Debe agregar al menos un detalle");
  } else {
    detalles.forEach((det, i) => {
      if (!det.IdProducto || det.IdProducto <= 0) {
        errores.push(`Fila ${i + 1}: Debe seleccionar un producto`);
      }
      if (!det.Tallos || det.Tallos <= 0) {
        errores.push(`Fila ${i + 1}: Los tallos deben ser mayores a 0`);
      }
    });
  }
  return errores;
}

/**
 * Genera el PDF de una baja
 * @param {number} idBaja - ID de la baja
 * @returns {Promise<Blob>} Blob del PDF
 */
export async function generarPDFBaja(idBaja) {
  try {
    const res = await fetch(`${API_URL}/ApiGenerarPDFBaja.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idBaja }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error respuesta API PDF:", errorText);
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const pdfBlob = await res.blob();
    return pdfBlob;
  } catch (err) {
    console.error("Error en generarPDFBaja:", err);
    throw err;
  }
}
