// src/modules/devoluciones/ModalBuscarDevoluciones.jsx
import React, { useState, useEffect } from "react";
import { buscarDevoluciones } from "../../services/devoluciones/devolucionesService";

export default function ModalBuscarDevoluciones({ isOpen, onClose, onSeleccionarDevolucion }) {
    const [filtros, setFiltros] = useState({
        filtroNumero: "",
        filtroCliente: "",
        filtroFecha: ""
    });
    const [devoluciones, setDevoluciones] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            buscar();
        }
    }, [isOpen]);

    const buscar = async () => {
        try {
            setCargando(true);
            setError(null);
            const res = await buscarDevoluciones(filtros);
            if (res.success) {
                setDevoluciones(res.devoluciones || []);
            } else {
                setError(res.message || "Error al buscar");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setCargando(false);
        }
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
    };

    const handleSeleccionar = (dev) => {
        onSeleccionarDevolucion(dev);
        onClose();
    };

    const formatFecha = (fecha) => {
        if (!fecha) return "";
        return new Date(fecha).toLocaleDateString('es-CO');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Buscar Devoluciones</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número Devolución</label>
                            <input
                                type="text"
                                value={filtros.filtroNumero}
                                onChange={(e) => handleFiltroChange("filtroNumero", e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                placeholder="DEV-000123"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                            <input
                                type="text"
                                value={filtros.filtroCliente}
                                onChange={(e) => handleFiltroChange("filtroCliente", e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                placeholder="Nombre del cliente"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Devolución</label>
                            <input
                                type="date"
                                value={filtros.filtroFecha}
                                onChange={(e) => handleFiltroChange("filtroFecha", e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={buscar}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Buscar
                            </button>
                            <button
                                onClick={() => setFiltros({ filtroNumero: "", filtroCliente: "", filtroFecha: "" })}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                            >
                                Limpiar
                            </button>
                        </div>
                        <div className="text-sm text-gray-500">
                            {devoluciones.length} {devoluciones.length === 1 ? 'devolución encontrada' : 'devoluciones encontradas'}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    {cargando ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Buscando...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">{error}</div>
                    ) : devoluciones.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-500">
                            No se encontraron devoluciones
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {devoluciones.map((dev) => (
                                <div
                                    key={dev.idFactura}
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                                    onClick={() => handleSeleccionar(dev)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-lg text-gray-800">
                                                    {dev.numeroDevolucion}
                                                </span>
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                    Factura: {dev.numeroFactura}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Cliente:</span>
                                                    <p className="font-medium">{dev.cliente}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Fecha Devolución:</span>
                                                    <p className="font-medium">{formatFecha(dev.fechaDevolucion)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Fecha Factura:</span>
                                                    <p className="font-medium">{formatFecha(dev.fechaFactura)}</p>
                                                </div>
                                            </div>
                                            {dev.observaciones && (
                                                <div className="mt-2 text-sm text-gray-600">
                                                    <span className="text-gray-500">Obs:</span> {dev.observaciones}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSeleccionar(dev);
                                            }}
                                        >
                                            Seleccionar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}