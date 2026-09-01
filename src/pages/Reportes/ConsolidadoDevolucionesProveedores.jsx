import React, { useState, useMemo } from 'react';
import { BarChart3, Search, Download, RefreshCw, Calendar, FileSpreadsheet, FilterX } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getConsolidadoDevolucionesProveedores } from '../../services/reportes/reportesService';

const ConsolidadoDevolucionesProveedores = () => {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({});

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
    setFiltros({});

    const data = await getConsolidadoDevolucionesProveedores({ fechaInicio, fechaFin });
    if (!data.success) {
      setError(data.message || 'Error al consultar consolidado de devoluciones de proveedores');
    } else {
      setResultado(data);
    }
    setLoading(false);
  };

  const limpiar = () => {
    setResultado(null);
    setError('');
    setFiltros({});
  };

  const limpiarFiltros = () => {
    setFiltros({});
  };

  const formatNum = (n) => new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const formatDevolucion = (n) => `DEV-${String(n || 0).padStart(6, '0')}`;

  const columnas = [
    { key: '#', label: '#' },
    { key: 'Proveedor', label: 'Proveedor' },
    { key: 'Fecha Devolución', label: 'Fecha Devolución' },
    { key: 'N° Devolución', label: 'N° Devolución' },
    { key: 'N° Compra', label: 'N° Compra' },
    { key: 'P.O.', label: 'P.O.' },
    { key: 'Producto', label: 'Producto' },
    { key: 'Variedad', label: 'Variedad' },
    { key: 'Grado', label: 'Grado' },
    { key: 'Unidad Fact.', label: 'Unidad Fact.' },
    { key: 'Tipo Empaque', label: 'Tipo Empaque' },
    { key: 'Tallos Devueltos', label: 'Tallos Devueltos' },
    { key: 'Precio Compra', label: 'Precio Compra' },
    { key: 'Motivo', label: 'Motivo' },
    { key: 'SubTotal', label: 'SubTotal' },
    { key: 'IVA', label: 'IVA' },
    { key: 'Valor IVA', label: 'Valor IVA' },
    { key: 'Total Devolución', label: 'Total Devolución' },
  ];

  const obtenerValor = (r, i, key) => {
    switch (key) {
      case '#': return String(i + 1);
      case 'Proveedor': return r.proveedor;
      case 'Fecha Devolución': return r.fechaDevolucion;
      case 'N° Devolución': return `DEV-${String(r.idDevolucion || 0).padStart(6, '0')}`;
      case 'N° Compra': return String(r.numeroCompra);
      case 'P.O.': return r.po;
      case 'Producto': return r.producto;
      case 'Variedad': return r.variedad || '';
      case 'Grado': return r.grado || '';
      case 'Unidad Fact.': return r.unidadFacturacion;
      case 'Tipo Empaque': return r.tipoEmpaque;
      case 'Tallos Devueltos': return String(r.tallosDevueltos);
      case 'Precio Compra': return String(r.precioCompra);
      case 'Motivo': return r.motivo || '';
      case 'SubTotal': return String(r.subTotal);
      case 'IVA': return r.tieneIVA ? 'Sí' : 'No';
      case 'Valor IVA': return String(r.valorIVA);
      case 'Total Devolución': return String(r.totalDevolucion);
      default: return '';
    }
  };

  const registros = useMemo(() => resultado?.registros || [], [resultado]);
  const totales = resultado?.totales;

  const filtroActivo = Object.values(filtros).some(v => v);

  const registrosFiltrados = useMemo(() => {
    if (!filtroActivo) return registros;
    return registros.filter((r, i) => {
      return Object.entries(filtros).every(([columna, valor]) => {
        if (!valor) return true;
        const val = obtenerValor(r, i, columna);
        return val.toLowerCase().includes(valor.toLowerCase());
      });
    });
  }, [registros, filtros, filtroActivo]);

  const totalesFiltrados = useMemo(() => {
    if (!totales) return null;
    const cantidadRegistros = registrosFiltrados.length;
    const tallosDevueltos = registrosFiltrados.reduce((sum, r) => sum + (Number(r.tallosDevueltos) || 0), 0);
    const subtotal = registrosFiltrados.reduce((sum, r) => sum + (Number(r.subTotal) || 0), 0);
    const valorIVA = registrosFiltrados.reduce((sum, r) => sum + (Number(r.valorIVA) || 0), 0);
    const totalDevolucion = registrosFiltrados.reduce((sum, r) => sum + (Number(r.totalDevolucion) || 0), 0);
    return { cantidadRegistros, tallosDevueltos, subtotal, valorIVA, totalDevolucion };
  }, [registrosFiltrados, totales]);

  const exportarExcel = () => {
    const datos = filtroActivo ? registrosFiltrados : registros;
    if (!datos || datos.length === 0) return;

    const datosExcel = datos.map((r, idx) => ({
      '#': idx + 1,
      Proveedor: r.proveedor,
      'Fecha Devolución': r.fechaDevolucion,
      'N° Devolución': formatDevolucion(r.idDevolucion),
      'N° Compra': r.numeroCompra,
      'P.O.': r.po,
      Producto: r.producto,
      Variedad: r.variedad,
      Grado: r.grado,
      'Unidad Fact.': r.unidadFacturacion,
      'Tipo Empaque': r.tipoEmpaque,
      'Tallos Devueltos': r.tallosDevueltos,
      'Precio Compra': r.precioCompra,
      Motivo: r.motivo,
      SubTotal: r.subTotal,
      'Tiene IVA': r.tieneIVA ? 'Sí' : 'No',
      'Valor IVA': r.valorIVA,
      'Total Devolución': r.totalDevolucion,
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);

    const colWidths = [
      { wch: 5 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
      { wch: 15 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 14 },
      { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 14 },
      { wch: 10 }, { wch: 14 }, { wch: 14 },
    ];
    ws['!cols'] = colWidths;

    const encabezadoStyle = {
      fill: { fgColor: { rgb: '2563EB' } },
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    const headers = Object.keys(datosExcel[0]);
    headers.forEach((header, idx) => {
      const cellRef = XLSX.utils.encode_col(idx) + '1';
      if (ws[cellRef]) ws[cellRef].s = encabezadoStyle;
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Consolidado Dev. Proveedores');
    XLSX.writeFile(wb, `ConsolidadoDevolucionesProveedores_${fechaInicio}_${fechaFin}.xlsx`);
  };

  const thClass = 'px-3 py-3 text-left whitespace-nowrap text-gray-600 uppercase text-xs font-semibold';
  const tdClass = 'px-3 py-2 whitespace-nowrap';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-violet-600 p-2 rounded-lg">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Consolidado de Devoluciones de Proveedores</h1>
          <p className="text-sm text-gray-500">
            Reporte detallado de devoluciones a proveedores por rango de fechas
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />Fecha inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={consultar}
            disabled={loading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Search className="w-4 h-4" />}
            {loading ? 'Consultando...' : 'Consultar'}
          </button>

          {resultado && registros.length > 0 && (
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
          <div className="bg-violet-50 border-b border-violet-200 px-5 py-3 flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="font-semibold text-violet-800 text-sm">Consolidado de Devoluciones de Proveedores</span>
              <span className="text-gray-500 text-xs ml-3">Período: {fechaInicio} — {fechaFin}</span>
            </div>
            <span className="text-sm text-gray-600">{totalesFiltrados?.cantidadRegistros || 0} registro(s)</span>
          </div>

          {(filtroActivo ? registrosFiltrados : registros).length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              {filtroActivo ? 'No hay registros que coincidan con los filtros aplicados.' : 'No hay devoluciones para el período seleccionado.'}
            </div>
          ) : (
            <>
              {totalesFiltrados && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-violet-50/50 border-b border-violet-100">
                  <div className="bg-white rounded-lg p-3 text-center border border-violet-200">
                    <p className="text-xs text-gray-500 uppercase font-medium">Registros</p>
                    <p className="text-lg font-bold text-violet-700">{totalesFiltrados.cantidadRegistros}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-violet-200">
                    <p className="text-xs text-gray-500 uppercase font-medium">Tallos Devueltos</p>
                    <p className="text-lg font-bold text-gray-800">{totalesFiltrados.tallosDevueltos}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-violet-200">
                    <p className="text-xs text-gray-500 uppercase font-medium">SubTotal</p>
                    <p className="text-lg font-bold text-gray-800">{formatNum(totalesFiltrados.subtotal)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-violet-200">
                    <p className="text-xs text-gray-500 uppercase font-medium">Valor IVA</p>
                    <p className="text-lg font-bold text-amber-600">{formatNum(totalesFiltrados.valorIVA)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-violet-200">
                    <p className="text-xs text-gray-500 uppercase font-medium">Total Devolución</p>
                    <p className="text-lg font-bold text-green-700">{formatNum(totalesFiltrados.totalDevolucion)}</p>
                  </div>
                </div>
              )}

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {columnas.map(col => (
                        <th key={col.key} className={thClass}>{col.label}</th>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-200">
                      {columnas.map(col => (
                        <th key={col.key} className="px-1 py-1">
                          <input
                            type="text"
                            value={filtros[col.key] || ''}
                            onChange={e => setFiltros(f => ({ ...f, [col.key]: e.target.value }))}
                            placeholder="..."
                            className="w-full h-6 px-1 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-violet-400"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrosFiltrados.map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className={tdClass + ' text-gray-500'}>{i + 1}</td>
                        <td className={tdClass + ' font-medium text-gray-800'}>{r.proveedor}</td>
                        <td className={tdClass}>{r.fechaDevolucion}</td>
                        <td className={tdClass + ' font-medium text-violet-700'}>{formatDevolucion(r.idDevolucion)}</td>
                        <td className={tdClass}>{r.numeroCompra}</td>
                        <td className={tdClass}>{r.po}</td>
                        <td className={tdClass}>{r.producto}</td>
                        <td className={tdClass + ' text-gray-600'}>{r.variedad || <span className="text-gray-400 italic">N/A</span>}</td>
                        <td className={tdClass + ' text-gray-600'}>{r.grado || <span className="text-gray-400 italic">N/A</span>}</td>
                        <td className={tdClass}>{r.unidadFacturacion}</td>
                        <td className={tdClass}>{r.tipoEmpaque}</td>
                        <td className={tdClass + ' text-right font-medium'}>{r.tallosDevueltos}</td>
                        <td className={tdClass + ' text-right'}>{formatNum(r.precioCompra)}</td>
                        <td className={tdClass + ' text-gray-600'}>{r.motivo || <span className="text-gray-400 italic">N/A</span>}</td>
                        <td className={tdClass + ' text-right'}>{formatNum(r.subTotal)}</td>
                        <td className={tdClass + ' text-center'}>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${r.tieneIVA ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.tieneIVA ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td className={tdClass + ' text-right'}>{formatNum(r.valorIVA)}</td>
                        <td className={tdClass + ' text-right font-bold text-green-700'}>{formatNum(r.totalDevolucion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtroActivo && (
                  <div className="flex justify-end px-3 py-2 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={limpiarFiltros}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <FilterX className="w-3 h-3" />Limpiar filtros
                    </button>
                  </div>
                )}
              </div>

              <div className="block md:hidden divide-y divide-gray-100">
                {registrosFiltrados.map((r, i) => (
                  <div key={i} className={`p-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{r.proveedor}</p>
                        <p className="text-xs text-gray-500">{r.fechaDevolucion} | {formatDevolucion(r.idDevolucion)}</p>
                      </div>
                      <span className="text-sm font-bold text-green-700 flex-shrink-0 ml-2">{formatNum(r.totalDevolucion)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span>Compra: <strong>{r.numeroCompra}</strong></span>
                      <span>PO: <strong>{r.po}</strong></span>
                      <span>Producto: <strong>{r.producto}</strong></span>
                      <span>Variedad: <strong>{r.variedad || 'N/A'}</strong></span>
                      <span>Grado: <strong>{r.grado || 'N/A'}</strong></span>
                      <span>Empaque: <strong>{r.tipoEmpaque}</strong></span>
                      <span>Tallos Dev: <strong>{r.tallosDevueltos}</strong></span>
                      <span>Precio: <strong>{formatNum(r.precioCompra)}</strong></span>
                      <span>Motivo: <strong>{r.motivo || 'N/A'}</strong></span>
                      <span>SubTotal: <strong>{formatNum(r.subTotal)}</strong></span>
                      <span>IVA: <strong className={r.tieneIVA ? 'text-green-600' : 'text-gray-400'}>{r.tieneIVA ? 'Sí' : 'No'}</strong></span>
                      <span>Valor IVA: <strong>{formatNum(r.valorIVA)}</strong></span>
                    </div>
                  </div>
                ))}
                {filtroActivo && (
                  <div className="p-3 bg-gray-50 flex justify-center">
                    <button
                      onClick={limpiarFiltros}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <FilterX className="w-3 h-3" />Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsolidadoDevolucionesProveedores;
