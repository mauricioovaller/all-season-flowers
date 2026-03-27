// src/services/compras/comprasService.js
const API_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/compras";

/**
 * Obtiene datos para los selects del formulario de compras
 */
export async function getDatosSelectCompras() {
  try {
    const res = await fetch(`${API_URL}/ApiGetDatosSelectCompras.php`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al cargar datos de compras:", err);
    throw err;
  }
}

/**
 * Obtiene variedades y grados según el producto seleccionado
 * (Reutiliza el mismo servicio de pedidos)
 */
export async function getVariedadesYGrados(idProducto) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/pedidos/ApiGetSelecVariedGrado.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idProducto }),
      },
    );

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

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
 * Guarda una compra completa con empaques y productos
 * @param {Object} compraData - Datos completos de la compra
 * @returns {Promise<Object>} Respuesta del servidor con ID generado
 */
export async function guardarCompraCompleta(compraData) {
  try {
    console.log("Enviando datos de compra al servidor:", compraData);

    const res = await fetch(`${API_URL}/ApiGuardarCompraCompleta.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(compraData),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const respuesta = await res.json();
    console.log("Respuesta del servidor (compra):", respuesta);
    return respuesta;
  } catch (err) {
    console.error("Error al guardar compra completa:", err);
    throw err;
  }
}

/**
 * Buscar compras con filtros
 */
export async function buscarCompras(filtros = {}) {
  try {
    const res = await fetch(`${API_URL}/ApiGetCompras.php`, {
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
    console.error("Error al buscar compras:", err);
    throw err;
  }
}

/**
 * Obtener una compra específica por ID
 */
export async function getCompraEspecifica(idCompra) {
  try {
    const res = await fetch(`${API_URL}/ApiGetCompraEspecifica.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idCompra }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error al obtener compra específica:", err);
    throw err;
  }
}

/**
 * Genera el PDF de orden de compra
 * VERSIÓN SIMPLIFICADA - Retorna blob para usar en ModalVisorPreliminar
 * @param {number} idCompra - ID de la compra
 * @returns {Promise<Blob>} PDF como blob
 */
