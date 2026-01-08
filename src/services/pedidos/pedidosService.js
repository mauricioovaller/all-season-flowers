// src/services/pedidos/pedidosService.js
const API_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/pedidos";

/**
 * Obtiene datos para los selects del formulario de pedidos
 */
export async function getDatosSelect() {
  try {
    const res = await fetch(`${API_URL}/ApiGetDatosSelect.php`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al cargar datos:", err);
    throw err;
  }
}

/**
 * Obtiene variedades y grados según el producto seleccionado
 * @param {number} idProducto - ID del producto
 * @returns {Promise<Object>} Datos de variedades y grados
 */
export async function getVariedadesYGrados(idProducto) {
  try {
    const res = await fetch(`${API_URL}/ApiGetSelecVariedGrado.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idProducto }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    // Formatear los datos para que sean consistentes
    return {
      variedades:
        data.variedades?.map((v) => ({
          id: v.id.toString(),
          nombre: v.nombre,
        })) || [],
      grados:
        data.grados?.map((g) => ({
          id: g.id.toString(),
          nombre: g.nombre,
        })) || [],
    };
  } catch (err) {
    console.error("Error al cargar variedades y grados:", err);
    throw err;
  }
}

/**
 * Guarda un pedido completo con empaques y productos
 * @param {Object} pedidoData - Datos completos del pedido
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function guardarPedido(pedidoData) {
  try {
    const res = await fetch(`${API_URL}/ApiGuardarPedido.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pedidoData),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al guardar pedido:", err);
    throw err;
  }
}

/**
 * Guarda un pedido completo en la base de datos
 * @param {Object} pedidoData - Datos completos del pedido
 * @returns {Promise<Object>} Respuesta del servidor con ID generado
 */
export async function guardarPedidoCompleto(pedidoData) {
  try {
    console.log("Enviando datos al servidor:", pedidoData);

    const res = await fetch(`${API_URL}/ApiGuardarPedidoCompleto.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pedidoData),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const respuesta = await res.json();
    console.log("Respuesta del servidor:", respuesta);
    return respuesta;
  } catch (err) {
    console.error("Error al guardar pedido completo:", err);
    throw err;
  }
}

/**
 * Buscar pedidos con filtros
 */
export async function buscarPedidos(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetPedidos.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filtros),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al buscar pedidos:", err);
    throw err;
  }
}

/**
 * Obtener un pedido específico por ID
 */
export async function getPedidoEspecifico(idPedido) {
  try {
    const res = await fetch(`${API_URL}/ApiGetPedidoEspecifico.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idPedido }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al obtener pedido específico:", err);
    throw err;
  }
}

/**
 * Obtiene el último número de factura utilizado
 * @returns {Promise<Object>} { success: boolean, ultimoNumero: number, prefijo: string }
 */
export async function obtenerUltimoNumeroFactura() {
  try {
    const res = await fetch(`${API_URL}/ApiGetUltimoNumeroFactura.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al obtener último número de factura:", err);

    // Fallback: Si la API no responde, retornar un valor por defecto
    return {
      success: false,
      ultimoNumero: 0,
      prefijo: "FACT-",
      message: "Usando valor por defecto",
    };
  }
}

/**
 * Genera una nueva factura para un pedido
 * @param {number} idPedido - ID del pedido
 * @param {string} numeroFactura - Número de factura a asignar
 * @param {Object} datosFactura - Datos adicionales de la factura
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function generarFactura(
  idPedido,
  numeroFactura,
  datosFactura = {}
) {
  try {
    const res = await fetch(`${API_URL}/ApiGenerarFactura.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idPedido,
        numeroFactura,
        ...datosFactura,
      }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al generar factura:", err);
    throw err;
  }
}

/**
 * Obtiene los datos de una factura existente
 * @param {string} numeroFactura - Número de factura
 * @returns {Promise<Object>} Datos de la factura
 */
export async function obtenerFactura(numeroFactura) {
  try {
    const res = await fetch(`${API_URL}/ApiGetFactura.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ numeroFactura }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al obtener factura:", err);
    throw err;
  }
}

/**
 * Genera el PDF de una factura
 * @param {string} numeroFactura - Número de factura (ej: "FACT-000001")
 * @returns {Promise<Object>} Datos para generar el PDF
 */

export async function generarPDFFactura(numeroFactura) {
  try {
    // Extraer solo el número si viene con prefijo
    const numero = numeroFactura.replace("FACT-", "");

    const res = await fetch(`${API_URL}/ApiGenerarPDFFactura.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        numeroFactura: numero,
        tipo: "factura",
        formato: "base64", // 👈 Añadir este parámetro para que devuelva base64
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error detallado del servidor:", errorText);
      throw new Error(`Error HTTP ${res.status}`);
    }

    const data = await res.json();

    // IMPORTANTE: Esperar que el backend devuelva el PDF en base64
    // o una URL directa al PDF
    if (!data.success) {
      throw new Error(data.error || "Error al generar datos para el PDF");
    }

    return data;
  } catch (err) {
    console.error("Error en generarPDFFactura:", err);
    throw err;
  }
}

/**
 * Genera y abre un PDF a partir de los datos de factura
 * @param {Object} datosFactura - Datos de la factura
 */
export function generarYMostrarPDF(datosFactura) {
  try {
    console.log("Datos para generar PDF:", datosFactura);

    // 1. Verificar que jsPDF esté disponible
    if (!window.jspdf) {
      console.error("jsPDF no está disponible");
      alert(
        "Error: La librería jsPDF no está cargada. Por favor recargue la página."
      );
      return;
    }

    const { jsPDF } = window.jspdf;

    // 2. Crear instancia del PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // 3. Configurar propiedades
    pdf.setProperties({
      title: `Factura ${datosFactura.factura?.numero || "Sin número"}`,
      subject: "Factura All Season Flowers",
      author: "All Season Flowers",
      keywords: "factura, pedido, flores",
      creator: "All Season Flowers App",
    });

    // 4. Logo y encabezado
    pdf.setFontSize(20);
    pdf.setTextColor(40, 180, 99); // Verde All Season
    pdf.text("ALL SEASON FLOWERS", 105, 15, { align: "center" });

    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text("FACTURA DE VENTA", 105, 22, { align: "center" });

    // 5. Información de la factura
    pdf.setFontSize(10);
    let y = 35;

    // Número de factura
    pdf.setFont(undefined, "bold");
    pdf.text("Factura No:", 20, y);
    pdf.setFont(undefined, "normal");
    pdf.text(datosFactura.factura?.numero || "Sin número", 45, y);

    // Fecha
    pdf.setFont(undefined, "bold");
    pdf.text("Fecha:", 150, y);
    pdf.setFont(undefined, "normal");
    pdf.text(datosFactura.factura?.fecha || "No especificada", 165, y);

    y += 8;

    // 6. Información del cliente
    pdf.setFont(undefined, "bold");
    pdf.text("DATOS DEL CLIENTE:", 20, y);
    y += 6;

    pdf.setFont(undefined, "normal");
    pdf.text(
      `Nombre: ${datosFactura.cliente?.nombre || "No especificado"}`,
      20,
      y
    );
    y += 5;
    pdf.text(`NIT: ${datosFactura.cliente?.nit || "No especificado"}`, 20, y);
    y += 5;
    pdf.text(
      `Dirección: ${datosFactura.cliente?.direccion || "No especificada"}`,
      20,
      y
    );
    y += 5;
    pdf.text(
      `Ciudad: ${datosFactura.cliente?.ciudad || "No especificada"}`,
      20,
      y
    );
    y += 5;
    pdf.text(
      `Teléfono: ${datosFactura.cliente?.telefono || "No especificado"}`,
      20,
      y
    );
    y += 10;

    // 7. Información del pedido
    pdf.setFont(undefined, "bold");
    pdf.text("INFORMACIÓN DEL PEDIDO:", 20, y);
    y += 6;

    pdf.setFont(undefined, "normal");
    pdf.text(`Pedido: ${datosFactura.pedido?.numero || "Sin número"}`, 20, y);
    pdf.text(
      `PO Cliente: ${datosFactura.pedido?.poCliente || "No especificado"}`,
      100,
      y
    );
    y += 5;
    pdf.text(
      `Aerolínea: ${datosFactura.pedido?.aerolinea || "No especificada"}`,
      20,
      y
    );
    pdf.text(`AWB: ${datosFactura.pedido?.awb || "No especificado"}`, 100, y);
    y += 5;
    pdf.text(
      `Moneda: ${datosFactura.pedido?.moneda || "No especificada"}`,
      20,
      y
    );
    pdf.text(`TRM: ${datosFactura.pedido?.trm || "0"}`, 100, y);
    y += 10;

    // 8. Tabla de productos
    const startY = y;
    const pageWidth = 210;
    const margin = 20;
    const tableWidth = pageWidth - margin * 2;

    // Encabezados de la tabla
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, y, tableWidth, 8, "F");

    pdf.setFont(undefined, "bold");
    pdf.setTextColor(0, 0, 0);

    // Columnas
    pdf.text("Descripción", margin + 2, y + 5);
    pdf.text("Cant.", margin + 70, y + 5);
    pdf.text("Unidad", margin + 85, y + 5);
    pdf.text("Precio", margin + 110, y + 5);
    pdf.text("Total", margin + 140, y + 5);

    y += 8;

    // Datos de productos
    pdf.setFont(undefined, "normal");
    let totalFactura = 0;

    if (
      datosFactura.productosPorEmpaque &&
      Object.keys(datosFactura.productosPorEmpaque).length > 0
    ) {
      Object.entries(datosFactura.productosPorEmpaque).forEach(
        ([idEmpaque, productos]) => {
          productos.forEach((producto, index) => {
            // Verificar si necesitamos nueva página
            if (y > 270) {
              pdf.addPage();
              y = 20;

              // Encabezado en nueva página
              pdf.setFont(undefined, "bold");
              pdf.setFillColor(241, 245, 249);
              pdf.rect(margin, y, tableWidth, 8, "F");
              pdf.text("Descripción", margin + 2, y + 5);
              pdf.text("Cant.", margin + 70, y + 5);
              pdf.text("Unidad", margin + 85, y + 5);
              pdf.text("Precio", margin + 110, y + 5);
              pdf.text("Total", margin + 140, y + 5);
              y += 8;
            }

            // Descripción del producto
            const descripcion = `${producto.NombreProducto || ""} ${
              producto.NombreVariedad || ""
            } ${producto.NombreGrado || ""}`.trim();
            pdf.text(descripcion.substring(0, 40), margin + 2, y + 4);

            // Cantidad
            const cantidad = producto.Cantidad || 0;
            pdf.text(cantidad.toString(), margin + 70, y + 4);

            // Unidad
            pdf.text(producto.NombreUnidad || "", margin + 85, y + 4);

            // Precio
            const precio = parseFloat(producto.Precio_Venta || 0);
            pdf.text(
              precio.toLocaleString("es-CO", { minimumFractionDigits: 2 }),
              margin + 110,
              y + 4
            );

            // Total
            const total = cantidad * precio;
            pdf.text(
              total.toLocaleString("es-CO", { minimumFractionDigits: 2 }),
              margin + 140,
              y + 4
            );

            totalFactura += total;
            y += 6;
          });
        }
      );
    } else {
      pdf.text("No hay productos registrados", margin + 2, y + 4);
      y += 6;
    }

    // 9. Totales
    y += 10;
    pdf.setFont(undefined, "bold");

    const subtotal = parseFloat(datosFactura.totales?.subtotal || 0);
    const iva = parseFloat(datosFactura.totales?.iva || 0);
    const total = parseFloat(datosFactura.totales?.total || 0);

    pdf.text("SUBTOTAL:", margin + 100, y);
    pdf.text(
      subtotal.toLocaleString("es-CO", { style: "currency", currency: "COP" }),
      margin + 140,
      y
    );
    y += 7;

    if (datosFactura.totales?.tieneIVA) {
      pdf.text("IVA (19%):", margin + 100, y);
      pdf.text(
        iva.toLocaleString("es-CO", { style: "currency", currency: "COP" }),
        margin + 140,
        y
      );
      y += 7;
    }

    pdf.text("TOTAL:", margin + 100, y);
    pdf.setTextColor(40, 180, 99);
    pdf.text(
      total.toLocaleString("es-CO", { style: "currency", currency: "COP" }),
      margin + 140,
      y
    );
    pdf.setTextColor(0, 0, 0);

    // 10. Pie de página
    y = 280;
    pdf.setFontSize(8);
    pdf.text(
      "Factura generada el " + new Date().toLocaleDateString("es-CO"),
      margin,
      y
    );
    pdf.text(
      "All Season Flowers - Sistema de Pedidos",
      pageWidth - margin - 60,
      y,
      { align: "right" }
    );

    // 11. Abrir PDF en nueva ventana
    pdf.output("dataurlnewwindow");
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Error al generar el PDF: " + error.message);
  }
}

