// src/modules/devoluciones/DevolucionHeader.jsx
import React from "react";

export default function DevolucionHeader({
    header,
    onChange,
    clientes = [],
    facturas = [],
    loadingFacturas = false,
    onClienteChange,
    inputRefs = {}
}) {
    // Manejar cambio en cualquier campo
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === "checkbox" ? checked : value;
        onChange(name, newValue);
    };

    // Cuando se selecciona un cliente, notificar al padre
    const handleClienteChange = (e) => {
        const idCliente = e.target.value;
        handleChange(e); // actualiza header.cliente
        if (onClienteChange) {
            onClienteChange(idCliente);
        }
    };

    return (
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4">
            <h3 className="text-base md:text-lg font-semibold text-slate-700 mb-3">
                📝 Encabezado de Devolución
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {/* Número de Devolución (automático, solo lectura) */}
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        N° Devolución
                    </label>
                    <input
                        type="text"
                        name="numeroDevolucion"
                        value={header.numeroDevolucion || "DEV-000000"}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                    />
                </div>

                {/* Fecha de Devolución */}
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Fecha Devolución <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        name="fechaDevolucion"
                        value={header.fechaDevolucion || ""}
                        onChange={handleChange}
                        ref={inputRefs.fechaDevolucion}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>

                {/* Cliente */}
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Cliente <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="cliente"
                        value={header.cliente || ""}
                        onChange={handleClienteChange}
                        ref={inputRefs.cliente}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="">Seleccione un cliente</option>
                        {clientes.map((cli) => (
                            <option key={cli.id} value={cli.id}>
                                {cli.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Factura (Invoice) - se habilita cuando hay cliente y facturas cargadas */}
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Factura (Invoice) <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="factura"
                        value={header.factura || ""}
                        onChange={handleChange}
                        disabled={!header.cliente || loadingFacturas}
                        ref={inputRefs.factura}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                        <option value="">
                            {loadingFacturas
                                ? "Cargando facturas..."
                                : !header.cliente
                                    ? "Primero seleccione un cliente"
                                    : facturas.length === 0
                                        ? "No hay facturas para este cliente"
                                        : "Seleccione una factura"}
                        </option>
                        {facturas.map((fact) => (
                            <option
                                key={fact.idEncabPedido}
                                value={fact.idEncabPedido}
                                disabled={fact.tieneDevolucion} // Deshabilitar si ya tiene devolución
                            >
                                {fact.numeroFacturaFormateado} - {fact.fechaFactura} ({fact.guia})
                                {fact.tieneDevolucion ? " (Ya tiene devolución)" : ""}
                            </option>
                        ))}
                    </select>
                    {header.factura && facturas.find(f => f.idEncabPedido == header.factura)?.tieneDevolucion && (
                        <p className="text-xs text-red-600 mt-1">
                            ⚠️ Esta factura ya tiene una devolución asociada. Si continúa, se modificará la existente.
                        </p>
                    )}
                </div>

                {/* Moneda (heredada, solo lectura) */}
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Moneda
                    </label>
                    <input
                        type="text"
                        name="moneda"
                        value={header.moneda || ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                    />
                </div>

                {/* TRM (heredado, solo lectura) */}
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        TRM
                    </label>
                    <input
                        type="text"
                        name="trm"
                        value={header.trm || ""}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                    />
                </div>

                {/* Observaciones */}
                <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Observaciones
                    </label>
                    <textarea
                        name="observaciones"
                        value={header.observaciones || ""}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Observaciones generales de la devolución..."
                    />
                </div>
            </div>

            {/* Totales del encabezado (se mostrarán después) */}
            <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Total Productos:</span>
                    <span className="font-semibold">{header.totalProductos || 0}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Total Tallos:</span>
                    <span className="font-semibold">{header.totalTallos || 0}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Valor Devolución:</span>
                    <span className="font-semibold text-green-600">
                        ${parseFloat(header.valorDevolucion || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
}