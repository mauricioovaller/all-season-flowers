// src/pages/Reportes/ConsolidadoIngresosRecibidos.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Search, RefreshCw, Calendar, FileSpreadsheet, FilterX, User, CreditCard } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getIngresosRecibidos } from '../../services/reportes/reportesService';
import { getClientes } from '../../services/clientes/clientesService';
import { getMediosPago } from '../../services/pagosClientes/pagosClientesService';

const ConsolidadoIngresosRecibidos = () => {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [idCliente, setIdCliente] = useState('');
  const [idMedioPago, setIdMedioPago] = useState('');
  const [clientes, setClientes] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({});

  // Cargar clientes y medios de pago al montar
  useEffect(() => {
    const cargar = async () => {
      setLoadingClientes(true);
      const [clientesRes, mediosRes] = await Promise.all([
        getClientes({ estado: 'activos' }),
        getMediosPago(),
      ]);
      if (clientesRes.success && clientesRes.clientes) {
        setClientes(clientesRes.clientes);
      }
      if (mediosRes.success && mediosRes.mediosPago) {
        setMediosPago(mediosRes.mediosPago);
      }
      setLoadingClientes(false);
    };
    cargar();
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
    setFiltros({});

    const data = await getIngresosRecibidos({
      fechaInicio,
      fechaFin,
      idCliente: idCliente ? parseInt(idCliente) : 0,
      idMedioPago: idMedioPago ? parseInt(idMedioPago) : 0,
    });
    if (!data.success) {
      setError(data.message || 'Error al consultar ingresos recibidos');
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

  const columnas = [
    { key: '#', label: '#' },
    { key: 'N° Pago', label: 'N° Pago' },
    { key: 'Fecha', label: 'Fecha' },
    { key: 'Cliente', label: 'Cliente' },
    { key: 'Medio Pago', label: 'Medio Pago' },
    { key: 'N° Factura', label: 'N° Factura' },
    { key: 'Moneda', label: 'Moneda' },
    { key: 'Valor Pagado', label: 'Valor Pagado' },
    { key: 'Costo Transferencia', label: 'Costo Transferencia' },
    { key: 'Neto Recibido', label: 'Neto Recibido' },
  ];

  const obtenerValor = (r, i, key) => {
    switch (key) {
      case '#': return String(i + 1);
      case 'N° Pago': return r.numeroPago;
      case 'Fecha': return r.fecha;
      case 'Cliente': return r.cliente;
      case 'Medio Pago': return r.medioPago || '';
      case 'N° Factura': return String(r.numeroFactura);
      case 'Moneda': return r.monedaCorta;
      case 'Valor Pagado': return String(r.valorPago);
      case 'Costo Transferencia': return String(r.costoTransferencia);
      case 'Neto Recibido': return String(r.netoRecibido);
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

  // Orden de monedas para mostrar (USD, COP, resto)
  const monedasOrden = useMemo(() => {
    const claves = Object.keys(totales?.porMoneda || {});
    const peso = { USD: 0, COP: 1 };
    return claves.sort((a, b) => (peso[a] ?? 2) - (peso[b] ?? 2));
  }, [totales]);

  const exportarExcel = () => {
    const datos = filtroActivo ? registrosFiltrados : registros;
    if (!datos || datos.length === 0) return;

    const datosExcel = datos.map((r, idx) => ({
      '#': idx + 1,
      'N° Pago': r.numeroPago,
      Fecha: r.fecha,
      Cliente: r.cliente,
      'Medio Pago': r.medioPago || '',
      'N° Factura': r.numeroFactura,
      Moneda: r.monedaCorta,
      'Valor Pagado': r.valorPago,
      'Costo Transferencia': r.costoTransferencia,
      'Neto Recibido': r.netoRecibido,
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);

    const colWidths = [
      { wch: 5 }, { wch: 16 }, { wch: 12 }, { wch: 32 }, { wch: 18 },
      { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
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

    // Hoja de totales por moneda
    if (totales && Object.keys(totales.porMoneda || {}).length > 0) {
      const totalesExcel = monedasOrden.map(mon => ({
        Moneda: mon,
        'Valor Pagado': totales.porMoneda[mon].valorPago,
        'Costo Transferencia': totales.porMoneda[mon].costoTransferencia,
        'Neto Recibido': totales.porMoneda[mon].netoRecibido,
        'Cant. Facturas': totales.porMoneda[mon].cantidad,
      }));
      const wsTotales = XLSX.utils.json_to_sheet(totalesExcel);
      wsTotales['!cols'] = [{ wch: 10 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ingresos Recibidos');
      XLSX.utils.book_append_sheet(wb, wsTotales, 'Totales por Moneda');
      XLSX.writeFile(wb, `ConsolidadoIngresosRecibidos_${fechaInicio}_${fechaFin}.xlsx`);
      return;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ingresos Recibidos');
    XLSX.writeFile(wb, `ConsolidadoIngresosRecibidos_${fechaInicio}_${fechaFin}.xlsx`);
  };

  const thClass = 'px-3 py-3 text-left whitespace-nowrap text-gray-600 uppercase text-xs font-semibold';
  const tdClass = 'px-3 py-2 whitespace-nowrap';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Consolidado de Ingresos Recibidos</h1>
          <p className="text-sm text-gray-500">
            Pagos de clientes por rango de fechas — neto recibido (valor pagado − costo de transferencia)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />Fecha inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />Cliente (opcional)
            </label>
            <select
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingClientes}
            >
              <option value="">{loadingClientes ? 'Cargando clientes...' : '-- Todos los clientes --'}</option>
              {clientes.map(c => (
                <option key={c.IdCliente} value={c.IdCliente}>{c.NOMBRE}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CreditCard className="w-4 h-4 inline mr-1" />Medio de pago (opcional)
            </label>
            <select
              value={idMedioPago}
              onChange={(e) => setIdMedioPago(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingClientes}
            >
              <option value="">-- Todos los medios --</option>
              {mediosPago.map(mp => (
                <option key={mp.id} value={mp.id}>{mp.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={consultar}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
          <div className="bg-blue-50 border-b border-blue-200 px-5 py-3 flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="font-semibold text-blue-800 text-sm">Ingresos Recibidos</span>
              <span className="text-gray-500 text-xs ml-3">Período: {fechaInicio} — {fechaFin}</span>
            </div>
            <span className="text-sm text-gray-600">
              {totales?.cantidadPagos || 0} pago(s) · {registros.length} factura(s)
            </span>
          </div>

          {(filtroActivo ? registrosFiltrados : registros).length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              {filtroActivo ? 'No hay registros que coincidan con los filtros aplicados.' : 'No hay ingresos para el período seleccionado.'}
            </div>
          ) : (
            <>
              {/* Totales por moneda */}
              {totales && monedasOrden.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-blue-50/50 border-b border-blue-100">
                  {monedasOrden.map(mon => (
                    <div key={mon} className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-500 uppercase font-medium">Totales — {mon}</p>
                      <div className="flex justify-between items-center mt-1 text-sm">
                        <span className="text-gray-500">Valor Pagado</span>
                        <span className="font-semibold text-gray-800">{formatNum(totales.porMoneda[mon].valorPago)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5 text-sm">
                        <span className="text-gray-500">Costo Transferencia</span>
                        <span className="font-semibold text-orange-600">− {formatNum(totales.porMoneda[mon].costoTransferencia)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-100 text-sm">
                        <span className="font-medium text-gray-700">Neto Recibido</span>
                        <span className="font-bold text-green-700">{formatNum(totales.porMoneda[mon].netoRecibido)}</span>
                      </div>
                    </div>
                  ))}
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
                            className="w-full h-6 px-1 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrosFiltrados.map((r, i) => (
                      <tr key={`${r.idPago}-${r.numeroFactura}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className={tdClass + ' text-gray-500'}>{i + 1}</td>
                        <td className={tdClass + ' font-medium text-gray-800'}>{r.numeroPago}</td>
                        <td className={tdClass}>{r.fecha}</td>
                        <td className={tdClass}>{r.cliente}</td>
                        <td className={tdClass}>{r.medioPago}</td>
                        <td className={tdClass + ' font-medium'}>{r.numeroFactura}</td>
                        <td className={tdClass}>
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">{r.monedaCorta}</span>
                        </td>
                        <td className={tdClass + ' text-right'}>{formatNum(r.valorPago)}</td>
                        <td className={tdClass + ' text-right text-orange-600'}>
                          {r.costoTransferencia > 0 ? `− ${formatNum(r.costoTransferencia)}` : '0.00'}
                        </td>
                        <td className={tdClass + ' text-right font-bold text-green-700'}>{formatNum(r.netoRecibido)}</td>
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
                  <div key={`${r.idPago}-${r.numeroFactura}-${i}`} className={`p-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{r.cliente}</p>
                        <p className="text-xs text-gray-500">{r.numeroPago} | {r.fecha} | Fact #{r.numeroFactura}</p>
                      </div>
                      <span className="text-sm font-bold text-green-700 flex-shrink-0 ml-2">{formatNum(r.netoRecibido)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span>Medio: <strong>{r.medioPago || 'N/A'}</strong></span>
                      <span>Moneda: <strong>{r.monedaCorta}</strong></span>
                      <span>Valor Pagado: <strong>{formatNum(r.valorPago)}</strong></span>
                      <span>Costo Transf.: <strong className={r.costoTransferencia > 0 ? 'text-orange-600' : ''}>{formatNum(r.costoTransferencia)}</strong></span>
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

export default ConsolidadoIngresosRecibidos;
