// src/pages/EjecutivosCompras/EjecutivosCompras.jsx
import React, { useState, useEffect } from 'react';
import { CLIENTE } from '../../config/cliente.js';
import Swal from 'sweetalert2';
import { UserCog, Plus, Search, Filter, RefreshCw, Users, XCircle, UserCheck } from 'lucide-react';
import EjecutivosComprasForm from './EjecutivosComprasForm';
import EjecutivosComprasList from './EjecutivosComprasList';
import { getEjecutivosCompras, guardarEjecutivoCompra } from '../../services/ejecutivosCompras/ejecutivosComprasService';

const EjecutivosCompras = () => {
    const [compradores, setCompradores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [editando, setEditando] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [mostrarListado, setMostrarListado] = useState(false);
    const [estadisticas, setEstadisticas] = useState({ total: 0, activos: 0, inactivos: 0 });

    useEffect(() => {
        if (mostrarListado && compradores.length === 0) cargarCompradores();
    }, [mostrarListado]);

    const cargarCompradores = async () => {
        setLoading(true);
        const data = await getEjecutivosCompras({ busqueda, estado: filtroEstado });
        if (data.success) {
            setCompradores(data.compradores || []);
            if (data.estadisticas) setEstadisticas({ total: parseInt(data.estadisticas.total) || 0, activos: parseInt(data.estadisticas.activos) || 0, inactivos: parseInt(data.estadisticas.inactivos) || 0 });
        } else {
            Swal.fire({ icon: 'warning', title: 'Advertencia', text: data.message || 'No se pudieron cargar los ejecutivos de compras', timer: 3000 });
            setCompradores([]);
        }
        setLoading(false);
    };

    const handleGuardar = async (data) => {
        const datosCompletos = { ...data, IdComprador: editando ? editando.IdComprador : undefined };
        const resultado = await guardarEjecutivoCompra(datosCompletos);
        if (resultado.success) {
            Swal.fire({ icon: 'success', title: editando ? 'Actualizado' : 'Guardado', text: resultado.message, timer: 2000 });
            await cargarCompradores();
            setMostrarFormulario(false);
            setEditando(null);
        }
    };

    const handleEditar = (c) => {
        setEditando(c);
        setMostrarFormulario(true);
        if (!mostrarListado) setMostrarListado(true);
        setTimeout(() => document.getElementById('formulario-ej-compras')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const handleNuevo = () => {
        setEditando(null);
        setMostrarFormulario(true);
        if (!mostrarListado) setMostrarListado(true);
        setTimeout(() => document.getElementById('formulario-ej-compras')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const comprFiltrados = compradores.filter(c => {
        const b = !busqueda || c.NomComprador?.toLowerCase().includes(busqueda.toLowerCase()) || c.E_MAILComprador?.toLowerCase().includes(busqueda.toLowerCase()) || c.IdentifComprador?.includes(busqueda);
        const e = filtroEstado === 'todos' || (filtroEstado === 'activos' && c.ACTIVO === 1) || (filtroEstado === 'inactivos' && c.ACTIVO === 0);
        return b && e;
    });

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <UserCog className="w-8 h-8 text-green-600" />
                            Gestión de Ejecutivos de Compras
                        </h1>
                        <p className="text-gray-600 mt-2">Administra los ejecutivos de compras de {CLIENTE.titulo}</p>
                    </div>
                    <button onClick={handleNuevo}
                        className="mt-4 md:mt-0 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 font-bold text-base group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform"><Plus className="w-5 h-5" /></div>
                        <span className="relative">NUEVO EJECUTIVO</span>
                        <div className="ml-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </button>
                </div>
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
                        <button onClick={cargarCompradores} className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors" title="Recargar">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {!mostrarListado && (
                <div className="text-center py-8">
                    <button onClick={() => setMostrarListado(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center gap-3 font-bold text-lg mx-auto">
                        <Users className="w-6 h-6" />VER EJECUTIVOS DE COMPRAS EXISTENTES
                    </button>
                    <p className="text-gray-500 mt-3">Mostrar listado completo de ejecutivos de compras registrados</p>
                </div>
            )}

            {mostrarFormulario && (
                <div id="formulario-ej-compras" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{editando ? '✏️ Editar Ejecutivo de Compras' : '➕ Nuevo Ejecutivo de Compras'}</h2>
                            <button onClick={() => { setMostrarFormulario(false); setEditando(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <EjecutivosComprasForm
                            comprador={editando}
                            onSave={handleGuardar}
                            onCancel={() => { setMostrarFormulario(false); setEditando(null); }}
                            onEliminado={async () => { setMostrarFormulario(false); setEditando(null); await cargarCompradores(); }}
                        />
                    </div>
                </div>
            )}

            {mostrarListado && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">📋 Listado de Ejecutivos de Compras
                                <span className="text-sm font-normal text-gray-500 ml-2">({comprFiltrados.length} de {compradores.length})</span>
                            </h2>
                            <button onClick={() => setMostrarListado(false)} className="text-gray-500 hover:text-gray-700 p-2">✕</button>
                        </div>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Cargando ejecutivos de compras...</p>
                                </div>
                            </div>
                        ) : (
                            <EjecutivosComprasList compradores={comprFiltrados} onEditar={handleEditar} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EjecutivosCompras;
