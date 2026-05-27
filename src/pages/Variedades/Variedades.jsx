// src/pages/Variedades/Variedades.jsx
import React, { useState, useEffect } from 'react';
import { CLIENTE } from '../../config/cliente.js';
import Swal from 'sweetalert2';
import {
    Palette, Plus, Search, Edit, Filter,
    Download, RefreshCw, CheckCircle, XCircle, Package
} from 'lucide-react';

// Componentes
import VariedadesForm from './VariedadesForm';
import VariedadesList from './VariedadesList';

// Servicio
import {
    getVariedades,
    guardarVariedad,
    getProductosParaSelector
} from '../../services/variedades/variedadesService';

const Variedades = () => {
    // Estados principales
    const [variedades, setVariedades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [variedadEditando, setVariedadEditando] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [mostrarListado, setMostrarListado] = useState(false);
    const [productos, setProductos] = useState([]);
    const [filtroProducto, setFiltroProducto] = useState('todos');

    // Estadísticas
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        activos: 0,
        inactivos: 0
    });

    // Cargar productos para selector
    useEffect(() => {
        cargarProductos();
    }, []);

    useEffect(() => {
        if (mostrarListado && variedades.length === 0) {
            cargarVariedades();
        }
    }, [mostrarListado]);

    useEffect(() => {
        calcularEstadisticas();
    }, [variedades]);

    const cargarProductos = async () => {
        try {
            const productosData = await getProductosParaSelector();
            setProductos(productosData);
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    };

    const cargarVariedades = async () => {
        try {
            setLoading(true);

            const filtros = {
                busqueda: busqueda,
                estado: filtroEstado
            };

            if (filtroProducto !== 'todos' && filtroProducto) {
                filtros.idProducto = parseInt(filtroProducto);
            }

            const data = await getVariedades(filtros);

            if (data.success) {
                const variedadesCorregidas = data.variedades.map(variedad => ({
                    ...variedad,
                    ACTIVO: variedad.ACTIVO === true ? 1 : 0
                }));

                setVariedades(variedadesCorregidas || []);

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
                    text: data.message || 'No se pudieron cargar las variedades',
                    timer: 3000
                });
                setVariedades([]);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error cargando variedades:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor.',
                timer: 3000
            });

            setVariedades([]);
            setLoading(false);
        }
    };

    const calcularEstadisticas = () => {
        const total = variedades.length;
        const activos = variedades.filter(v => v.ACTIVO === 1 || v.ACTIVO === true).length;
        const inactivos = total - activos;

        setEstadisticas({ total, activos, inactivos });
    };

    const handleGuardarVariedad = async (variedadData) => {
        try {
            // Preparar datos con IdVariedad si estamos editando
            const datosCompletos = {
                ...variedadData,
                IdVariedad: variedadEditando ? variedadEditando.IdVariedad : undefined
            };

            const resultado = await guardarVariedad(datosCompletos);

            if (resultado.success) {
                // Obtener nombre del producto
                const productoSeleccionado = productos.find(p => p.IdProducto == variedadData.IdProducto);
                const nombreProducto = productoSeleccionado ? productoSeleccionado.NOMPRODUCTO : 'Producto';

                Swal.fire({
                    icon: 'success',
                    title: variedadEditando ? 'Variedad actualizada' : 'Variedad guardada',
                    html: `
          <div class="text-left">
            <p><strong>Variedad:</strong> ${variedadData.NOMVARIEDAD}</p>
            <p><strong>Producto:</strong> ${nombreProducto}</p>
            <p><strong>ID:</strong> ${resultado.idVariedad}</p>
            <p class="text-sm text-gray-600 mt-2">${resultado.message}</p>
          </div>
        `,
                    timer: 2000
                });

                // Recargar lista
                await cargarVariedades();

                // Limpiar formulario
                setMostrarFormulario(false);
                setVariedadEditando(null);

            } else {
                throw new Error(resultado.message || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error guardando variedad:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                html: `
        <div class="text-left">
          <p class="font-semibold">No se pudo guardar la variedad</p>
          <p class="mt-2 text-sm">${error.message}</p>
          <p class="mt-2 text-xs text-gray-600">Verifique los datos e intente nuevamente.</p>
        </div>
      `,
                confirmButtonText: 'Entendido'
            });
        }
    };

    const handleEditarVariedad = (variedad) => {
        setVariedadEditando(variedad);
        setMostrarFormulario(true);

        if (!mostrarListado) {
            setMostrarListado(true);
        }

        setTimeout(() => {
            document.getElementById('formulario-variedades')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    const handleNuevaVariedad = () => {
        setVariedadEditando(null);
        setMostrarFormulario(true);

        if (!mostrarListado) {
            setMostrarListado(true);
        }

        document.getElementById('formulario-variedades')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    // Filtrar variedades
    const variedadesFiltradas = variedades.filter(variedad => {
        const coincideBusqueda =
            !busqueda ||
            variedad.NOMVARIEDAD.toLowerCase().includes(busqueda.toLowerCase()) ||
            variedad.COLOR?.toLowerCase().includes(busqueda.toLowerCase()) ||
            variedad.NOMPRODUCTO?.toLowerCase().includes(busqueda.toLowerCase());

        const coincideEstado =
            filtroEstado === 'todos' ||
            (filtroEstado === 'activos' && (variedad.ACTIVO === 1 || variedad.ACTIVO === true)) ||
            (filtroEstado === 'inactivos' && (variedad.ACTIVO === 0 || variedad.ACTIVO === false));

        const coincideProducto =
            filtroProducto === 'todos' ||
            variedad.IdProducto == filtroProducto;

        return coincideBusqueda && coincideEstado && coincideProducto;
    });

    return (
        <div className="space-y-6">
            {/* ========== HEADER CON ESTADÍSTICAS ========== */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Palette className="w-8 h-8 text-primary" />
                            Gestión de Variedades
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Administra las variedades de productos de {CLIENTE.titulo}
                        </p>
                    </div>

                    {/* BOTÓN NUEVA VARIEDAD */}
                    <button
                        onClick={handleNuevaVariedad}
                        className="mt-4 md:mt-0 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 font-bold text-base group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="relative">NUEVA VARIEDAD</span>
                        <div className="ml-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </button>
                </div>

                {/* CARDS DE ESTADÍSTICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Variedades */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-700">Total Variedades</p>
                                <p className="text-2xl font-bold text-blue-900">{estadisticas.total}</p>
                            </div>
                            <div className="bg-blue-500 text-white p-3 rounded-lg">
                                <Palette className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Variedades Activas */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-700">Variedades Activas</p>
                                <p className="text-2xl font-bold text-green-900">{estadisticas.activos}</p>
                            </div>
                            <div className="bg-green-500 text-white p-3 rounded-lg">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Inactivas */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Inactivas</p>
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
                                placeholder="Buscar por variedad, color o producto..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-3">
                        {/* Filtro por Producto */}
                        <div className="relative">
                            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                value={filtroProducto}
                                onChange={(e) => setFiltroProducto(e.target.value)}
                                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                            >
                                <option value="todos">Todos los productos</option>
                                {productos.map(producto => (
                                    <option key={producto.IdProducto} value={producto.IdProducto}>
                                        {producto.NOMPRODUCTO}
                                    </option>
                                ))}
                            </select>
                        </div>

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
                            onClick={cargarVariedades}
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
                        <Palette className="w-6 h-6" />
                        VER VARIEDADES EXISTENTES
                    </button>
                    <p className="text-gray-500 mt-3">Mostrar listado completo de variedades registradas</p>
                </div>
            )}

            {/* ========== FORMULARIO (COLAPSABLE) ========== */}
            {mostrarFormulario && (
                <div id="formulario-variedades" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {variedadEditando ? '✏️ Editar Variedad' : '➕ Nueva Variedad'}
                            </h2>
                            <button
                                onClick={() => {
                                    setMostrarFormulario(false);
                                    setVariedadEditando(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <VariedadesForm
                            variedad={variedadEditando}
                            productos={productos}
                            onSave={handleGuardarVariedad}
                            onCancel={() => {
                                setMostrarFormulario(false);
                                setVariedadEditando(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ========== LISTADO DE VARIEDADES ========== */}
            {mostrarListado && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                📋 Listado de Variedades
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({variedadesFiltradas.length} de {variedades.length})
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
                                    <p className="text-gray-600">Cargando variedades...</p>
                                </div>
                            </div>
                        ) : (
                            <VariedadesList
                                variedades={variedadesFiltradas}
                                onEditar={handleEditarVariedad}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* ========== AYUDAS RÁPIDAS ========== */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    💡 Tips de Gestión de Variedades
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Nombre Único por Producto</div>
                        <p className="text-sm text-gray-600">Cada variedad debe tener un nombre único para el producto seleccionado.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Relación con Productos</div>
                        <p className="text-sm text-gray-600">Cada variedad está asociada a un producto específico.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Código de Color</div>
                        <p className="text-sm text-gray-600">Use códigos de color cortos (ej: ROJO, AZUL) de máximo 5 caracteres.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Variedades;