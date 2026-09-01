import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { Search, Save, Plus, Download, FileText, Undo2, ShoppingCart } from 'lucide-react';
import ModalVisorPreliminar from "./ModalVisorPreliminar";
import PedidoComisionHeader from "./PedidoComisionHeader";
import PedidoComisionEmpaque from "./PedidoComisionEmpaque";
import ModalBuscarPedidosComision from "./ModalBuscarPedidosComision";
import {
  getDatosSelect,
  guardarPedidoCompleto,
  getPedidoEspecifico,
  obtenerUltimoNumeroPedido,
  generarPDFPedido,
} from "../../../services/ventasComision/pedidosComisionService";

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
    { id: "3", nombre: "Freedom", productoId: "1" },
    { id: "4", nombre: "Sunspot", productoId: "2" },
    { id: "5", nombre: "Double Dutch", productoId: "2" },
    { id: "6", nombre: "Casablanca", productoId: "3" },
    { id: "7", nombre: "Siberia", productoId: "3" },
    { id: "8", nombre: "Variado", productoId: "4" },
  ],
  grados: [
    { id: "1", nombre: "Premium", productoId: "1" },
    { id: "2", nombre: "Estándar", productoId: "1" },
    { id: "3", nombre: "Económico", productoId: "1" },
    { id: "4", nombre: "Premium", productoId: "2" },
    { id: "5", nombre: "Estándar", productoId: "2" },
    { id: "6", nombre: "Premium", productoId: "3" },
    { id: "7", nombre: "Estándar", productoId: "3" },
    { id: "8", nombre: "Único", productoId: "4" },
  ],
  tipoEmpaque: [
    { id: "1", nombre: "Caja Estándar", equivFull: 1 },
    { id: "2", nombre: "Caja Grande", equivFull: 2 },
    { id: "3", nombre: "Caja Pequeña", equivFull: 0.5 },
  ],
  unidades: [
    { id: "1", nombre: "Tallo", codigo: "TAL" },
    { id: "2", nombre: "Ramo", codigo: "RAM" },
    { id: "3", nombre: "Bouquet", codigo: "BQ" },
  ],
  predios: [
    { id: "1", nombre: "Finca Principal" },
    { id: "2", nombre: "Finca Secundaria" },
  ],
};

