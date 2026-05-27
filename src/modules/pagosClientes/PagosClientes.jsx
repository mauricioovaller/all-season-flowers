// src/modules/pagosClientes/PagosClientes.jsx
import React, { useState, useEffect, useRef } from "react";
import { CLIENTE } from "../../config/cliente.js";
import Swal from "sweetalert2";
import { Search, Save, Plus, FileText, Trash2, Wallet } from 'lucide-react';
import PagoClienteHeader from "./PagoClienteHeader";
import PagoClienteDetalle from "./PagoClienteDetalle";
import ModalBuscarPagosClientes from "./ModalBuscarPagosClientes";
import ModalSeleccionarFacturas from "./ModalSeleccionarFacturas";
import ModalVisorPreliminar from "../devoluciones/ModalVisorPreliminar";
import { getDatosSelect } from "../../services/pedidos/pedidosService";
import { getMediosPago } from "../../services/pagosClientes/pagosClientesService";
import {
  getFacturasClienteConSaldo,
  guardarPagoCliente,
  getPagoClienteEspecifico,
  obtenerUltimoNumeroPagoCliente,
  generarPDFPagoCliente,
  eliminarPagoCliente,
  validarPagoCliente,
  calcularTotalesPago
} from "../../services/pagosClientes/pagosClientesService";

