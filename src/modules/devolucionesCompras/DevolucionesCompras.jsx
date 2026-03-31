// src/modules/devolucionesCompras/DevolucionesCompras.jsx
import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
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
      {/* Barra de acciones */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-slate-700">
                Devoluciones Compras
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                Gestión de devoluciones de productos comprados
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs md:text-sm font-medium text-gray-700">
              Estado: <span className={`font-bold ${header.idDevolucion ? 'text-green-600' : 'text-orange-600'}`}>
                {header.idDevolucion ? 'Editando' : 'Nuevo'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {header.numeroDevolucion}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setMostrarModalBuscar(true)}
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
            onClick={handleGuardar}
            disabled={guardando || !header.compra || detalle.length === 0}
            className={`rounded-lg px-3 py-2 transition font-medium text-sm flex-1 ${guardando || !header.compra || detalle.length === 0
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
                  <span>{header.idDevolucion ? "Actualizar" : "Guardar"}</span>
                </>
              )}
            </div>
          </button>

          <button
            onClick={handleNuevaDevolucion}
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
            onClick={handleGenerarPDF}
            disabled={!header.idDevolucion}
            className={`rounded-lg px-3 py-2 transition font-medium text-sm flex-1 ${header.idDevolucion
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            <div className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>PDF</span>
            </div>
          </button>

          <button
            onClick={handleEliminar}
            disabled={!header.idDevolucion}
            className={`rounded-lg px-3 py-2 transition font-medium text-sm flex-1 ${header.idDevolucion
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            <div className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Eliminar</span>
            </div>
          </button>
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