function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function nextMonthISODate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function PedidosComision() {
  const [datosSelect, setDatosSelect] = useState(datosMock);
  const [idActual, setIdActual] = useState(null);
  const [editando, setEditando] = useState(true);
  const [numeroPedido, setNumeroPedido] = useState("");
  const [errors, setErrors] = useState([]);
  const [showErrors, setShowErrors] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdf, setShowPdf] = useState(false);

  const [header, setHeader] = useState({
    idCliente: "",
    idEjecutivo: "",
    idMoneda: "",
    trm: "",
    fechaSolicitud: todayISODate(),
    fechaEntrega: nextMonthISODate(),
    poCliente: "",
    observaciones: "",
    iva: false,
    estado: "Activo",
    porcentajeComision: "",
  });

  const [empaques, setEmpaques] = useState([]);

  const calculos = useRef({
    totalPiezas: 0,
    totalFulles: 0,
    totalTallos: 0,
    valorTotal: 0,
    valorIva: 0,
    totalConIva: 0,
    totalComision: 0,
  });

  useEffect(() => {
    const totales = calcularTotales(empaques, header.iva, header.trm, header.porcentajeComision);
    calculos.current = totales;
  }, [empaques, header.iva, header.trm, header.porcentajeComision]);

  useEffect(() => {
    cargarDatosSelect();
    obtenerSiguienteNumero();
  }, []);

  async function cargarDatosSelect() {
    const data = await getDatosSelect();
    if (data.success && data.clientes && data.clientes.length > 0) {
      const mapeados = {
        clientes: (data.clientes || []).map(c => ({
          id: c.IdCliente?.toString() || c.id?.toString() || '',
          nombre: c.NOMBRE || c.nombre || '',
        })),
        ejecutivos: (data.ejecutivos || []).map(e => ({
          id: e.IdEjecutivo?.toString() || e.id?.toString() || '',
          nombre: e.NOMEJECUTIVO || e.nombre || '',
        })),
        monedas: (data.monedas || []).map(m => ({
          id: m.IdMoneda?.toString() || m.id?.toString() || '',
          nombre: m.Moneda || m.nombre || '',
        })),
        aerolineas: (data.aerolineas || []).map(a => ({
          id: a.IdAerolinea?.toString() || a.id?.toString() || '',
          nombre: a.NOMAEROLINEA || a.nombre || '',
        })),
        agencias: (data.agencias || []).map(a => ({
          id: a.IdAgencia?.toString() || a.id?.toString() || '',
          nombre: a.NOMAGENCIA || a.nombre || '',
        })),
        productos: (data.productos || []).map(p => ({
          id: p.IdProducto?.toString() || p.id?.toString() || '',
          descripcion: p.NOMPRODUCTO || p.descripcion || '',
          codigo: p.CODPRODUCTO || p.codigo || '',
        })),
        variedades: (data.variedades || []).map(v => ({
          id: v.IdVariedad?.toString() || v.id?.toString() || '',
          nombre: v.NOMVARIEDAD || v.nombre || '',
          productoId: v.IdProducto?.toString() || v.productoId?.toString() || '',
        })),
        grados: (data.grados || []).map(g => ({
          id: g.IdGrado?.toString() || g.id?.toString() || '',
          nombre: g.NOMGRADO || g.nombre || '',
          productoId: g.IdProducto?.toString() || g.productoId?.toString() || '',
        })),
        tipoEmpaque: (data.tipoEmpaque || []).map(t => ({
          id: t.IdTipoEmpaque?.toString() || t.id?.toString() || '',
          nombre: t.Descripcion || t.nombre || '',
          equivFull: parseFloat(t.EquivFull) || 1,
        })),
        unidades: (data.unidades || []).map(u => ({
          id: u.IdUnidad?.toString() || u.IdUnidades?.toString() || u.id?.toString() || '',
          nombre: u.DescripUnidad || u.NOMBREUNIDAD || u.nombre || '',
          codigo: u.CODIGOUNIDAD || u.codigo || '',
        })),
        predios: (data.predios || []).map(p => ({
          id: p.IdPredio?.toString() || p.id?.toString() || '',
          nombre: p.NombrePredio || p.NOMBREPREDIO || p.nombre || '',
        })),
      };
      setDatosSelect(mapeados);
    }
  }

  async function obtenerSiguienteNumero() {
    const data = await obtenerUltimoNumeroPedido();
    if (data.success && data.siguienteNumeroFormateado) {
      setNumeroPedido(data.siguienteNumeroFormateado);
    } else {
      setNumeroPedido("PEC-000001");
    }
  }

  function calcularTotales(emps, tieneIva, trm, pctComision) {
    let totalPiezas = 0;
    let totalFulles = 0;
    let totalTallos = 0;
    let valorTotal = 0;
    let totalComision = 0;

    emps.forEach(emp => {
      const cantEmp = parseInt(emp.cantidad) || 0;
      totalPiezas += cantEmp;

      const empaqInfo = datosSelect.tipoEmpaque.find(t => t.id === emp.idTipoEmpaque);
      const equivFull = parseFloat(empaqInfo?.equivFull) || 1;
      totalFulles += cantEmp * equivFull;

      (emp.productos || []).forEach(prod => {
        const tallosCaja = (parseInt(prod.tallosRamo) || 0) * (parseInt(prod.ramosCaja) || 0);
        totalTallos += tallosCaja * cantEmp;

        const precio = parseFloat(prod.precioVenta) || 0;
        const valorProd = precio * tallosCaja * cantEmp;
        valorTotal += valorProd;

        const pctItem = prod.porcentajeComision !== "" && prod.porcentajeComision !== null && prod.porcentajeComision !== undefined
          ? parseFloat(prod.porcentajeComision) || 0
          : (parseFloat(pctComision) || 0);
        totalComision += valorProd * (pctItem / 100);
      });
    });

    const valorIva = tieneIva ? valorTotal * 0.19 : 0;
    const totalConIva = valorTotal + valorIva;

    return { totalPiezas, totalFulles, totalTallos, valorTotal, valorIva, totalConIva, totalComision };
  }

  function validarPedido() {
    const errs = [];
    if (!header.idCliente) errs.push("Debe seleccionar un cliente");
    if (!header.fechaSolicitud) errs.push("Debe ingresar la fecha de solicitud");
    if (!header.fechaEntrega) errs.push("Debe ingresar la fecha de entrega");
    if (!header.idMoneda) errs.push("Debe seleccionar una moneda");
    if (!header.trm || parseFloat(header.trm) <= 0) errs.push("Debe ingresar una TRM válida mayor a 0");

    if (empaques.length === 0) {
      errs.push("Debe agregar al menos un empaque");
    } else {
      empaques.forEach((emp, i) => {
        if (!emp.idTipoEmpaque) errs.push(`Empaque #${i + 1}: debe seleccionar un tipo de empaque`);
        if (!emp.cantidad || parseInt(emp.cantidad) <= 0) errs.push(`Empaque #${i + 1}: debe ingresar una cantidad válida`);
        if (!emp.productos || emp.productos.length === 0) errs.push(`Empaque #${i + 1}: debe tener al menos un producto`);
        (emp.productos || []).forEach((prod, j) => {
          if (!prod.idProducto) errs.push(`Empaque #${i + 1}, Producto #${j + 1}: debe seleccionar un producto`);
          if (!prod.descripcion) errs.push(`Empaque #${i + 1}, Producto #${j + 1}: la descripción es obligatoria`);
          if (!prod.precioVenta || parseFloat(prod.precioVenta) <= 0) errs.push(`Empaque #${i + 1}, Producto #${j + 1}: debe ingresar un precio válido`);
        });
      });
    }
    return errs;
  }

  function prepararDatosParaGuardar() {
    const encabezado = {
      IdCliente: parseInt(header.idCliente) || 0,
      IdEjecutivo: parseInt(header.idEjecutivo) || 0,
      IdMoneda: header.idMoneda,
      TRM: parseFloat(header.trm) || 0,
      FechaSolicitud: header.fechaSolicitud,
      FechaEntrega: header.fechaEntrega,
      PO_Cliente: header.poCliente || "",
      Observaciones: header.observaciones || "",
      IVA: header.iva ? 1 : 0,
      Estado: header.estado || "Activo",
      PorcentajeComision: parseFloat(header.porcentajeComision) || 0,
    };

    const empaquesData = empaques.map(emp => ({
      empaque: {
        IdTipoEmpaque: parseInt(emp.idTipoEmpaque) || 0,
        Cantidad: parseInt(emp.cantidad) || 0,
        PO_Empaque: emp.poEmpaque || "",
      },
      productos: (emp.productos || []).map(prod => ({
        producto: {
          IdProducto: parseInt(prod.idProducto) || 0,
          IdVariedad: parseInt(prod.idVariedad) || 0,
          IdGrado: parseInt(prod.idGrado) || 0,
          Descripcion: prod.descripcion || "",
          IdUnidad: parseInt(prod.idUnidad) || 0,
          IdPredio: parseInt(prod.idPredio) || 0,
          Tallos_Ramo: parseInt(prod.tallosRamo) || 0,
          Ramos_Caja: parseInt(prod.ramosCaja) || 0,
          Precio_Venta: parseFloat(prod.precioVenta) || 0,
          PorcentajeComision: prod.porcentajeComision !== "" ? parseFloat(prod.porcentajeComision) : null,
        },
        receta: (prod.receta || []).map(rec => ({
          IdProducto: parseInt(rec.idProducto) || 0,
          IdVariedad: parseInt(rec.idVariedad) || 0,
          Cantidad: parseInt(rec.cantidad) || 0,
        })),
      })),
    }));

    return { encabezado, empaques: empaquesData };
  }

  async function handleGuardar() {
    const errs = validarPedido();
    if (errs.length > 0) {
      setErrors(errs);
      setShowErrors(true);
      return;
    }

    const datos = prepararDatosParaGuardar();
    if (idActual) datos.idPedido = idActual;

    const result = await Swal.fire({
      title: "¿Guardar pedido?",
      html: `
        <div class="text-left text-sm space-y-1">
          <p><b>Cliente:</b> ${datosSelect.clientes.find(c => c.id === header.idCliente)?.nombre || "N/A"}</p>
          <p><b>Total Productos:</b> $${calculos.current.valorTotal.toLocaleString()}</p>
          <p><b>Comisión:</b> $${calculos.current.totalComision.toLocaleString()}</p>
          <p><b>Empaques:</b> ${empaques.length}</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669",
    });

    if (!result.isConfirmed) return;

    setSaving(true);
    try {
      const response = await guardarPedidoCompleto(datos);
      if (response.success) {
        setGuardadoExitoso(true);
        if (response.idPedido) setIdActual(response.idPedido);
        if (response.numeroPedido) setNumeroPedido(response.numeroPedido);
        await Swal.fire({
          title: "¡Guardado!",
          text: `Pedido ${response.numeroPedido || numeroPedido} guardado exitosamente`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.message || "Error al guardar");
      }
    } catch (e) {
      await Swal.fire({
        title: "Error",
        text: e.message || "No se pudo guardar el pedido",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handlePDF() {
    if (!idActual) {
      Swal.fire({ title: "Atención", text: "Debe guardar el pedido antes de generar el PDF", icon: "warning" });
      return;
    }
    try {
      const blob = await generarPDFPedido(idActual);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowPdf(true);
    } catch (_) {
      Swal.fire({ title: "Error", text: "No se pudo generar el PDF", icon: "error" });
    }
  }

  function handleNuevo() {
    setIdActual(null);
    setNumeroPedido("");
    setHeader({
      idCliente: "", idEjecutivo: "", idMoneda: "", trm: "",
      fechaSolicitud: todayISODate(), fechaEntrega: nextMonthISODate(),
      poCliente: "", observaciones: "", iva: false, estado: "Activo",
      porcentajeComision: "",
    });
    setEmpaques([]);
    setGuardadoExitoso(false);
    setEditando(true);
    obtenerSiguienteNumero();
  }

  function handleSeleccionarPedido(pedido) {
    setShowSearch(false);
    getPedidoEspecifico(pedido.idPedido)
      .then(data => {
        if (data.success) {
          const h = data.encabezado || {};
          setIdActual(data.idPedido || pedido.idPedido);
          setNumeroPedido(data.numeroPedido || pedido.numeroPedido || "");
          setHeader({
            idCliente: h.IdCliente?.toString() || "",
            idEjecutivo: h.IdEjecutivo?.toString() || "",
            idMoneda: h.IdMoneda?.toString() || "",
            trm: h.TRM?.toString() || "",
            fechaSolicitud: h.FechaSolicitud || todayISODate(),
            fechaEntrega: h.FechaEntrega || nextMonthISODate(),
            poCliente: h.PO_Cliente || "",
            observaciones: h.Observaciones || "",
            iva: Boolean(h.IVA) || (h.IVA === 1),
            estado: h.Estado || "Activo",
            porcentajeComision: h.PorcentajeComision?.toString() || "",
          });
          setEmpaques(transformarEmpaques(data.empaques || []));
          setGuardadoExitoso(true);
          setEditando(true);
        }
      })
      .catch(err => {
        Swal.fire({ title: "Error", text: err.message, icon: "error" });
      });
  }

  function handleSeleccionarPedidoParaDuplicar(pedido) {
    setShowSearch(false);
    getPedidoEspecifico(pedido.idPedido)
      .then(data => {
        if (data.success) {
          const h = data.encabezado || {};
          setIdActual(null);
          setNumeroPedido("");
          setHeader({
            idCliente: h.IdCliente?.toString() || "",
            idEjecutivo: h.IdEjecutivo?.toString() || "",
            idMoneda: h.IdMoneda?.toString() || "",
            trm: h.TRM?.toString() || "",
            fechaSolicitud: todayISODate(),
            fechaEntrega: nextMonthISODate(),
            poCliente: h.PO_Cliente || "",
            observaciones: h.Observaciones || "",
            iva: Boolean(h.IVA) || (h.IVA === 1),
            estado: "Activo",
            porcentajeComision: h.PorcentajeComision?.toString() || "",
          });
          setEmpaques(transformarEmpaques(data.empaques || []));
          setGuardadoExitoso(false);
          setEditando(true);
          obtenerSiguienteNumero();
        }
      })
      .catch(err => {
        Swal.fire({ title: "Error", text: err.message, icon: "error" });
      });
  }

  function transformarEmpaques(emps) {
    return emps.map(emp => ({
      id: `emp_${emp.IdDetEmpaqueComision || Date.now()}_${Math.random().toString(36).slice(2,5)}`,
      idTipoEmpaque: emp.IdTipoEmpaque?.toString() || "",
      cantidad: emp.Cantidad?.toString() || "",
      poEmpaque: emp.PO_Empaque || "",
      productos: (emp.productos || []).map(prod => ({
        idProducto: prod.IdProducto?.toString() || "",
        idVariedad: prod.IdVariedad?.toString() || "",
        idGrado: prod.IdGrado?.toString() || "",
        descripcion: prod.Descripcion || "",
        idUnidad: prod.IdUnidad?.toString() || "",
        idPredio: prod.IdPredio?.toString() || "",
        tallosRamo: prod.Tallos_Ramo?.toString() || "",
        ramosCaja: prod.Ramos_Caja?.toString() || "",
        precioVenta: prod.Precio_Venta?.toString() || "",
        porcentajeComision: prod.PorcentajeComision !== null && prod.PorcentajeComision !== undefined
          ? prod.PorcentajeComision?.toString() : "",
        receta: (prod.receta || []).map(rec => ({
          idProducto: rec.IdProducto?.toString() || "",
          idVariedad: rec.IdVariedad?.toString() || "",
          cantidad: rec.Cantidad?.toString() || "",
        })),
      })),
    }));
  }

  function handleAnular() {
    if (!idActual) {
      Swal.fire({ title: "Atención", text: "Debe seleccionar un pedido para anular", icon: "warning" });
      return;
    }
    Swal.fire({
      title: "¿Anular pedido?",
      text: `Se anulará el pedido ${numeroPedido}. Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const datos = prepararDatosParaGuardar();
          datos.idPedido = idActual;
          datos.encabezado.Estado = "Anulado";
          const response = await guardarPedidoCompleto(datos);
          if (response.success) {
            setHeader(prev => ({ ...prev, estado: "Anulado" }));
            Swal.fire({ title: "Anulado", text: "Pedido anulado exitosamente", icon: "success", timer: 2000, showConfirmButton: false });
          }
        } catch (err) {
          Swal.fire({ title: "Error", text: err.message, icon: "error" });
        }
      }
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabecera del módulo */}
      <div className="bg-gradient-to-r from-violet-700 to-purple-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pedidos - Ventas Comisión</h1>
              <p className="text-purple-200 text-sm mt-1">
                Gestión de pedidos independientes para actividad comercial
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
            <FileText className="w-4 h-4 text-purple-200" />
            <span className="text-sm font-semibold">{numeroPedido || "Nuevo"}</span>
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
            <button onClick={handleGuardar} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-md shadow-emerald-600/20 font-medium text-sm disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : idActual ? "Actualizar" : "Guardar"}
            </button>
            <button onClick={handleNuevo}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-md shadow-gray-600/20 font-medium text-sm">
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handlePDF} disabled={!guardadoExitoso}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:from-rose-700 hover:to-pink-700 transition-all shadow-md shadow-rose-600/20 font-medium text-sm disabled:opacity-50">
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button onClick={handleAnular} disabled={!idActual || header.estado === "Anulado"}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-md shadow-red-600/20 font-medium text-sm disabled:opacity-50">
              <Undo2 className="w-4 h-4" />
              Anular
            </button>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 flex items-center gap-3">
            <FileText className="w-5 h-5 text-white" />
            <h2 className="text-white font-semibold">Encabezado del Pedido</h2>
          </div>
          <div className="p-6">
            <PedidoComisionHeader
              header={header}
              setHeader={setHeader}
              datosSelect={datosSelect}
              calculos={calculos}
              numeroPedido={numeroPedido}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 flex items-center gap-3">
            <Package className="w-5 h-5 text-white" />
            <h2 className="text-white font-semibold">Empaques y Productos</h2>
          </div>
          <div className="p-6">
            <PedidoComisionEmpaque
              empaques={empaques}
              setEmpaques={setEmpaques}
              datosSelect={datosSelect}
              porcentajeComisionGlobal={header.porcentajeComision}
            />
          </div>
        </div>
      </div>

      {/* Modal de errores */}
      {showErrors && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowErrors(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-2xl flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold">Errores de validación</h3>
                <p className="text-red-200 text-sm">Corrija los siguientes errores antes de guardar</p>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-2">
                {errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-red-700">{err}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowErrors(false)}
                className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de búsqueda */}
      {showSearch && (
        <ModalBuscarPedidosComision
          onClose={() => setShowSearch(false)}
          onSelect={handleSeleccionarPedido}
          onDuplicate={handleSeleccionarPedidoParaDuplicar}
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

function Package({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
