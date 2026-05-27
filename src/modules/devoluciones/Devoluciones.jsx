// src/modules/devoluciones/Devoluciones.jsx
import React, { useState, useEffect, useRef } from "react";
import { CLIENTE } from "../../config/cliente.js";
import Swal from "sweetalert2";
import { Search, Save, Plus, FileText, Trash2, Undo2 } from 'lucide-react';
import DevolucionHeader from "./DevolucionHeader";
import DevolucionDetalle from "./DevolucionDetalle";
import ModalBuscarDevoluciones from "./ModalBuscarDevoluciones"; // Lo crearemos después
import ModalVisorPreliminar from "./ModalVisorPreliminar";
import { getDatosSelect } from "../../services/pedidos/pedidosService";
import {
  getFacturasCliente,
  getDetalleFactura,
  guardarDevolucion,
  getDevolucionEspecifica,
  obtenerUltimoNumeroDevolucion,
  generarPDFDevolucion,
  eliminarDevolucion
} from "../../services/devoluciones/devolucionesService";

function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function Devoluciones() {
  // Estado del encabezado
  const [header, setHeader] = useState({
    idDevolucion: null,
    numeroDevolucion: "DEV-000000",
    fechaDevolucion: todayISODate(),
    cliente: "",
    factura: "",
    moneda: "",
    trm: "",
    observaciones: "",
    totalProductos: 0,
    totalTallos: 0,
    valorDevolucion: 0
  });

  // Estado del detalle
  const [detalle, setDetalle] = useState([]);

  // Datos de selects
  const [datosSelect, setDatosSelect] = useState({ clientes: [] });

  // Facturas del cliente seleccionado
  const [facturas, setFacturas] = useState([]);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [menuCompacto, setMenuCompacto] = useState(false);
  const [mostrarModalBuscar, setMostrarModalBuscar] = useState(false);

  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [urlPDF, setUrlPDF] = useState(null);

  const headerRefs = {
    fechaDevolucion: useRef(null),
    cliente: useRef(null),
    factura: useRef(null)
  };

  // Cargar clientes al inicio
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoadingDatos(true);
        const datosAPI = await getDatosSelect();

        // Mapear clientes al formato esperado por el componente
        const clientesMapeados = datosAPI.clientes?.map(c => ({
          id: c.IdCliente.toString(),
          nombre: c.NOMBRE || ''
        })) || [];

        setDatosSelect({
          clientes: clientesMapeados,
        });
      } catch (err) {
        console.error("Error cargando datos:", err);
        Swal.fire("Error", "No se pudieron cargar los datos iniciales", "error");
      } finally {
        setLoadingDatos(false);
      }
    }
    cargarDatos();
  }, []);

  // Cuando cambia el cliente, cargar sus facturas
  useEffect(() => {
    if (!header.cliente) {
      setFacturas([]);
      setHeader(prev => ({ ...prev, factura: "", moneda: "", trm: "" }));
      setDetalle([]);
      return;
    }

    async function cargarFacturas() {
      setLoadingFacturas(true);
      try {
        const res = await getFacturasCliente(parseInt(header.cliente));
        if (res.success) {
          setFacturas(res.facturas || []);
        } else {
          Swal.fire("Aviso", res.message || "Error al cargar facturas", "warning");
          setFacturas([]);
        }
      } catch (err) {
        console.error("Error cargando facturas:", err);
        Swal.fire("Error", "No se pudieron cargar las facturas", "error");
        setFacturas([]);
      } finally {
        setLoadingFacturas(false);
      }
    }
    cargarFacturas();
  }, [header.cliente]);

  // Cuando se selecciona una factura, cargar su detalle
  useEffect(() => {
    if (!header.factura) {
      setDetalle([]);
      setHeader(prev => ({ ...prev, moneda: "", trm: "" }));
      return;
    }

    const facturaSeleccionada = facturas.find(f => f.idEncabPedido == header.factura);
    if (facturaSeleccionada) {
      setHeader(prev => ({
        ...prev,
        moneda: facturaSeleccionada.moneda,
        trm: facturaSeleccionada.trm
      }));

      if (facturaSeleccionada.tieneDevolucion && facturaSeleccionada.idDevolucion) {
        // Cargar devolución existente
        cargarDevolucionExistente(facturaSeleccionada.idEncabPedido);
      } else {
        // Cargar detalle de la factura para nueva devolución
        cargarDetalleFactura(facturaSeleccionada.idEncabPedido);
      }
    }
  }, [header.factura, facturas]);

  const cargarDetalleFactura = async (idFactura) => {
    setCargandoDetalle(true);
    try {
      const res = await getDetalleFactura(idFactura);
      if (res.success) {
        setDetalle(res.detalle || []);
        calcularTotales(res.detalle || []);
      } else {
        Swal.fire("Error", res.message || "Error al cargar detalle", "error");
      }
    } catch (err) {
      console.error("Error cargando detalle:", err);
      Swal.fire("Error", "No se pudo cargar el detalle de la factura", "error");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cargarDevolucionExistente = async (idFactura) => {
    setCargandoDetalle(true);
    try {
      const res = await getDevolucionEspecifica(idFactura);
      if (res.success) {
        const { encabezado, detalle } = res;
        setHeader(prev => ({
          ...prev,
          idDevolucion: encabezado.idDevolucion,
          numeroDevolucion: encabezado.numeroDevolucion,
          fechaDevolucion: encabezado.fechaDevolucion,
          observaciones: encabezado.observaciones || "",
          moneda: encabezado.moneda || prev.moneda,
          trm: encabezado.trm || prev.trm
        }));
        setDetalle(detalle || []);
        calcularTotales(detalle || []);
      } else {
        Swal.fire("Error", res.message || "Error al cargar devolución", "error");
      }
    } catch (err) {
      console.error("Error cargando devolución existente:", err);
      Swal.fire("Error", "No se pudo cargar la devolución existente", "error");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const calcularTotales = (detalleActual) => {
    let totalTallos = 0;
    let valorTotal = 0;
    detalleActual.forEach(item => {
      const tallos = Number(item.tallosDevolucion) || 0;
      const precio = Number(item.precioUnitario) || 0;
      const flete = Number(item.flete) || 0;
      const fumigacion = Number(item.fumigacion) || 0;
      const otros = Number(item.otros) || 0;
      totalTallos += tallos;
      valorTotal += (tallos * precio) + flete + fumigacion + otros;
    });
    setHeader(prev => ({
      ...prev,
      totalProductos: detalleActual.length,
      totalTallos,
      valorDevolucion: valorTotal
    }));
  };

  const handleHeaderChange = (field, value) => {
    setHeader(prev => ({ ...prev, [field]: value }));
  };

  const handleDetalleChange = (index, field, value) => {
    const nuevoDetalle = [...detalle];
    nuevoDetalle[index][field] = value;
    setDetalle(nuevoDetalle);
    calcularTotales(nuevoDetalle);
  };

  const validateAll = () => {
    if (!header.fechaDevolucion) {
      headerRefs.fechaDevolucion.current?.focus();
      Swal.fire("Error", "La fecha de devolución es obligatoria", "warning");
      return false;
    }
    if (!header.cliente) {
      headerRefs.cliente.current?.focus();
      Swal.fire("Error", "Debe seleccionar un cliente", "warning");
      return false;
    }
    if (!header.factura) {
      headerRefs.factura.current?.focus();
      Swal.fire("Error", "Debe seleccionar una factura", "warning");
      return false;
    }
    if (detalle.length === 0) {
      Swal.fire("Error", "No hay productos para devolver", "warning");
      return false;
    }
    // Validar que al menos un producto tenga tallosDevolucion > 0
    const tieneAlguno = detalle.some(item => Number(item.tallosDevolucion) > 0);
    if (!tieneAlguno) {
      Swal.fire("Error", "Debe ingresar al menos un producto con tallos a devolver", "warning");
      return false;
    }
    // Validar que tallosDevolucion <= tallosFacturados
    for (let i = 0; i < detalle.length; i++) {
      const item = detalle[i];
      if (Number(item.tallosDevolucion) > Number(item.tallosFacturados)) {
        Swal.fire("Error", `Producto ${item.producto}: los tallos a devolver no pueden exceder los facturados (${item.tallosFacturados})`, "warning");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateAll()) return;

    const facturaSeleccionada = facturas.find(f => f.idEncabPedido == header.factura);
    if (!facturaSeleccionada) {
      Swal.fire("Error", "Factura no encontrada", "error");
      return;
    }

    // Confirmación
    const confirmacion = await Swal.fire({
      title: facturaSeleccionada.tieneDevolucion ? '¿Actualizar devolución?' : '¿Guardar devolución?',
      html: `
        <div class="text-left">
          <p>Factura: ${facturaSeleccionada.numeroFacturaFormateado}</p>
          <p>Cliente: ${facturaSeleccionada.cliente}</p>
          <p>Fecha devolución: ${header.fechaDevolucion}</p>
          <p>Total tallos: ${header.totalTallos}</p>
          <p>Valor devolución: $${header.valorDevolucion.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: facturaSeleccionada.tieneDevolucion ? 'Sí, actualizar' : 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    setGuardando(true);
    try {
      // Preparar datos para enviar
      const datosDevolucion = {
        idFactura: parseInt(header.factura),
        fechaDevolucion: header.fechaDevolucion,
        observaciones: header.observaciones || "",
        detalles: detalle.map(item => ({
          idDetProducto: item.idDetProducto,
          tallosDevolucion: parseInt(item.tallosDevolucion) || 0,
          motivo: item.motivo || "",
          flete: parseFloat(item.flete) || 0,
          fumigacion: parseFloat(item.fumigacion) || 0,
          otros: parseFloat(item.otros) || 0
        }))
      };

      const res = await guardarDevolucion(datosDevolucion);

      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: facturaSeleccionada.tieneDevolucion ? '¡Devolución actualizada!' : '¡Devolución guardada!',
          html: `
            <div class="text-left">
              <p>Número de devolución: <strong>${res.numeroDevolucion}</strong></p>
              <p>Factura: ${facturaSeleccionada.numeroFacturaFormateado}</p>
            </div>
          `,
          timer: 3000
        });

        // Actualizar estado local con el número de devolución
        setHeader(prev => ({
          ...prev,
          idDevolucion: res.idDevolucion,
          numeroDevolucion: res.numeroDevolucion
        }));

        // Recargar facturas para actualizar el indicador tieneDevolucion
        if (header.cliente) {
          const facturasRes = await getFacturasCliente(parseInt(header.cliente));
          if (facturasRes.success) setFacturas(facturasRes.facturas);
        }
      } else {
        throw new Error(res.message || "Error al guardar");
      }
    } catch (err) {
      console.error("Error guardando devolución:", err);
      Swal.fire("Error", err.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleNew = () => {
    setHeader({
      idDevolucion: null,
      numeroDevolucion: "DEV-000000",
      fechaDevolucion: todayISODate(),
      cliente: "",
      factura: "",
      moneda: "",
      trm: "",
      observaciones: "",
      totalProductos: 0,
      totalTallos: 0,
      valorDevolucion: 0
    });
    setDetalle([]);
    setFacturas([]);
  };

  const handleSeleccionarDevolucion = (devolucion) => {
    // devolucion tiene idFactura, entonces cargamos esa factura
    setHeader(prev => ({
      ...prev,
      cliente: String(devolucion.idCliente),
      factura: String(devolucion.idFactura),
      fechaDevolucion: devolucion.fechaDevolucion || todayISODate(),
      observaciones: devolucion.observaciones || ""
    }));
    // Luego el efecto se encargará de cargar el detalle
    setMostrarModalBuscar(false);
  };

  // Función para generar PDF
  const handleGenerarPDF = async () => {
    if (!header.idDevolucion) {
      Swal.fire("Aviso", "Debe guardar la devolución primero", "info");
      return;
    }

    try {
      Swal.fire({
        title: 'Generando PDF...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const pdfBlob = await generarPDFDevolucion(parseInt(header.factura));
      const fileURL = URL.createObjectURL(pdfBlob);
      setUrlPDF(fileURL);
      setMostrarVisor(true);

      Swal.close();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo generar el PDF", "error");
    }
  };

  // Función para eliminar una devolución
  const handleEliminar = async () => {
    if (!header.idDevolucion) {
      Swal.fire("Aviso", "No hay una devolución para eliminar", "info");
      return;
    }

    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción eliminará permanentemente la devolución. ¿Desea continuar?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      Swal.fire({
        title: 'Eliminando devolución...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const resultado = await eliminarDevolucion(header.idDevolucion);
      
      if (resultado.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Eliminada!',
          text: resultado.message,
          timer: 2000,
          showConfirmButton: false
        });
        
        // Resetear formulario
        handleNew();
      } else {
        throw new Error(resultado.message || "Error al eliminar");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message || "No se pudo eliminar la devolución", "error");
    }
  };

  // Función para cerrar el visor
  const handleCerrarVisor = () => {
    setMostrarVisor(false);
    if (urlPDF) {
      URL.revokeObjectURL(urlPDF);
      setUrlPDF(null);
    }
  };

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
      {/* ── Barra de acciones profesional ── */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Cabecera info */}
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-rose-600 to-pink-700 rounded-xl flex items-center justify-center shadow-lg shadow-rose-900/40 flex-shrink-0">
              <Undo2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base lg:text-lg leading-tight">Devoluciones / Notas Crédito</h2>
              <p className="text-slate-400 text-xs">{CLIENTE.titulo} — Devoluciones de ventas</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              header.idDevolucion
                ? 'bg-green-500/15 text-green-400 border-green-500/25'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${header.idDevolucion ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
              {header.idDevolucion ? 'Editando' : 'Nuevo'}
            </div>
            <span className="text-slate-500 text-xs font-mono hidden sm:block">{header.numeroDevolucion}</span>
          </div>
        </div>
        {/* Botones */}
        <div className="px-5 py-3">
          <div className={`${menuCompacto ? 'hidden sm:flex' : 'flex'} flex-wrap sm:flex-nowrap gap-2`}>
            <button
              onClick={() => setMostrarModalBuscar(true)}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px]"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span>Buscar</span>
            </button>
            <button
              onClick={handleSave}
              disabled={guardando}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px] ${
                guardando
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-md shadow-green-900/40'
              }`}
            >
              {guardando ? (
                <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-slate-400 flex-shrink-0" /><span>Guardando...</span></>
              ) : (
                <><Save className="w-4 h-4 flex-shrink-0" /><span>{header.idDevolucion ? "Actualizar" : "Guardar"}</span></>
              )}
            </button>
            <button
              onClick={handleNew}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px]"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Nuevo</span>
            </button>
            <button
              onClick={handleGenerarPDF}
              disabled={!header.idDevolucion}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px] ${
                header.idDevolucion
                  ? 'bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleEliminar}
              disabled={!header.idDevolucion}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px] ${
                header.idDevolucion
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Encabezado */}
      <DevolucionHeader
        header={header}
        onChange={handleHeaderChange}
        clientes={datosSelect.clientes}
        facturas={facturas}
        loadingFacturas={loadingFacturas}
        onClienteChange={() => {
          setHeader(prev => ({ ...prev, factura: "", moneda: "", trm: "" }));
          setDetalle([]);
        }}
        inputRefs={headerRefs}
      />

      {/* Detalle */}
      {cargandoDetalle ? (
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando detalle...</p>
        </div>
      ) : (
        header.factura && (
          <DevolucionDetalle
            detalle={detalle}
            onChangeItem={handleDetalleChange}
            soloLectura={false}
          />
        )
      )}

      {/* Visor de PDF */}
      {mostrarVisor && urlPDF && (
        <ModalVisorPreliminar
          url={urlPDF}
          onClose={handleCerrarVisor}
        />
      )}

      {/* Modal de búsqueda */}
      {mostrarModalBuscar && (
        <ModalBuscarDevoluciones
          isOpen={mostrarModalBuscar}
          onClose={() => setMostrarModalBuscar(false)}
          onSeleccionarDevolucion={handleSeleccionarDevolucion}
        />
      )}
    </div>
  );
}