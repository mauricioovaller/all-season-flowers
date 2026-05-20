// src/modules/pagosProveedores/PagosProveedores.jsx
import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { Search, Save, Plus, FileText, Trash2, HandCoins } from 'lucide-react';
import PagoProveedorHeader from "./PagoProveedorHeader";
import PagoProveedorDetalle from "./PagoProveedorDetalle";
import ModalBuscarPagosProveedores from "./ModalBuscarPagosProveedores";
import ModalSeleccionarCompras from "./ModalSeleccionarCompras";
import ModalVisorPreliminar from "../devoluciones/ModalVisorPreliminar";
import { getDatosSelectCompras } from "../../services/compras/comprasService";
import {
  getMediosPago,
  guardarPagoProveedor,
  getPagoProveedorEspecifico,
  obtenerUltimoNumeroPagoProveedor,
  generarPDFPagoProveedor,
  eliminarPagoProveedor,
  validarPagoProveedor,
  calcularTotalPagoProveedor
} from "../../services/pagosProveedores/pagosProveedoresService";

function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const defaultHeader = {
  idPagoProveedor: null,
  numeroPago: "PAG-PROV-000000",
  fecha: todayISODate(),
  idProveedor: "",
  idMoneda: "",
  moneda: "",
  trm: "",
  idMedioPago: "",
  costoTransferencia: 0,
  observaciones: ""
};

