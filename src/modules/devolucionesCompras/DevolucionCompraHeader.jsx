// src/modules/devolucionesCompras/DevolucionCompraHeader.jsx
import React from "react";

export default function DevolucionCompraHeader({
    header,
    onChange,
    proveedores = [],
    compras = [],
    loadingCompras = false,
    onProveedorChange,
    inputRefs = {}
}) {
    // Manejar cambio en cualquier campo
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === "checkbox" ? checked : value;
        onChange(name, newValue);
    };

    // Cuando se selecciona un proveedor, notificar al padre
    const handleProveedorChange = (e) => {
        const idProveedor = e.target.value;
        handleChange(e); // actualiza header.proveedor
        if (onProveedorChange) {
            onProveedorChange(idProveedor);
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

                {/* Proveedor */}
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Proveedor <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="proveedor"
                        value={header.proveedor || ""}
                        onChange={handleProveedorChange}
                        ref={inputRefs.proveedor}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="">Seleccione un proveedor</option>
                        {proveedores.map((prov) => (
                            <option key={prov.id} value={prov.id}>
                                {prov.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Compra - se habilita cuando hay proveedor y compras cargadas */}
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Compra <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="compra"
                        value={header.compra || ""}
                        onChange={handleChange}
                        disabled={!header.proveedor || loadingCompras}
                        ref={inputRefs.compra}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                        <option value="">
                            {loadingCompras
                                ? "Cargando compras..."
                                : !header.proveedor
                                    ? "Primero seleccione un proveedor"
                                    : compras.length === 0
                                        ? "No hay compras para este proveedor"
                                        : "Seleccione una compra"}
                        </option>
                        {compras.map((comp) => (
                            <option
                                key={comp.idCompra}
                                value={comp.idCompra}
                                disabled={comp.tieneDevolucion} // Deshabilitar si ya tiene devolución
                            >
                                {comp.numeroCompra} - {comp.fecha} ({comp.guia})
                                {comp.tieneDevolucion ? " (Ya tiene devolución)" : ""}
                            </option>
                        ))}
                    </select>
                    {header.compra && compras.find(c => c.idCompra == header.compra)?.tieneDevolucion && (
                        <p className="text-xs text-red-600 mt-1">
                            ⚠️ Esta compra ya tiene una devolución asociada. Si continúa, se modificará la existente.
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

                {/* Observaciones (ocupa toda la fila en pantallas grandes) */}
                <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                        Observaciones
                    </label>
                    <textarea
                        name="observaciones"
                        value={header.observaciones || ""}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                        placeholder="Observaciones adicionales sobre la devolución..."
                    />
                </div>
            </div>
        </div>
    );
}