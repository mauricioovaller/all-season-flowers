import React, { useState, useEffect } from 'react';
import { Search, X, FileText, Undo2 } from 'lucide-react';
import { buscarDevoluciones } from '../../../services/ventasComision/devolucionesComisionService';

export default function ModalBuscarDevolucionesComision({ onClose, onSelect }) {
  const [filtros, setFiltros] = useState({ numero: '', cliente: '', fechaInicio: '', fechaFin: '', pagina: 1 });
  const [resultados, setResultados] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const itemsPerPage = 10;

  const handleBuscar = async (pagina = 1) => {
    setCargando(true);
    const data = await buscarDevoluciones({ ...filtros, pagina, itemsPorPagina: itemsPerPage });
    if (data.success) {
      setResultados(data.devoluciones || []);
      setTotal(data.total || 0);
    } else {
      setResultados([]);
      setTotal(0);
    }
    setCargando(false);
  };

  useEffect(() => { handleBuscar(1); }, []);

  const totalPaginas = Math.ceil(total / itemsPerPage);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-violet-700 to-purple-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">Buscar Devoluciones</h3>
              <p className="text-purple-200 text-sm">Busque una devolución para editarla</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">N° Devolución</label>
              <input type="text" value={filtros.numero}
                onChange={e => setFiltros(prev => ({ ...prev, numero: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm"
                placeholder="DEV-000001" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cliente</label>
              <input type="text" value={filtros.cliente}
                onChange={e => setFiltros(prev => ({ ...prev, cliente: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm"
                placeholder="Nombre del cliente" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fecha Inicio</label>
              <input type="date" value={filtros.fechaInicio}
                onChange={e => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fecha Fin</label>
              <input type="date" value={filtros.fechaFin}
                onChange={e => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm" />
            </div>
          </div>
          <button onClick={() => handleBuscar(1)}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all text-sm font-medium shadow-md shadow-violet-600/20">
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>

        {/* Resultados */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
            </div>
          ) : resultados.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Undo2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No se encontraron devoluciones</p>
            </div>
          ) : (
            <div className="space-y-2">
              {resultados.map(r => (
                <div key={r.idDevolucion || r.idFactura} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-violet-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <Undo2 className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{r.numeroDevolucion || `DEV-${r.idDevolucion}`}</p>
                      <p className="text-xs text-gray-500">{r.cliente || 'Sin cliente'}</p>
                      {r.fechaDevolucion && <p className="text-xs text-gray-400">{r.fechaDevolucion}</p>}
                    </div>
                  </div>
                  <button onClick={() => onSelect(r)}
                    className="px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-xs font-medium transition-colors">
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="px-6 pb-4 flex items-center justify-between text-sm">
            <p className="text-gray-500">Total: {total} devoluciones</p>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => handleBuscar(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${filtros.pagina === p ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
