import React, { useState } from "react"; // <-- Añadir useState aquí

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

  const [showLogistica, setShowLogistica] = useState(false);
  const [showTotales, setShowTotales] = useState(true);

  return (
    <section className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base md:text-lg font-semibold text-slate-700">Encabezado</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLogistica(!showLogistica)}
            className="text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          >
            {showLogistica ? "Ocultar Logística" : "Mostrar Logística"}
          </button>
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
        {/* Número Pedido */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">No. Pedido</label>
          <div className="border rounded p-1.5 bg-gray-50 text-xs font-medium text-gray-900 truncate">
            {header.noPedido || "PED-000000"}
          </div>
        </div>

        {/* Cliente */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Cliente *</label>
          <select
            ref={inputRefs.cliente}
            value={header.cliente || ""}
            onChange={(e) => onChange("cliente", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
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
          <label className="block text-xs font-medium text-gray-700">Ejecutivo *</label>
          <select
            ref={inputRefs.ejecutivo}
            value={header.ejecutivo || ""}
            onChange={(e) => onChange("ejecutivo", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
          >
            <option value="">-- Seleccione --</option>
            {ejecutivos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Estado</label>
          <div className="border rounded p-1.5 bg-gray-50 text-xs font-medium text-gray-900">
            {header.noPedido !== "PED-000000" ? "Pendiente" : "Sin guardar"}
          </div>
        </div>
      </div>

      {/* SEGUNDA FILA - Fechas y moneda */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
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
          <label className="block text-xs font-medium text-gray-700">Moneda</label>
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

        {/* TRM */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">TRM</label>
          <input
            ref={inputRefs.trm}
            type="number"
            step="0.01"
            value={header.trm || ""}
            onChange={(e) => onChange("trm", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            placeholder="Tasa cambio"
          />
        </div>
      </div>

      {/* TERCERA FILA - PO Code y Observaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        {/* PO Code */}
        <div className="space-y-1 md:col-span-1">
          <label className="block text-xs font-medium text-gray-700">PO - Code</label>
          <input
            ref={inputRefs.poCodeEncab}
            value={header.poCodeEncab || ""}
            onChange={(e) => onChange("poCodeEncab", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            placeholder="PO Code"
          />
        </div>

        {/* Observaciones */}
        <div className="space-y-1 md:col-span-2">
          <label className="block text-xs font-medium text-gray-700">Observaciones</label>
          <textarea
            value={header.observaciones || ""}
            onChange={(e) => onChange("observaciones", e.target.value)}
            className="border rounded p-1.5 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            rows={2}
            placeholder="Observaciones..."
          />
        </div>
      </div>

      {/* LOGÍSTICA (Colapsable) */}
      {showLogistica && (
        <div className="border rounded-lg p-3 mb-3 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-semibold text-gray-700">Información Logística</h4>
            <button
              onClick={() => setShowLogistica(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {/* Guías */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Guía Master</label>
              <input
                ref={inputRefs.guiaMaster}
                value={header.guiaMaster || ""}
                onChange={(e) => onChange("guiaMaster", e.target.value)}
                className="border rounded p-1.5 w-full text-xs"
                placeholder="Master"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Guía Hija</label>
              <input
                value={header.guiaHija || ""}
                onChange={(e) => onChange("guiaHija", e.target.value)}
                className="border rounded p-1.5 w-full text-xs"
                placeholder="Hija"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Guía Nieta</label>
              <input
                value={header.guiaNieta || ""}
                onChange={(e) => onChange("guiaNieta", e.target.value)}
                className="border rounded p-1.5 w-full text-xs"
                placeholder="Nieta"
              />
            </div>

            {/* Aerolínea y Agencia */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Aerolínea</label>
              <select
                value={header.aerolinea || ""}
                onChange={(e) => onChange("aerolinea", e.target.value)}
                className="border rounded p-1.5 w-full text-xs"
              >
                <option value="">-- Seleccione --</option>
                {aerolineas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Agencia</label>
              <select
                value={header.agencia || ""}
                onChange={(e) => onChange("agencia", e.target.value)}
                className="border rounded p-1.5 w-full text-xs"
              >
                <option value="">-- Seleccione --</option>
                {agencias.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Puerto Salida */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">Puerto Salida</label>
              <select
                value={header.puertoSalida || ""}
                onChange={(e) => onChange("puertoSalida", e.target.value)}
                className="border rounded p-1.5 w-full text-xs"
              >
                <option value="">-- Seleccione --</option>
                {puertosSalida.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TOTALES (Siempre visibles pero compactos) */}
      {showTotales && (
        <div className="space-y-2">
          {/* Indicadores */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-gray-50 rounded border">
            <div className="text-center">
              <div className="text-xs text-gray-600">Invoice</div>
              <div className="text-sm font-bold">{header.noInvoice || "0"}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Etiqueta</div>
              <div className="text-sm font-bold">{header.noEtiqueta || "0"}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Planilla</div>
              <div className="text-sm font-bold">{header.noPlanilla || "0"}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Fito</div>
              <div className="text-sm font-bold">{header.noFito || "0"}</div>
            </div>
          </div>

          {/* Totales de venta */}
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
              <div className="text-xs text-gray-600">Valor</div>
              <div className="text-sm font-bold text-green-600">
                ${header.valorVenta ? Number(header.valorVenta).toLocaleString() : "0"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">IVA (19%)</div>
              <div className="text-sm font-bold">
                ${header.iva ? Number(header.iva).toLocaleString() : "0"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-sm font-bold text-green-600">
                ${header.totalVenta ? Number(header.totalVenta).toLocaleString() : "0"}
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

      {/* Botón para mostrar/ocultar logística si está oculta */}
      {!showLogistica && (
        <button
          onClick={() => setShowLogistica(true)}
          className="w-full text-center text-xs text-blue-600 hover:text-blue-800 py-1 border-t mt-2"
        >
          + Mostrar información logística
        </button>
      )}
    </section>
  );
}