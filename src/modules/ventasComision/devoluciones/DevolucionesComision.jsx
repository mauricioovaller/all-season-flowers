import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Search, Save, Plus, FileText, Trash2, Undo2 } from 'lucide-react';
import ModalVisorPreliminar from "../pedidos/ModalVisorPreliminar";
import DevolucionComisionHeader from "./DevolucionComisionHeader";
import DevolucionComisionDetalle from "./DevolucionComisionDetalle";
import ModalBuscarDevolucionesComision from "./ModalBuscarDevolucionesComision";
import { getDatosSelect } from "../../../services/pedidos/pedidosService";
import {
  getFacturasCliente,
  getDetalleFactura,
  guardarDevolucion,
  getDevolucionEspecifica,
  obtenerUltimoNumeroDevolucion,
  generarPDFDevolucion,
  eliminarDevolucion,
} from "../../../services/ventasComision/devolucionesComisionService";

function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function DevolucionesComision() {
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
    valorDevolucion: 0,
  });

  const [detalle, setDetalle] = useState([]);
  const [datosSelect, setDatosSelect] = useState({ clientes: [] });
  const [facturas, setFacturas] = useState([]);
  const [editando, setEditando] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [facturaCargada, setFacturaCargada] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    cargarDatosSelect();
    obtenerProximoNumero();
  }, []);

  useEffect(() => {
    if (header.cliente) {
      cargarFacturas(header.cliente);
    } else {
      setFacturas([]);
    }
  }, [header.cliente]);

  async function cargarDatosSelect() {
    const data = await getDatosSelect();
    if (data.clientes) {
      setDatosSelect(prev => ({ ...prev, clientes: data.clientes }));
    }
  }

  async function obtenerProximoNumero() {
    const data = await obtenerUltimoNumeroDevolucion();
    if (data.siguienteNumeroFormateado) {
      setHeader(prev => ({ ...prev, numeroDevolucion: data.siguienteNumeroFormateado }));
    }
  }

  async function cargarFacturas(idCliente) {
    const data = await getFacturasCliente(idCliente);
    if (data.success) {
      setFacturas(data.facturas || []);
    } else {
      setFacturas([]);
    }
  }

  async function handleFacturaChange(idFactura) {
    if (!idFactura) {
      setFacturaCargada(false);
      setDetalle([]);
      setHeader(prev => ({ ...prev, factura: "", moneda: "", trm: "", totalProductos: 0, totalTallos: 0, valorDevolucion: 0 }));
      return;
    }

    const factura = facturas.find(f => f.idFactura === idFactura);
    if (!factura) return;

    setHeader(prev => ({
      ...prev,
      factura: idFactura,
      moneda: factura.moneda || "",
      trm: factura.trm || "",
    }));

    if (factura.tieneDevolucion) {
      try {
        const data = await getDevolucionEspecifica(idFactura);
        if (data.success) {
          setHeader(prev => ({
            ...prev,
            idDevolucion: data.encabezado?.idDevolucion || data.idDevolucion,
            numeroDevolucion: data.encabezado?.numeroDevolucion || prev.numeroDevolucion,
            fechaDevolucion: data.encabezado?.fechaDevolucion || prev.fechaDevolucion,
            observaciones: data.encabezado?.observaciones || "",
            totalProductos: data.encabezado?.totalProductos || 0,
            totalTallos: data.encabezado?.totalTallos || 0,
            valorDevolucion: data.encabezado?.valorDevolucion || 0,
          }));
          setDetalle(data.detalle || []);
          setFacturaCargada(true);
          setEditando(true);
        }
      } catch (err) {
        Swal.fire({ title: "Error", text: err.message, icon: "error" });
      }
    } else {
      try {
        const data = await getDetalleFactura(idFactura);
        if (data.success) {
          setDetalle((data.detalle || []).map(d => ({
            ...d,
            tallosDevolucion: 0,
            motivo: "",
            flete: 0,
            fumigacion: 0,
            otros: 0,
          })));
          setFacturaCargada(true);
          setEditando(false);
          setHeader(prev => ({
            ...prev,
            idDevolucion: null,
            fechaDevolucion: todayISODate(),
            observaciones: "",
            totalProductos: 0,
            totalTallos: 0,
            valorDevolucion: 0,
          }));
          obtenerProximoNumero();
        }
      } catch (err) {
        Swal.fire({ title: "Error", text: err.message, icon: "error" });
      }
    }
  }

  function calcularTotales(det) {
    let totalTallos = 0;
    let valorDevolucion = 0;
    let totalProductos = 0;

    det.forEach(d => {
      const td = parseInt(d.tallosDevolucion) || 0;
      const precio = parseFloat(d.precioVenta) || 0;
      totalTallos += td;
      valorDevolucion += td * precio + (parseFloat(d.flete) || 0) + (parseFloat(d.fumigacion) || 0) + (parseFloat(d.otros) || 0);
      if (td > 0) totalProductos++;
    });

    return { totalTallos, valorDevolucion, totalProductos };
  }

  function validarDevolucion() {
    const errs = [];
    if (!header.cliente) errs.push("Debe seleccionar un cliente");
    if (!header.factura) errs.push("Debe seleccionar una factura");
    if (!header.fechaDevolucion) errs.push("Debe ingresar la fecha de devolución");
    if (!detalle.some(d => parseInt(d.tallosDevolucion) > 0)) errs.push("Debe registrar al menos un ítem con tallos devueltos");
    detalle.forEach((d, i) => {
      if (d.tallosDevolucion > 0 && d.tallosDevolucion > (d.tallosFacturados || 0)) {
        errs.push(`Ítem #${i + 1}: Los tallos devueltos (${d.tallosDevolucion}) no pueden superar los facturados (${d.tallosFacturados})`);
      }
    });
    return errs;
  }

  async function handleGuardar() {
    const errs = validarDevolucion();
    if (errs.length > 0) {
      Swal.fire({ title: "Errores", html: errs.map(e => `<p>• ${e}</p>`).join(''), icon: "warning" });
      return;
    }

    setSaving(true);
    try {
      const datosDevolucion = {
        idFactura: parseInt(header.factura),
        fechaDevolucion: header.fechaDevolucion,
        observaciones: header.observaciones,
        detalles: detalle
          .filter(d => parseInt(d.tallosDevolucion) > 0)
          .map(d => ({
            idDetProducto: d.idDetProducto,
            tallosDevolucion: parseInt(d.tallosDevolucion) || 0,
            motivo: d.motivo || "",
            flete: parseFloat(d.flete) || 0,
            fumigacion: parseFloat(d.fumigacion) || 0,
            otros: parseFloat(d.otros) || 0,
          })),
      };

      const response = await guardarDevolucion(datosDevolucion);
      if (response.success) {
        const totales = calcularTotales(detalle);
        setHeader(prev => ({
          ...prev,
          idDevolucion: response.idDevolucion || prev.idDevolucion,
          numeroDevolucion: response.numeroDevolucion || prev.numeroDevolucion,
          ...totales,
        }));
        setEditando(true);
        await Swal.fire({ title: "¡Guardado!", text: "Devolución guardada exitosamente", icon: "success", timer: 2000, showConfirmButton: false });
        if (header.cliente) cargarFacturas(header.cliente);
      } else {
        throw new Error(response.message || "Error al guardar");
      }
    } catch (e) {
      Swal.fire({ title: "Error", text: e.message, icon: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handlePDF() {
    if (!header.idDevolucion) {
      Swal.fire({ title: "Atención", text: "Debe guardar la devolución antes de generar el PDF", icon: "warning" });
      return;
    }
    try {
      const blob = await generarPDFDevolucion(header.factura);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowPdf(true);
    } catch (_) {
      Swal.fire({ title: "Error", text: "No se pudo generar el PDF", icon: "error" });
    }
  }

  async function handleEliminar() {
    if (!header.idDevolucion) return;
    const result = await Swal.fire({
      title: "¿Eliminar devolución?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await eliminarDevolucion(header.idDevolucion);
      if (response.success) {
        Swal.fire({ title: "Eliminada", text: "Devolución eliminada", icon: "success", timer: 2000, showConfirmButton: false });
        handleNuevo();
      }
    } catch (err) {
      Swal.fire({ title: "Error", text: err.message, icon: "error" });
    }
  }

  function handleNuevo() {
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
      valorDevolucion: 0,
    });
    setDetalle([]);
    setFacturaCargada(false);
    setEditando(false);
    obtenerProximoNumero();
  }

  async function handleSeleccionarDevolucion(dev) {
    setShowSearch(false);
    if (!dev.idFactura) return;

    try {
      const data = await getDevolucionEspecifica(dev.idFactura);
      if (data.success) {
        setHeader(prev => ({
          ...prev,
          idDevolucion: data.idDevolucion,
          numeroDevolucion: data.numeroDevolucion || prev.numeroDevolucion,
          fechaDevolucion: data.encabezado?.fechaDevolucion || prev.fechaDevolucion,
          cliente: dev.idCliente?.toString() || "",
          factura: dev.idFactura,
          moneda: data.encabezado?.moneda || "",
          trm: data.encabezado?.trm || "",
          observaciones: data.encabezado?.observaciones || "",
        }));
        setDetalle(data.detalle || []);
        setFacturaCargada(true);
        setEditando(true);
      }
    } catch (e) {
      Swal.fire({ title: "Error", text: e.message, icon: "error" });
    }
  }

  const totales = calcularTotales(detalle);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabecera del módulo */}
      <div className="bg-gradient-to-r from-violet-700 to-purple-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Undo2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Devoluciones - Ventas Comisión</h1>
              <p className="text-purple-200 text-sm mt-1">
                Gestión de devoluciones para pedidos de comisión
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
            <FileText className="w-4 h-4 text-purple-200" />
            <span className="text-sm font-semibold">{header.numeroDevolucion}</span>
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-600/20 font-medium text-sm">
              <Search className="w-4 h-4" />
              Buscar
            </button>
            <button onClick={handleGuardar} disabled={saving || !facturaCargada}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-md shadow-emerald-600/20 font-medium text-sm disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : editando ? "Actualizar" : "Guardar"}
            </button>
            <button onClick={handleNuevo}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-md shadow-gray-600/20 font-medium text-sm">
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handlePDF} disabled={!header.idDevolucion}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:from-rose-700 hover:to-pink-700 transition-all shadow-md shadow-rose-600/20 font-medium text-sm disabled:opacity-50">
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button onClick={handleEliminar} disabled={!header.idDevolucion}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-md shadow-red-600/20 font-medium text-sm disabled:opacity-50">
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 flex items-center gap-3">
            <FileText className="w-5 h-5 text-white" />
            <h2 className="text-white font-semibold">Encabezado de Devolución</h2>
          </div>
          <div className="p-6">
            <DevolucionComisionHeader
              header={header}
              setHeader={setHeader}
              datosSelect={datosSelect}
              facturas={facturas}
              facturaCargada={facturaCargada}
              onFacturaChange={handleFacturaChange}
              totales={totales}
            />
          </div>
        </div>

        {facturaCargada && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 flex items-center gap-3">
              <Undo2 className="w-5 h-5 text-white" />
              <h2 className="text-white font-semibold">Detalle de Devolución</h2>
            </div>
            <div className="p-6">
              <DevolucionComisionDetalle
                detalle={detalle}
                setDetalle={setDetalle}
                header={header}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal de búsqueda */}
      {showSearch && (
        <ModalBuscarDevolucionesComision
          onClose={() => setShowSearch(false)}
          onSelect={handleSeleccionarDevolucion}
        />
      )}

      {/* Visor PDF */}
      {showPdf && pdfUrl && (
        <ModalVisorPreliminar
          url={pdfUrl}
          onClose={() => { setShowPdf(false); setPdfUrl(null); }}
        />
      )}
    </div>
  );
}