// ... (resto del código)
/**
 * Abre el PDF en una nueva ventana o lo descarga
 * @param {Blob} pdfBlob - Archivo PDF
 * @param {string} nombreArchivo - Nombre del archivo
 */
export function abrirPDF(pdfBlob, nombreArchivo = "factura.pdf") {
  // Crear URL para el blob
  const pdfUrl = URL.createObjectURL(pdfBlob);

  // Abrir en nueva pestaña
  window.open(pdfUrl, "_blank");

  // También opción de descarga:
  // const link = document.createElement('a');
  // link.href = pdfUrl;
  // link.download = nombreArchivo;
  // link.click();
}

// ============================================
// SERVICIOS PARA PLANILLAS
// ============================================

/**
 * Obtiene el último número de planilla utilizado
 * @returns {Promise<Object>} { success: boolean, ultimoNumero: number, prefijo: string }
 */
export async function obtenerUltimoNumeroPlanilla() {
  try {
    const res = await fetch(`${API_URL}/ApiGetUltimoNumeroPlanilla.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al obtener último número de planilla:", err);

    // Fallback: Si la API no responde, retornar un valor por defecto
    return {
      success: false,
      ultimoNumero: 0,
      prefijo: "PLAN-",
      message: "Usando valor por defecto",
    };
  }
}

/**
 * Genera o actualiza una planilla para un pedido
 * @param {number} idPedido - ID del pedido
 * @param {string} numeroPlanilla - Número de planilla a asignar
 * @param {Object} datosPlanilla - Datos de la planilla { conductorId, ayudanteId, placa, precinto }
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function generarPlanilla(
  idPedido,
  numeroPlanilla,
  datosPlanilla = {}
) {
  try {
    const res = await fetch(`${API_URL}/ApiGenerarPlanilla.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idPedido,
        numeroPlanilla,
        ...datosPlanilla,
      }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al generar planilla:", err);
    throw err;
  }
}

