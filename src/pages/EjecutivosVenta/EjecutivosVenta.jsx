// src/pages/EjecutivosVenta/EjecutivosVenta.jsx
import React, { useState, useEffect } from 'react';
import { CLIENTE } from '../../config/cliente.js';
import Swal from 'sweetalert2';
import { UserCheck, Plus, Search, Filter, RefreshCw, Users, XCircle } from 'lucide-react';
import EjecutivosVentaForm from './EjecutivosVentaForm';
import EjecutivosVentaList from './EjecutivosVentaList';
import { getEjecutivosVenta, guardarEjecutivoVenta } from '../../services/ejecutivosVenta/ejecutivosVentaService';

const EjecutivosVenta = () => {
    const [ejecutivos, setEjecutivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [editando, setEditando] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [mostrarListado, setMostrarListado] = useState(false);
    const [estadisticas, setEstadisticas] = useState({ total: 0, activos: 0, inactivos: 0 });

    useEffect(() => {
        if (mostrarListado && ejecutivos.length === 0) cargarEjecutivos();
    }, [mostrarListado]);

    const cargarEjecutivos = async () => {
        setLoading(true);
        const data = await getEjecutivosVenta({ busqueda, estado: filtroEstado });
        if (data.success) {
            setEjecutivos(data.ejecutivos || []);
            if (data.estadisticas) setEstadisticas({ total: parseInt(data.estadisticas.total) || 0, activos: parseInt(data.estadisticas.activos) || 0, inactivos: parseInt(data.estadisticas.inactivos) || 0 });
        } else {
            Swal.fire({ icon: 'warning', title: 'Advertencia', text: data.message || 'No se pudieron cargar los ejecutivos de venta', timer: 3000 });
            setEjecutivos([]);
        }
        setLoading(false);
    };

    const handleGuardar = async (data) => {
        const datosCompletos = { ...data, IdEjecutivo: editando ? editando.IdEjecutivo : undefined };
        const resultado = await guardarEjecutivoVenta(datosCompletos);
        if (resultado.success) {
            Swal.fire({ icon: 'success', title: editando ? 'Actualizado' : 'Guardado', text: resultado.message, timer: 2000 });
            await cargarEjecutivos();
            setMostrarFormulario(false);
            setEditando(null);
        }
    };

    const handleEditar = (ej) => {
        setEditando(ej);
        setMostrarFormulario(true);
        if (!mostrarListado) setMostrarListado(true);
        setTimeout(() => document.getElementById('formulario-ej-venta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const handleNuevo = () => {
        setEditando(null);
        setMostrarFormulario(true);
        if (!mostrarListado) setMostrarListado(true);
        setTimeout(() => document.getElementById('formulario-ej-venta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const ejecutivosFiltrados = ejecutivos.filter(ej => {
        const coincideBusqueda = !busqueda ||
            ej.NOMEJECUTIVO?.toLowerCase().includes(busqueda.toLowerCase()) ||
            ej.E_MAILEJECUTIVO?.toLowerCase().includes(busqueda.toLowerCase()) ||
            ej.IdentifEjecutivo?.includes(busqueda);
        const coincideEstado = filtroEstado === 'todos' ||
            (filtroEstado === 'activos' && ej.ACTIVO === 1) ||
            (filtroEstado === 'inactivos' && ej.ACTIVO === 0);
        return coincideBusqueda && coincideEstado;
    });

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <UserCheck className="w-8 h-8 text-green-600" />
                            Gestión de Ejecutivos de Venta
                        </h1>
                        <p className="text-gray-600 mt-2">Administra los ejecutivos de ventas de {CLIENTE.titulo}</p>
                    </div>
                    <button onClick={handleNuevo}
                        className="mt-4 md:mt-0 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 font-bold text-base group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform"><Plus className="w-5 h-5" /></div>
                        <span className="relative">NUEVO EJECUTIVO</span>
                        <div className="ml-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </button>
                </div>
                {/* Estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div><p className="text-sm font-medium text-blue-700">Total</p><p className="text-2xl font-bold text-blue-900">{estadisticas.total}</p></div>
                            <div className="bg-blue-500 text-white p-3 rounded-lg"><Users className="w-6 h-6" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div><p className="text-sm font-medium text-green-700">Activos</p><p className="text-2xl font-bold text-green-900">{estadisticas.activos}</p></div>
                            <div className="bg-green-500 text-white p-3 rounded-lg"><UserCheck className="w-6 h-6" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div><p className="text-sm font-medium text-gray-700">Inactivos</p><p className="text-2xl font-bold text-gray-900">{estadisticas.inactivos}</p></div>
                            <div className="bg-gray-500 text-white p-3 rounded-lg"><XCircle className="w-6 h-6" /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BÚSQUEDA Y FILTROS */}
            <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="Buscar por nombre, email o identificación..."
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white">
                                <option value="todos">Todos los estados</option>
                                <option value="activos">Solo activos</option>
                                <option value="inactivos">Solo inactivos</option>
                            </select>
                        </div>
                        <button onClick={cargarEjecutivos} className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors" title="Recargar">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* BOTÓN VER LISTADO */}
            {!mostrarListado && (
                <div className="text-center py-8">
                    <button onClick={() => setMostrarListado(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center gap-3 font-bold text-lg mx-auto">
                        <Users className="w-6 h-6" />VER EJECUTIVOS EXISTENTES
                    </button>
                    <p className="text-gray-500 mt-3">Mostrar listado completo de ejecutivos registrados</p>
                </div>
            )}

            {/* FORMULARIO */}
            {mostrarFormulario && (
                <div id="formulario-ej-venta" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editando ? '✏️ Editar Ejecutivo de Venta' : '➕ Nuevo Ejecutivo de Venta'}
                            </h2>
                            <button onClick={() => { setMostrarFormulario(false); setEditando(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <EjecutivosVentaForm
                            ejecutivo={editando}
                            onSave={handleGuardar}
                            onCancel={() => { setMostrarFormulario(false); setEditando(null); }}
                            onEliminado={async () => { setMostrarFormulario(false); setEditando(null); await cargarEjecutivos(); }}
                        />
                    </div>
                </div>
            )}

            {/* LISTADO */}
            {mostrarListado && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                📋 Listado de Ejecutivos de Venta
                                <span className="text-sm font-normal text-gray-500 ml-2">({ejecutivosFiltrados.length} de {ejecutivos.length})</span>
                            </h2>
                            <button onClick={() => setMostrarListado(false)} className="text-gray-500 hover:text-gray-700 p-2" title="Ocultar listado">✕</button>
                        </div>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Cargando ejecutivos...</p>
                                </div>
                            </div>
                        ) : (
                            <EjecutivosVentaList ejecutivos={ejecutivosFiltrados} onEditar={handleEditar} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EjecutivosVenta;
