// src/services/pagosClientes/pagosClientesService.js
const API_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/pagosClientes";

/**
 * Obtiene el último número de pago de cliente
 * @returns {Promise<Object>} { success, ultimoNumero, siguienteNumeroFormateado, ... }
 */
export async function obtenerUltimoNumeroPagoCliente() {
  try {
    const res = await fetch(`${API_URL}/ApiGetUltimoNumeroPagoCliente.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener último número de pago:", err);
    return {
      success: false,
      ultimoNumero: 0,
      siguienteNumeroFormateado: "PAG-CLI-000001",
    };
  }
}

/**
 * Obtiene los medios de pago disponibles
 * @returns {Promise<Object>} { success, mediosPago, total }
 */
export async function getMediosPago() {
  try {
    const res = await fetch(`${API_URL}/ApiGetMediosPago.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener medios de pago:", err);
    return {
      success: false,
      mediosPago: [],
      total: 0,
    };
  }
}

/**
 * Obtiene facturas de un cliente con saldo pendiente
 * @param {number} idCliente - ID del cliente
 * @returns {Promise<Object>} { success, facturas, total }
 */
export async function getFacturasClienteConSaldo(
  idCliente,
  idPagoExcluir = null,
) {
  try {
    const body = { idCliente };
    if (idPagoExcluir) body.idPagoExcluir = idPagoExcluir;
    const res = await fetch(`${API_URL}/ApiGetFacturasClienteConSaldo.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener facturas con saldo:", err);
    return {
      success: false,
      facturas: [],
      total: 0,
    };
  }
}

/**
 * Guarda un pago de cliente (soporta múltiples facturas)
 * @param {Object} datosPago - Datos del pago { header, facturas }
 * @returns {Promise<Object>} { success, message, idEncabPagoCliente, numeroPago, advertencias }
 */
export async function guardarPagoCliente(datosPago) {
  try {
    const res = await fetch(`${API_URL}/ApiGuardarPagoCliente.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosPago),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al guardar pago:", err);
    throw err;
  }
}

/**
 * Obtiene un pago específico de cliente (soporta múltiples facturas)
 * @param {number} idEncabPagoCliente - ID del encabezado del pago
 * @returns {Promise<Object>} { success, encabezado, facturas }
 */
export async function getPagoClienteEspecifico(idEncabPagoCliente) {
  try {
    const res = await fetch(`${API_URL}/ApiGetPagoClienteEspecifico.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idPagoCliente: idEncabPagoCliente }),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener pago específico:", err);
    throw err;
  }
}

/**
 * Busca pagos de clientes
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Promise<Object>} { success, pagos, total, filtros }
 */
export async function buscarPagosClientes(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiBuscarPagosClientes.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al buscar pagos:", err);
    return {
      success: false,
      pagos: [],
      total: 0,
      filtros,
    };
  }
}

/**
 * Genera el PDF de un pago de cliente
 * @param {number} idEncabPagoCliente - ID del encabezado del pago
 * @returns {Promise<Blob>} Blob del PDF
 */
export async function generarPDFPagoCliente(idEncabPagoCliente) {
  try {
    const res = await fetch(`${API_URL}/ApiGenerarPDFPagoCliente.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idEncabPagoCliente }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error respuesta API:", errorText);
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const pdfBlob = await res.blob();
    console.log("PDF Pago Cliente obtenido, tamaño:", pdfBlob.size);
    return pdfBlob;
  } catch (err) {
    console.error("Error en generarPDFPagoCliente:", err);
    throw err;
  }
}

/**
 * Elimina/anula un pago de cliente
 * @param {number} idPagoCliente - ID del pago
 * @returns {Promise<Object>} { success, message, numeroPago }
 */
export async function eliminarPagoCliente(idPagoCliente) {
  try {
    const res = await fetch(`${API_URL}/ApiEliminarPagoCliente.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idPagoCliente }),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error al eliminar pago:", err);
    throw err;
  }
}

/**
 * Valida datos de pago antes de guardar (soporta múltiples facturas)
 * @param {Object} header - Encabezado del pago
 * @param {Array} facturas - Array de facturas con valores de pago
 * @returns {Object} { valido: boolean, errores: string[], advertencias: string[] }
 */
export function validarPagoCliente(header, facturas = []) {
  const errores = [];
  const advertencias = [];

  // Validar encabezado
  if (!header.fecha) {
    errores.push("La fecha de pago es obligatoria");
  }

  if (!header.idCliente || header.idCliente <= 0) {
    errores.push("Debe seleccionar un cliente");
  }

  if (!header.idMedioPago || header.idMedioPago <= 0) {
    errores.push("Debe seleccionar un medio de pago");
  }

  if (!header.idMoneda || header.idMoneda <= 0) {
    errores.push("Debe seleccionar una moneda");
  }

  if (!header.trm || header.trm <= 0) {
    errores.push("La TRM es obligatoria y debe ser mayor a cero");
  }

  // Validar facturas
  if (!facturas || facturas.length === 0) {
    errores.push("Debe seleccionar al menos una factura");
  } else {
    let valorTotalPago = 0;

    facturas.forEach((factura, index) => {
      if (!factura.invoice && !factura.idFactura) {
        errores.push(
          `La factura #${index + 1} no tiene número de factura válido`,
        );
      }

      if (!factura.valorPago || factura.valorPago <= 0) {
        errores.push(
          `El valor de pago para la factura ${factura.numeroFactura || factura.idFactura || factura.invoice} debe ser mayor a cero`,
        );
      }

      if (factura.valorPago > factura.saldoFactura) {
        advertencias.push(
          `El pago para la factura ${factura.numeroFactura || factura.idFactura || factura.invoice} (${factura.valorPago}) excede el saldo pendiente (${factura.saldoFactura})`,
        );
      }

      if (factura.idMonedaFactura) {
        // Convertir ambos a números para comparación
        const idMonedaFacturaNum = Number(factura.idMonedaFactura);
        const idMonedaHeaderNum = Number(header.idMoneda);

        // Solo validar si ambos son números válidos
        if (
          !isNaN(idMonedaFacturaNum) &&
          !isNaN(idMonedaHeaderNum) &&
          idMonedaFacturaNum !== idMonedaHeaderNum
        ) {
          errores.push(
            `La factura ${factura.numeroFactura || factura.idFactura || factura.invoice} tiene moneda diferente a la seleccionada para el pago`,
          );
        }
      }

      valorTotalPago += parseFloat(factura.valorPago) || 0;
    });

    if (valorTotalPago <= 0) {
      errores.push("El valor total del pago debe ser mayor a cero");
    }
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Calcula totales del pago (soporta múltiples facturas)
 * @param {Array} facturas - Array de facturas con valores de pago
 * @returns {Object} { valorTotal: number, costoTransferencia: number }
 */
export function calcularTotalesPago(facturas = []) {
  let valorTotal = 0;

  facturas.forEach((factura) => {
    valorTotal += parseFloat(factura.valorPago) || 0;
  });

  return {
    valorTotal,
    costoTransferencia: 0, // Se calculará según el medio de pago
  };
}