/**
 * Obtiene los datos de una planilla existente
 * @param {number} idPlanilla - ID de la planilla (o número de planilla)
 * @returns {Promise<Object>} Datos de la planilla
 */
export async function obtenerPlanilla(idPlanilla) {
  try {
    const res = await fetch(`${API_URL}/ApiGetPlanilla.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idPlanilla }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al obtener planilla:", err);
    throw err;
  }
}

/**
 * Genera el PDF de una planilla (las 3 páginas juntas)
 * VERSIÓN SIMPLIFICADA - Abre directamente en nueva pestaña
 * @param {string} numeroPlanilla - Número de planilla (ej: "PLAN-000001")
 */
export async function generarPDFPlanilla(numeroPlanilla) {
  try {
    // Extraer solo el número si viene con prefijo
    const numero = numeroPlanilla.replace("PLAN-", "");

    const apiUrl = `${API_URL}/ApiGenerarPDFPlanilla.php`;

    // Crear formulario temporal para enviar POST
    const form = document.createElement("form");
    form.method = "POST";
    form.action = apiUrl;
    form.target = "_blank";
    form.style.display = "none";

    // Agregar campo con los datos
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "numeroPlanilla";
    input.value = numero;
    form.appendChild(input);

    // Agregar campo JSON para el backend
    const inputJson = document.createElement("input");
    inputJson.type = "hidden";
    inputJson.name = "json_data";
    inputJson.value = JSON.stringify({ numeroPlanilla: numero });
    form.appendChild(inputJson);

    // Agregar al documento y enviar
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    return { success: true };
  } catch (err) {
    console.error("Error en generarPDFPlanilla:", err);
    throw err;
  }
}

/**
 * Abre el PDF de planilla en una nueva ventana
 * @param {Blob} pdfBlob - Archivo PDF
 * @param {string} nombreArchivo - Nombre del archivo
 */
export function abrirPDFPlanilla(pdfBlob, nombreArchivo = "planilla.pdf") {
  try {
    // Crear URL para el blob
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Abrir en nueva pestaña
    window.open(pdfUrl, "_blank");

    // Opcional: Limpiar URL después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 10000);
  } catch (err) {
    console.error("Error al abrir PDF:", err);
    throw err;
  }
}

/**
 * Genera las etiquetas de marcación para un pedido
 * @param {number} idPedido - ID del pedido
 * @param {string} tipo - Tipo de etiqueta (por ahora "marcacion")
 * @returns {Promise<Object>} Respuesta del servidor con datos para el PDF
 */
export async function generarEtiquetas(idPedido, tipo = "marcacion") {
  try {
    const res = await fetch(`${API_URL}/ApiGenerarPDFEtiqueta.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idPedido: idPedido,
        tipo: tipo,
      }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al generar etiquetas:", err);
    throw err;
  }
}

