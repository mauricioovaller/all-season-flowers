import React, { useState, useEffect, useMemo, useCallback } from "react";
import EmpaqueComisionItem from "./EmpaqueComisionItem";

const coloresEmpaques = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', header: 'bg-blue-100' },
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', header: 'bg-green-100' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', header: 'bg-purple-100' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', header: 'bg-amber-100' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', header: 'bg-rose-100' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', header: 'bg-cyan-100' },
];

function formatCurrency(v) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v || 0);
}

function formatNumber(n) {
  return new Intl.NumberFormat("en-US").format(n || 0);
}

export default function PedidoComisionEmpaque({ empaques, setEmpaques, datosSelect, porcentajeComisionGlobal }) {
  const [empaquesExpandidos, setEmpaquesExpandidos] = useState({});
  const [vistaTabla, setVistaTabla] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const getNomProducto = useCallback((id) => datosSelect.productos?.find(p => p.id === id)?.descripcion || id || '', [datosSelect.productos]);

  function addEmpaque() {
    const id = `emp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nuevo = {
      id,
      idTipoEmpaque: "",
      cantidad: "",
      poEmpaque: "",
      productos: [],
    };
    setEmpaques(prev => [...prev, nuevo]);
    setEmpaquesExpandidos(prev => ({ ...prev, [id]: true }));
  }

  function removeEmpaque(index) {
    const empId = empaques[index]?.id;
    setEmpaques(prev => prev.filter((_, i) => i !== index));
    if (empId) {
      setEmpaquesExpandidos(prev => {
        const n = { ...prev };
        delete n[empId];
        return n;
      });
    }
  }

  function toggleEmpaqueExpandido(empId) {
    setEmpaquesExpandidos(prev => ({ ...prev, [empId]: !prev[empId] }));
  }

  function updateEmpaque(index, field, value) {
    setEmpaques(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function updateProductosEmpaque(empaqueIndex, nuevosProductos) {
    setEmpaques(prev => {
      const copy = [...prev];
      copy[empaqueIndex] = { ...copy[empaqueIndex], productos: nuevosProductos };
      return copy;
    });
  }

  function irAProducto(empIdx) {
    setVistaTabla(false);
    setBusqueda('');
    const empId = empaques[empIdx]?.id;
    if (!empId) return;
    setEmpaquesExpandidos(prev => ({ ...prev, [empId]: true }));
    setTimeout(() => {
      document.getElementById(`empaque-${empId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }

  // Items planos para la vista tabla
  const itemsPlanos = useMemo(() => {
    const planos = [];
    empaques.forEach((emp, empIdx) => {
      (emp.productos || []).forEach((prod, prodIdx) => {
        const tipoEmp = datosSelect.tipoEmpaque?.find(t => t.id === emp.idTipoEmpaque);
        planos.push({
          empIdx,
          prodIdx,
          key: `${emp.id}_${prodIdx}`,
          empaque: emp,
          producto: prod,
          tipoEmpaqueDesc: tipoEmp?.nombre || '',
          colorIndex: empIdx % coloresEmpaques.length,
        });
      });
    });
    return planos;
  }, [empaques, datosSelect.tipoEmpaque]);

  const itemsFiltrados = useMemo(() => {
    if (!busqueda) return itemsPlanos;
    const q = busqueda.toLowerCase();
    return itemsPlanos.filter(({ producto, empaque }) => {
      const campos = [
        getNomProducto(producto.idProducto),
        producto.idVariedad,
        producto.idGrado,
        producto.descripcion,
        empaque.poEmpaque,
        String(producto.tallosRamo),
        String(producto.ramosCaja),
        String(producto.precioVenta),
      ];
      return campos.some(f => f && f.toLowerCase().includes(q));
    });
  }, [itemsPlanos, busqueda, getNomProducto]);

  const totalPiezas = empaques.reduce((sum, emp) => sum + (parseInt(emp.cantidad) || 0), 0);
  const totalTallos = empaques.reduce((sum, emp) => {
    return sum + (emp.productos || []).reduce((s, p) => s + (parseInt(p.tallosRamo) || 0) * (parseInt(p.ramosCaja) || 0) * (parseInt(emp.cantidad) || 0), 0);
  }, 0);
  const totalValor = empaques.reduce((sum, emp) => {
    return sum + (emp.productos || []).reduce((s, p) => s + ((parseInt(p.tallosRamo) || 0) * (parseInt(p.ramosCaja) || 0) * (parseFloat(p.precioVenta) || 0)), 0);
  }, 0);

  return (
    <div>
      {/* Header con toggle de vista */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-700">Empaques y Productos</h3>
          <p className="text-xs text-gray-400">
            {vistaTabla ? 'Todos los productos en una vista consolidada' : 'Cada empaque tiene un color diferente'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {empaques.length > 0 && (
            <button onClick={() => { setVistaTabla(!vistaTabla); setBusqueda(''); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition border ${
                vistaTabla ? 'bg-violet-50 text-violet-700 border-violet-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}>
              {vistaTabla ? (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>Vista Tarjetas</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Vista Tabla</>
              )}
            </button>
          )}
          <button onClick={addEmpaque}
            className="bg-violet-600 text-white rounded-lg px-3 py-2 hover:bg-violet-700 transition font-medium text-xs">
            + Nuevo Empaque
          </button>
        </div>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <div className="text-xs text-gray-500 font-medium">Empaques</div>
          <div className="text-base font-bold text-gray-900">{totalPiezas}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 font-medium">Tallos</div>
          <div className="text-base font-bold text-gray-900">{formatNumber(totalTallos)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 font-medium">Valor</div>
          <div className="text-base font-bold text-violet-700">{formatCurrency(totalValor)}</div>
        </div>
      </div>

      {/* VISTA TABLA */}
      {vistaTabla && itemsPlanos.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por producto, variedad, grado..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            {busqueda && (
              <button onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 text-right">{itemsFiltrados.length} de {itemsPlanos.length} producto(s)</p>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-2 py-2 text-left text-gray-600 font-semibold">#</th>
                  <th className="px-2 py-2 text-left text-gray-600 font-semibold">Empaque</th>
                  <th className="px-2 py-2 text-left text-gray-600 font-semibold">Producto</th>
                  <th className="px-2 py-2 text-left text-gray-600 font-semibold">Variedad</th>
                  <th className="px-2 py-2 text-left text-gray-600 font-semibold">Grado</th>
                  <th className="px-2 py-2 text-center text-gray-600 font-semibold">T/R</th>
                  <th className="px-2 py-2 text-center text-gray-600 font-semibold">R/C</th>
                  <th className="px-2 py-2 text-right text-gray-600 font-semibold">Precio</th>
                  <th className="px-2 py-2 text-right text-gray-600 font-semibold">Subtotal</th>
                  <th className="px-2 py-2 text-center text-gray-600 font-semibold">% Com</th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map(({ key, empIdx, prodIdx, empaque, producto, tipoEmpaqueDesc, colorIndex }) => {
                  const tallosRamo = parseInt(producto.tallosRamo) || 0;
                  const ramosCaja = parseInt(producto.ramosCaja) || 0;
                  const precio = parseFloat(producto.precioVenta) || 0;
                  const subtotal = tallosRamo * ramosCaja * precio;
                  const color = coloresEmpaques[colorIndex];
                  return (
                    <tr key={key} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => irAProducto(empIdx)}>
                      <td className="px-2 py-2">
                        <span className={`inline-block w-5 h-5 rounded ${color.header} ${color.text} text-center text-xs font-bold leading-5`}>
                          {empIdx + 1}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-gray-600">{tipoEmpaqueDesc || 'N/D'}</td>
                      <td className="px-2 py-2 font-medium text-gray-800">{getNomProducto(producto.idProducto)}</td>
                      <td className="px-2 py-2 text-gray-600">{producto.idVariedad || '-'}</td>
                      <td className="px-2 py-2 text-gray-600">{producto.idGrado || '-'}</td>
                      <td className="px-2 py-2 text-center">{tallosRamo}</td>
                      <td className="px-2 py-2 text-center">{ramosCaja}</td>
                      <td className="px-2 py-2 text-right">{formatCurrency(precio)}</td>
                      <td className="px-2 py-2 text-right font-medium">{formatCurrency(subtotal)}</td>
                      <td className="px-2 py-2 text-center">
                        <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded text-xs font-medium">
                          {producto.porcentajeComision || porcentajeComisionGlobal || 0}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LISTA DE EMPAQUES */}
      {empaques.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-400 font-medium">No hay empaques agregados</p>
          <p className="text-gray-300 text-sm">Haga clic en "+ Nuevo Empaque" para comenzar</p>
        </div>
      ) : (
        empaques.map((emp, i) => {
          const expandido = empaquesExpandidos[emp.id] === true;
          const color = coloresEmpaques[i % coloresEmpaques.length];
          const tipoEmp = datosSelect.tipoEmpaque?.find(t => t.id === emp.idTipoEmpaque);
          return (
            <div key={emp.id || i} id={`empaque-${emp.id || i}`} className={`mb-3 rounded-xl border ${color.border} overflow-hidden`}>
              {/* Cabecera del empaque */}
              <div className={`${color.header} px-4 py-3 flex items-center justify-between cursor-pointer`}
                onClick={() => toggleEmpaqueExpandido(emp.id)}>
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${color.bg} ${color.text}`}>
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-sm text-gray-700">{tipoEmp?.nombre || 'Sin tipo'} × {emp.cantidad || '0'} unid</span>
                    {emp.poEmpaque && <span className="text-xs text-gray-500 ml-2">PO: {emp.poEmpaque}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{(emp.productos || []).length} producto(s)</span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandido ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <button onClick={e => { e.stopPropagation(); removeEmpaque(i); }}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Cuerpo del empaque (expandible) */}
              {expandido && (
                <div className={`p-4 ${color.bg}`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo Empaque</label>
                      <select value={emp.idTipoEmpaque} onChange={e => updateEmpaque(i, 'idTipoEmpaque', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm bg-white">
                        <option value="">Seleccione</option>
                        {(datosSelect.tipoEmpaque || []).map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cantidad</label>
                      <input type="number" value={emp.cantidad} onChange={e => updateEmpaque(i, 'cantidad', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm"
                        placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">PO Empaque</label>
                      <input type="text" value={emp.poEmpaque} onChange={e => updateEmpaque(i, 'poEmpaque', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm"
                        placeholder="Código PO" />
                    </div>
                  </div>
                  <EmpaqueComisionItem
                    productos={emp.productos || []}
                    empaqueIndex={i}
                    datosSelect={datosSelect}
                    porcentajeComisionGlobal={porcentajeComisionGlobal}
                    onUpdateProductos={updateProductosEmpaque}
                    getNomProducto={getNomProducto}
                  />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