export default function PagosProveedores() {
  const [header, setHeader] = useState({ ...defaultHeader });
  const [comprasSeleccionadas, setComprasSeleccionadas] = useState([]);

  const [datosSelect, setDatosSelect] = useState({ proveedores: [], mediosPago: [], monedas: [] });
  const [guardando, setGuardando] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [menuCompacto, setMenuCompacto] = useState(false);
  const [mostrarModalBuscar, setMostrarModalBuscar] = useState(false);
  const [mostrarModalCompras, setMostrarModalCompras] = useState(false);
  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [urlPDF, setUrlPDF] = useState("");

  const headerRefs = {
    fecha: useRef(null),
    idProveedor: useRef(null),
    idMedioPago: useRef(null)
  };

  // Cargar datos iniciales (proveedores, medios de pago, Ãºltimo nÃºmero)
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoadingDatos(true);
        const [datosAPI, mediosPagoRes, ultimoNum] = await Promise.all([
          getDatosSelectCompras(),
          getMediosPago(),
          obtenerUltimoNumeroPagoProveedor()
        ]);

        const proveedoresMapeados = datosAPI.proveedores?.map(p => ({
          id: p.IdProveedor.toString(),
          nombre: p.Proveedor || ''
        })) || [];

        const monedasMapeadas = datosAPI.monedas?.map(m => ({
          id: m.IdMoneda.toString(),
          nombre: m.Moneda || ''
        })) || [];

        setDatosSelect({
          proveedores: proveedoresMapeados,
          mediosPago: mediosPagoRes.mediosPago || [],
          monedas: monedasMapeadas
        });

        if (ultimoNum.success) {
          setHeader(prev => ({ ...prev, numeroPago: ultimoNum.siguienteNumeroFormateado }));
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        Swal.fire("Error", "No se pudieron cargar los datos iniciales", "error");
      } finally {
        setLoadingDatos(false);
      }
    }
    cargarDatos();
  }, []);

  const handleHeaderChange = (field, value) => {
    setHeader(prev => ({ ...prev, [field]: value }));

    if (field === 'idMoneda') {
      const monedaSeleccionada = datosSelect.monedas.find(m => m.id == value);
      setHeader(prev => ({
        ...prev,
        idMoneda: value,
        moneda: monedaSeleccionada?.nombre || ''
      }));
    }
  };

  // Al cambiar proveedor, limpiar compras seleccionadas y moneda
  const handleProveedorChange = () => {
    setComprasSeleccionadas([]);
    setHeader(prev => ({ ...prev, idMoneda: "", moneda: "", trm: "" }));
  };

  // Cargar pago existente para edición
  const cargarPagoExistente = async (idPagoProveedor) => {
    try {
      Swal.fire({
        title: 'Cargando pago...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await getPagoProveedorEspecifico(idPagoProveedor);

      Swal.close();

      if (!res.success) {
        Swal.fire("Error", res.message || "No se encontró el pago", "error");
        return;
      }

      const enc = res.encabezado;
      setHeader({
        idPagoProveedor: enc.idPagoProveedor,
        numeroPago: enc.numeroPago,
        fecha: enc.fecha,
        idProveedor: String(enc.idProveedor || ""),
        idMoneda: String(enc.idMoneda || ""),
        moneda: enc.moneda || "",
        trm: enc.trm || "",
        idMedioPago: String(enc.idMedioPago || ""),
        costoTransferencia: enc.costoTransferencia || 0,
        observaciones: enc.observaciones || ""
      });
      setComprasSeleccionadas(res.compras || []);
    } catch (err) {
      Swal.close();
      console.error("Error cargando pago:", err);
      Swal.fire("Error", err.message || "No se pudo cargar el pago", "error");
    }
  };

  const handleSave = async () => {
    const { valido, errores } = validarPagoProveedor(
      { ...header, idProveedor: parseInt(header.idProveedor) || 0, idMedioPago: parseInt(header.idMedioPago) || 0 },
      comprasSeleccionadas
    );

    if (!valido) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        html: errores.map(e => `<li>${e}</li>`).join(''),
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const totalPago = calcularTotalPagoProveedor(comprasSeleccionadas);
    const proveedor = datosSelect.proveedores.find(p => p.id === header.idProveedor);

    const confirmacion = await Swal.fire({
      title: header.idPagoProveedor ? '¿Actualizar pago?' : '¿Guardar pago?',
      html: `
        <div class="text-left text-sm space-y-1">
          <p>Proveedor: <b>${proveedor?.nombre || header.idProveedor}</b></p>
          <p>Compras: <b>${comprasSeleccionadas.length}</b></p>
          <p>Fecha: <b>${header.fecha}</b></p>
          <p>Total pago: <b>$${totalPago.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</b></p>
          ${header.costoTransferencia > 0 ? `<p>Costo transferencia: <b>$${parseFloat(header.costoTransferencia).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</b></p>` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: header.idPagoProveedor ? 'Sí, actualizar' : 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    setGuardando(true);
    try {
      const datosPago = {
        encabezado: {
          idPagoProveedor: header.idPagoProveedor || null,
          fecha: header.fecha,
          idProveedor: parseInt(header.idProveedor),
          idMoneda: parseInt(header.idMoneda) || (comprasSeleccionadas[0]?.idMoneda || 1),
          trm: parseFloat(header.trm) || 1,
          idMedioPago: parseInt(header.idMedioPago),
          costoTransferencia: parseFloat(header.costoTransferencia) || 0,
          observaciones: header.observaciones || ""
        },
        compras: comprasSeleccionadas.map(c => ({
          idCompra: c.idCompra,
          valorPago: parseFloat(c.valorPago) || 0
        }))
      };

      const res = await guardarPagoProveedor(datosPago);

      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: header.idPagoProveedor ? '¡Pago actualizado!' : '¡Pago guardado!',
          html: `<p>Número de pago: <strong>${res.numeroPago}</strong></p>`,
          timer: 3000
        });

        setHeader(prev => ({
          ...prev,
          idPagoProveedor: res.idPagoProveedor,
          numeroPago: res.numeroPago
        }));
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

  const handleNew = async () => {
    const res = await obtenerUltimoNumeroPagoProveedor();
    setHeader({
      ...defaultHeader,
      numeroPago: res.success ? res.siguienteNumeroFormateado : "PAG-PROV-000001"
    });
    setComprasSeleccionadas([]);
  };

  const handleSeleccionarPago = (pago) => {
    setMostrarModalBuscar(false);
    if (pago.idPagoProveedor) {
      cargarPagoExistente(pago.idPagoProveedor);
    }
  };

  const handleGenerarPDF = async () => {
    if (!header.idPagoProveedor) {
      Swal.fire("Aviso", "Debe guardar el pago primero", "info");
      return;
    }
    try {
      Swal.fire({ title: 'Generando PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const pdfBlob = await generarPDFPagoProveedor(header.idPagoProveedor);
      Swal.close();
      if (urlPDF) URL.revokeObjectURL(urlPDF);
      const url = URL.createObjectURL(pdfBlob);
      setUrlPDF(url);
      setMostrarVisor(true);
    } catch (err) {
      Swal.close();
      console.error(err);
      Swal.fire("Error", "No se pudo generar el PDF", "error");
    }
  };

  const handleEliminar = async () => {
    if (!header.idPagoProveedor) {
      Swal.fire("Aviso", "No hay un pago para anular", "info");
      return;
    }

    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción anulará permanentemente el pago. ¿Desea continuar?.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      Swal.fire({ title: 'Anulando pago...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const resultado = await eliminarPagoProveedor(header.idPagoProveedor);
      Swal.close();
      if (resultado.success) {
        Swal.fire({ icon: 'success', title: '¡Anulado!', text: resultado.message, timer: 2000, showConfirmButton: false });
        handleNew();
      } else {
        throw new Error(resultado.message || "Error al anular");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message || "No se pudo anular el pago", "error");
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
            <div className="w-11 h-11 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40 flex-shrink-0">
              <HandCoins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base lg:text-lg leading-tight">Pago Realizado a Proveedores</h2>
              <p className="text-slate-400 text-xs">All Season Flowers — Gestión de pagos a proveedores</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              header.idPagoProveedor
                ? 'bg-green-500/15 text-green-400 border-green-500/25'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${header.idPagoProveedor ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
              {header.idPagoProveedor ? 'Editando' : 'Nuevo'}
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
                <><Save className="w-4 h-4 flex-shrink-0" /><span>{header.idPagoProveedor ? "Actualizar" : "Guardar"}</span></>
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
              disabled={!header.idPagoProveedor}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px] ${
                header.idPagoProveedor
                  ? 'bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleEliminar}
              disabled={!header.idPagoProveedor}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px] ${
                header.idPagoProveedor
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

      {/* Formulario de encabezado */}
      <PagoProveedorHeader
        header={header}
        onChange={handleHeaderChange}
        proveedores={datosSelect.proveedores}
        mediosPago={datosSelect.mediosPago}
        monedas={datosSelect.monedas}
        comprasSeleccionadas={comprasSeleccionadas}
        onAbrirModalCompras={() => setMostrarModalCompras(true)}
        onProveedorChange={handleProveedorChange}
        inputRefs={headerRefs}
      />

      {/* Tabla de compras seleccionadas */}
      <PagoProveedorDetalle comprasSeleccionadas={comprasSeleccionadas} />

      {/* Modal de bÃºsqueda de pagos */}
      <ModalBuscarPagosProveedores
        isOpen={mostrarModalBuscar}
        onClose={() => setMostrarModalBuscar(false)}
        onSeleccionarPago={handleSeleccionarPago}
      />

      {/* Modal de selecciÃ³n de compras */}
      <ModalSeleccionarCompras
        isOpen={mostrarModalCompras}
        onClose={() => setMostrarModalCompras(false)}
        idProveedor={header.idProveedor ? parseInt(header.idProveedor) : null}
        comprasSeleccionadas={comprasSeleccionadas}
        onComprasSeleccionadasChange={setComprasSeleccionadas}
        idPagoExcluir={header.idPagoProveedor || null}
      />
      {/* Visor de PDF */}
      {mostrarVisor && (
        <ModalVisorPreliminar
          url={urlPDF}
          onClose={() => {
            setMostrarVisor(false);
            URL.revokeObjectURL(urlPDF);
            setUrlPDF("");
          }}
        />
      )}    </div>
  );
}
