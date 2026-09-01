import React from 'react';

export default function PedidoComisionHeader({ header, setHeader, datosSelect, calculos, numeroPedido }) {
  const handleChange = (field, value) => {
    setHeader(prev => ({ ...prev, [field]: value }));
  };

  const c = calculos.current;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Número de Pedido */}
      <div className="lg:col-span-3">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          N° Pedido
        </label>
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl px-4 py-3 text-violet-800 font-bold text-lg">
          {numeroPedido || "PEC-000000"}
        </div>
      </div>

      {/* Cliente */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Cliente <span className="text-red-500">*</span>
        </label>
        <select
          value={header.idCliente}
          onChange={e => handleChange('idCliente', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white text-sm"
        >
          <option value="">Seleccione un cliente</option>
          {(datosSelect.clientes || []).map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Ejecutivo */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ejecutivo</label>
        <select
          value={header.idEjecutivo}
          onChange={e => handleChange('idEjecutivo', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white text-sm"
        >
          <option value="">Seleccione un ejecutivo</option>
          {(datosSelect.ejecutivos || []).map(e => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
      </div>

      {/* Estado */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Estado</label>
        <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${header.estado === 'Anulado' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
          {header.estado || "Activo"}
        </div>
      </div>

      {/* Fecha Solicitud */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Fecha Solicitud <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={header.fechaSolicitud}
          onChange={e => handleChange('fechaSolicitud', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
        />
      </div>

      {/* Fecha Entrega */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Fecha Entrega <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={header.fechaEntrega}
          onChange={e => handleChange('fechaEntrega', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
        />
      </div>

      {/* Moneda */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Moneda <span className="text-red-500">*</span>
        </label>
        <select
          value={header.idMoneda}
          onChange={e => handleChange('idMoneda', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white text-sm"
        >
          <option value="">Seleccione moneda</option>
          {(datosSelect.monedas || []).map(m => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
      </div>

      {/* TRM */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          TRM <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          value={header.trm}
          onChange={e => handleChange('trm', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
          placeholder="0.00"
        />
      </div>

      {/* PO Cliente */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">PO Cliente</label>
        <input
          type="text"
          value={header.poCliente}
          onChange={e => handleChange('poCliente', e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
          placeholder="N° orden de compra del cliente"
        />
      </div>

      {/* Porcentaje Comisión Global */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          % Comisión Global
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={header.porcentajeComision}
            onChange={e => handleChange('porcentajeComision', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm pr-8"
            placeholder="0.00"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Este % se replica a cada ítem. Puede ajustarse individualmente.</p>
      </div>

      {/* IVA */}
      <div className="flex items-end pb-2.5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={header.iva}
            onChange={e => handleChange('iva', e.target.checked)}
            className="w-5 h-5 rounded-lg border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Aplicar IVA (19%)</span>
            <p className="text-xs text-gray-400">Calcula automáticamente el IVA</p>
          </div>
        </label>
      </div>

      {/* Observaciones */}
      <div className="lg:col-span-3">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Observaciones</label>
        <textarea
          value={header.observaciones}
          onChange={e => handleChange('observaciones', e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm resize-none"
          placeholder="Notas u observaciones del pedido..."
        />
      </div>

      {/* Totales */}
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-2">
        <div className="bg-violet-50 rounded-xl p-3 border border-violet-200">
          <p className="text-xs text-violet-600 font-semibold uppercase">Piezas</p>
          <p className="text-lg font-bold text-violet-900">{c.totalPiezas}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <p className="text-xs text-blue-600 font-semibold uppercase">Fulles</p>
          <p className="text-lg font-bold text-blue-900">{c.totalFulles}</p>
        </div>
        <div className="bg-teal-50 rounded-xl p-3 border border-teal-200">
          <p className="text-xs text-teal-600 font-semibold uppercase">Tallos</p>
          <p className="text-lg font-bold text-teal-900">{c.totalTallos}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
          <p className="text-xs text-amber-600 font-semibold uppercase">Valor Total</p>
          <p className="text-lg font-bold text-amber-900">${c.valorTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
          <p className="text-xs text-emerald-600 font-semibold uppercase">Comisión</p>
          <p className="text-lg font-bold text-emerald-900">${c.totalComision.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className={header.iva ? 'bg-purple-50 rounded-xl p-3 border border-purple-200' : 'bg-gray-50 rounded-xl p-3 border border-gray-200'}>
          <p className="text-xs text-purple-600 font-semibold uppercase">Total + IVA</p>
          <p className="text-lg font-bold text-purple-900">${c.totalConIva.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  );
}
