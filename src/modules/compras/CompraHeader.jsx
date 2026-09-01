// src/modules/compras/CompraHeader.jsx
import React, { useState } from "react";

export default function CompraHeader({
  header,
  onChange,
  proveedores = [],
  compradores = [],
  monedas = [],
  tiposCompra = [],
  inputRefs = {},
}) {

  const [showTotales, setShowTotales] = useState(true);
  const esUSD = header.monedaNombre && /d[oó]lar/i.test(header.monedaNombre);
  const dec = esUSD ? 3 : 2;

  return (
    <section className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base md:text-lg font-semibold text-slate-700">Encabezado de Compra</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTotales(!showTotales)}
            className="text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          >
            {showTotales ? "Ocultar Totales" : "Mostrar Totales"}
          </button>
        </div>
      </div>

      {/* PRIMERA FILA - Campos básicos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {/* Número Compra */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">No. Compra</label>
          <div className="border rounded p-1.5 bg-gray-50 text-xs font-medium text-gray-900 truncate">
            {header.noCompra || "COMP-000000"}
          </div>
        </div>

        {/* Tipo de Compra */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Tipo Compra *</label>
          <select
            value={header.tipoCompra || ""}
            onChange={(e) => onChange("tipoCompra", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
          >
            <option value="">-- Seleccione --</option>
            {tiposCompra.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Proveedor */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Proveedor *</label>
          <select
            ref={inputRefs.proveedor}
            value={header.proveedor || ""}
            onChange={(e) => onChange("proveedor", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
          >
            <option value="">-- Seleccione --</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Estado</label>
          <div className="border rounded p-1.5 bg-gray-50 text-xs font-medium text-gray-900">
            {header.noCompra !== "COMP-000000" ? 
              (header.anulado ? "Anulada" : "Activa") : 
              "Sin guardar"}
          </div>
        </div>
      </div>

      {/* SEGUNDA FILA - Más campos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {/* Comprador */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Comprador *</label>
          <select
            ref={inputRefs.comprador}
            value={header.comprador || ""}
            onChange={(e) => onChange("comprador", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
          >
            <option value="">-- Seleccione --</option>
            {compradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha Solicitud */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">F. Solicitud *</label>
          <input
            ref={inputRefs.fechaSolicitud}
            type="date"
            value={header.fechaSolicitud || ""}
            onChange={(e) => onChange("fechaSolicitud", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
          />
        </div>

        {/* Fecha Entrega */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">F. Entrega *</label>
          <input
            ref={inputRefs.fechaEntrega}
            type="date"
            value={header.fechaEntrega || ""}
            onChange={(e) => onChange("fechaEntrega", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
          />
        </div>

        {/* Moneda */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Moneda *</label>
          <select
            ref={inputRefs.moneda}
            value={header.moneda || ""}
            onChange={(e) => onChange("moneda", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
          >
            <option value="">-- Seleccione --</option>
            {monedas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TERCERA FILA - TRM, PO Proveedor */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {/* TRM */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">TRM *</label>
          <input
            ref={inputRefs.trm}
            type="number"
            step="0.01"
            value={header.trm || ""}
            onChange={(e) => onChange("trm", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            placeholder="Tasa de cambio"
          />
        </div>

        {/* PO Proveedor */}
        <div className="space-y-1 md:col-span-2">
          <label className="block text-xs font-medium text-gray-700">PO Proveedor</label>
          <input
            value={header.poProveedor || ""}
            onChange={(e) => onChange("poProveedor", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            placeholder="Purchase Order del proveedor"
          />
        </div>

        {/* Anulado */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Anulado</label>
          <div className={`border rounded p-1.5 text-xs font-medium text-center ${header.anulado ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {header.anulado ? "SÍ" : "NO"}
          </div>
        </div>
      </div>

      {/* CUARTA FILA - Observaciones */}
      <div className="mb-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Observaciones</label>
          <textarea
            value={header.observaciones || ""}
            onChange={(e) => onChange("observaciones", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            rows={2}
            placeholder="Observaciones sobre la compra..."
          />
        </div>
      </div>

      {/* TOTALES (Siempre visibles pero compactos) */}
      {showTotales && (
        <div className="space-y-2">
          {/* Indicadores */}
          <div className="grid grid-cols-3 gap-1 p-2 bg-gray-50 rounded border">
            <div className="text-center">
              <div className="text-xs text-gray-600">Orden Compra</div>
              <div className="text-sm font-bold">{header.noCompra !== "COMP-000000" ? "Disponible" : "Pendiente"}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Tipo</div>
              <div className="text-sm font-bold">{header.tipoCompra || "REGULAR"}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Proveedor</div>
              <div className="text-sm font-bold">
                {proveedores.find(p => p.id === header.proveedor)?.nombre?.substring(0, 15) || "Sin seleccionar"}
              </div>
            </div>
          </div>

          {/* Totales de compra */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 p-2 bg-blue-50 rounded border">
            <div className="text-center">
              <div className="text-xs text-gray-600">Piezas</div>
              <div className="text-sm font-bold">{header.totalPiezas || "0"}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Fulles</div>
              <div className="text-sm font-bold">{header.equivalenciaFulles || "0"}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Tallos</div>
              <div className="text-sm font-bold">{header.totalTallos || "0"}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Valor Compra</div>
              <div className="text-sm font-bold text-green-600">
                ${header.valorCompra ? Number(header.valorCompra).toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : "0"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">IVA (19%)</div>
              <div className="text-sm font-bold">
                ${header.iva ? Number(header.iva).toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : "0"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Compra</div>
              <div className="text-sm font-bold text-green-600">
                ${header.totalCompra ? Number(header.totalCompra).toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : "0"}
              </div>
            </div>
          </div>

          {/* Checkbox IVA */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
            <input
              type="checkbox"
              checked={header.tieneIVA || false}
              onChange={(e) => onChange("tieneIVA", e.target.checked)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              id="tieneIVA"
            />
            <label htmlFor="tieneIVA" className="text-xs font-medium text-gray-700">
              Aplicar IVA (19%)
            </label>
          </div>
        </div>
      )}

      {/* Botón para mostrar/ocultar totales si está oculto */}
      {!showTotales && (
        <button
          onClick={() => setShowTotales(true)}
          className="w-full text-center text-xs text-blue-600 hover:text-blue-800 py-1 border-t mt-2"
        >
          + Mostrar totales de compra
        </button>
      )}

      {/* Nota de ayuda */}
      <div className="mt-2 text-xs text-gray-500">
        <p>💡 <strong>Tip:</strong> Los campos marcados con * son obligatorios para guardar la compra.</p>
      </div>
    </section>
  );
}