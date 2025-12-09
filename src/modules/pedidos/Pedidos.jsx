// src/modules/pedidos/Pedidos.jsx
import React, { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import PedidoHeader from "./PedidoHeader";
import PedidoEmpaque from "./PedidoEmpaque";
import { getDatosSelect, guardarPedidoCompleto } from "../../services/pedidos/pedidosService";

// Datos mock temporales - para fallback
const datosMock = {
  clientes: [
    { id: "1", nombre: "Cliente A - Estados Unidos" },
    { id: "2", nombre: "Cliente B - Canadá" },
    { id: "3", nombre: "Cliente C - Europa" },
  ],
  ejecutivos: [
    { id: "1", nombre: "Juan Pérez" },
    { id: "2", nombre: "María García" },
    { id: "3", nombre: "Carlos Rodríguez" },
  ],
  monedas: [
    { id: "USD", nombre: "USD" },
    { id: "EUR", nombre: "EUR" },
    { id: "COP", nombre: "COP" },
  ],
  aerolineas: [
    { id: "1", nombre: "Avianca" },
    { id: "2", nombre: "LATAM" },
    { id: "3", nombre: "American Airlines" },
  ],
  agencias: [
    { id: "1", nombre: "Agencia A" },
    { id: "2", nombre: "Agencia B" },
    { id: "3", nombre: "Agencia C" },
  ],
  productos: [
    { id: "1", descripcion: "Rosas Premium", codigo: "ROS-PREM" },
    { id: "2", descripcion: "Girasoles", codigo: "GIR-STD" },
    { id: "3", descripcion: "Lirios", codigo: "LIR-PREM" },
    { id: "4", descripcion: "Bouquet Mixto", codigo: "BOUQ-MIX" },
  ],
  variedades: [
    { id: "1", nombre: "Red Naomi", productoId: "1" },
    { id: "2", nombre: "Avalanche", productoId: "1" },
    { id: "3", nombre: "Sunflower", productoId: "2" },
  ],
  grados: [
    { id: "1", nombre: "Grado A" },
    { id: "2", nombre: "Grado B" },
    { id: "3", nombre: "Grado C" },
  ],
  tiposEmpaque: [
    { id: "1", descripcion: "Caja 100cm", equivFull: 1 },
    { id: "2", descripcion: "Caja 120cm", equivFull: 1 },
    { id: "3", descripcion: "Bolsa Plástica", equivFull: 0.5 },
    { id: "4", descripcion: "Half Box", equivFull: 0.5 },
    { id: "5", descripcion: "Quarter Box", equivFull: 0.25 },
    { id: "6", descripcion: "Eighth Box", equivFull: 0.125 },
  ],
  unidadesFacturacion: [
    { id: "1", nombre: "Tallos" },
    { id: "2", nombre: "Ramos" },
    { id: "3", nombre: "Cajas" },
    { id: "4", nombre: "Stem/Tallo" },
    { id: "5", nombre: "Bunch/Ramo" },
    { id: "6", nombre: "Bouquet" },
    { id: "7", nombre: "Consumer/Bunch" },
  ],
  predios: [
    { id: "1", nombre: "La Floresta" },
    { id: "2", nombre: "El Jardín" },
    { id: "3", nombre: "Santa Helena" },
  ]
};

// --------------------------------------------------------------
// Función para fecha actual en formato ISO (YYYY-MM-DD)
// --------------------------------------------------------------
function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function Pedidos() {
  // --------------------------------------------------------------
  // Estado del encabezado
  // --------------------------------------------------------------
  const [header, setHeader] = useState({
    noPedido: `PED-000000`,
    cliente: "",
    ejecutivo: "",
    fechaSolicitud: todayISODate(),
    fechaEntrega: "",
    moneda: "USD",
    trm: "",
    poCodeEncab: "",
    observaciones: "",
    guiaMaster: "",
    guiaHija: "",
    guiaNieta: "",
    aerolinea: "",
    agencia: "",
    puertoSalida: "",
    estadoPedido: "Pendiente",
    noInvoice: "0",
    noEtiqueta: "0",
    noPlanilla: "0",
    noFito: "0",
    totalPiezas: "0",
    equivalenciaFulles: "0",
    totalTallos: "0",
    valorVenta: "0",
    tieneIVA: false,
    iva: "0",
    totalVenta: "0",
  });

  // --------------------------------------------------------------
  // NUEVO: Estado de empaques (reemplaza items)
  // --------------------------------------------------------------
  const [empaques, setEmpaques] = useState([]);

  // --------------------------------------------------------------
  // Datos de selects globales
  // --------------------------------------------------------------
  const [datosSelect, setDatosSelect] = useState({
    clientes: [],
    ejecutivos: [],
    monedas: [],
    aerolineas: [],
    agencias: [],
    productos: [],
    variedades: [],
    grados: [],
    tiposEmpaque: [],
    unidadesFacturacion: [],
    predios: [],
  });

  // Estados de carga inicial
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [menuCompacto, setMenuCompacto] = useState(false);

  // --------------------------------------------------------------
  // Refs para validaciones
  // --------------------------------------------------------------
  const headerRefs = {
    cliente: useRef(null),
    ejecutivo: useRef(null),
    fechaSolicitud: useRef(null),
    fechaEntrega: useRef(null),
    poCodeEncab: useRef(null),
    guiaMaster: useRef(null),
  };

  // --------------------------------------------------------------
  // Cargar datos REALES desde la API
  // --------------------------------------------------------------
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoadingDatos(true);

        // Llamar a la API
        const datosAPI = await getDatosSelect();

        // Mapear los datos de la API al formato que necesitan los componentes
        const datosMapeados = {
          // Clientes: IdCliente, NOMBRE, IVA
          clientes: datosAPI.clientes?.map(c => ({
            id: c.IdCliente.toString(),
            nombre: `${c.NOMBRE || ''} ${c.IVA ? `(IVA)` : ''}`.trim()
          })) || [],

          // Ejecutivos: IdEjecutivo, NOMEJECUTIVO
          ejecutivos: datosAPI.ejecutivos?.map(e => ({
            id: e.IdEjecutivo.toString(),
            nombre: e.NOMEJECUTIVO || ''
          })) || [],

          // Monedas: IdMoneda, Moneda
          monedas: datosAPI.monedas?.map(m => ({
            id: m.IdMoneda.toString(),
            nombre: m.Moneda || ''
          })) || [],

          // Aerolíneas: IdAerolinea, NOMAEROLINEA
          aerolineas: datosAPI.aerolineas?.map(a => ({
            id: a.IdAerolinea.toString(),
            nombre: a.NOMAEROLINEA || ''
          })) || [],

          // Agencias: IdAgencia, NOMAGENCIA
          agencias: datosAPI.agencias?.map(a => ({
            id: a.IdAgencia.toString(),
            nombre: a.NOMAGENCIA || ''
          })) || [],

          // Productos: IdProducto, NOMPRODUCTO
          productos: datosAPI.productos?.map(p => ({
            id: p.IdProducto.toString(),
            descripcion: p.NOMPRODUCTO || '',
            codigo: p.NOMPRODUCTO?.substring(0, 10) || p.IdProducto.toString()
          })) || [],

          // Tipo Empaque: IdTipoEmpaque, Descripcion, EquivFull
          tiposEmpaque: datosAPI.tipoEmpaque?.map(t => ({
            id: t.IdTipoEmpaque.toString(),
            descripcion: t.Descripcion || '',
            equivFull: t.EquivFull || 1 // Si no viene el campo, asumimos 1
          })) || [],

          // Unidades: IdUnidades, DescripUnidad
          unidadesFacturacion: datosAPI.unidades?.map(u => ({
            id: u.IdUnidades.toString(),
            nombre: u.DescripUnidad || ''
          })) || [],

          // Predios: IdPredio, NombrePredio
          predios: datosAPI.predios?.map(p => ({
            id: p.IdPredio.toString(),
            nombre: p.NombrePredio || ''
          })) || [],
        };

        setDatosSelect(datosMapeados);
        setLoadingDatos(false);

      } catch (err) {
        console.error("Error cargando datos:", err);

        // Si falla la API, mostrar mensaje y usar datos mock
        Swal.fire({
          icon: 'warning',
          title: 'API no disponible',
          text: 'Usando datos de ejemplo. La API no respondió.',
          timer: 3000
        });

        // Usar datos mock como fallback
        setDatosSelect(datosMock);
        setLoadingDatos(false);
      }
    }
    cargarDatos();
  }, []);

  // --------------------------------------------------------------
  // Depuración: Monitorear cambios en empaques
  // --------------------------------------------------------------
  useEffect(() => {
    console.log("Estado actual de empaques:", empaques);
    console.log("Descripciones por producto:", 
      empaques.flatMap((emp, empIdx) => 
        emp.items?.map((item, itemIdx) => ({
          empaque: empIdx + 1,
          producto: itemIdx + 1,
          descripcion: item.descripcion || "SIN DESCRIPCIÓN",
          esBouquet: item.esBouquet,
          tieneProducto: !!item.producto
        })) || []
      )
    );
  }, [empaques]);

  // --------------------------------------------------------------
  // Manejo de cambios en encabezado
  // --------------------------------------------------------------
  function handleHeaderChange(field, value) {
    const updatedHeader = { ...header, [field]: value };

    // Si se cambia el check de IVA, recalcular IVA y total
    if (field === 'tieneIVA') {
      const valorVenta = Number(updatedHeader.valorVenta) || 0;
      const iva = value ? valorVenta * 0.19 : 0;
      const totalVenta = valorVenta + iva;

      updatedHeader.iva = iva.toString();
      updatedHeader.totalVenta = totalVenta.toString();
    }

    // Si se cambia el valor de venta, recalcular IVA y total si aplica
    if (field === 'valorVenta') {
      const valorVenta = Number(value) || 0;
      const iva = updatedHeader.tieneIVA ? valorVenta * 0.19 : 0;
      const totalVenta = valorVenta + iva;

      updatedHeader.iva = iva.toString();
      updatedHeader.totalVenta = totalVenta.toString();
    }

    setHeader(updatedHeader);
  }

  // --------------------------------------------------------------
  // NUEVO: Manejo de cambios en empaques
  // --------------------------------------------------------------
  function handleEmpaquesChange(nuevosEmpaques) {
    console.log("Nuevos empaques recibidos:", nuevosEmpaques);
    setEmpaques(nuevosEmpaques);

    // Calcular totales del encabezado basado en los empaques
    let totalPiezas = 0;
    let totalFulles = 0; // <-- NUEVO: Total de fulles calculados
    let totalTallos = 0;
    let valorVenta = 0;

    nuevosEmpaques.forEach(empaque => {
      // Sumar cantidad de empaques físicos
      const cantidadEmpaques = Number(empaque.cantidadEmpaque) || 0;
      totalPiezas += cantidadEmpaques;

      // Calcular fulles según equivalencia del tipo de empaque
      const tipoEmpaque = datosSelect.tiposEmpaque.find(t => t.id === empaque.tipoEmpaque);
      const equivFull = tipoEmpaque?.equivFull || 1;
      totalFulles += cantidadEmpaques * equivFull;

      // Sumar totales de todos los items dentro del empaque
      if (empaque.items && empaque.items.length > 0) {
        empaque.items.forEach(item => {
          totalTallos += Number(item.totTallosRegistro) || 0;
          valorVenta += Number(item.valorRegistro) || 0;
        });
      }
    });

    // Calcular IVA y total
    const iva = header.tieneIVA ? valorVenta * 0.19 : 0;
    const totalVenta = valorVenta + iva;

    setHeader(prev => ({
      ...prev,
      totalPiezas: totalPiezas.toString(),
      equivalenciaFulles: totalFulles.toString(), // <-- NUEVO: Usar totalFulles calculado
      totalTallos: totalTallos.toString(),
      valorVenta: valorVenta.toString(),
      iva: iva.toString(),
      totalVenta: totalVenta.toString()
    }));
  }

  // --------------------------------------------------------------
  // Validaciones generales
  // --------------------------------------------------------------
  function validateAll() {
    // Validar encabezado
    if (!header.fechaSolicitud) {
      headerRefs.fechaSolicitud.current?.focus();
      Swal.fire("Error", "La fecha de solicitud es obligatoria.", "warning");
      return false;
    }

    if (!header.fechaEntrega) {
      headerRefs.fechaEntrega.current?.focus();
      Swal.fire("Error", "La fecha de entrega es obligatoria.", "warning");
      return false;
    }

    if (!header.cliente) {
      headerRefs.cliente.current?.focus();
      Swal.fire("Error", "El cliente es obligatorio.", "warning");
      return false;
    }

    if (!header.ejecutivo) {
      headerRefs.ejecutivo.current?.focus();
      Swal.fire("Error", "El ejecutivo es obligatorio.", "warning");
      return false;
    }

    // Validar empaques
    if (!empaques || empaques.length === 0) {
      Swal.fire("Error", "Debe agregar al menos un empaque al pedido.", "warning");
      return false;
    }

    // Validar que cada empaque tenga al menos un item
    for (let i = 0; i < empaques.length; i++) {
      const emp = empaques[i];

      if (!emp.tipoEmpaque) {
        Swal.fire("Error", `Empaque ${i + 1}: El tipo de empaque es obligatorio.`, "warning");
        return false;
      }

      if (!emp.cantidadEmpaque || Number(emp.cantidadEmpaque) <= 0) {
        Swal.fire("Error", `Empaque ${i + 1}: La cantidad de empaques debe ser mayor que cero.`, "warning");
        return false;
      }

      if (!emp.items || emp.items.length === 0) {
        Swal.fire("Error", `Empaque ${i + 1}: Debe contener al menos un producto.`, "warning");
        return false;
      }

      // Validar items dentro del empaque
      for (let j = 0; j < emp.items.length; j++) {
        const item = emp.items[j];

        if (!item.producto) {
          Swal.fire("Error", `Empaque ${i + 1}, Producto ${j + 1}: Producto es obligatorio.`, "warning");
          return false;
        }

        // NUEVO: Validar descripción
        if (!item.descripcion || item.descripcion.trim() === '') {
          Swal.fire("Error", `Empaque ${i + 1}, Producto ${j + 1}: Descripción es obligatoria.`, "warning");
          return false;
        }

        if (item.esBouquet) {
          // Validar bouquets
          if (!item.cantidadBouquets || Number(item.cantidadBouquets) <= 0) {
            Swal.fire("Error", `Empaque ${i + 1}, Bouquet ${j + 1}: Cantidad de bouquets debe ser mayor que cero.`, "warning");
            return false;
          }

          // Validar que tallos por bouquet coincida con receta
          if (item.receta && item.receta.length > 0) {
            const sumaReceta = item.receta.reduce((sum, ing) => sum + (Number(ing.tallosPorBouquet) || 0), 0);
            const tallosBouquet = Number(item.tallosRamo) || 0;

            if (sumaReceta !== tallosBouquet) {
              Swal.fire({
                icon: 'warning',
                title: 'Validación de receta',
                html: `Empaque ${i + 1}, Bouquet ${j + 1}:<br>
                       La suma de la receta (${sumaReceta} tallos) no coincide con los tallos por bouquet (${tallosBouquet} tallos).<br>
                       ¿Desea continuar de todos modos?`,
                showCancelButton: true,
                confirmButtonText: 'Sí, continuar',
                cancelButtonText: 'Corregir'
              }).then((result) => {
                if (!result.isConfirmed) {
                  return false;
                }
              });
            }
            
          }

          if (!item.precioVenta || Number(item.precioVenta) <= 0) {
            Swal.fire("Error", `Empaque ${i + 1}, Bouquet ${j + 1}: Precio de venta debe ser mayor que cero.`, "warning");
            return false;
          }
        } else {
          // Validar productos simples
          if (!item.cantidadEmpaque || Number(item.cantidadEmpaque) <= 0) {
            Swal.fire("Error", `Empaque ${i + 1}, Producto ${j + 1}: Cantidad de empaque debe ser mayor que cero.`, "warning");
            return false;
          }

          if (!item.precioVenta || Number(item.precioVenta) <= 0) {
            Swal.fire("Error", `Empaque ${i + 1}, Producto ${j + 1}: Precio de venta debe ser mayor que cero.`, "warning");
            return false;
          }
        }
      }
    }

    return true;
  }

  function validarPedidoCompleto() {
    const errores = [];

    // ========== 1. ENCABEZADO ==========
    if (!header.cliente) errores.push("Cliente es obligatorio");
    if (!header.ejecutivo) errores.push("Ejecutivo es obligatorio");
    if (!header.fechaSolicitud) errores.push("Fecha de solicitud es obligatoria");
    if (!header.fechaEntrega) errores.push("Fecha de entrega es obligatoria");
    if (!header.moneda) errores.push("Moneda es obligatoria");

    // TRM es obligatorio y mayor a 0
    const trmValue = parseFloat(header.trm);
    if (!header.trm || isNaN(trmValue) || trmValue <= 0) {
      errores.push("TRM es obligatorio y debe ser mayor a 0");
    }

    // ========== 2. EMPAQUES ==========
    if (empaques.length === 0) {
      errores.push("Debe agregar al menos un empaque");
      return errores;
    }

    empaques.forEach((empaque, empIndex) => {
      const numEmpaque = empIndex + 1;

      // Validar empaque
      if (!empaque.tipoEmpaque) {
        errores.push(`Empaque ${numEmpaque}: Tipo de empaque es obligatorio`);
      }

      const cantidadEmpaque = parseInt(empaque.cantidadEmpaque);
      if (!empaque.cantidadEmpaque || isNaN(cantidadEmpaque) || cantidadEmpaque <= 0) {
        errores.push(`Empaque ${numEmpaque}: Cantidad de empaques debe ser mayor a 0`);
      }

      // Validar productos en el empaque
      if (!empaque.items || empaque.items.length === 0) {
        errores.push(`Empaque ${numEmpaque}: Debe contener al menos un producto`);
      } else {
        empaque.items.forEach((item, itemIndex) => {
          const numProducto = itemIndex + 1;

          // ========== VALIDACIONES PARA TODOS LOS PRODUCTOS ==========

          // Producto obligatorio
          if (!item.producto) {
            errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Producto es obligatorio`);
          }

          // NUEVO: Descripción obligatoria
          if (!item.descripcion || item.descripcion.trim() === '') {
            errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Descripción es obligatoria`);
          }

          // Unidad de facturación obligatoria
          if (!item.unidadFacturacion) {
            errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Unidad de facturación es obligatoria`);
          }

          // Predio NO es obligatorio (se envía 0 si no hay)
          // No validamos predio

          // Precio obligatorio y mayor a 0
          const precioVenta = parseFloat(item.precioVenta);
          if (!item.precioVenta || isNaN(precioVenta) || precioVenta <= 0) {
            errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Precio de venta debe ser mayor a 0`);
          }

          // ========== VALIDACIONES ESPECÍFICAS POR TIPO ==========

          if (item.esBouquet) {
            // ========== VALIDACIONES PARA BOUQUETS ==========

            // Cantidad de bouquets obligatoria
            const cantidadBouquets = parseInt(item.cantidadBouquets);
            if (!item.cantidadBouquets || isNaN(cantidadBouquets) || cantidadBouquets <= 0) {
              errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}: Cantidad de bouquets debe ser mayor a 0`);
            }

            // Validar que tallos por bouquet sea mayor a 0
            const tallosBouquet = parseInt(item.tallosRamo);
            if (!item.tallosRamo || isNaN(tallosBouquet) || tallosBouquet <= 0) {
              errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}: Tallos por bouquet debe ser mayor a 0`);
            }

            // Validar receta
            if (!item.receta || item.receta.length === 0) {
              errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}: La receta debe tener al menos un ingrediente`);
            } else {
              // Validar cada ingrediente
              item.receta.forEach((ingrediente, ingIndex) => {
                const numIng = ingIndex + 1;

                if (!ingrediente.producto) {
                  errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}, Ingrediente ${numIng}: Producto es obligatorio`);
                }
                if (!ingrediente.variedad) {
                  errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}, Ingrediente ${numIng}: Variedad es obligatoria`);
                }
                
                const tallosPorBouquet = parseInt(ingrediente.tallosPorBouquet);
                if (!ingrediente.tallosPorBouquet || isNaN(tallosPorBouquet) || tallosPorBouquet <= 0) {
                  errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}, Ingrediente ${numIng}: Tallos por bouquet debe ser mayor a 0`);
                }
              });

              // Validar que suma de receta coincida con tallos por bouquet
              const sumaReceta = item.receta.reduce((sum, ing) => {
                const tallos = parseInt(ing.tallosPorBouquet);
                return sum + (isNaN(tallos) ? 0 : tallos);
              }, 0);

              if (sumaReceta !== tallosBouquet) {
                errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}: La suma de la receta (${sumaReceta} tallos) no coincide con los tallos por bouquet (${tallosBouquet} tallos)`);
              }
            }

          } else {
            // ========== VALIDACIONES PARA PRODUCTOS SIMPLES ==========

            // Variedad obligatoria para productos simples
            if (!item.variedad) {
              errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Variedad es obligatoria`);
            }

            // Grado obligatorio para productos simples
            if (!item.grado) {
              errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Grado es obligatorio`);
            }

            // Tallos por ramo obligatorio
            const tallosRamo = parseInt(item.tallosRamo);
            if (!item.tallosRamo || isNaN(tallosRamo) || tallosRamo <= 0) {
              errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Tallos por ramo debe ser mayor a 0`);
            }

            // Ramos por caja obligatorio
            const ramosCaja = parseInt(item.ramosCaja);
            if (!item.ramosCaja || isNaN(ramosCaja) || ramosCaja <= 0) {
              errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Ramos por caja debe ser mayor a 0`);
            }
          }
        });
      }
    });

    return errores;
  }

  // EN Pedidos.jsx, AÑADE esta función después de validarPedidoCompleto (antes de handleSave)

  function prepararDatosParaGuardar() {
    console.log("Preparando datos para guardar...");

    // 1. ENCABEZADO - Convertir a formato de tabla SAS_EncabPedido
    const encabezadoData = {
      IdCliente: parseInt(header.cliente) || 0,
      IdEjecutivo: parseInt(header.ejecutivo) || 0,
      FechaSolicitud: header.fechaSolicitud || '',
      FechaEntrega: header.fechaEntrega || '',
      IdMoneda: header.moneda || '',
      TRM: parseFloat(header.trm) || 0,
      PO_Cliente: header.poCodeEncab || '',
      Observaciones: header.observaciones || '',
      AWB: header.guiaMaster || '',
      AWB_HIJA: header.guiaHija || '',
      AWB_NIETA: header.guiaNieta || '',
      IdAerolinea: header.aerolinea ? parseInt(header.aerolinea) : null,
      IdAgencia: header.agencia ? parseInt(header.agencia) : null,
      PuertoSalida: header.puertoSalida || '',
      IVA: header.tieneIVA ? 1 : 0,
      Estado: "Pendiente",
      // Si no es nuevo, incluir el ID del pedido
      ...(header.noPedido !== "PED-000000" && {
        IdEncabPedido: parseInt(header.noPedido.replace("PED-", ""))
      })
    };

    console.log("Encabezado preparado:", encabezadoData);

    // 2. EMPAQUES - Preparar estructura jerárquica
    const empaquesData = empaques.map((empaque, empIndex) => {
      console.log(`Procesando empaque ${empIndex + 1}:`, empaque);

      // Datos para SAS_DetEmpaque
      const datosEmpaque = {
        IdTipoEmpaque: parseInt(empaque.tipoEmpaque) || 0,
        Cantidad: parseInt(empaque.cantidadEmpaque) || 1,
        PO_Empaque: empaque.poCodeEmpaque || ''
      };

      // Productos dentro del empaque
      const productosData = empaque.items.map((item, itemIndex) => {
        console.log(`  Procesando producto ${itemIndex + 1}:`, item);

        // Datos para SAS_DetProducto
        const datosProducto = {
          IdProducto: parseInt(item.producto) || 0,
          IdVariedad: item.variedad ? parseInt(item.variedad) : 0,
          IdGrado: item.grado ? parseInt(item.grado) : 0,
          IdUnidad: parseInt(item.unidadFacturacion) || 0,
          IdPredio: item.predio ? parseInt(item.predio) : 0,
          Tallos_Ramo: parseInt(item.tallosRamo) || 0,
          Ramos_Caja: parseInt(item.ramosCaja) || 0,
          Precio_Venta: parseFloat(item.precioVenta) || 0,
          // NUEVO: Incluir la descripción del frontend
          Descripcion: item.descripcion || (item.esBouquet ? "Bouquet personalizado" : "")
        };

        // Si es bouquet, preparar receta para SAS_DetReceta
        let recetaData = [];
        if (item.esBouquet && item.receta && item.receta.length > 0) {
          recetaData = item.receta.map((ingrediente, ingIndex) => {
            return {
              IdProducto: parseInt(ingrediente.producto) || 0,
              IdVariedad: parseInt(ingrediente.variedad) || 0,
              Cantidad: parseInt(ingrediente.tallosPorBouquet) || 0,
              // NUEVO: Incluir descripción de ingredientes si aplica
              Descripcion: ingrediente.descripcion || ""
            };
          });

          console.log(`    Receta con ${recetaData.length} ingredientes`);
        }

        return {
          producto: datosProducto,
          receta: recetaData
        };
      });

      return {
        empaque: datosEmpaque,
        productos: productosData
      };
    });

    console.log("Empaques preparados:", empaquesData);

    // 3. ESTRUCTURA FINAL PARA ENVIAR
    const datosCompletos = {
      encabezado: encabezadoData,
      empaques: empaquesData
    };

    console.log("Datos completos preparados:", datosCompletos);
    console.log("Descripciones de productos:", 
      datosCompletos.empaques.flatMap(emp => 
        emp.productos.map(p => ({
          productoId: p.producto.IdProducto,
          descripcion: p.producto.Descripcion,
          esBouquet: p.producto.Descripcion?.includes("Bouquet") || false
        }))
      )
    );
    return datosCompletos;
  }

  // --------------------------------------------------------------
  // Guardar pedido
  // --------------------------------------------------------------
  async function handleSave() {
    console.log("Iniciando validación del pedido...");

    // Determinar si es guardar nuevo o actualizar
    const esNuevo = header.noPedido === "PED-000000";
    console.log("Es nuevo pedido?", esNuevo);
    // 1. Ejecutar validación completa
    const errores = validarPedidoCompleto();

    // 2. Si hay errores, mostrarlos
    if (errores.length > 0) {
      console.log("Errores encontrados:", errores);

      Swal.fire({
        icon: 'error',
        title: 'Errores de validación',
        html: `
        <div class="text-left">
          <p class="font-semibold mb-2">Por favor corrija los siguientes errores:</p>
          <div class="max-h-60 overflow-y-auto">
            <ul class="list-disc pl-5 space-y-1">
              ${errores.map(error => `<li class="text-sm">${error}</li>`).join('')}
            </ul>
          </div>
          <p class="text-xs text-gray-500 mt-3">Total de errores: ${errores.length}</p>
        </div>
      `,
        confirmButtonText: 'Entendido',
        width: '500px'
      });

      return; // Detener el proceso
    }

    console.log("Validación pasada. Preparando datos...");

    // 3. Preparar datos para el backend
    const datosParaGuardar = prepararDatosParaGuardar();

    // 4. Mostrar confirmación con vista previa
    Swal.fire({
      title: '¿Guardar pedido?',
      html: `
      <div class="text-left">
        <p class="font-medium mb-2">Se guardarán los siguientes datos:</p>
        <div class="text-xs space-y-1 max-h-60 overflow-y-auto">
          <p><strong>Cliente ID:</strong> ${datosParaGuardar.encabezado.IdCliente}</p>
          <p><strong>Ejecutivo ID:</strong> ${datosParaGuardar.encabezado.IdEjecutivo}</p>
          <p><strong>Fechas:</strong> ${datosParaGuardar.encabezado.FechaSolicitud} → ${datosParaGuardar.encabezado.FechaEntrega}</p>
          <p><strong>Empaques:</strong> ${datosParaGuardar.empaques.length}</p>
          <p><strong>Total productos:</strong> ${datosParaGuardar.empaques.reduce((sum, emp) => sum + emp.productos.length, 0)}</p>
          <p><strong>Descripciones incluidas:</strong> ${datosParaGuardar.empaques.flatMap(emp => 
            emp.productos.map(p => p.producto.Descripcion || 'Sin descripción')
          ).filter(Boolean).length}</p>
        </div>
        <p class="text-xs text-gray-500 mt-3">Revise la consola para ver todos los datos.</p>
      </div>
    `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
      width: '500px'
    }).then((result) => {
      if (result.isConfirmed) {
        // 5. Iniciar proceso de guardado real
        iniciarGuardado(datosParaGuardar);
      }
    });
  }

  async function iniciarGuardado(datosParaGuardar) {
    setGuardando(true);

    try {
      // Mostrar loading
      Swal.fire({
        title: "Enviando al servidor...",
        text: "Guardando pedido en la base de datos",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // 1. Llamar al servicio real
      console.log("Llamando a guardarPedidoCompleto...");
      console.log("Datos para guardar (incluyendo descripciones):", datosParaGuardar);
      console.log("Descripciones de productos:", 
        datosParaGuardar.empaques.flatMap(emp => 
          emp.productos.map(p => ({
            productoId: p.producto.IdProducto,
            descripcion: p.producto.Descripcion
          }))
        )
      );

      const resultado = await guardarPedidoCompleto(datosParaGuardar);
      console.log("Resultado del servidor:", resultado);

      if (resultado.success) {
        // 2. Actualizar estado con respuesta real
        const nuevoNumero = `PED-${String(resultado.idEncabPedido).padStart(6, "0")}`;

        setHeader(prev => ({
          ...prev,
          noPedido: nuevoNumero,
          estadoPedido: "Pendiente"
        }));

        // 3. Mostrar éxito con datos reales
        Swal.fire({
          icon: 'success',
          title: '¡Pedido Guardado!',
          html: `
          <div class="text-center">
            <p class="font-semibold text-lg">${nuevoNumero}</p>
            <div class="mt-3 text-sm text-left bg-green-50 p-3 rounded border border-green-200">
              <p class="font-medium text-green-800">✓ Guardado en base de datos</p>
              <p class="mt-2"><strong>ID Pedido:</strong> ${resultado.idEncabPedido}</p>
              <p><strong>Fecha registro:</strong> ${resultado.fechaRegistro || new Date().toLocaleString()}</p>
              <p><strong>Mensaje:</strong> ${resultado.message}</p>
              <p><strong>Descripciones guardadas:</strong> ${datosParaGuardar.empaques.flatMap(emp => 
                emp.productos.map(p => p.producto.Descripcion || 'Sin descripción')
              ).filter(Boolean).length}</p>
            </div>
            <p class="text-xs text-gray-500 mt-3">Puede continuar trabajando con este pedido.</p>
          </div>
        `,
          confirmButtonText: 'Aceptar',
          width: '500px'
        });

      } else {
        // 4. Manejar error del servidor
        throw new Error(resultado.message || "Error desconocido del servidor");
      }

      setGuardando(false);

    } catch (err) {
      console.error("Error en el proceso de guardado:", err);

      // Mostrar error específico
      let mensajeError = err.message;
      if (err.message.includes("Failed to fetch")) {
        mensajeError = "No se pudo conectar con el servidor. Verifique la conexión.";
      } else if (err.message.includes("404")) {
        mensajeError = "Servicio no encontrado. Verifique la URL del API.";
      } else if (err.message.includes("Descripcion") || err.message.includes("descripción")) {
        mensajeError = "Error relacionado con las descripciones de productos. Verifique que todos los campos de descripción estén completos.";
      }

      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        html: `
        <div class="text-left">
          <p class="font-medium">${mensajeError}</p>
          <div class="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <p><strong>Detalles:</strong></p>
            <p class="mt-1">${err.message}</p>
            <p class="mt-2 text-gray-600">Revise la consola para más información.</p>
          </div>
          <p class="text-xs text-gray-500 mt-3">Los datos no se han perdido. Puede intentar nuevamente.</p>
        </div>
      `,
        confirmButtonText: 'Entendido',
        width: '500px'
      });

      setGuardando(false);
    }
  }

  // --------------------------------------------------------------
  // Nuevo pedido
  // --------------------------------------------------------------
  function handleNew() {
    Swal.fire({
      title: '¿Nuevo pedido?',
      text: "Se perderán los cambios no guardados",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, nuevo pedido',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setHeader({
          noPedido: `PED-000000`,
          cliente: "",
          ejecutivo: "",
          fechaSolicitud: todayISODate(),
          fechaEntrega: "",
          moneda: "USD",
          trm: "",
          poCodeEncab: "",
          observaciones: "",
          guiaMaster: "",
          guiaHija: "",
          guiaNieta: "",
          aerolinea: "",
          agencia: "",
          puertoSalida: "",
          estadoPedido: "Pendiente",
          noInvoice: "0",
          noEtiqueta: "0",
          noPlanilla: "0",
          noFito: "0",
          totalPiezas: "0",
          equivalenciaFulles: "0",
          totalTallos: "0",
          valorVenta: "0",
          tieneIVA: false,
          iva: "0",
          totalVenta: "0",
        });
        setEmpaques([]);

        Swal.fire(
          '¡Listo!',
          'Nuevo pedido creado',
          'success'
        );
      }
    });
  }

  // --------------------------------------------------------------
  // Buscar pedidos (mock temporal)
  // --------------------------------------------------------------
  function handleOpenModal() {
    Swal.fire({
      icon: 'info',
      title: 'Búsqueda de pedidos',
      text: 'Funcionalidad en desarrollo. Próximamente disponible.',
      timer: 3000
    });
  }

  // --------------------------------------------------------------
  // Imprimir (mock temporal)
  // --------------------------------------------------------------
  function handlePrint() {
    if (!header.noPedido || header.noPedido === "PED-000000") {
      Swal.fire("Aviso", "No hay pedido para imprimir.", "info");
      return;
    }

    // Preparar datos para imprimir
    const datosImpresion = {
      encabezado: header,
      empaques: empaques,
      fechaImpresion: new Date().toLocaleDateString('es-CO')
    };

    console.log("Datos para imprimir:", datosImpresion);
    console.log("Descripciones en impresión:", 
      empaques.flatMap((emp, empIdx) => 
        emp.items?.map((item, itemIdx) => ({
          empaque: empIdx + 1,
          producto: itemIdx + 1,
          descripcion: item.descripcion || "Sin descripción"
        })) || []
      )
    );

    Swal.fire({
      icon: 'info',
      title: 'Imprimir PDF',
      text: 'Funcionalidad en desarrollo. Los datos están listos en consola.',
      timer: 3000
    });
  }

  // --------------------------------------------------------------
  // Renderizado
  // --------------------------------------------------------------
  if (loadingDatos) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos iniciales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Barra de acciones COMPACTA */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-slate-700">Pedidos - All Season</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">Sistema de pedidos</p>
            </div>
            <button
              onClick={() => setMenuCompacto(!menuCompacto)}
              className="md:hidden text-gray-500 hover:text-gray-700 ml-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuCompacto ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
              </svg>
            </button>
          </div>
          <div className="text-right">
            <div className="text-xs md:text-sm font-medium text-gray-700">
              Estado: <span className={`font-bold ${header.noPedido !== 'PED-000000' ? 'text-green-600' : 'text-orange-600'}`}>
                {header.noPedido !== 'PED-000000' ? 'Pendiente' : 'Sin guardar'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {header.noPedido}
            </div>
          </div>
        </div>

        {/* Botones - Responsivos */}
        <div className={`${menuCompacto ? 'hidden md:flex' : 'flex'} flex-col sm:flex-row gap-2`}>
          <button
            onClick={handleOpenModal}
            className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition font-medium text-sm flex-1"
          >
            <div className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Buscar</span>
            </div>
          </button>

          <button
            onClick={handleSave}
            disabled={guardando}
            className={`rounded-lg px-3 py-2 transition font-medium text-sm flex-1 ${guardando
              ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
          >
            <div className="flex items-center justify-center gap-1">
              {guardando ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{header.noPedido !== "PED-000000" ? "Actualizar" : "Guardar"}</span>
                </>
              )}
            </div>
          </button>

          <button
            onClick={handleNew}
            className="bg-gray-500 text-white rounded-lg px-3 py-2 hover:bg-gray-600 transition font-medium text-sm flex-1"
          >
            <div className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo</span>
            </div>
          </button>

          <button
            onClick={handlePrint}
            disabled={header.noPedido === "PED-000000"}
            className={`rounded-lg px-3 py-2 transition font-medium text-sm flex-1 ${header.noPedido !== "PED-000000"
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            <div className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimir</span>
            </div>
          </button>
        </div>
      </div>

      {/* Encabezado del pedido */}
      <PedidoHeader
        header={header}
        onChange={handleHeaderChange}
        clientes={datosSelect.clientes}
        ejecutivos={datosSelect.ejecutivos}
        monedas={datosSelect.monedas}
        aerolineas={datosSelect.aerolineas}
        agencias={datosSelect.agencias}
        inputRefs={headerRefs}
      />

      {/* NUEVO: Componente de empaques */}
      <PedidoEmpaque
        empaques={empaques}
        onChangeEmpaques={handleEmpaquesChange}
        productos={datosSelect.productos}
        tiposEmpaque={datosSelect.tiposEmpaque}
        unidadesFacturacion={datosSelect.unidadesFacturacion}
        predios={datosSelect.predios}
      />

      {/* Información adicional - COMPACTA */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm md:text-base font-semibold text-slate-700">Ayuda Rápida</h4>
          <button
            onClick={() => {
              Swal.fire({
                icon: 'info',
                title: 'Tips Rápidos',
                html: `
                  <div class="text-left space-y-2">
                    <p><b>✓</b> Cada empaque puede contener múltiples productos</p>
                    <p><b>✓</b> Bouquets permiten crear recetas con ingredientes</p>
                    <p><b>✓</b> Totales se calculan automáticamente</p>
                    <p><b>✓</b> Toque los encabezados para expandir/colapsar</p>
                    <p><b>✓</b> Fulles se calculan según equivalencia del tipo de empaque</p>
                    <p><b>✓</b> IVA se calcula automáticamente al marcar la casilla</p>
                    <p><b>✓</b> <strong>Descripción es obligatoria</strong> para cada producto</p>
                    <p><b>✓</b> Descripción se autocompleta con Producto + Variedad + Grado</p>
                  </div>
                `,
                confirmButtonText: 'Entendido'
              });
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Ver más tips
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs md:text-sm">
          <div className="p-2 bg-blue-50 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="text-gray-600">
              <span className="font-medium text-blue-700">IVA:</span> Marque la casilla para calcular automáticamente el 19%
            </div>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="text-gray-600">
              <span className="font-medium text-purple-700">Fulles:</span> Se calculan según la equivalencia del tipo de empaque
            </div>
          </div>
          <div className="p-2 bg-green-50 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="text-gray-600">
              <span className="font-medium text-green-700">Descripción:</span> Campo obligatorio para todos los productos
            </div>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <div className="text-gray-600">
              <span className="font-medium text-amber-700">Autocompletado:</span> Descripción se genera automáticamente al seleccionar Producto + Variedad + Grado
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}