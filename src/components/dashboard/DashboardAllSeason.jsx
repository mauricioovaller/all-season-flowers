// src/components/dashboard/DashboardAllSeason.jsx
import React, { useState, useEffect } from 'react';
import { fetchDashboardData } from '../../services/dashboard/dashboardService';
import KPICards from './KPICards';
import ChartProveedoresClientes from './ChartProveedoresClientes';
import ChartProductos from './ChartProductos';
import ChartTendencia from './ChartTendencia';
import FiltrosFecha from './FiltrosFecha';
import { APPS_CONFIG } from '../../services/dashboard/dashboardService';

const DashboardAllSeason = () => {
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [fechaInicio, setFechaInicio] = useState(() => {
        const firstDay = new Date();
        firstDay.setDate(1);
        return firstDay.toISOString().split('T')[0];
    });

    const [fechaFin, setFechaFin] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    useEffect(() => {
        cargarDatos();
    }, [fechaInicio, fechaFin]);

    const cargarDatos = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchDashboardData('allseason', fechaInicio, fechaFin);
            setDatos(data);
        } catch (err) {
            setError(err.message);
            console.error('Error cargando datos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFechasCambiadas = (nuevaInicio, nuevaFin) => {
        setFechaInicio(nuevaInicio);
        setFechaFin(nuevaFin);
    };

    const handleRecargar = () => {
        cargarDatos();
    };

    if (loading && !datos) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Cargando datos del dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <h3 className="text-red-800 text-xl font-semibold mb-2">Error al cargar datos</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={handleRecargar}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const configApp = APPS_CONFIG.allseason;

    return (
        <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 md:mb-6 pb-4 border-b border-gray-200">
                <div className="mb-3 lg:mb-0">
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">
                        {configApp.nombre} - Dashboard
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Período: {fechaInicio} al {fechaFin}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <button
                        onClick={handleRecargar}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="mb-6">
                <FiltrosFecha
                    fechaInicio={fechaInicio}
                    fechaFin={fechaFin}
                    onFechasCambiadas={handleFechasCambiadas}
                />
            </div>

            {/* Sección VENTAS primero */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
                <h2 className="text-xl font-bold mb-6 pb-3 border-b border-gray-100"
                    style={{ color: configApp.colorVentas }}>
                    💰 Ventas
                </h2>

                {datos?.ventas && (
                    <>
                        <div className="mb-6">
                            <KPICards
                                kpis={datos.ventas.kpis}
                                tipo="ventas"
                                color={configApp.colorVentas}
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6">
                            {/* Clientes */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 h-[320px]">
                                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                                    Top 10 Clientes
                                </h3>
                                <div className="h-[250px]">
                                    <ChartProveedoresClientes
                                        data={datos.ventas.clientes}
                                        color={configApp.colorVentas}
                                        tipo="clientes"
                                    />
                                </div>
                            </div>

                            {/* Productos Ventas */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 h-[320px]">
                                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                                    Productos Más Vendidos
                                </h3>
                                <div className="h-[250px]">
                                    <ChartProductos
                                        data={datos.ventas.productos}
                                        color={configApp.colorVentas}
                                        tipo="ventas"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tendencia Ventas */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 h-[320px]">
                            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                                Tendencia de Ventas
                            </h3>
                            <div className="h-[250px]">
                                <ChartTendencia
                                    data={datos.ventas.tendencia}
                                    color={configApp.colorVentas}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Sección COMPRAS después */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <h2 className="text-xl font-bold mb-6 pb-3 border-b border-gray-100"
                    style={{ color: configApp.colorCompras }}>
                    📦 Compras
                </h2>

                {datos?.compras && (
                    <>
                        <div className="mb-6">
                            <KPICards
                                kpis={datos.compras.kpis}
                                tipo="compras"
                                color={configApp.colorCompras}
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6">
                            {/* Proveedores */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 h-[350px]">
                                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
                                    Top 10 Proveedores
                                </h3>
                                <div className="h-[280px]">
                                    <ChartProveedoresClientes
                                        data={datos.compras.proveedores}
                                        color={configApp.colorCompras}
                                        tipo="proveedores"
                                    />
                                </div>
                            </div>

                            {/* Productos Compras */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 h-[350px]">
                                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
                                    Productos Más Comprados
                                </h3>
                                <div className="h-[280px]">
                                    <ChartProductos
                                        data={datos.compras.productos}
                                        color={configApp.colorCompras}
                                        tipo="compras"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tendencia Compras */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 h-[350px]">
                            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
                                Tendencia de Compras
                            </h3>
                            <div className="h-[280px]">
                                <ChartTendencia
                                    data={datos.compras.tendencia}
                                    color={configApp.colorCompras}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DashboardAllSeason;