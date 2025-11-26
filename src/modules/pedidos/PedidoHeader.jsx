import React from "react";

export default function PedidoHeader({
  header,
  onChange,
  clientes = [],
  ejecutivos = [],
  monedas = [],
  aerolineas = [],
  agencias = [],
  inputRefs = {},
}) {
  
  // Datos mock temporales - luego vendrán de la base de datos
  const puertosSalida = [
    { value: "Bogota", label: "Bogotá" },
    { value: "Medellin", label: "Medellín" },
    { value: "Buenaventura", label: "Buenaventura" }
  ];

  return (
    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-700">Encabezado del Pedido</h3>

      {/* PRIMERA FILA - 4 campos básicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Número Pedido (readonly) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">No. Pedido</label>
          <div className="border rounded-lg p-2 bg-gray-50 text-sm font-medium text-gray-900">
            {header.noPedido || "PED-000000"}
          </div>
        </div>

        {/* Cliente */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Cliente *</label>
          <select
            ref={inputRefs.cliente}
            value={header.cliente || ""}
            onChange={(e) => onChange("cliente", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Ejecutivo */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Ejecutivo *</label>
          <select
            ref={inputRefs.ejecutivo}
            value={header.ejecutivo || ""}
            onChange={(e) => onChange("ejecutivo", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {ejecutivos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* PO Code */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">PO - Code</label>
          <input
            ref={inputRefs.poCodeEncab}
            value={header.poCodeEncab || ""}
            onChange={(e) => onChange("poCodeEncab", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Ingrese PO Code"
          />
        </div>
      </div>

      {/* SEGUNDA FILA - 4 campos de fechas y moneda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Fecha Solicitud */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Fecha Solicitud *</label>
          <input
            ref={inputRefs.fechaSolicitud}
            type="date"
            value={header.fechaSolicitud || ""}
            onChange={(e) => onChange("fechaSolicitud", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Fecha Entrega */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Fecha Entrega *</label>
          <input
            ref={inputRefs.fechaEntrega}
            type="date"
            value={header.fechaEntrega || ""}
            onChange={(e) => onChange("fechaEntrega", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Moneda */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Moneda</label>
          <select
            ref={inputRefs.moneda}
            value={header.moneda || ""}
            onChange={(e) => onChange("moneda", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {monedas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* TRM */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">TRM</label>
          <input
            ref={inputRefs.trm}
            type="number"
            step="0.01"
            value={header.trm || ""}
            onChange={(e) => onChange("trm", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Tasa de cambio"
          />
        </div>
      </div>

      {/* TERCERA FILA - 5 campos de logística */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        {/* Guía Master */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Guía Master</label>
          <input
            ref={inputRefs.guiaMaster}
            value={header.guiaMaster || ""}
            onChange={(e) => onChange("guiaMaster", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Guía master"
          />
        </div>

        {/* Guía Hija */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Guía Hija</label>
          <input
            ref={inputRefs.guiaHija}
            value={header.guiaHija || ""}
            onChange={(e) => onChange("guiaHija", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Guía hija"
          />
        </div>

        {/* Guía Nieta */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Guía Nieta</label>
          <input
            ref={inputRefs.guiaNieta}
            value={header.guiaNieta || ""}
            onChange={(e) => onChange("guiaNieta", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Guía nieta"
          />
        </div>

        {/* Aerolínea */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Aerolínea</label>
          <select
            ref={inputRefs.aerolinea}
            value={header.aerolinea || ""}
            onChange={(e) => onChange("aerolinea", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {aerolineas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Agencia */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Agencia</label>
          <select
            ref={inputRefs.agencia}
            value={header.agencia || ""}
            onChange={(e) => onChange("agencia", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {agencias.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CUARTA FILA - 2 campos adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Puerto Salida */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Puerto Salida</label>
          <select
            ref={inputRefs.puertoSalida}
            value={header.puertoSalida || ""}
            onChange={(e) => onChange("puertoSalida", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {puertosSalida.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Estado Pedido (readonly) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <div className="border rounded-lg p-2 bg-gray-50 text-sm font-medium text-gray-900">
            {header.estadoPedido || "Pendiente"}
          </div>
        </div>
      </div>

      {/* QUINTA FILA - Indicadores (readonly) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">No. Invoice</div>
          <div className="text-lg font-bold text-gray-900">{header.noInvoice || "0"}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">No. Etiqueta</div>
          <div className="text-lg font-bold text-gray-900">{header.noEtiqueta || "0"}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">No. Planilla</div>
          <div className="text-lg font-bold text-gray-900">{header.noPlanilla || "0"}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">No. Fito</div>
          <div className="text-lg font-bold text-gray-900">{header.noFito || "0"}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Tiene IVA</div>
          <div className="text-lg font-bold text-gray-900">
            <input
              type="checkbox"
              checked={header.tieneIVA || false}
              onChange={(e) => onChange("tieneIVA", e.target.checked)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* SEXTA FILA - Resumen de ventas (readonly) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4 p-4 bg-blue-50 rounded-lg border">
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Total Piezas</div>
          <div className="text-lg font-bold text-gray-900">{header.totalPiezas || "0"}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Equiv. Fulles</div>
          <div className="text-lg font-bold text-gray-900">{header.equivalenciaFulles || "0"}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Total Tallos</div>
          <div className="text-lg font-bold text-gray-900">{header.totalTallos || "0"}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Valor Venta</div>
          <div className="text-lg font-bold text-green-600">
            ${header.valorVenta ? Number(header.valorVenta).toLocaleString() : "0"}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">IVA (19%)</div>
          <div className="text-lg font-bold text-gray-900">
            ${header.iva ? Number(header.iva).toLocaleString() : "0"}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Total Venta</div>
          <div className="text-lg font-bold text-green-600">
            ${header.totalVenta ? Number(header.totalVenta).toLocaleString() : "0"}
          </div>
        </div>
      </div>

      {/* Observaciones - full width */}
      <div className="mt-6 space-y-1">
        <label className="block text-sm font-medium text-gray-700">Observaciones</label>
        <textarea
          value={header.observaciones || ""}
          onChange={(e) => onChange("observaciones", e.target.value)}
          className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          rows={3}
          placeholder="Observaciones adicionales..."
        />
      </div>
    </section>
  );
}