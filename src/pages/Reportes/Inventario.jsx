import React, { useState, useEffect } from 'react';
import { PackageSearch, Search, Download, RefreshCw, Calendar, ChevronDown, ChevronRight, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getInventario } from '../../services/inventarios/inventariosService';

const Inventario = () => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [nivel, setNivel] = useState(1);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandidos, setExpandidos] = useState({});

  useEffect(() => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setFechaFin(hoy.toISOString().split('T')[0]);
    setFechaInicio(primerDia.toISOString().split('T')[0]);
  }, []);

  const consultar = async () => {
    if (!fechaInicio || !fechaFin) {
      setError('Ingrese el rango de fechas');
      return;
    }
    if (fechaInicio > fechaFin) {
      setError('La fecha inicial no puede ser mayor a la fecha final');
      return;
    }

    setError('');
    setLoading(true);
    setResultado(null);
    setExpandidos({});

    const data = await getInventario({ fechaInicio, fechaFin, nivel });
    if (!data.success) {
      setError(data.message || 'Error al consultar inventario');
    } else {
      setResultado(data);
    }
    setLoading(false);
  };

  const limpiar = () => {
    setResultado(null);
    setError('');
    setExpandidos({});
  };

  const toggleExpandido = (key) => {
    setExpandidos((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatNum = (n) => new Intl.NumberFormat('es-CO').format(n || 0);

  const exportarExcel = () => {
    if (!resultado || !resultado.inventarios || resultado.inventarios.length === 0) return;

    const nivelLabel = nivel === 1 ? 'Producto' : nivel === 2 ? 'Producto+Variedad' : 'Producto+Variedad+Grado';

    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen
    const resumenData = resultado.inventarios.map((item) => {
      const row = {
        Producto: item.producto,
        Código: item.codigoProducto || '',
      };
      if (nivel >= 2) row.Variedad = item.variedad || 'N/A';
      if (nivel >= 3) row.Grado = item.grado || 'N/A';
      row.Entradas = item.entradas;
      row.Salidas = item.salidas;
      row.Saldo = item.saldo;
      return row;
    });

    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Hoja 2: Movimientos detallados
    const movData = [];
    resultado.inventarios.forEach((item) => {
      (item.movimientos || []).forEach((m) => {
        const row = {
          Producto: item.producto,
        };
        if (nivel >= 2) row.Variedad = item.variedad || 'N/A';
        if (nivel >= 3) row.Grado = item.grado || 'N/A';
        row.Fecha = m.fecha;
        row['Tipo Documento'] = m.tipoDocumento;
        row['N° Documento'] = m.numeroDocumento;
        row.Tallos = m.tallos;
        row.Dirección = m.direccion === 'entrada' ? 'Entrada' : 'Salida';
        movData.push(row);
      });
    });

    if (movData.length > 0) {
      const wsMov = XLSX.utils.json_to_sheet(movData);
      XLSX.utils.book_append_sheet(wb, wsMov, 'Movimientos');
    }

    XLSX.writeFile(wb, `Inventario_${nivelLabel}_${fechaInicio}_${fechaFin}.xlsx`);
  };

  const niveles = [
    { id: 1, label: 'Nivel 1', desc: 'Solo Producto' },
    { id: 2, label: 'Nivel 2', desc: 'Producto + Variedad' },
    { id: 3, label: 'Nivel 3', desc: 'Producto + Variedad + Grado' },
  ];

  const inventarios = resultado?.inventarios || [];
  const resumen = resultado?.resumen;

  const badgeColor = (saldo) => {
    if (saldo > 0) return 'text-green-700 bg-green-50';
    if (saldo < 0) return 'text-red-700 bg-red-50';
    return 'text-gray-500 bg-gray-100';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-600 p-2 rounded-lg">
          <PackageSearch className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Inventario</h1>
          <p className="text-sm text-gray-500">
            Movimientos de entradas y salidas por producto, variedad y grado
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />Fecha inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />Fecha fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <PackageSearch className="w-4 h-4 inline mr-1" />Nivel de detalle
            </label>
            <div className="flex gap-2">
              {niveles.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setNivel(n.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    nivel === n.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div>{n.label}</div>
                  <div className="opacity-70 text-[10px]">{n.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={consultar}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Search className="w-4 h-4" />}
            {loading ? 'Consultando...' : 'Consultar'}
          </button>

          {resultado && resultado.inventarios.length > 0 && (
            <>
              <button
                onClick={exportarExcel}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />Exportar Excel
              </button>
              <button
                onClick={limpiar}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />Nueva consulta
              </button>
            </>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
        )}
      </div>

      {resultado && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-3 flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="font-semibold text-emerald-800 text-sm">
                {niveles.find((n) => n.id === nivel)?.label} — {niveles.find((n) => n.id === nivel)?.desc}
              </span>
              <span className="text-gray-500 text-xs ml-3">Período: {fechaInicio} — {fechaFin}</span>
            </div>
            <span className="text-sm text-gray-600">{inventarios.length} registro(s)</span>
          </div>

          {inventarios.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              No hay movimientos para el período seleccionado.
            </div>
          ) : (
            <>
              {/* Tarjetas de resumen */}
              {resumen && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-emerald-50/50 border-b border-emerald-100">
                  <div className="bg-white rounded-lg p-3 text-center border border-emerald-200">
                    <p className="text-xs text-gray-500 uppercase font-medium">Entradas</p>
                    <p className="text-lg font-bold text-green-700">{formatNum(resumen.totalEntradas)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-emerald-200">
                    <p className="text-xs text-gray-500 uppercase font-medium">Salidas</p>
                    <p className="text-lg font-bold text-red-600">{formatNum(resumen.totalSalidas)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-emerald-200">
                    <p className="text-xs text-gray-500 uppercase font-medium">Saldo</p>
                    <p className={`text-lg font-bold ${resumen.totalSaldo >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatNum(resumen.totalSaldo)}
                    </p>
                  </div>
                </div>
              )}

              {/* Tabla desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="px-3 py-3 text-left w-6"></th>
                      <th className="px-3 py-3 text-left whitespace-nowrap">Producto</th>
                      {nivel >= 2 && <th className="px-3 py-3 text-left whitespace-nowrap">Variedad</th>}
                      {nivel >= 3 && <th className="px-3 py-3 text-left whitespace-nowrap">Grado</th>}
                      <th className="px-3 py-3 text-right whitespace-nowrap">Entradas</th>
                      <th className="px-3 py-3 text-right whitespace-nowrap">Salidas</th>
                      <th className="px-3 py-3 text-right whitespace-nowrap">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventarios.map((item, i) => {
                      const key = `${item.idProducto}_${item.idVariedad || 0}_${item.idGrado || 0}`;
                      const isOpen = expandidos[key];
                      return (
                        <React.Fragment key={key}>
                          <tr
                            className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-emerald-50 transition-colors`}
                            onClick={() => toggleExpandido(key)}
                          >
                            <td className="px-3 py-2">
                              {item.movimientos && item.movimientos.length > 0 && (
                                isOpen
                                  ? <ChevronDown className="w-4 h-4 text-emerald-600" />
                                  : <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-800">{item.producto}</td>
                            {nivel >= 2 && (
                              <td className="px-3 py-2 text-gray-600">{item.variedad || <span className="text-gray-400 italic">N/A</span>}</td>
                            )}
                            {nivel >= 3 && (
                              <td className="px-3 py-2 text-gray-600">{item.grado || <span className="text-gray-400 italic">N/A</span>}</td>
                            )}
                            <td className="px-3 py-2 text-right font-medium text-green-700">{formatNum(item.entradas)}</td>
                            <td className="px-3 py-2 text-right font-medium text-red-600">{formatNum(item.salidas)}</td>
                            <td className={`px-3 py-2 text-right font-bold ${badgeColor(item.saldo)} rounded-lg`}>
                              {formatNum(item.saldo)}
                            </td>
                          </tr>
                          {isOpen && item.movimientos && item.movimientos.length > 0 && (
                            <tr>
                              <td colSpan={nivel === 1 ? 6 : nivel === 2 ? 7 : 8} className="bg-emerald-50/70 px-6 py-2">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-gray-500 uppercase">
                                      <th className="px-2 py-1 text-left">Fecha</th>
                                      <th className="px-2 py-1 text-left">Tipo</th>
                                      <th className="px-2 py-1 text-left">N° Documento</th>
                                      <th className="px-2 py-1 text-right">Tallos</th>
                                      <th className="px-2 py-1 text-center">Dirección</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.movimientos.map((m, mi) => (
                                      <tr key={mi} className={mi % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}>
                                        <td className="px-2 py-1 whitespace-nowrap">{m.fecha}</td>
                                        <td className="px-2 py-1">{m.tipoDocumento}</td>
                                        <td className="px-2 py-1 font-medium">{m.numeroDocumento}</td>
                                        <td className="px-2 py-1 text-right">{formatNum(m.tallos)}</td>
                                        <td className="px-2 py-1 text-center">
                                          <span
                                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                              m.direccion === 'entrada'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}
                                          >
                                            {m.direccion === 'entrada' ? 'Entrada' : 'Salida'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tarjetas móvil */}
              <div className="block md:hidden divide-y divide-gray-100">
                {inventarios.map((item, i) => {
                  const key = `${item.idProducto}_${item.idVariedad || 0}_${item.idGrado || 0}`;
                  const isOpen = expandidos[key];
                  return (
                    <div key={key} className={`p-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <div
                        className="flex justify-between items-start cursor-pointer"
                        onClick={() => toggleExpandido(key)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm">{item.producto}</p>
                          <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                            {nivel >= 2 && <span>Var: {item.variedad || 'N/A'}</span>}
                            {nivel >= 3 && <span>Gra: {item.grado || 'N/A'}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${badgeColor(item.saldo)}`}>
                            {formatNum(item.saldo)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="text-center bg-green-50 rounded-lg p-1.5">
                          <p className="text-[10px] text-gray-500">Entradas</p>
                          <p className="text-xs font-bold text-green-700">{formatNum(item.entradas)}</p>
                        </div>
                        <div className="text-center bg-red-50 rounded-lg p-1.5">
                          <p className="text-[10px] text-gray-500">Salidas</p>
                          <p className="text-xs font-bold text-red-600">{formatNum(item.salidas)}</p>
                        </div>
                        <div className="text-center bg-gray-50 rounded-lg p-1.5">
                          <p className="text-[10px] text-gray-500">Saldo</p>
                          <p className={`text-xs font-bold ${item.saldo >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {formatNum(item.saldo)}
                          </p>
                        </div>
                      </div>

                      {isOpen && item.movimientos && item.movimientos.length > 0 && (
                        <div className="mt-3 bg-emerald-50/70 rounded-lg p-3 space-y-1.5">
                          {item.movimientos.map((m, mi) => (
                            <div key={mi} className="flex justify-between items-center text-xs">
                              <div className="flex-1 min-w-0">
                                <span className="text-gray-500">{m.fecha}</span>
                                <span className="ml-2 font-medium">{m.tipoDocumento}</span>
                                <span className="ml-1 text-gray-500">{m.numeroDocumento}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="font-medium">{formatNum(m.tallos)}</span>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  m.direccion === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {m.direccion === 'entrada' ? 'E' : 'S'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Inventario;
