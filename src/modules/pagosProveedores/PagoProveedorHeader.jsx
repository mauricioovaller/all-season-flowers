// src/modules/pagosProveedores/PagoProveedorHeader.jsx
import React from "react";

const PagoProveedorHeader = ({
  header,
  onChange,
  proveedores,
  mediosPago,
  monedas,
  comprasSeleccionadas = [],
  onAbrirModalCompras,
  onProveedorChange,
  inputRefs
}) => {
  const handleChange = (field, value) => {
    onChange(field, value);
    if (field === "idProveedor") {
      onProveedorChange();
    }
  };

  const totalPago = comprasSeleccionadas.reduce(
    (sum, c) => sum + (parseFloat(c.valorPago) || 0),
    0
  );

  return (
    <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Pago</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Número de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Pago
          </label>
          <input
            type="text"
            value={header.numeroPago}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
          />
        </div>

        {/* Fecha de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Pago *
          </label>
          <input
            ref={inputRefs?.fecha}
            type="date"
            value={header.fecha}
            onChange={(e) => handleChange("fecha", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Proveedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proveedor *
          </label>
          <select
            ref={inputRefs?.idProveedor}
            value={header.idProveedor}
            onChange={(e) => handleChange("idProveedor", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccionar proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Moneda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Moneda *
          </label>
          <select
            value={header.idMoneda}
            onChange={(e) => handleChange("idMoneda", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccionar moneda</option>
            {monedas?.map((moneda) => (
              <option key={moneda.id} value={moneda.id}>
                {moneda.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* TRM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            TRM *
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={header.trm}
            onChange={(e) => handleChange("trm", parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <div className="mt-1 text-xs text-gray-500">
            Tasa de cambio de referencia
          </div>
        </div>

        {/* Medio de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medio de Pago *
          </label>
          <select
            ref={inputRefs?.idMedioPago}
            value={header.idMedioPago}
            onChange={(e) => handleChange("idMedioPago", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccionar medio de pago</option>
            {mediosPago.map((medio) => (
              <option key={medio.id} value={medio.id}>
                {medio.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Costo de Transferencia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Costo de Transferencia
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={header.costoTransferencia}
            onChange={(e) => handleChange("costoTransferencia", parseFloat(e.target.value) || 0)}
            disabled={
              !header.idMedioPago ||
              !mediosPago.find(mp => mp.id == header.idMedioPago)?.nombre?.toLowerCase().includes("transferencia")
            }
            className={`w-full px-3 py-2 border rounded-lg ${
              !header.idMedioPago ||
              !mediosPago.find(mp => mp.id == header.idMedioPago)?.nombre?.toLowerCase().includes("transferencia")
                ? "bg-gray-100 text-gray-500 border-gray-300"
                : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
          <div className="mt-1 text-xs text-gray-500">
            Solo aplica para transferencias
          </div>
        </div>

        {/* Compras incluidas en el pago */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Compras incluidas en el pago
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onAbrirModalCompras}
              disabled={!header.idProveedor}
              className={`px-4 py-2 rounded-md transition flex items-center gap-2 ${
                !header.idProveedor
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {comprasSeleccionadas.length > 0 ? "Editar compras" : "Seleccionar compras"}
            </button>
            <div className="flex-1">
              {comprasSeleccionadas.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {header.idProveedor
                    ? "No hay compras seleccionadas"
                    : "Seleccione un proveedor primero"}
                </p>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {comprasSeleccionadas.length} compra(s) seleccionada(s)
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: {totalPago.toLocaleString("es-CO", { minimumFractionDigits: 2 })} {header.moneda}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Valor total del pago
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {totalPago.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
        <textarea
          value={header.observaciones}
          onChange={(e) => handleChange("observaciones", e.target.value)}
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Observaciones adicionales sobre el pago..."
        />
      </div>
    </div>
  );
};

export default PagoProveedorHeader;
