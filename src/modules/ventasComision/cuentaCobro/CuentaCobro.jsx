import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Search, Download, FileText, DollarSign, Filter, Eye, History, Plus } from 'lucide-react';
import { getDatosSelect } from "../../../services/ventasComision/pedidosComisionService";
import { getPedidosParaCobro, generarPDFCuentaCobro, marcarPedidosFacturados } from "../../../services/ventasComision/cuentaCobroService";
import ModalVisorPreliminar from "../pedidos/ModalVisorPreliminar";

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function firstDay() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-01`;
}

export default function CuentaCobro() {
  const [modo, setModo] = useState('nueva');
  const [fechaInicio, setFechaInicio] = useState(firstDay());
  const [fechaFin, setFechaFin] = useState(todayISO());
  const [idCliente, setIdCliente] = useState("");
  const [clientes, setClientes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [totales, setTotales] = useState({ totalPedidos: 0, valorTotal: 0, totalComision: 0, totalCobrar: 0 });
  const [cargando, setCargando] = useState(false);
  const [consultado, setConsultado] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    getDatosSelect().then(data => {
      if (data.clientes) {
        setClientes(data.clientes.map(c => ({
          id: c.IdCliente?.toString() || c.id?.toString() || '',
          nombre: c.NOMBRE || c.nombre || '',
        })));
      }
    });
  }, []);

  async function handleConsultar() {
    if (modo === 'nueva') {
      if (!fechaInicio || !fechaFin) {
        Swal.fire({ title: "Atención", text: "Debe seleccionar un rango de fechas", icon: "warning" });
        return;
      }
      if (fechaInicio > fechaFin) {
        Swal.fire({ title: "Atención", text: "La fecha de inicio no puede ser mayor a la fecha fin", icon: "warning" });
        return;
      }
    }
    setCargando(true);
    setConsultado(false);
    try {
      const filtros = { modo, fechaInicio, fechaFin };
      if (idCliente) filtros.idCliente = parseInt(idCliente);

      const data = await getPedidosParaCobro(filtros);
      if (data.success) {
        if (modo === 'historial') {
          setHistorial(data.cuentas || []);
        } else {
          const pedList = data.pedidos || [];
          setPedidos(pedList);
          let vt = 0, tc = 0;
          pedList.forEach(p => { vt += parseFloat(p.valorTotal) || 0; tc += parseFloat(p.comision) || 0; });
          setTotales({ totalPedidos: pedList.length, valorTotal: vt, totalComision: tc, totalCobrar: tc });
        }
        setConsultado(true);
      }
    } catch (e) {
      Swal.fire({ title: "Error", text: e.message, icon: "error" });
    } finally {
      setCargando(false);
    }
  }

  async function verDetalleCuenta(fecha) {
    setCargando(true);
    try {
      const data = await getPedidosParaCobro({
        modo: 'historial_detalle',
        fechaCuentaCobro: fecha,
      });
      if (data.success) {
        setPedidos(data.pedidos || []);
        let vt = 0, tc = 0;
        (data.pedidos || []).forEach(p => { vt += parseFloat(p.valorTotal) || 0; tc += parseFloat(p.comision) || 0; });
        setTotales({ totalPedidos: (data.pedidos || []).length, valorTotal: vt, totalComision: tc, totalCobrar: tc });
        setModo('detalle_historial');
        setConsultado(true);
      }
    } catch (e) {
      Swal.fire({ title: "Error", text: e.message, icon: "error" });
    } finally {
      setCargando(false);
    }
  }

  async function handlePDF() {
    if (pedidos.length === 0) {
      Swal.fire({ title: "Atención", text: "No hay datos para generar", icon: "warning" });
      return;
    }

    if (modo === 'nueva') {
      const result = await Swal.fire({
        title: "¿Generar Cuenta de Cobro?",
        html: `<div class="text-left text-sm">
          <p class="mb-2"><b>${pedidos.length}</b> pedido(s) serán incluidos.</p>
          <p class="text-amber-600 font-semibold">Una vez generada, estos pedidos quedarán marcados como facturados y no estarán disponibles para futuras cuentas de cobro.</p>
        </div>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, generar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#7c3aed",
      });
      if (!result.isConfirmed) return;
    }

    try {
      const datos = {
        fechaInicio, fechaFin,
        idCliente: idCliente ? parseInt(idCliente) : null,
        clienteNombre: idCliente ? (clientes.find(c => c.id === idCliente)?.nombre || "") : "Todos los clientes",
        pedidos, totales,
      };
      const blob = await generarPDFCuentaCobro(datos);
      setPdfUrl(URL.createObjectURL(blob));
      setShowPdf(true);

      if (modo === 'nueva') {
        const ids = pedidos.map(p => p.idPedido).filter(Boolean);
        await marcarPedidosFacturados(ids);
      }
    } catch (_) {
      Swal.fire({ title: "Error", text: "No se pudo generar el PDF", icon: "error" });
    }
  }

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    setConsultado(false);
    setPedidos([]);
    setHistorial([]);
    setTotales({ totalPedidos: 0, valorTotal: 0, totalComision: 0, totalCobrar: 0 });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="bg-gradient-to-r from-violet-700 to-purple-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl"><DollarSign className="w-8 h-8" /></div>
            <div>
              <h1 className="text-2xl font-bold">Cuenta de Cobro</h1>
              <p className="text-purple-200 text-sm mt-1">Consolidado de comisiones por pedidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Nueva / Historial */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex">
        <button onClick={() => cambiarModo('nueva')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${modo === 'nueva' || modo === 'detalle_historial' ? 'bg-violet-100 text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Plus className="w-4 h-4" /> Nueva Cuenta de Cobro
        </button>
        <button onClick={() => cambiarModo('historial')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${modo === 'historial' ? 'bg-violet-100 text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <History className="w-4 h-4" /> Cuentas Anteriores
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-violet-600" />
          <h2 className="font-semibold text-gray-700">Filtros de Consulta</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Fecha Inicio</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Fecha Fin</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Cliente</label>
            <select value={idCliente} onChange={e => setIdCliente(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 bg-white text-sm">
              <option value="">Todos los clientes</option>
              {(clientes || []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleConsultar} disabled={cargando}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 transition-all font-medium text-sm disabled:opacity-50">
              <Search className="w-4 h-4" />{cargando ? "Consultando..." : "Consultar"}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {consultado && (
        <>
          {modo === 'historial' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3">
                <h2 className="text-white font-semibold">Cuentas de Cobro Anteriores</h2>
              </div>
              {historial.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No se encontraron cuentas de cobro anteriores</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pedidos</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((h, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{h.FechaCuentaCobro}</td>
                          <td className="px-4 py-3">{h.cliente || 'Todos los clientes'}</td>
                          <td className="px-4 py-3 text-center">{h.totalPedidos}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => verDetalleCuenta(h.FechaCuentaCobro)}
                              className="px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-xs font-medium">
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {(modo === 'nueva' || modo === 'detalle_historial') && (
            <>
              {/* Tarjetas de Totales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-100 rounded-xl"><FileText className="w-5 h-5 text-violet-600" /></div>
                    <div><p className="text-xs text-gray-500 font-semibold uppercase">Total Pedidos</p><p className="text-2xl font-bold">{totales.totalPedidos}</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 rounded-xl"><DollarSign className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-xs text-gray-500 font-semibold uppercase">Valor Total</p><p className="text-2xl font-bold">${totales.valorTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 rounded-xl"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-xs text-gray-500 font-semibold uppercase">Total Comisión</p><p className="text-2xl font-bold text-emerald-700">${totales.totalComision.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-100 rounded-xl"><DollarSign className="w-5 h-5 text-amber-600" /></div>
                    <div><p className="text-xs text-gray-500 font-semibold uppercase">Total a Cobrar</p><p className="text-2xl font-bold text-amber-700">${totales.totalCobrar.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                  </div>
                </div>
              </div>

              {/* Tabla de pedidos */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-white" />
                    <h2 className="text-white font-semibold">Detalle de Pedidos</h2>
                  </div>
                </div>
                {pedidos.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron pedidos</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Pedido</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valor Total</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">% Comisión</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Comisión</th>
                      </tr></thead>
                      <tbody>
                        {pedidos.map((p, i) => (
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-700">{p.numeroPedido || `ID: ${p.idPedido}`}</td>
                            <td className="px-4 py-3 text-gray-600">{p.cliente || '-'}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{p.fecha || '-'}</td>
                            <td className="px-4 py-3 text-right">${(parseFloat(p.valorTotal)||0).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {p.PorcentajeComision || (parseFloat(p.comision)>0&&parseFloat(p.valorTotal)>0?((parseFloat(p.comision)/parseFloat(p.valorTotal))*100).toFixed(2):'0')}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                              ${(parseFloat(p.comision)||0).toLocaleString('en-US', {minimumFractionDigits:2})}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-bold text-gray-800">
                          <td colSpan={3} className="px-4 py-3 text-right">Totales:</td>
                          <td className="px-4 py-3 text-right">${totales.valorTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                          <td className="px-4 py-3 text-right"></td>
                          <td className="px-4 py-3 text-right text-emerald-700">${totales.totalComision.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Botón PDF */}
              <div className="flex justify-end">
                <button onClick={handlePDF} disabled={pedidos.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:from-rose-700 transition-all font-semibold text-sm disabled:opacity-50 shadow-lg shadow-rose-600/30">
                  <Download className="w-5 h-5" />{modo === 'nueva' ? 'Generar Cuenta de Cobro' : 'Regenerar PDF'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {!consultado && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-violet-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Search className="w-10 h-10 text-violet-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              {modo === 'historial' ? 'Consultar Cuentas Anteriores' : 'Consultar Cuenta de Cobro'}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Seleccione filtros y haga clic en "Consultar"
            </p>
          </div>
        </div>
      )}

      {showPdf && pdfUrl && (
        <ModalVisorPreliminar url={pdfUrl} onClose={() => { setShowPdf(false); setPdfUrl(null); }} />
      )}
    </div>
  );
}