/**
 * Genera y abre el PDF de etiquetas directamente
 * Versión simplificada - abre directamente en nueva pestaña
 * @param {number} idPedido - ID del pedido
 */
export async function generarPDFEtiquetas(idPedido) {
  try {
    const apiUrl = `${API_URL}/ApiGenerarPDFEtiqueta.php`;
    
    // Crear formulario temporal para enviar POST
    const form = document.createElement("form");
    form.method = "POST";
    form.action = apiUrl;
    form.target = "_blank"; // Abrir en nueva pestaña
    form.style.display = "none";

    // Agregar campo con los datos
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "idPedido";
    input.value = idPedido;
    form.appendChild(input);

    // Agregar campo JSON para el backend
    const inputJson = document.createElement("input");
    inputJson.type = "hidden";
    inputJson.name = "json_data";
    inputJson.value = JSON.stringify({ idPedido: idPedido });
    form.appendChild(inputJson);

    // Agregar al documento y enviar
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    return { success: true };
  } catch (err) {
    console.error("Error en generarPDFEtiquetas:", err);
    throw err;
  }
}

/**
 * Obtiene el último número de fitosanitario utilizado
 * @returns {Promise<Object>} { success: boolean, ultimoNumero: number, prefijo: string }
 */
export async function obtenerUltimoNumeroFitosanitario() {
  try {
    const res = await fetch(`${API_URL}/ApiGetUltimoNumeroFitosanitario.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al obtener último número de fitosanitario:", err);

    // Fallback: Si la API no responde, retornar un valor por defecto
    return {
      success: false,
      ultimoNumero: 0,
      prefijo: "FITO-",
      message: "Usando valor por defecto",
    };
  }
}

/**
 * Genera un nuevo fitosanitario para un pedido
 * @param {number} idPedido - ID del pedido
 * @param {string} numeroFitosanitario - Número de fitosanitario a asignar
 * @param {Object} datosFitosanitario - Datos adicionales { fechaVigenciaInicial, fechaVigenciaFinal }
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function generarFitosanitario(
  idPedido,
  numeroFitosanitario,
  datosFitosanitario = {}
) {
  try {
    const res = await fetch(`${API_URL}/ApiGenerarFitosanitario.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idPedido,
        numeroFitosanitario,
        ...datosFitosanitario,
      }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al generar fitosanitario:", err);
    throw err;
  }
}

/**
 * Genera el PDF de un fitosanitario
 * @param {string} numeroFitosanitario - Número de fitosanitario (ej: "FITO-000001")
 * @returns {Promise<Blob>} Blob del PDF
 */
export async function generarPDFFitosanitario(numeroFitosanitario) {
  try {
    // Extraer solo el número si viene con prefijo
    const numero = numeroFitosanitario.replace("FITO-", "");

    const res = await fetch(`${API_URL}/ApiGenerarPDFFitosanitario.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        numeroFitosanitario: numero,
        tipo: "fitosanitario"  // ← SIN "formato: base64"
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error respuesta API:", errorText);
      throw new Error(`Error HTTP: ${res.status}`);
    }

    // Obtener como Blob (igual que en ModalFactura.jsx)
    const pdfBlob = await res.blob();
    console.log("Blob obtenido, tamaño:", pdfBlob.size, "type:", pdfBlob.type);
    
    return pdfBlob;  // ← Retorna Blob directamente

  } catch (err) {
    console.error("Error en generarPDFFitosanitario:", err);
    throw err;
  }
}