function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function PagosClientes() {
  // Estado del encabezado (ahora sin factura individual)
  const [header, setHeader] = useState({
    idEncabPagoCliente: null,
    numeroPago: "PAG-CLI-000000",
    fecha: todayISODate(),
    idCliente: "",
    cliente: "",
    idMoneda: "",
    moneda: "",
    trm: "",
    idMedioPago: "",
    costoTransferencia: 0,
    observaciones: ""
  });

  // Estado de facturas seleccionadas (múltiples facturas por pago)
  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState([]);

  // Estado del detalle (productos) - mantenido para compatibilidad
  // eslint-disable-next-line no-unused-vars
  const [detalle, setDetalle] = useState([]);

  // Datos de selects
  const [datosSelect, setDatosSelect] = useState({
    clientes: [],
    mediosPago: [],
    monedas: []
  });

  // Facturas disponibles del cliente seleccionado
  // eslint-disable-next-line no-unused-vars
  const [facturasDisponibles, setFacturasDisponibles] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [menuCompacto, setMenuCompacto] = useState(false);
  const [mostrarModalBuscar, setMostrarModalBuscar] = useState(false);
  const [mostrarModalFacturas, setMostrarModalFacturas] = useState(false);

  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [urlPDF, setUrlPDF] = useState(null);

  const headerRefs = {
    fecha: useRef(null),
    idCliente: useRef(null),
    idMedioPago: useRef(null)
  };

  // Cargar clientes y medios de pago al inicio
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoadingDatos(true);
        const [datosAPI, mediosPagoRes] = await Promise.all([
          getDatosSelect(),
          getMediosPago()
        ]);

        // Mapear clientes al formato esperado por el componente
        const clientesMapeados = datosAPI.clientes?.map(c => ({
          id: c.IdCliente.toString(),
          nombre: c.NOMBRE || ''
        })) || [];

        // Mapear monedas
        const monedasMapeadas = datosAPI.monedas?.map(m => ({
          id: m.IdMoneda.toString(),
          nombre: m.Moneda || ''
        })) || [];

        setDatosSelect({
          clientes: clientesMapeados,
          mediosPago: mediosPagoRes.mediosPago || [],
          monedas: monedasMapeadas
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

  // Cargar último número de pago al inicio
  useEffect(() => {
    async function cargarUltimoNumero() {
      try {
        const res = await obtenerUltimoNumeroPagoCliente();
        if (res.success) {
          setHeader(prev => ({
            ...prev,
            numeroPago: res.siguienteNumeroFormateado
          }));
        }
      } catch (err) {
        console.error("Error cargando último número de pago:", err);
      }
    }
    cargarUltimoNumero();
  }, []);

  // Cuando cambia el cliente, cargar sus facturas con saldo
  useEffect(() => {
    if (!header.idCliente) {
      setFacturasDisponibles([]);
      setFacturasSeleccionadas([]);
      setHeader(prev => ({
        ...prev,
        idMoneda: "",
        moneda: "",
        trm: ""
      }));
      setDetalle([]);
      return;
    }

    async function cargarFacturas() {
      setLoadingFacturas(true);
      try {
        const res = await getFacturasClienteConSaldo(parseInt(header.idCliente));
        if (res.success) {
          setFacturasDisponibles(res.facturas || []);
        } else {
          Swal.fire("Aviso", res.message || "Error al cargar facturas", "warning");
          setFacturasDisponibles([]);
        }
      } catch (err) {
        console.error("Error cargando facturas:", err);
        Swal.fire("Error", "No se pudieron cargar las facturas", "error");
        setFacturasDisponibles([]);
      } finally {
        setLoadingFacturas(false);
      }
    }
    cargarFacturas();
  }, [header.idCliente]);

  // Cuando se selecciona una moneda, verificar que todas las facturas sean de la misma moneda
  useEffect(() => {
    if (header.idMoneda && facturasSeleccionadas.length > 0) {
      const facturasMonedaDiferente = facturasSeleccionadas.filter(
        f => {
          const idMonedaFactura = Number(f.idMonedaFactura);
          const idMonedaHeader = Number(header.idMoneda);
          return !isNaN(idMonedaFactura) && !isNaN(idMonedaHeader) && idMonedaFactura !== idMonedaHeader;
        }
      );

      if (facturasMonedaDiferente.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Moneda diferente',
          text: `Algunas facturas seleccionadas tienen moneda diferente a ${header.moneda}. Se recomienda seleccionar facturas de la misma moneda.`,
          confirmButtonText: 'Entendido'
        });
      }
    }
  }, [header.idMoneda, header.moneda, facturasSeleccionadas]);

  const cargarPagoExistente = async (idEncabPagoCliente) => {
    setCargandoDetalle(true);
    try {
      const res = await getPagoClienteEspecifico(idEncabPagoCliente);
      if (res.success && res.encabezado) {
        const { encabezado, facturas } = res;
        setHeader(prev => ({
          ...prev,
          idEncabPagoCliente: encabezado.idEncabPagoCliente,
          numeroPago: encabezado.numeroPago,
          fecha: encabezado.fecha,
          idCliente: encabezado.idCliente?.toString() || "",
          cliente: encabezado.cliente || "",
          idMoneda: encabezado.idMoneda?.toString() || "",
          moneda: encabezado.moneda || "",
          trm: encabezado.trm || "",
          idMedioPago: encabezado.idMedioPago?.toString() || "",
          costoTransferencia: encabezado.costoTransferencia || 0,
          observaciones: encabezado.observaciones || ""
        }));

        // Cargar facturas seleccionadas
        setFacturasSeleccionadas(facturas || []);

        // Cargar detalles (productos) si existen
        // Nota: En la nueva estructura, los detalles son por factura, no por producto
        setDetalle([]);
      } else {
        // No hay pago existente, limpiar
        setFacturasSeleccionadas([]);
        setDetalle([]);
      }
    } catch (err) {
      console.error("Error cargando pago existente:", err);
      Swal.fire("Error", "No se pudo cargar el pago existente", "error");
      setFacturasSeleccionadas([]);
      setDetalle([]);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleHeaderChange = (field, value) => {
    setHeader(prev => ({ ...prev, [field]: value }));

    // Si cambia el cliente, limpiar facturas seleccionadas
    if (field === 'idCliente') {
      const clienteSeleccionado = datosSelect.clientes.find(c => c.id == value);
      setHeader(prev => ({
        ...prev,
        cliente: clienteSeleccionado?.nombre || "",
        idMoneda: "",
        moneda: "",
        trm: ""
      }));
      setFacturasSeleccionadas([]);
    }

    // Si cambia la moneda, actualizar el nombre de la moneda
    if (field === 'idMoneda') {
      const monedaSeleccionada = datosSelect.monedas.find(m => m.id == value);
      setHeader(prev => ({
        ...prev,
        moneda: monedaSeleccionada?.nombre || "",
        trm: monedaSeleccionada?.trm || ""
      }));
    }

    // Si cambia el medio de pago, verificar si es transferencia para habilitar costo
    if (field === 'idMedioPago') {
      const medioPagoSeleccionado = datosSelect.mediosPago.find(mp => mp.id == value);
      const esTransferencia = medioPagoSeleccionado?.nombre?.toLowerCase().includes('transferencia');

      if (!esTransferencia) {
        setHeader(prev => ({ ...prev, costoTransferencia: 0 }));
      }
    }
  };



  const validateAll = async () => {
    const validacion = validarPagoCliente(header, facturasSeleccionadas);

    if (!validacion.valido) {
      Swal.fire({
        icon: 'warning',
        title: 'Errores de validación',
        html: `<div class="text-left">${validacion.errores.map(e => `<p class="mb-1">• ${e}</p>`).join('')}</div>`,
        confirmButtonText: 'Entendido'
      });
      return false;
    }

    // Mostrar advertencias si las hay
    if (validacion.advertencias.length > 0) {
      const confirmacion = await Swal.fire({
        icon: 'warning',
        title: 'Advertencias',
        html: `
          <div class="text-left">
            <p class="mb-2">Se detectaron las siguientes advertencias:</p>
            ${validacion.advertencias.map(a => `<p class="mb-1 text-yellow-700">⚠️ ${a}</p>`).join('')}
            <p class="mt-3 font-medium">¿Desea continuar con el guardado?</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Revisar'
      });

      if (!confirmacion.isConfirmed) {
        return false;
      }
    }

    // Validar costo de transferencia solo si el medio de pago es transferencia
    const medioPagoSeleccionado = datosSelect.mediosPago.find(mp => mp.id == header.idMedioPago);
    const esTransferencia = medioPagoSeleccionado?.nombre?.toLowerCase().includes('transferencia');

    if (esTransferencia && header.costoTransferencia < 0) {
      Swal.fire("Error", "El costo de transferencia no puede ser negativo", "warning");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!(await validateAll())) return;

    // Confirmación
    const confirmacion = await Swal.fire({
      title: header.idEncabPagoCliente ? '¿Actualizar pago?' : '¿Guardar pago?',
      html: `
        <div class="text-left">
          <p><strong>Cliente:</strong> ${header.cliente}</p>
          <p><strong>Fecha pago:</strong> ${header.fecha}</p>
          <p><strong>Moneda:</strong> ${header.moneda}</p>
          <p><strong>TRM:</strong> ${header.trm}</p>
          <p><strong>Facturas:</strong> ${facturasSeleccionadas.length}</p>
          <p><strong>Valor total:</strong> ${calcularTotalesPago(facturasSeleccionadas).valorTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })} ${header.moneda}</p>
          ${header.costoTransferencia > 0 ? `<p><strong>Costo transferencia:</strong> ${header.costoTransferencia.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>` : ''}
          ${header.observaciones ? `<p><strong>Observaciones:</strong> ${header.observaciones}</p>` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: header.idEncabPagoCliente ? 'Sí, actualizar' : 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    setGuardando(true);
    try {
      // Preparar datos para enviar (estructura que espera el backend PHP)
      // Calcular valor total sumando todos los valores de pago de las facturas
      const valorTotal = facturasSeleccionadas.reduce((total, factura) => {
        return total + (parseFloat(factura.valorPago) || 0);
      }, 0);

      const datosPago = {
        ...(header.idEncabPagoCliente ? { idEncabPagoCliente: header.idEncabPagoCliente } : {}),
        fechaPago: header.fecha,
        idCliente: parseInt(header.idCliente),
        idMoneda: parseInt(header.idMoneda) || 0,
        trm: parseFloat(header.trm),
        idMedioPago: parseInt(header.idMedioPago),
        costoTransferencia: parseFloat(header.costoTransferencia) || 0,
        observaciones: header.observaciones || "",
        valorTotal: valorTotal,
        facturas: facturasSeleccionadas.map(factura => ({
          invoice: factura.invoice || factura.numeroFactura, // Siempre el número comercial (ep.Factura)
          valorPago: parseFloat(factura.valorPago) || 0
        }))
      };

      const res = await guardarPagoCliente(datosPago);

      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: header.idEncabPagoCliente ? '¡Pago actualizado!' : '¡Pago guardado!',
          html: `
            <div class="text-left">
              <p>Número de pago: <strong>${res.numeroPago}</strong></p>
              <p>Cliente: ${header.cliente}</p>
              <p>Facturas: ${facturasSeleccionadas.length}</p>
              <p>Valor total: ${calcularTotalesPago(facturasSeleccionadas).valorTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })} ${header.moneda}</p>
              ${res.advertencias ? `<p class="text-yellow-600 mt-2"><strong>Advertencias:</strong> ${res.advertencias.join(', ')}</p>` : ''}
            </div>
          `,
          timer: 4000
        });

        // Actualizar estado local con el número de pago
        setHeader(prev => ({
          ...prev,
          idEncabPagoCliente: res.idEncabPagoCliente,
          numeroPago: res.numeroPago
        }));

        // Recargar facturas disponibles para actualizar saldos
        if (header.idCliente) {
          const facturasRes = await getFacturasClienteConSaldo(parseInt(header.idCliente));
          if (facturasRes.success) {
            setFacturasDisponibles(facturasRes.facturas);
          }
        }
      } else {
        throw new Error(res.message || "Error al guardar");
      }
    } catch (err) {
      console.error("Error guardando pago:", err);
      Swal.fire("Error", err.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleNew = () => {
    setHeader({
      idEncabPagoCliente: null,
      numeroPago: "PAG-CLI-000000",
      fecha: todayISODate(),
      idCliente: "",
      cliente: "",
      idMoneda: "",
      moneda: "",
      trm: "",
      idMedioPago: "",
      costoTransferencia: 0,
      observaciones: ""
    });
    setFacturasSeleccionadas([]);
    setDetalle([]);
    setFacturasDisponibles([]);
  };

  const handleSeleccionarPago = (pago) => {
    // Cargar el pago existente usando su ID
    cargarPagoExistente(pago.idEncabPagoCliente);
    setMostrarModalBuscar(false);
  };

  // Función para generar PDF
  const handleGenerarPDF = async () => {
    if (!header.idEncabPagoCliente) {
      Swal.fire("Aviso", "Debe guardar el pago primero", "info");
      return;
    }

    try {
      Swal.fire({
        title: 'Generando PDF...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const pdfBlob = await generarPDFPagoCliente(parseInt(header.idEncabPagoCliente));
      const fileURL = URL.createObjectURL(pdfBlob);
      setUrlPDF(fileURL);
      setMostrarVisor(true);

      Swal.close();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo generar el PDF", "error");
    }
  };

  // Función para eliminar un pago
  const handleEliminar = async () => {
    if (!header.idEncabPagoCliente) {
      Swal.fire("Aviso", "No hay un pago para eliminar", "info");
      return;
    }

    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción anulará permanentemente el pago. ¿Desea continuar?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    try {
      Swal.fire({
        title: 'Anulando pago...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const resultado = await eliminarPagoCliente(header.idEncabPagoCliente);

      if (resultado.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Anulado!',
          text: resultado.message,
          timer: 2000,
          showConfirmButton: false
        });

        // Resetear formulario
        handleNew();
      } else {
        throw new Error(resultado.message || "Error al anular");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message || "No se pudo anular el pago", "error");
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
            <div className="w-11 h-11 bg-gradient-to-br from-green-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/40 flex-shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base lg:text-lg leading-tight">Pago Recibido de Clientes</h2>
              <p className="text-slate-400 text-xs">{CLIENTE.titulo} — Gestión de pagos de clientes</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              header.idEncabPagoCliente
                ? 'bg-green-500/15 text-green-400 border-green-500/25'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${header.idEncabPagoCliente ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
              {header.idEncabPagoCliente ? 'Editando' : 'Nuevo'}
            </div>
            <span className="text-slate-500 text-xs font-mono hidden sm:block">{header.numeroPago}</span>
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
                <><Save className="w-4 h-4 flex-shrink-0" /><span>{header.idEncabPagoCliente ? "Actualizar" : "Guardar"}</span></>
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
              disabled={!header.idEncabPagoCliente}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px] ${
                header.idEncabPagoCliente
                  ? 'bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleEliminar}
              disabled={!header.idEncabPagoCliente}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px] ${
                header.idEncabPagoCliente
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-md shadow-red-900/40'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              <span>Anular</span>
            </button>
          </div>
        </div>
      </div>

      {/* Encabezado */}
      <PagoClienteHeader
        header={header}
        onChange={handleHeaderChange}
        clientes={datosSelect.clientes}
        mediosPago={datosSelect.mediosPago}
        monedas={datosSelect.monedas}
        facturasSeleccionadas={facturasSeleccionadas}
        onAbrirModalFacturas={() => setMostrarModalFacturas(true)}
        inputRefs={headerRefs}
      />

      {/* Detalle de facturas seleccionadas */}
      <div className="bg-white rounded-lg shadow-sm md:shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            Facturas incluidas en el pago
          </h3>
          <button
            onClick={() => setMostrarModalFacturas(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {facturasSeleccionadas.length > 0 ? 'Editar facturas' : 'Seleccionar facturas'}
          </button>
        </div>

        {facturasSeleccionadas.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2">No hay facturas seleccionadas</p>
            <p className="text-sm">Haga clic en "Seleccionar facturas" para agregar facturas a este pago</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor a pagar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moneda
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {facturasSeleccionadas.map((factura, index) => {
                  const excedeSaldo = factura.valorPago > factura.saldoFactura;
                  return (
                    <tr key={index} className={excedeSaldo ? 'bg-yellow-50' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {factura.numeroFactura || factura.invoice}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {factura.fechaFactura}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {factura.totalFactura?.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {factura.saldoFactura?.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={factura.valorPago}
                            onChange={(e) => {
                              const nuevasFacturas = [...facturasSeleccionadas];
                              nuevasFacturas[index].valorPago = parseFloat(e.target.value) || 0;
                              setFacturasSeleccionadas(nuevasFacturas);
                            }}
                            className={`w-32 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${excedeSaldo ? 'border-yellow-500 bg-yellow-50' : ''
                              }`}
                          />
                          {excedeSaldo && (
                            <span className="ml-2 text-yellow-600 text-xs" title="Excede el saldo pendiente">
                              ⚠️
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {factura.monedaFactura}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Total del pago:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-700">
                    {calcularTotalesPago(facturasSeleccionadas).valorTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {header.moneda}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="text-sm text-gray-500">Total Facturas</div>
          <div className="text-2xl font-bold text-gray-800">
            {facturasSeleccionadas.reduce((sum, f) => sum + (f.totalFactura || 0), 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {facturasSeleccionadas.length} factura(s)
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="text-sm text-gray-500">Valor del Pago</div>
          <div className="text-2xl font-bold text-blue-600">
            {calcularTotalesPago(facturasSeleccionadas).valorTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {header.moneda}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
          <div className="text-sm text-gray-500">Costo Transferencia</div>
          <div className="text-2xl font-bold text-orange-600">
            {header.costoTransferencia.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {header.costoTransferencia > 0 ? 'Transferencia' : 'No aplica'}
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

      {/* Modal de selección de facturas */}
      {mostrarModalFacturas && (
        <ModalSeleccionarFacturas
          isOpen={mostrarModalFacturas}
          onClose={() => setMostrarModalFacturas(false)}
          idCliente={parseInt(header.idCliente)}
          idMonedaSeleccionada={parseInt(header.idMoneda)}
          facturasSeleccionadas={facturasSeleccionadas}
          onFacturasSeleccionadasChange={setFacturasSeleccionadas}
          idPagoExcluir={header.idEncabPagoCliente || null}
        />
      )}

      {/* Modal de búsqueda */}
      {mostrarModalBuscar && (
        <ModalBuscarPagosClientes
          isOpen={mostrarModalBuscar}
          onClose={() => setMostrarModalBuscar(false)}
          onSeleccionarPago={handleSeleccionarPago}
        />
      )}
    </div>
  );
}