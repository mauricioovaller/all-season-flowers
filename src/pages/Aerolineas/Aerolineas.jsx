// src/pages/Aerolineas/Aerolineas.jsx
import React, { useState, useEffect } from 'react';
import { CLIENTE } from '../../config/cliente.js';
import Swal from 'sweetalert2';
import { Plane, Plus, Search, RefreshCw } from 'lucide-react';
import AerolineasForm from './AerolineasForm';
import AerolineasList from './AerolineasList';
import { getAerolineas, guardarAerolinea } from '../../services/aerolineas/aerolineasService';

const Aerolineas = () => {
    const [aerolineas, setAerolineas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [editando, setEditando] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [mostrarListado, setMostrarListado] = useState(false);
    const [estadisticas, setEstadisticas] = useState({ total: 0 });

    useEffect(() => {
        if (mostrarListado && aerolineas.length === 0) cargarAerolineas();
    }, [mostrarListado]);

    const cargarAerolineas = async () => {
        setLoading(true);
        const data = await getAerolineas({ busqueda });
        if (data.success) {
            setAerolineas(data.aerolineas || []);
            if (data.estadisticas) setEstadisticas({ total: parseInt(data.estadisticas.total) || 0 });
        } else {
            Swal.fire({ icon: 'warning', title: 'Advertencia', text: data.message || 'No se pudieron cargar las aerolíneas', timer: 3000 });
            setAerolineas([]);
        }
        setLoading(false);
    };

    const handleGuardar = async (data) => {
        const resultado = await guardarAerolinea(data);
        if (resultado.success) {
            Swal.fire({ icon: 'success', title: editando ? 'Actualizada' : 'Guardada', text: resultado.message, timer: 2000 });
            await cargarAerolineas();
            setMostrarFormulario(false);
            setEditando(null);
        }
    };

    const handleEditar = (a) => {
        setEditando(a);
        setMostrarFormulario(true);
        if (!mostrarListado) setMostrarListado(true);
        setTimeout(() => document.getElementById('formulario-aerolinea')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const handleNuevo = () => {
        setEditando(null);
        setMostrarFormulario(true);
        if (!mostrarListado) setMostrarListado(true);
        setTimeout(() => document.getElementById('formulario-aerolinea')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const filtradas = aerolineas.filter(a => !busqueda ||
        a.NOMAEROLINEA?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.CODAEROLINEA?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.CONTACTOAEROLINEA?.toLowerCase().includes(busqueda.toLowerCase()));

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Plane className="w-8 h-8 text-green-600" />Gestión de Aerolíneas
                        </h1>
                        <p className="text-gray-600 mt-2">Administra las aerolíneas de {CLIENTE.titulo}</p>
                    </div>
                    <button onClick={handleNuevo}
                        className="mt-4 md:mt-0 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 font-bold text-base group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform"><Plus className="w-5 h-5" /></div>
                        <span className="relative">NUEVA AEROLÍNEA</span>
                        <div className="ml-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </button>
                </div>
                <div className="max-w-xs">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div><p className="text-sm font-medium text-blue-700">Total aerolíneas</p><p className="text-2xl font-bold text-blue-900">{estadisticas.total}</p></div>
                            <div className="bg-blue-500 text-white p-3 rounded-lg"><Plane className="w-6 h-6" /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BÚSQUEDA */}
            <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="Buscar por nombre, código o contacto..."
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <button onClick={cargarAerolineas} className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors" title="Recargar">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!mostrarListado && (
                <div className="text-center py-8">
                    <button onClick={() => setMostrarListado(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center gap-3 font-bold text-lg mx-auto">
                        <Plane className="w-6 h-6" />VER AEROLÍNEAS EXISTENTES
                    </button>
                    <p className="text-gray-500 mt-3">Mostrar listado completo de aerolíneas registradas</p>
                </div>
            )}

            {mostrarFormulario && (
                <div id="formulario-aerolinea" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{editando ? '✏️ Editar Aerolínea' : '➕ Nueva Aerolínea'}</h2>
                            <button onClick={() => { setMostrarFormulario(false); setEditando(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <AerolineasForm
                            aerolinea={editando}
                            onSave={handleGuardar}
                            onCancel={() => { setMostrarFormulario(false); setEditando(null); }}
                            onEliminado={async () => { setMostrarFormulario(false); setEditando(null); await cargarAerolineas(); }}
                        />
                    </div>
                </div>
            )}

            {mostrarListado && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">✈️ Listado de Aerolíneas
                                <span className="text-sm font-normal text-gray-500 ml-2">({filtradas.length} de {aerolineas.length})</span>
                            </h2>
                            <button onClick={() => setMostrarListado(false)} className="text-gray-500 hover:text-gray-700 p-2">✕</button>
                        </div>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Cargando aerolíneas...</p>
                                </div>
                            </div>
                        ) : (
                            <AerolineasList aerolineas={filtradas} onEditar={handleEditar} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Aerolineas;
