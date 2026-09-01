import React from 'react';

export default function DevolucionComisionHeader({ header, setHeader, datosSelect, facturas, onFacturaChange, totales }) {
  const handleChange = (field, value) => {
    setHeader(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* N° Devolución */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">N° Devolución</label>
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl px-4 py-2.5 text-violet-800 font-bold">
          {header.numeroDevolucion || "DEV-000000"}
        </div>
      </div>

      {/* Fecha Devolución */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Fecha Devolución <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={header.fechaDevolucion}
          onChange={e => handleChange('fechaDevolucion', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
        />
      </div>

      {/* Cliente */}
      <div className="lg:col-span-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Cliente <span className="text-red-500">*</span>
        </label>
        <select
          value={header.cliente}
          onChange={e => handleChange('cliente', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white text-sm"
        >
          <option value="">Seleccione un cliente</option>
          {(datosSelect.clientes || []).map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Factura */}
      <div className="lg:col-span-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Factura / Pedido <span className="text-red-500">*</span>
        </label>
        <select
          value={header.factura}
          onChange={e => onFacturaChange(e.target.value)}
          disabled={!header.cliente}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">{header.cliente ? "Seleccione una factura" : "Primero seleccione un cliente"}</option>
          {(facturas || []).map(f => (
            <option key={f.idFactura} value={f.idFactura}>
              {f.numeroFactura || f.numeroPedido || `ID: ${f.idFactura}`}
              {f.tieneDevolucion ? ' (Dev: ' + f.numeroDevolucion + ')' : ''}
              {f.fecha ? ` - ${f.fecha}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Moneda y TRM */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Moneda</label>
        <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-700 border border-gray-200">
          {header.moneda || "-"}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TRM</label>
        <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-700 border border-gray-200">
          {header.trm || "-"}
        </div>
      </div>

      {/* Observaciones */}
      <div className="lg:col-span-4">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Observaciones</label>
        <textarea
          value={header.observaciones}
          onChange={e => handleChange('observaciones', e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm resize-none"
          placeholder="Observaciones de la devolución..."
        />
      </div>

      {/* Totales */}
      <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
        <div className="bg-violet-50 rounded-xl p-3 border border-violet-200">
          <p className="text-xs text-violet-600 font-semibold uppercase">Productos con devolución</p>
          <p className="text-lg font-bold text-violet-900">{totales.totalProductos}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <p className="text-xs text-blue-600 font-semibold uppercase">Total Tallos Devueltos</p>
          <p className="text-lg font-bold text-blue-900">{totales.totalTallos}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
          <p className="text-xs text-amber-600 font-semibold uppercase">Valor Devolución</p>
          <p className="text-lg font-bold text-amber-900">${totales.valorDevolucion.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  );
}
