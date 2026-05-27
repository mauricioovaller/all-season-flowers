// src/modules/devolucionesCompras/DevolucionesCompras.jsx
import React, { useState, useEffect, useRef } from "react";
import { CLIENTE } from "../../config/cliente.js";
import Swal from "sweetalert2";
import { Search, Save, Plus, FileText, Trash2, Undo2 } from 'lucide-react';
import DevolucionCompraHeader from "./DevolucionCompraHeader";
import DevolucionCompraDetalle from "./DevolucionCompraDetalle";
import ModalBuscarDevolucionesCompras from "./ModalBuscarDevolucionesCompras";
import ModalVisorPreliminar from "../devoluciones/ModalVisorPreliminar";
import { getDatosSelectCompras } from "../../services/compras/comprasService";
import {
  getComprasProveedor,
  getDetalleCompra,
  guardarDevolucionCompra,
  getDevolucionCompraEspecifica,
  obtenerUltimoNumeroDevolucion,
  generarPDFDevolucionCompra,
  validarDevolucionCompra,
  calcularTotalesDevolucionCompra,
  eliminarDevolucionCompra
} from "../../services/devolucionesCompras/devolucionesComprasService";

function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function DevolucionesCompras() {
  // Estado del encabezado
  const [header, setHeader] = useState({
    idDevolucion: null,
    numeroDevolucion: "DEV-000000",
    fechaDevolucion: todayISODate(),
    proveedor: "",
    compra: "",
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
  const [datosSelect, setDatosSelect] = useState({ proveedores: [] });

  // Compras del proveedor seleccionado
  const [compras, setCompras] = useState([]);
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);


  const [mostrarModalBuscar, setMostrarModalBuscar] = useState(false);

  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [urlPDF, setUrlPDF] = useState(null);

  const headerRefs = {
    fechaDevolucion: useRef(null),
    proveedor: useRef(null),
    compra: useRef(null)
  };

  // Cargar proveedores al inicio
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoadingDatos(true);
        const datosAPI = await getDatosSelectCompras();

        // Mapear proveedores al formato esperado por el componente
        const proveedoresMapeados = datosAPI.proveedores?.map(p => ({
          id: p.IdProveedor.toString(),
          nombre: p.Proveedor || ''
        })) || [];

        setDatosSelect({
          proveedores: proveedoresMapeados,
        });
      } catch (err) {
        console.error("Error cargando datos de compras:", err);
        Swal.fire("Error", "No se pudieron cargar los datos iniciales de compras", "error");
      } finally {
        setLoadingDatos(false);
      }
    }
    cargarDatos();
  }, []);

  // Cuando cambia el proveedor, cargar sus compras
  useEffect(() => {
    if (!header.proveedor) {
      setCompras([]);
      setHeader(prev => ({ ...prev, compra: "", moneda: "", trm: "" }));
      setDetalle([]);
      return;
    }

    async function cargarCompras() {
      try {
        setLoadingCompras(true);
        const res = await getComprasProveedor(parseInt(header.proveedor));
        
        if (res.success) {
          setCompras(res.compras || []);
        } else {
          Swal.fire("Error", res.message || "Error al cargar compras del proveedor", "error");
          setCompras([]);
        }
      } catch (err) {
        console.error("Error cargando compras:", err);
        Swal.fire("Error", "No se pudieron cargar las compras del proveedor", "error");
        setCompras([]);
      } finally {
        setLoadingCompras(false);
      }
    }

    cargarCompras();
  }, [header.proveedor]);

  // Cuando cambia la compra, cargar su detalle
  useEffect(() => {
    if (!header.compra) {
      setDetalle([]);
      setHeader(prev => ({ ...prev, moneda: "", trm: "" }));
      return;
    }

    async function cargarDetalleCompra() {
      try {
        setCargandoDetalle(true);
        const res = await getDetalleCompra(parseInt(header.compra));
        
        if (res.success) {
          // Encontrar la compra seleccionada para obtener moneda y TRM
          const compraSeleccionada = compras.find(c => c.idCompra === parseInt(header.compra));
          
          if (compraSeleccionada) {
            setHeader(prev => ({
              ...prev,
              moneda: compraSeleccionada.idMoneda?.toString() || "",
              trm: compraSeleccionada.trm?.toString() || ""
            }));
          }

          // Preparar detalles con valores iniciales
          const detallesPreparados = res.detalle.map(item => ({
            idDetProducto: item.idDetProducto,
            idProducto: item.idProducto,
            nombreProducto: item.nombreProducto,
            idVariedad: item.idVariedad,
            nombreVariedad: item.nombreVariedad,
            idGrado: item.idGrado,
            nombreGrado: item.nombreGrado,
            idUnidad: item.idUnidad,
            nombreUnidad: item.nombreUnidad,
            tallosRamo: item.tallosRamo,
            tallosComprados: item.tallosComprados,
            precioCompra: item.precioCompra,
            idPredio: item.idPredio,
            nombrePredio: item.nombrePredio,
            tallosDevolucion: item.tallosDevolucion || 0,
            motivo: item.motivo || ""
          }));

          setDetalle(detallesPreparados);
          actualizarTotales(detallesPreparados);
        } else {
          Swal.fire("Error", res.message || "Error al cargar detalle de la compra", "error");
          setDetalle([]);
        }
      } catch (err) {
        console.error("Error cargando detalle de compra:", err);
        Swal.fire("Error", "No se pudo cargar el detalle de la compra", "error");
        setDetalle([]);
      } finally {
        setCargandoDetalle(false);
      }
    }

    cargarDetalleCompra();
  }, [header.compra, compras]);

  // Cargar último número de devolución al inicio
  useEffect(() => {
    async function cargarUltimoNumero() {
      try {
        const res = await obtenerUltimoNumeroDevolucion();
        if (res.success) {
          setHeader(prev => ({
            ...prev,
            numeroDevolucion: res.siguienteNumeroFormateado
          }));
        }
      } catch (err) {
        console.error("Error cargando último número de devolución:", err);
      }
    }
    cargarUltimoNumero();
  }, []);

  // Actualizar totales cuando cambia el detalle
  const actualizarTotales = (detalles) => {
    const totales = calcularTotalesDevolucionCompra(detalles);
    setHeader(prev => ({
      ...prev,
      totalProductos: totales.totalProductos,
      totalTallos: totales.totalTallosDevolucion,
      valorDevolucion: totales.valorDevolucion
    }));
  };

  // Manejar cambios en el encabezado
  const handleHeaderChange = (campo, valor) => {
    setHeader(prev => ({ ...prev, [campo]: valor }));
  };

  // Manejar cambios en el detalle
  const handleDetalleChange = (index, campo, valor) => {
    const nuevosDetalles = [...detalle];
    nuevosDetalles[index][campo] = valor;
    setDetalle(nuevosDetalles);
    actualizarTotales(nuevosDetalles);
  };

  // Cargar una devolución existente para editar
  const cargarDevolucionExistente = async (idCompra) => {
    try {
      setCargandoDetalle(true);
      const res = await getDevolucionCompraEspecifica(idCompra);
      
      if (res.success) {
        // Actualizar encabezado
        setHeader(prev => ({
          ...prev,
          idDevolucion: res.encabezado.idDevolucion,
          numeroDevolucion: res.encabezado.numeroDevolucion,
          fechaDevolucion: res.encabezado.fechaDevolucion,
          proveedor: res.encabezado.idProveedor?.toString() || "",
          compra: idCompra.toString(),
          moneda: res.encabezado.idMoneda?.toString() || "",
          trm: res.encabezado.trm?.toString() || "",
          observaciones: res.encabezado.observaciones || ""
        }));

        // Cargar proveedor para obtener sus compras
        if (res.encabezado.idProveedor) {
          const proveedorRes = await getComprasProveedor(res.encabezado.idProveedor);
          if (proveedorRes.success) {
            setCompras(proveedorRes.compras || []);
          }
        }

        // Preparar detalles
        const detallesPreparados = res.detalle.map(item => ({
          idDetProducto: item.idDetProducto,
          idProducto: item.idProducto,
          nombreProducto: item.nombreProducto,
          idVariedad: item.idVariedad,
          nombreVariedad: item.nombreVariedad,
          idGrado: item.idGrado,
          nombreGrado: item.nombreGrado,
          idUnidad: item.idUnidad,
          nombreUnidad: item.nombreUnidad,
          tallosRamo: item.tallosRamo,
          tallosComprados: item.tallosComprados,
          precioCompra: item.precioCompra,
          idPredio: item.idPredio,
          nombrePredio: item.nombrePredio,
          tallosDevolucion: item.tallosDevolucion || 0,
          motivo: item.motivo || ""
        }));

        setDetalle(detallesPreparados);
        actualizarTotales(detallesPreparados);
        
        Swal.fire("Éxito", "Devolución cargada correctamente", "success");
      } else {
        Swal.fire("Error", res.message || "Error al cargar la devolución", "error");
      }
    } catch (err) {
      console.error("Error cargando devolución existente:", err);
      Swal.fire("Error", "No se pudo cargar la devolución", "error");
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Guardar devolución
  const handleGuardar = async () => {
    // Validar datos
    const datosDevolucion = {
      idCompra: parseInt(header.compra),
      fechaDevolucion: header.fechaDevolucion,
      observaciones: header.observaciones,
      detalles: detalle.map(item => ({
        idDetProducto: item.idDetProducto,
        tallosDevolucion: parseInt(item.tallosDevolucion) || 0,
        motivo: item.motivo || ""
      })).filter(item => item.tallosDevolucion > 0)
    };

    const validacion = validarDevolucionCompra(datosDevolucion);
    if (!validacion.valido) {
      Swal.fire("Error", validacion.errores.join("\n"), "error");
      return;
    }

    try {
      setGuardando(true);
      const res = await guardarDevolucionCompra(datosDevolucion);
      
      if (res.success) {
        Swal.fire({
          title: "¡Éxito!",
          text: res.message,
          icon: "success",
          confirmButtonText: "Aceptar"
        });
        
        // Actualizar número de devolución si es nueva
        if (!header.idDevolucion) {
          setHeader(prev => ({
            ...prev,
            idDevolucion: res.idDevolucion,
            numeroDevolucion: res.numeroDevolucion
          }));
        }
      } else {
        Swal.fire("Error", res.message || "Error al guardar la devolución", "error");
      }
    } catch (err) {
      console.error("Error guardando devolución:", err);
      Swal.fire("Error", "No se pudo guardar la devolución", "error");
    } finally {
      setGuardando(false);
    }
  };

  // Generar PDF
  const handleGenerarPDF = async () => {
    if (!header.compra) {
      Swal.fire("Error", "Seleccione una compra para generar el PDF", "error");
      return;
    }

    try {
      const pdfBlob = await generarPDFDevolucionCompra(parseInt(header.compra));
      const url = URL.createObjectURL(pdfBlob);
      setUrlPDF(url);
      setMostrarVisor(true);
    } catch (err) {
      console.error("Error generando PDF:", err);
      Swal.fire("Error", "No se pudo generar el PDF de la devolución", "error");
    }
  };



  // Seleccionar devolución desde el modal de búsqueda
  const handleSeleccionarDevolucion = (devolucion) => {
    cargarDevolucionExistente(devolucion.idCompra);
    setMostrarModalBuscar(false);
  };

  // Nueva devolución
  const handleNuevaDevolucion = () => {
    setHeader({
      idDevolucion: null,
      numeroDevolucion: "DEV-000000",
      fechaDevolucion: todayISODate(),
      proveedor: "",
      compra: "",
      moneda: "",
      trm: "",
      observaciones: "",
      totalProductos: 0,
      totalTallos: 0,
      valorDevolucion: 0
    });
    setDetalle([]);
    setCompras([]);
  };

  // Cerrar visor PDF
  const handleCerrarVisor = () => {
    setMostrarVisor(false);
    if (urlPDF) {
      URL.revokeObjectURL(urlPDF);
      setUrlPDF(null);
    }
  };

  // Función para eliminar una devolución de compra
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

      const resultado = await eliminarDevolucionCompra(header.idDevolucion);
      
      if (resultado.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Eliminada!',
          text: resultado.message,
          timer: 2000,
          showConfirmButton: false
        });
        
        // Resetear formulario
        handleNuevaDevolucion();
      } else {
        throw new Error(resultado.message || "Error al eliminar");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message || "No se pudo eliminar la devolución", "error");
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
            <div className="w-11 h-11 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/40 flex-shrink-0">
              <Undo2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base lg:text-lg leading-tight">Devoluciones de Compras</h2>
              <p className="text-slate-400 text-xs">{CLIENTE.titulo} — Devolución de productos comprados</p>
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
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <button
              onClick={() => setMostrarModalBuscar(true)}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px]"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span>Buscar</span>
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando || !header.compra || detalle.length === 0}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px] ${
                guardando || !header.compra || detalle.length === 0
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
              onClick={handleNuevaDevolucion}
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
      <DevolucionCompraHeader
        header={header}
        onChange={handleHeaderChange}
        proveedores={datosSelect.proveedores}
        compras={compras}
        loadingCompras={loadingCompras}
        onProveedorChange={() => {
          setHeader(prev => ({ ...prev, compra: "", moneda: "", trm: "" }));
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
        header.compra && (
          <DevolucionCompraDetalle
            detalle={detalle}
            onChangeItem={handleDetalleChange}
            soloLectura={false}
          />
        )
      )}



      {/* Totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="text-sm text-gray-500">Total Productos</div>
          <div className="text-2xl font-bold text-gray-800">{header.totalProductos}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="text-sm text-gray-500">Total Tallos a Devolver</div>
          <div className="text-2xl font-bold text-blue-600">{header.totalTallos.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="text-sm text-gray-500">Valor Devolución</div>
          <div className="text-2xl font-bold text-green-600">
            ${header.valorDevolucion.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Visor de PDF */}
      {mostrarVisor && urlPDF && (
        <ModalVisorPreliminar
          url={urlPDF}
          onClose={handleCerrarVisor}
        />
      )}

      {/* Modal de búsqueda */}
      <ModalBuscarDevolucionesCompras
        isOpen={mostrarModalBuscar}
        onClose={() => setMostrarModalBuscar(false)}
        onSeleccionarDevolucion={handleSeleccionarDevolucion}
      />
    </div>
  );
}