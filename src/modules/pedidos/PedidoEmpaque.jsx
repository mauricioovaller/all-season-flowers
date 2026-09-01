// src/components/pedidos/PedidoEmpaque.jsx - VERSIÓN CON CÁLCULO DE FÜLLES
import React, { useState, useEffect, useMemo, useCallback } from "react";
import EmpaqueItem from "./EmpaqueItem";

// Colores diferenciados para cada empaque
const coloresEmpaques = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', header: 'bg-blue-100' },
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', header: 'bg-green-100' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', header: 'bg-purple-100' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', header: 'bg-amber-100' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', header: 'bg-rose-100' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', header: 'bg-cyan-100' },
];

function formatCurrency(v, isUSD = false) {
  const dec = isUSD ? 3 : 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: isUSD ? "USD" : "COP",
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(v || 0);
}

function formatNumber(n) {
  return new Intl.NumberFormat("es-CO").format(n || 0);
}

export default function PedidoEmpaque({
  empaques,
  onChangeEmpaques,
  productos = [],
  tiposEmpaque = [],
  unidadesFacturacion = [],
  predios = [],
  monedaNombre = '',
}) {
  const esUSD = monedaNombre && /d[oó]lar/i.test(monedaNombre);
  const [empaquesExpandidos, setEmpaquesExpandidos] = useState({});
  const [vistaTabla, setVistaTabla] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const getNomProducto = useCallback((id) => productos.find(p => p.id === id)?.descripcion || id || '', [productos]);

  function recalcularTotalesEmpaque(empaque) {
    let totalTallos = 0;
    let totalValor = 0;
    let totalFulles = 0;
    const tipoEmpaque = tiposEmpaque.find(t => t.id === empaque.tipoEmpaque);
    const equivFull = tipoEmpaque?.equivFull || 1;
    const cantidadEmpaques = Number(empaque.cantidadEmpaque) || 0;
    totalFulles = cantidadEmpaques * equivFull;
    if (empaque.items && empaque.items.length > 0) {
      empaque.items.forEach(item => {
        totalTallos += Number(item.totTallosRegistro) || 0;
        totalValor += Number(item.valorRegistro) || 0;
      });
    }
    return {
      ...empaque,
      totalTallosEmpaque: totalTallos,
      valorTotalEmpaque: totalValor,
      fullesEmpaque: totalFulles,
    };
  }

  // Efecto para recalcular totales cuando cambian los empaques
  useEffect(() => {
    if (empaques.length > 0) {
      const empaquesConTotales = empaques.map(empaque => {
        if (empaque.totalTallosEmpaque && empaque.valorTotalEmpaque && empaque.fullesEmpaque) {
          return empaque;
        }
        return recalcularTotalesEmpaque(empaque);
      });

      const huboCambios = empaquesConTotales.some((newEmp, index) => {
        const oldEmp = empaques[index];
        return newEmp.totalTallosEmpaque !== oldEmp.totalTallosEmpaque ||
          newEmp.valorTotalEmpaque !== oldEmp.valorTotalEmpaque ||
          newEmp.fullesEmpaque !== oldEmp.fullesEmpaque;
      });

      if (huboCambios) {
        onChangeEmpaques(empaquesConTotales);
      }
    }
  }, [empaques, tiposEmpaque]);

  function addEmpaque() {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nuevoEmpaque = {
      id,
      tipoEmpaque: "",
      cantidadEmpaque: 1,
      poCodeEmpaque: "",
      items: [],
      totalTallosEmpaque: 0,
      valorTotalEmpaque: 0,
      fullesEmpaque: 0,
    };
    onChangeEmpaques([...empaques, nuevoEmpaque]);
    setEmpaquesExpandidos(prev => ({ ...prev, [id]: true }));
  }

  function removeEmpaque(index) {
    const copy = [...empaques];
    const empaqueId = copy[index].id;
    copy.splice(index, 1);
    onChangeEmpaques(copy);
    setEmpaquesExpandidos(prev => {
      const nuevo = { ...prev };
      delete nuevo[empaqueId];
      return nuevo;
    });
  }

  function toggleEmpaqueExpandido(empaqueId) {
    setEmpaquesExpandidos(prev => ({
      ...prev,
      [empaqueId]: !prev[empaqueId]
    }));
  }

  function updateEmpaque(index, field, value) {
    const copy = [...empaques];
    copy[index] = { ...copy[index], [field]: value };

    if (field !== "items") {
      copy[index] = recalcularTotalesEmpaque(copy[index]);
    }

    onChangeEmpaques(copy);
  }

  function updateItemsEmpaque(empaqueIndex, newItems) {
    const copy = [...empaques];
    copy[empaqueIndex].items = newItems;
    copy[empaqueIndex] = recalcularTotalesEmpaque(copy[empaqueIndex]);
    onChangeEmpaques(copy);
  }

  function irAProducto(empIdx) {
    setVistaTabla(false);
    setBusqueda('');
    const empaqueId = empaques[empIdx]?.id;
    if (!empaqueId) return;
    setEmpaquesExpandidos(prev => ({ ...prev, [empaqueId]: true }));
    setTimeout(() => {
      document.getElementById(`empaque-${empaqueId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }

  const totalPiezas = empaques.reduce((sum, emp) => sum + (Number(emp.cantidadEmpaque) || 0), 0);
  const totalFulles = empaques.reduce((sum, emp) => {
    const tipoEmpaque = tiposEmpaque.find(t => t.id === emp.tipoEmpaque);
    const equivFull = tipoEmpaque?.equivFull || 1;
    const cantidadEmpaques = Number(emp.cantidadEmpaque) || 0;
    return sum + (cantidadEmpaques * equivFull);
  }, 0);
  const totalTallos = empaques.reduce((sum, emp) => sum + (Number(emp.totalTallosEmpaque) || 0), 0);
  const totalValor = empaques.reduce((sum, emp) => sum + (Number(emp.valorTotalEmpaque) || 0), 0);

  const itemsPlanos = useMemo(() => {
    const planos = [];
    empaques.forEach((emp, empIdx) => {
      (emp.items || []).forEach((item, itemIdx) => {
        planos.push({
          empIdx,
          itemIdx,
          key: `${emp.id}_${itemIdx}`,
          empaque: emp,
          item,
          tipoEmpaqueDesc: tiposEmpaque.find(t => t.id === emp.tipoEmpaque)?.descripcion || '',
          colorIndex: empIdx % coloresEmpaques.length,
        });
      });
    });
    return planos;
  }, [empaques, tiposEmpaque]);

  const itemsFiltrados = useMemo(() => {
    if (!busqueda) return itemsPlanos;
    const q = busqueda.toLowerCase();
    return itemsPlanos.filter(({ item, empaque }) => {
      const campos = [
        getNomProducto(item.producto),
        item.variedad,
        item.grado,
        item.descripcion,
        empaque.poCodeEmpaque,
        String(item.tallosRamo),
        String(item.ramosCaja),
        String(item.totTallosRegistro),
        String(item.valorRegistro),
      ];
      return campos.some(f => f && f.toLowerCase().includes(q));
    });
  }, [itemsPlanos, busqueda, getNomProducto]);

  return (
    <section className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4">
      {/* Header con toggle de vista */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-slate-700">Empaques</h3>
          <p className="text-xs text-gray-500">
            {vistaTabla
              ? 'Todos los productos en una vista consolidada'
              : 'Cada empaque tiene un color diferente'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {empaques.length > 0 && (
            <button
              type="button"
              onClick={() => { setVistaTabla(!vistaTabla); setBusqueda(''); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition border ${
                vistaTabla
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {vistaTabla ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Vista Tarjetas
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Vista Tabla
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={addEmpaque}
            className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition font-medium text-xs md:text-sm"
          >
            + Nuevo Empaque
          </button>
        </div>
      </div>

      {/* Totales Generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 p-2 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Empaques</div>
          <div className="text-base font-bold text-gray-900">{totalPiezas}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Fulles</div>
          <div className="text-base font-bold text-gray-900">{totalFulles.toFixed(3)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Tallos</div>
          <div className="text-base font-bold text-gray-900">{totalTallos}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Valor</div>
          <div className="text-base font-bold text-green-600">{formatCurrency(totalValor, esUSD)}</div>
        </div>
      </div>

      {/* VISTA TABLA CONSOLIDADA */}
      {vistaTabla && itemsPlanos.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por producto, variedad, grado, PO..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-right">
            {itemsFiltrados.length} de {itemsPlanos.length} producto(s)
          </p>

          {/* Tabla desktop */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="px-2 py-2 text-left">#</th>
                  <th className="px-2 py-2 text-left">Emp</th>
                  <th className="px-2 py-2 text-left">PO</th>
                  <th className="px-2 py-2 text-left">Producto</th>
                  <th className="px-2 py-2 text-left">Descripción</th>
                  <th className="px-2 py-2 text-right">Piezas</th>
                  <th className="px-2 py-2 text-right">T/Ramo</th>
                  <th className="px-2 py-2 text-right">R/Caja</th>
                  <th className="px-2 py-2 text-right">T/Caja</th>
                  <th className="px-2 py-2 text-right">Precio</th>
                  <th className="px-2 py-2 text-right">Total Tallos</th>
                  <th className="px-2 py-2 text-right">Valor</th>
                  <th className="px-2 py-2 text-center w-14">Ir</th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((plano, i) => {
                  const { item, empaque, colorIndex } = plano;
                  const color = coloresEmpaques[colorIndex];
                  const nomProducto = getNomProducto(item.producto);
                  return (
                    <tr key={plano.key} className={`border-t border-gray-100 hover:bg-blue-50/50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-2 py-1.5 text-gray-500">{i + 1}</td>
                      <td className="px-2 py-1.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${color.text} ${color.header}`}>
                          {plano.empIdx + 1}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-gray-600 max-w-[80px] truncate">{empaque.poCodeEmpaque || '-'}</td>
                      <td className="px-2 py-1.5 font-medium text-gray-800 max-w-[140px] truncate">{nomProducto}</td>
                      <td className="px-2 py-1.5 text-gray-500 max-w-[220px] truncate">{item.descripcion || '-'}</td>
                      <td className="px-2 py-1.5 text-right font-medium">{formatNumber(empaque.cantidadEmpaque)}</td>
                      <td className="px-2 py-1.5 text-right">{formatNumber(item.tallosRamo)}</td>
                      <td className="px-2 py-1.5 text-right">{formatNumber(item.ramosCaja)}</td>
                      <td className="px-2 py-1.5 text-right font-medium">{formatNumber((item.tallosRamo || 0) * (item.ramosCaja || 0))}</td>
                      <td className="px-2 py-1.5 text-right">{formatCurrency(item.precioVenta, esUSD)}</td>
                      <td className="px-2 py-1.5 text-right font-medium">{formatNumber(item.totTallosRegistro)}</td>
                      <td className="px-2 py-1.5 text-right font-bold text-green-700">{formatCurrency(item.valorRegistro, esUSD)}</td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => irAProducto(plano.empIdx)}
                          title="Ir al empaque"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards móvil */}
          <div className="block md:hidden space-y-2">
            {itemsFiltrados.map((plano) => {
              const { item, empaque, colorIndex } = plano;
              const color = coloresEmpaques[colorIndex];
              const nomProducto = getNomProducto(item.producto);
              return (
                <div key={plano.key} className={`border rounded-lg p-3 ${color.bg} ${color.border}`}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${color.text} ${color.header}`}>
                        E{plano.empIdx + 1}
                      </span>
                  <span className="font-medium text-gray-800 text-sm truncate">{nomProducto}</span>
                </div>
                <button
                  type="button"
                  onClick={() => irAProducto(plano.empIdx)}
                  className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                  title="Ir al empaque"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-gray-600">
                <span className="col-span-2 truncate">{item.descripcion || '-'}</span>
                <span>PO: <strong>{empaque.poCodeEmpaque || '-'}</strong></span>
                <span>Piezas: <strong>{formatNumber(empaque.cantidadEmpaque)}</strong></span>
                <span>T/Ramo: <strong>{formatNumber(item.tallosRamo)}</strong></span>
                <span>R/Caja: <strong>{formatNumber(item.ramosCaja)}</strong></span>
                <span>T/Caja: <strong>{formatNumber((item.tallosRamo || 0) * (item.ramosCaja || 0))}</strong></span>
                    <span>Precio: <strong>{formatCurrency(item.precioVenta, esUSD)}</strong></span>
                    <span>Total T.: <strong>{formatNumber(item.totTallosRegistro)}</strong></span>
                    <span className="col-span-2 text-right text-sm font-bold text-green-700">
                      Valor: {formatCurrency(item.valorRegistro, esUSD)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {itemsFiltrados.length === 0 && busqueda && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No hay productos que coincidan con "<strong>{busqueda}</strong>"
            </div>
          )}
        </div>
      )}

      {/* VISTA TARJETAS (ACORDEÓN) - ORIGINAL */}
      {!vistaTabla && (
        <div className="space-y-3">
          {empaques.map((empaque, empIndex) => {
            const estaExpandido = empaquesExpandidos[empaque.id];
            const tipoEmpaqueObj = tiposEmpaque.find(t => t.id === empaque.tipoEmpaque);
            const tipoEmpaqueDesc = tipoEmpaqueObj?.descripcion || "Seleccionar tipo";
            const equivFull = tipoEmpaqueObj?.equivFull || 1;
            const fullesCalculados = (Number(empaque.cantidadEmpaque) || 0) * equivFull;

            const colorIndex = empIndex % coloresEmpaques.length;
            const colores = coloresEmpaques[colorIndex];

            return (
              <div key={empaque.id} id={`empaque-${empaque.id}`} className={`border rounded-lg md:rounded-xl overflow-hidden ${colores.bg} ${colores.border}`}>
                {/* ENCABEZADO DEL EMPAQUE - SIEMPRE VISIBLE Y COMPACTO */}
                <div className={`p-2 ${colores.header} border-b ${colores.border}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleEmpaqueExpandido(empaque.id)}
                        className={`${colores.text} hover:opacity-80 flex-shrink-0`}
                      >
                        <svg
                          className={`w-4 h-4 transform transition-transform ${estaExpandido ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-gray-700 truncate">
                            Empaque #{empIndex + 1}
                          </span>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-white border">
                            {tipoEmpaqueDesc}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          PO: {empaque.poCodeEmpaque || "Sin código"} | Cant: {empaque.cantidadEmpaque} | Fulles: {fullesCalculados.toFixed(3)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-medium">
                          <span className="text-gray-600">{empaque.totalTallosEmpaque || 0} tallos</span>
                        </div>
                        <div className="text-xs font-bold text-green-600">
                          {formatCurrency(empaque.valorTotalEmpaque || 0, esUSD)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEmpaque(empIndex)}
                        className="text-red-600 hover:text-red-800 text-xs bg-white hover:bg-red-50 border border-red-200 px-2 py-1 rounded transition"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                {/* CONTENIDO DEL EMPAQUE - SOLO SI ESTÁ EXPANDIDO */}
                {estaExpandido && (
                  <>
                    {/* Configuración del Empaque - COMPACTA */}
                    <div className="p-3 border-b bg-white/50">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-700">Tipo *</label>
                          <select
                            value={empaque.tipoEmpaque || ""}
                            onChange={(e) => updateEmpaque(empIndex, "tipoEmpaque", e.target.value)}
                            className="border rounded p-1.5 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">-- Seleccione --</option>
                            {tiposEmpaque.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.descripcion} {t.equivFull !== 1 ? `(${t.equivFull} fulles)` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-700">Cantidad *</label>
                          <input
                            type="number"
                            value={empaque.cantidadEmpaque || 1}
                            onChange={(e) => updateEmpaque(empIndex, "cantidadEmpaque", e.target.value)}
                            className="border rounded p-1.5 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-700">PO-CODE</label>
                          <input
                            type="text"
                            value={empaque.poCodeEmpaque || ""}
                            onChange={(e) => updateEmpaque(empIndex, "poCodeEmpaque", e.target.value)}
                            className="border rounded p-1.5 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="PO del empaque"
                          />
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-1 p-1.5 bg-gray-50 rounded border">
                        <div className="text-center">
                          <div className="text-xs text-gray-600">Fulles</div>
                          <div className="text-sm font-bold">{fullesCalculados.toFixed(3)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600">Tallos</div>
                          <div className="text-sm font-bold">{empaque.totalTallosEmpaque || 0}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600">Valor</div>
                          <div className="text-sm font-bold text-green-600">{formatCurrency(empaque.valorTotalEmpaque || 0, esUSD)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      <EmpaqueItem
                        monedaNombre={monedaNombre}
                        empaqueIndex={empIndex}
                        items={empaque.items || []}
                        onChangeItems={(newItems) => updateItemsEmpaque(empIndex, newItems)}
                        productos={productos}
                        tiposEmpaque={tiposEmpaque}
                        unidadesFacturacion={unidadesFacturacion}
                        predios={predios}
                        cantidadEmpaque={empaque.cantidadEmpaque || 1}
                        estaExpandido={estaExpandido}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Estado vacío */}
      {empaques.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium text-sm">No hay empaques</p>
          <p className="text-xs text-gray-500 mt-0.5">Agregue empaques para comenzar</p>
        </div>
      )}

      {/* Instrucción rápida */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Tip:</span> Use el botón <strong>Vista Tabla</strong> para ver todos los productos en una tabla consolidada con búsqueda incluida. Haga clic en <strong>Ir</strong> para localizar rÃ¡pidamente un producto en los acordeones
        </p>
      </div>
    </section>
  );
}