export async function generarPDFOrdenCompra(idCompra) {
  try {
    console.log("Generando PDF de orden de compra para ID:", idCompra);

    const res = await fetch(`${API_URL}/ApiGenerarPDFOrdenCompra.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        numeroOrdenCompra: idCompra,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error respuesta API:", errorText);
      throw new Error(`Error HTTP: ${res.status}`);
    }

    // Obtener como Blob (igual que en pedidos)
    const pdfBlob = await res.blob();
    console.log(
      "✅ PDF Blob obtenido, tamaño:",
      pdfBlob.size,
      "type:",
      pdfBlob.type,
    );

    return pdfBlob;
  } catch (err) {
    console.error("Error al generar PDF de orden de compra:", err);
    throw err;
  }
}

/**
 * Formatea un número de compra con prefijo
 * @param {number} idCompra - ID de la compra
 * @returns {string} Número formateado (ej: "COMP-000001")
 */
export function formatearNumeroCompra(idCompra) {
  if (!idCompra || idCompra === 0) return "COMP-000000";
  return `COMP-${String(idCompra).padStart(6, "0")}`;
}

/**
 * Prepara datos para guardar (similar a pedidos pero con estructura de compra)
 */
export function prepararDatosParaGuardar(header, empaques) {
  console.log("Preparando datos de compra para guardar...");

  // 1. ENCABEZADO - Convertir a formato de tabla SAS_EncabCompra
  const encabezadoData = {
    TipoCompra: header.tipoCompra || "REGULAR",
    IdProveedor: parseInt(header.proveedor) || 0,
    IdComprador: parseInt(header.comprador) || 0,
    IdMoneda: parseInt(header.moneda) || 0,
    TRM: parseFloat(header.trm) || 0,
    FechaSolicitud: header.fechaSolicitud || "",
    FechaEntrega: header.fechaEntrega || "",
    PO_Proveedor: header.poProveedor || "",
    Observaciones: header.observaciones || "",
    Anulado: 0,
    IVA: header.tieneIVA ? 1 : 0, // tinyint(1) - 0 o 1
    TotalIVA: parseFloat(header.iva) || 0, // Valor calculado del IVA
    TotalGeneral: parseFloat(header.totalCompra) || 0, // Total con IVA incluido
    // Si no es nuevo, incluir el ID de la compra
    ...(header.noCompra !== "COMP-000000" && {
      IdEncabCompra: parseInt(header.noCompra.replace("COMP-", "")),
    }),
  };

  console.log("Encabezado preparado:", encabezadoData);

  // 2. EMPAQUES - Preparar estructura jerárquica
  const empaquesData = empaques.map((empaque, empIndex) => {
    console.log(`Procesando empaque ${empIndex + 1}:`, empaque);

    // Datos para SAS_DetEmpaqueCompra
    const datosEmpaque = {
      IdTipoEmpaque: parseInt(empaque.tipoEmpaque) || 0,
      Cantidad: parseInt(empaque.cantidadEmpaque) || 1,
      PO_Empaque: empaque.poCodeEmpaque || "",
    };

    // Productos dentro del empaque
    const productosData = empaque.items.map((item, itemIndex) => {
      console.log(`  Procesando producto ${itemIndex + 1}:`, item);

      // Datos para SAS_DetProductoCompra
      const datosProducto = {
        IdProducto: parseInt(item.producto) || 0,
        IdVariedad: item.variedad ? parseInt(item.variedad) : 0,
        IdGrado: item.grado ? parseInt(item.grado) : 0,
        IdUnidad: parseInt(item.unidadFacturacion) || 0,
        IdPredio: item.predio ? parseInt(item.predio) : 0,
        Tallos_Ramo: parseInt(item.tallosRamo) || 0,
        // Para bouquets usar cantidadBouquets, para productos normales usar ramosCaja
        Ramos_Caja: item.esBouquet
          ? parseInt(item.cantidadBouquets) || 1
          : parseInt(item.ramosCaja) || 0,
        Precio_Compra: parseFloat(item.precioCompra) || 0, // ¡CAMBIADO! Precio_Compra en lugar de Precio_Venta
        Descripcion:
          item.descripcion || (item.esBouquet ? "Bouquet personalizado" : ""),
      };

      // Si es bouquet, preparar receta para SAS_DetRecetaCompra
      let recetaData = [];
      if (item.esBouquet && item.receta && item.receta.length > 0) {
        recetaData = item.receta.map((ingrediente, ingIndex) => {
          return {
            IdProducto: parseInt(ingrediente.producto) || 0,
            IdVariedad: parseInt(ingrediente.variedad) || 0,
            Cantidad: parseInt(ingrediente.tallosPorBouquet) || 0,
            Descripcion: ingrediente.descripcion || "",
          };
        });

        console.log(`    Receta con ${recetaData.length} ingredientes`);
      }

      return {
        producto: datosProducto,
        receta: recetaData,
      };
    });

    return {
      empaque: datosEmpaque,
      productos: productosData,
    };
  });

  console.log("Empaques preparados:", empaquesData);

  // 3. ESTRUCTURA FINAL PARA ENVIAR
  const datosCompletos = {
    encabezado: encabezadoData,
    empaques: empaquesData,
  };

  console.log("Datos completos preparados:", datosCompletos);
  return datosCompletos;
}

/**
 * Calcula totales a partir de los empaques
 */
export function calcularTotales(empaques, tiposEmpaque) {
  let totalPiezas = 0;
  let totalFulles = 0;
  let totalTallos = 0;
  let totalValor = 0;

  empaques.forEach((empaque) => {
    const cantidadEmpaques = Number(empaque.cantidadEmpaque) || 0;
    totalPiezas += cantidadEmpaques;

    // Calcular fulles según equivalencia del tipo de empaque
    const tipoEmpaque = tiposEmpaque.find((t) => t.id === empaque.tipoEmpaque);
    const equivFull = tipoEmpaque?.equivFull || 1;
    totalFulles += cantidadEmpaques * equivFull;

    // Sumar totales de todos los items dentro del empaque
    if (empaque.items && empaque.items.length > 0) {
      empaque.items.forEach((item) => {
        totalTallos += Number(item.totTallosRegistro) || 0;
        totalValor += Number(item.valorRegistro) || 0;
      });
    }
  });

  return {
    totalPiezas,
    totalFulles,
    totalTallos,
    totalValor,
  };
}
