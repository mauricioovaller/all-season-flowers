// src/components/dashboard/FiltrosFecha.jsx
import React, { useState } from 'react';

const FiltrosFecha = ({ fechaInicio, fechaFin, onFechasCambiadas }) => {
    const [tempFechaInicio, setTempFechaInicio] = useState(fechaInicio);
    const [tempFechaFin, setTempFechaFin] = useState(fechaFin);

    const aplicarFiltro = () => {
        onFechasCambiadas(tempFechaInicio, tempFechaFin);
    };

    const resetearFiltro = () => {
        const hoy = new Date().toISOString().split('T')[0];
        const primerDiaMes = new Date();
        primerDiaMes.setDate(1);
        const inicioMes = primerDiaMes.toISOString().split('T')[0];
        
        setTempFechaInicio(inicioMes);
        setTempFechaFin(hoy);
        onFechasCambiadas(inicioMes, hoy);
    };

    const seleccionarRango = (dias) => {
        const fin = new Date();
        const inicio = new Date();
        inicio.setDate(fin.getDate() - dias);
        
        const inicioStr = inicio.toISOString().split('T')[0];
        const finStr = fin.toISOString().split('T')[0];
        
        setTempFechaInicio(inicioStr);
        setTempFechaFin(finStr);
        onFechasCambiadas(inicioStr, finStr);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros de Fecha</h3>
            
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Rápidos */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => seleccionarRango(7)}
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                        Últimos 7 días
                    </button>
                    <button
                        onClick={() => seleccionarRango(30)}
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                        Últimos 30 días
                    </button>
                    <button
                        onClick={() => seleccionarRango(90)}
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                        Últimos 90 días
                    </button>
                    <button
                        onClick={resetearFiltro}
                        className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                    >
                        Este mes
                    </button>
                </div>

                {/* Selectores personalizados */}
                <div className="flex-1 flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha inicio
                        </label>
                        <input
                            type="date"
                            value={tempFechaInicio}
                            onChange={(e) => setTempFechaInicio(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha fin
                        </label>
                        <input
                            type="date"
                            value={tempFechaFin}
                            onChange={(e) => setTempFechaFin(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Botón aplicar */}
                <div className="mt-2 md:mt-0">
                    <button
                        onClick={aplicarFiltro}
                        className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Aplicar Filtro
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FiltrosFecha;