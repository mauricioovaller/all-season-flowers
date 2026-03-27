// src/pages/Ayudantes/Ayudantes.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    Users, Plus, Search, Edit, Trash2, Filter,
    Download, RefreshCw, CheckCircle, XCircle, User, CreditCard
} from 'lucide-react';

// Componentes
import AyudantesForm from './AyudantesForm';
import AyudantesList from './AyudantesList';

// Servicio
import {
    getAyudantes,
    guardarAyudante,
    eliminarAyudante
} from '../../services/ayudantes/ayudantesService';

const Ayudantes = () => {
    // Estados principales
    const [ayudantes, setAyudantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [ayudanteEditando, setAyudanteEditando] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [mostrarListado, setMostrarListado] = useState(false);

    // Estadísticas
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        activos: 0,
        inactivos: 0
    });

    useEffect(() => {
        if (mostrarListado && ayudantes.length === 0) {
            cargarAyudantes();
        }
    }, [mostrarListado]);

    useEffect(() => {
        calcularEstadisticas();
    }, [ayudantes]);

    const cargarAyudantes = async () => {
        try {
            setLoading(true);

            const data = await getAyudantes({
                busqueda: busqueda,
                estado: filtroEstado
            });

            if (data.success) {
                const ayudantesCorregidos = data.ayudantes.map(ayudante => ({
                    ...ayudante,
                    ACTIVO: ayudante.ACTIVO === true ? 1 : 0
                }));

                setAyudantes(ayudantesCorregidos || []);

                if (data.estadisticas) {
                    setEstadisticas({
                        total: parseInt(data.estadisticas.total) || 0,
                        activos: parseInt(data.estadisticas.activos) || 0,
                        inactivos: parseInt(data.estadisticas.inactivos) || 0
                    });
                }
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Advertencia',
                    text: data.message || 'No se pudieron cargar los ayudantes',
                    timer: 3000
                });
                setAyudantes([]);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error cargando ayudantes:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor.',
                timer: 3000
            });

            setAyudantes([]);
            setLoading(false);
        }
    };

    const calcularEstadisticas = () => {
        const total = ayudantes.length;
        const activos = ayudantes.filter(a => a.ACTIVO === 1 || a.ACTIVO === true).length;
        const inactivos = total - activos;

        setEstadisticas({ total, activos, inactivos });
    };

    const handleGuardarAyudante = async (ayudanteData) => {
        try {
            const datosCompletos = {
                ...ayudanteData,
                IdAyudante: ayudanteEditando ? parseInt(ayudanteEditando.IdAyudante) : undefined
            };

            const resultado = await guardarAyudante(datosCompletos);

            if (resultado.success) {
                Swal.fire({
                    icon: 'success',
                    title: ayudanteEditando ? 'Ayudante actualizado' : 'Ayudante guardado',
                    html: `
          <div class="text-left">
            <p><strong>Ayudante:</strong> ${ayudanteData.NomAyudante}</p>
            ${ayudanteData.NoCedula ? `<p><strong>Cédula:</strong> ${ayudanteData.NoCedula}</p>` : ''}
            <p><strong>ID:</strong> ${resultado.idAyudante}</p>
            <p class="text-sm text-gray-600 mt-2">${resultado.message}</p>
          </div>
        `,
                    timer: 2000
                });

                await cargarAyudantes();
                setMostrarFormulario(false);
                setAyudanteEditando(null);

            } else {
                throw new Error(resultado.message || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error guardando ayudante:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                html: `
        <div class="text-left">
          <p class="font-semibold">No se pudo guardar el ayudante</p>
          <p class="mt-2 text-sm">${error.message}</p>
          <p class="mt-2 text-xs text-gray-600">Verifique los datos e intente nuevamente.</p>
        </div>
      `,
                confirmButtonText: 'Entendido'
            });
        }
    };

    const handleEditarAyudante = (ayudante) => {
        setAyudanteEditando(ayudante);
        setMostrarFormulario(true);

        if (!mostrarListado) {
            setMostrarListado(true);
        }

        setTimeout(() => {
            document.getElementById('formulario-ayudantes')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };    

    const handleNuevoAyudante = () => {
        setAyudanteEditando(null);
        setMostrarFormulario(true);

        if (!mostrarListado) {
            setMostrarListado(true);
        }

        document.getElementById('formulario-ayudantes')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    // Filtrar ayudantes
    const ayudantesFiltrados = ayudantes.filter(ayudante => {
        const coincideBusqueda =
            !busqueda ||
            ayudante.NomAyudante.toLowerCase().includes(busqueda.toLowerCase()) ||
            (ayudante.NoCedula && ayudante.NoCedula.toString().includes(busqueda));

        const coincideEstado =
            filtroEstado === 'todos' ||
            (filtroEstado === 'activos' && (ayudante.ACTIVO === 1 || ayudante.ACTIVO === true)) ||
            (filtroEstado === 'inactivos' && (ayudante.ACTIVO === 0 || ayudante.ACTIVO === false));

        return coincideBusqueda && coincideEstado;
    });

    return (
        <div className="space-y-6">
            {/* ========== HEADER CON ESTADÍSTICAS ========== */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Users className="w-8 h-8 text-primary" />
                            Gestión de Ayudantes
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Administra la información de los ayudantes de All Season Flowers
                        </p>
                    </div>

                    {/* BOTÓN NUEVO AYUDANTE */}
                    <button
                        onClick={handleNuevoAyudante}
                        className="mt-4 md:mt-0 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 font-bold text-base group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="relative">NUEVO AYUDANTE</span>
                        <div className="ml-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </button>
                </div>

                {/* CARDS DE ESTADÍSTICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Ayudantes */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-700">Total Ayudantes</p>
                                <p className="text-2xl font-bold text-blue-900">{estadisticas.total}</p>
                            </div>
                            <div className="bg-blue-500 text-white p-3 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Ayudantes Activos */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-700">Ayudantes Activos</p>
                                <p className="text-2xl font-bold text-green-900">{estadisticas.activos}</p>
                            </div>
                            <div className="bg-green-500 text-white p-3 rounded-lg">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Inactivos */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Inactivos</p>
                                <p className="text-2xl font-bold text-gray-900">{estadisticas.inactivos}</p>
                            </div>
                            <div className="bg-gray-500 text-white p-3 rounded-lg">
                                <XCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== BARRA DE BÚSQUEDA Y FILTROS ========== */}
            <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o cédula..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-3">
                        {/* Filtro por Estado */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="activos">Solo activos</option>
                                <option value="inactivos">Solo inactivos</option>
                            </select>
                        </div>

                        {/* Botones de acción */}
                        <button
                            onClick={cargarAyudantes}
                            className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                            title="Recargar"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>

                        <button
                            className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                            title="Exportar"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* BOTÓN PARA MOSTRAR/OCULTAR LISTADO */}
            {!mostrarListado && (
                <div className="text-center py-8">
                    <button
                        onClick={() => setMostrarListado(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center gap-3 font-bold text-lg mx-auto"
                    >
                        <Users className="w-6 h-6" />
                        VER AYUDANTES EXISTENTES
                    </button>
                    <p className="text-gray-500 mt-3">Mostrar listado completo de ayudantes registrados</p>
                </div>
            )}

            {/* ========== FORMULARIO (COLAPSABLE) ========== */}
            {mostrarFormulario && (
                <div id="formulario-ayudantes" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {ayudanteEditando ? '✏️ Editar Ayudante' : '➕ Nuevo Ayudante'}
                            </h2>
                            <button
                                onClick={() => {
                                    setMostrarFormulario(false);
                                    setAyudanteEditando(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <AyudantesForm
                            ayudante={ayudanteEditando}
                            onSave={handleGuardarAyudante}
                            onCancel={() => {
                                setMostrarFormulario(false);
                                setAyudanteEditando(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ========== LISTADO DE AYUDANTES ========== */}
            {mostrarListado && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                📋 Listado de Ayudantes
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({ayudantesFiltrados.length} de {ayudantes.length})
                                </span>
                            </h2>
                            <button
                                onClick={() => setMostrarListado(false)}
                                className="text-gray-500 hover:text-gray-700 p-2"
                                title="Ocultar listado"
                            >
                                ✕
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-gray-600">Cargando ayudantes...</p>
                                </div>
                            </div>
                        ) : (
                            <AyudantesList
                                ayudantes={ayudantesFiltrados}
                                onEditar={handleEditarAyudante}                                
                            />
                        )}
                    </div>
                </div>
            )}

            {/* ========== AYUDAS RÁPIDAS ========== */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    💡 Tips de Gestión de Ayudantes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Nombre Único</div>
                        <p className="text-sm text-gray-600">Cada ayudante debe tener un nombre único en el sistema.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Cédula (Opcional)</div>
                        <p className="text-sm text-gray-600">La cédula es opcional pero debe ser única si se proporciona.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Estado Activo/Inactivo</div>
                        <p className="text-sm text-gray-600">Los ayudantes inactivos no estarán disponibles para asignaciones.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ayudantes;