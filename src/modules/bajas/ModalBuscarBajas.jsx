import React, { useState } from 'react';
import { Search, X, Calendar, FileText } from 'lucide-react';

const ModalBuscarBajas = ({ isOpen, onClose, onSelect, bajas, loading }) => {
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  const filtered = bajas.filter((b) => {
    if (filtroNumero && !b.numeroBaja.toLowerCase().includes(filtroNumero.toLowerCase())) return false;
    if (filtroFecha && b.fecha !== filtroFecha) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Buscar Bajas</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Search className="w-3 h-3 inline mr-1" />N° Baja
              </label>
              <input
                type="text"
                value={filtroNumero}
                onChange={(e) => setFiltroNumero(e.target.value)}
                placeholder="Buscar por número..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />Fecha
              </label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No se encontraron bajas</p>
            </div>
          ) : (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-600 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">N° Baja</th>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Motivo</th>
                    <th className="px-3 py-2 text-right">Tallos</th>
                    <th className="px-3 py-2 text-right">Items</th>
                    <th className="px-3 py-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.idBaja} className="border-b border-gray-100 hover:bg-green-50">
                      <td className="px-3 py-2 font-medium text-green-700">{b.numeroBaja}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{b.fecha}</td>
                      <td className="px-3 py-2">{b.motivoGeneral}</td>
                      <td className="px-3 py-2 text-right">{b.totalTallos.toLocaleString('es-CO')}</td>
                      <td className="px-3 py-2 text-right">{b.totalItems}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => onSelect(b)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="block md:hidden space-y-2">
              {filtered.map((b) => (
                <div key={b.idBaja} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-green-700 text-sm">{b.numeroBaja}</span>
                    <button
                      onClick={() => onSelect(b)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded"
                    >
                      Seleccionar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">{b.fecha} - {b.motivoGeneral}</p>
                  <p className="text-xs text-gray-500 mt-1">{b.totalTallos.toLocaleString('es-CO')} tallos · {b.totalItems} item(s)</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalBuscarBajas;
