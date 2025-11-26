// src/modules/pedidos/Pedidos.jsx
import React, { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import PedidoHeader from "./PedidoHeader";
import PedidoDetail from "./PedidoDetail";

// Datos mock temporales - luego vendrán de servicios/API
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
    { id: "USD", nombre: "Dólar Americano (USD)" },
    { id: "EUR", nombre: "Euro (EUR)" },
    { id: "COP", nombre: "Peso Colombiano (COP)" },
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
  ],
  variedades: [
    { id: "1", nombre: "Red Naomi", productoId: "1" },
    { id: "2", nombre: "Avalanche", productoId: "1" },
    { id: "3", nombre: "Sunflower", productoId: "2" },
  ],
  grados: [
    { id: "1", nombre: "Grado A - Premium" },
    { id: "2", nombre: "Grado B - Estándar" },
    { id: "3", nombre: "Grado C - Económico" },
  ],
  tiposEmpaque: [
    { id: "1", descripcion: "Caja Cartón 100cm" },
    { id: "2", descripcion: "Caja Madera 120cm" },
    { id: "3", descripcion: "Bolsa Plástica" },
  ],
  unidadesFacturacion: [
    { id: "1", nombre: "Tallos" },
    { id: "2", nombre: "Ramos" },
    { id: "3", nombre: "Cajas" },
  ],
  predios: [
    { id: "1", nombre: "Predio La Floresta" },
    { id: "2", nombre: "Predio El Jardín" },
    { id: "3", nombre: "Predio Santa Helena" },
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
  // Estado del encabezado - ADAPTADO PARA FLORES
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
  // Estado del detalle
  // --------------------------------------------------------------
  const [items, setItems] = useState([]);

  // --------------------------------------------------------------
  // Datos de selects globales (mock temporal)
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
  const itemRefs = useRef([]);

  // --------------------------------------------------------------
  // Cargar datos mock iniciales
  // --------------------------------------------------------------
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoadingDatos(true);
        // Simular carga de datos
        setTimeout(() => {
          setDatosSelect(datosMock);
          setLoadingDatos(false);
        }, 1000);
      } catch (err) {
        console.error("Error cargando datos:", err);
        Swal.fire("Error", "No se pudieron cargar los datos iniciales.", "error");
        setLoadingDatos(false);
      }
    }
    cargarDatos();
  }, []);

  // --------------------------------------------------------------
  // Manejo de cambios en encabezado
  // --------------------------------------------------------------
  function handleHeaderChange(field, value) {
    setHeader((prev) => ({ ...prev, [field]: value }));
  }

  // --------------------------------------------------------------
  // Manejo de cambios en detalle
  // --------------------------------------------------------------
  function handleItemsChange(newItems) {
    console.log("Datos recibidos del detalle:", newItems);
    setItems(newItems);
    
    // Calcular totales del encabezado basado en los items
    const totalPiezas = newItems.reduce((sum, item) => sum + (Number(item.cantidadEmpaque) || 0), 0);
    const totalTallos = newItems.reduce((sum, item) => sum + (Number(item.totTallosRegistro) || 0), 0);
    const valorVenta = newItems.reduce((sum, item) => sum + (Number(item.valorRegistro) || 0), 0);
    
    // Calcular IVA y total
    const iva = header.tieneIVA ? valorVenta * 0.19 : 0;
    const totalVenta = valorVenta + iva;
    
    setHeader(prev => ({
      ...prev,
      totalPiezas: totalPiezas.toString(),
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

    if (!items || items.length === 0) {
      Swal.fire("Error", "Agrega al menos un producto al detalle.", "warning");
      return false;
    }

    // Validar items individuales
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.producto) {
        itemRefs.current[i]?.focus();
        Swal.fire("Error", `Fila ${i + 1}: Producto es obligatorio.`, "warning");
        return false;
      }
      if (!it.cantidadEmpaque || Number(it.cantidadEmpaque) <= 0) {
        itemRefs.current[i]?.focus();
        Swal.fire("Error", `Fila ${i + 1}: Cantidad de empaque debe ser mayor que cero.`, "warning");
        return false;
      }
    }

    return true;
  }

  // --------------------------------------------------------------
  // Guardar pedido (mock temporal)
  // --------------------------------------------------------------
  async function handleSave() {
    if (!validateAll()) return;

    try {
      // Simular guardado
      Swal.fire({
        title: "Guardando...",
        text: "Procesando el pedido",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      setTimeout(() => {
        const nuevoId = Math.floor(Math.random() * 1000) + 1;
        const nuevoNumero = `PED-${String(nuevoId).padStart(6, "0")}`;
        
        setHeader(prev => ({ 
          ...prev, 
          noPedido: nuevoNumero,
          estadoPedido: "Guardado"
        }));

        Swal.fire("¡Guardado!", "Pedido guardado correctamente.", "success");
      }, 1500);

    } catch (err) {
      Swal.fire("Error", "Ocurrió un error al guardar el pedido.", "error");
    }
  }

  // --------------------------------------------------------------
  // Nuevo pedido
  // --------------------------------------------------------------
  function handleNew() {
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
    setItems([]);
    itemRefs.current = [];
  }

  // --------------------------------------------------------------
  // Buscar pedidos (mock temporal)
  // --------------------------------------------------------------
  function handleOpenModal() {
    Swal.fire("Info", "Funcionalidad de búsqueda en desarrollo.", "info");
  }

  // --------------------------------------------------------------
  // Imprimir (mock temporal)
  // --------------------------------------------------------------
  function handlePrint() {
    if (!header.noPedido || header.noPedido === "PED-000000") {
      Swal.fire("Aviso", "No hay pedido para imprimir.", "info");
      return;
    }
    Swal.fire("Info", "Funcionalidad de impresión en desarrollo.", "info");
  }

  // --------------------------------------------------------------
  // Renderizado
  // --------------------------------------------------------------
  if (loadingDatos)
    return <p className="text-center text-gray-500 py-4">Cargando datos iniciales...</p>;

  return (
    <div className="space-y-6">
      {/* Barra de acciones */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">Gestión de Pedidos - All Season Flowers</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleOpenModal}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-blue-700 transition font-medium flex-1"
          >
            Buscar Pedidos
          </button>
          <button
            onClick={handleSave}
            className="bg-orange-500 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-orange-600 transition font-medium flex-1"
          >
            {header.noPedido !== "PED-000000" ? "Actualizar Pedido" : "Guardar Pedido"}
          </button>
          <button
            onClick={handleNew}
            className="bg-gray-500 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-gray-600 transition font-medium flex-1"
          >
            Nuevo Pedido
          </button>
          <button
            onClick={handlePrint}
            disabled={header.noPedido === "PED-000000"}
            className={`rounded-lg px-4 py-3 sm:py-2 transition font-medium flex-1 ${
              header.noPedido !== "PED-000000"
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Imprimir PDF
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

      {/* Detalle del pedido */}
      <PedidoDetail
        items={items}
        onChangeItems={handleItemsChange}
        itemRefsRef={itemRefs}
        productos={datosSelect.productos}
        variedades={datosSelect.variedades}
        grados={datosSelect.grados}
        tiposEmpaque={datosSelect.tiposEmpaque}
        unidadesFacturacion={datosSelect.unidadesFacturacion}
        predios={datosSelect.predios}
      />
    </div>
  );
}