// src/pages/Proveedores/Proveedores.jsx
import React, { useState, useEffect } from 'react';
import { CLIENTE } from '../../config/cliente.js';
import Swal from 'sweetalert2';
import {
    Package, Plus, Search, Edit, Trash2, Filter,
    Download, RefreshCw, CheckCircle, XCircle, Building
} from 'lucide-react';

// Componentes
import ProveedoresForm from './ProveedoresForm';
import ProveedoresList from './ProveedoresList';

// Servicio
import {
    getProveedores,
    guardarProveedor,
    eliminarProveedor
} from '../../services/proveedores/proveedoresService';

const Proveedores = () => {
    // Estados principales
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [proveedorEditando, setProveedorEditando] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [mostrarListado, setMostrarListado] = useState(false);

    // Estadísticas
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        activos: 0,
        conIVA: 0,
        inactivos: 0
    });

    useEffect(() => {
        if (mostrarListado && proveedores.length === 0) {
            cargarProveedores();
        }
    }, [mostrarListado]);

    // Calcular estadísticas cuando cambien los proveedores
    useEffect(() => {
        calcularEstadisticas();
    }, [proveedores]);

    const cargarProveedores = async () => {
        try {
            setLoading(true);

            const data = await getProveedores({
                busqueda: busqueda,
                estado: filtroEstado
            });

            if (data.success) {
                setProveedores(data.proveedores || []);

                // Convertir estadísticas de string a número
                if (data.estadisticas) {
                    setEstadisticas({
                        total: parseInt(data.estadisticas.total) || 0,
                        activos: parseInt(data.estadisticas.activos) || 0,
                        conIVA: parseInt(data.estadisticas.conIVA) || 0,
                        inactivos: parseInt(data.estadisticas.inactivos) || 0
                    });
                }
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Advertencia',
                    text: data.message || 'No se pudieron cargar los proveedores',
                    timer: 3000
                });
                setProveedores([]);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error cargando proveedores:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor.',
                timer: 3000
            });

            setProveedores([]);
            setLoading(false);
        }
    };

    const calcularEstadisticas = () => {
        const total = proveedores.length;

        // Contar activos
        const activos = proveedores.filter(p =>
            p.Estado === 'Activo'
        ).length;

        // Contar con IVA
        const conIVA = proveedores.filter(p =>
            p.IVA === 1 || p.IVA === true
        ).length;

        const inactivos = total - activos;

        setEstadisticas({ total, activos, conIVA, inactivos });
    };

    const handleGuardarProveedor = async (proveedorData) => {
        try {
            // Preparar datos con IdProveedor si estamos editando
            const datosCompletos = {
                ...proveedorData,
                IdProveedor: proveedorEditando ? proveedorEditando.IdProveedor : undefined
            };

            // Usar servicio REAL
            const resultado = await guardarProveedor(datosCompletos);

            if (resultado.success) {
                Swal.fire({
                    icon: 'success',
                    title: proveedorEditando ? 'Proveedor actualizado' : 'Proveedor guardado',
                    html: `
          <div class="text-left">
            <p><strong>Proveedor:</strong> ${proveedorData.Proveedor}</p>
            <p><strong>Código:</strong> ${proveedorData.CodProveedor || 'Sin código'}</p>
            <p><strong>ID:</strong> ${resultado.idProveedor}</p>
            <p class="text-sm text-gray-600 mt-2">${resultado.message}</p>
          </div>
        `,
                    timer: 2000
                });

                // Recargar lista
                await cargarProveedores();

                // Limpiar formulario
                setMostrarFormulario(false);
                setProveedorEditando(null);

            } else {
                throw new Error(resultado.message || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error guardando proveedor:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                html: `
        <div class="text-left">
          <p class="font-semibold">No se pudo guardar el proveedor</p>
          <p class="mt-2 text-sm">${error.message}</p>
          <p class="mt-2 text-xs text-gray-600">Verifique los datos e intente nuevamente.</p>
        </div>
      `,
                confirmButtonText: 'Entendido'
            });
        }
    };

    const handleEditarProveedor = (proveedor) => {
        setProveedorEditando(proveedor);
        setMostrarFormulario(true);

        // Asegurar que el listado esté visible
        if (!mostrarListado) {
            setMostrarListado(true);
        }

        // Scroll suave al formulario
        setTimeout(() => {
            document.getElementById('formulario-proveedores')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    const handleNuevoProveedor = () => {
        setProveedorEditando(null);
        setMostrarFormulario(true);

        // Si el listado está oculto, mostrarlo para que el formulario sea visible
        if (!mostrarListado) {
            setMostrarListado(true);
        }

        document.getElementById('formulario-proveedores')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    // Filtrar proveedores según búsqueda y filtros
    const proveedoresFiltrados = proveedores.filter(proveedor => {
        const coincideBusqueda =
            !busqueda ||
            proveedor.Proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
            proveedor.CodProveedor?.toLowerCase().includes(busqueda.toLowerCase()) ||
            proveedor.Nit?.toString().includes(busqueda) ||
            proveedor.Contacto?.toLowerCase().includes(busqueda.toLowerCase());

        const coincideEstado =
            filtroEstado === 'todos' ||
            (filtroEstado === 'activos' && proveedor.Estado === 'Activo') ||
            (filtroEstado === 'inactivos' && proveedor.Estado === 'Inactivo');

        return coincideBusqueda && coincideEstado;
    });

    return (
        <div className="space-y-6">
            {/* ========== HEADER CON ESTADÍSTICAS ========== */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Package className="w-8 h-8 text-blue-600" />
                            Gestión de Proveedores
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Administra la información de los proveedores de {CLIENTE.titulo}
                        </p>
                    </div>

                    {/* BOTÓN SIEMPRE VISIBLE */}
                    <button
                        onClick={handleNuevoProveedor}
                        className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 font-bold text-base group relative overflow-hidden"
                    >
                        {/* Efecto de brillo */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                        {/* Icono con animación */}
                        <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                        </div>

                        {/* Texto */}
                        <span className="relative">NUEVO PROVEEDOR</span>

                        {/* Indicador de acción */}
                        <div className="ml-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </button>
                </div>

                {/* CARDS DE ESTADÍSTICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Proveedores */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-700">Total Proveedores</p>
                                <p className="text-2xl font-bold text-blue-900">{estadisticas.total}</p>
                            </div>
                            <div className="bg-blue-500 text-white p-3 rounded-lg">
                                <Package className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Proveedores Activos */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-700">Proveedores Activos</p>
                                <p className="text-2xl font-bold text-green-900">{estadisticas.activos}</p>
                            </div>
                            <div className="bg-green-500 text-white p-3 rounded-lg">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Con IVA */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-700">Con IVA</p>
                                <p className="text-2xl font-bold text-purple-900">{estadisticas.conIVA}</p>
                            </div>
                            <div className="bg-purple-500 text-white p-3 rounded-lg">
                                <span className="text-sm font-bold">IVA</span>
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
                                placeholder="Buscar por nombre, código, NIT o contacto..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-3">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="activos">Solo activos</option>
                                <option value="inactivos">Solo inactivos</option>
                            </select>
                        </div>

                        {/* Botones de acción */}
                        <button
                            onClick={cargarProveedores}
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
                        <Package className="w-6 h-6" />
                        VER PROVEEDORES EXISTENTES
                    </button>
                    <p className="text-gray-500 mt-3">Mostrar listado completo de proveedores registrados</p>
                </div>
            )}

            {/* ========== FORMULARIO (COLAPSABLE) ========== */}
            {mostrarFormulario && (
                <div id="formulario-proveedores" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {proveedorEditando ? '✏️ Editar Proveedor' : '➕ Nuevo Proveedor'}
                            </h2>
                            <button
                                onClick={() => {
                                    setMostrarFormulario(false);
                                    setProveedorEditando(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Componente de formulario */}
                        <ProveedoresForm
                            proveedor={proveedorEditando}
                            onSave={handleGuardarProveedor}
                            onCancel={() => {
                                setMostrarFormulario(false);
                                setProveedorEditando(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ========== LISTADO DE PROVEEDORES ========== */}
            {mostrarListado && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                📋 Listado de Proveedores
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({proveedoresFiltrados.length} de {proveedores.length})
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
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Cargando proveedores...</p>
                                </div>
                            </div>
                        ) : (
                            <ProveedoresList
                                proveedores={proveedoresFiltrados}
                                onEditar={handleEditarProveedor}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* ========== AYUDAS RÁPIDAS ========== */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    💡 Tips de Gestión de Proveedores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-blue-600 font-bold text-sm mb-2">✓ Código Único</div>
                        <p className="text-sm text-gray-600">Usa el botón "Autogenerar" o crea un código personalizado de máximo 8 caracteres.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-blue-600 font-bold text-sm mb-2">✓ Estado Activo/Inactivo</div>
                        <p className="text-sm text-gray-600">Los proveedores inactivos no aparecerán en los procesos de compra.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-blue-600 font-bold text-sm mb-2">✓ Dos Emails</div>
                        <p className="text-sm text-gray-600">Email para facturación y email general de contacto pueden ser diferentes.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Proveedores;