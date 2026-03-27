// src/pages/Grados/Grados.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    Layers, Plus, Search, Edit, Filter,
    Download, RefreshCw, CheckCircle, XCircle, Package
} from 'lucide-react';

// Componentes
import GradosForm from './GradosForm';
import GradosList from './GradosList';

// Servicio
import {
    getGrados,
    guardarGrado,
    getProductosParaSelector
} from '../../services/grados/gradosService';

const Grados = () => {
    // Estados principales
    const [grados, setGrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [gradoEditando, setGradoEditando] = useState(null);
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
        if (mostrarListado && grados.length === 0) {
            cargarGrados();
        }
    }, [mostrarListado]);

    useEffect(() => {
        calcularEstadisticas();
    }, [grados]);

    const cargarProductos = async () => {
        try {
            const productosData = await getProductosParaSelector();
            setProductos(productosData);
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    };

    const cargarGrados = async () => {
        try {
            setLoading(true);

            const filtros = {
                busqueda: busqueda,
                estado: filtroEstado
            };

            if (filtroProducto !== 'todos' && filtroProducto) {
                filtros.idProducto = parseInt(filtroProducto);
            }

            const data = await getGrados(filtros);

            if (data.success) {
                const gradosCorregidos = data.grados.map(grado => ({
                    ...grado,
                    ACTIVO: grado.ACTIVO === true ? 1 : 0
                }));

                setGrados(gradosCorregidos || []);

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
                    text: data.message || 'No se pudieron cargar los grados',
                    timer: 3000
                });
                setGrados([]);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error cargando grados:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor.',
                timer: 3000
            });

            setGrados([]);
            setLoading(false);
        }
    };

    const calcularEstadisticas = () => {
        const total = grados.length;
        const activos = grados.filter(g => g.ACTIVO === 1 || g.ACTIVO === true).length;
        const inactivos = total - activos;

        setEstadisticas({ total, activos, inactivos });
    };

    const handleGuardarGrado = async (gradoData) => {
        try {
            const datosCompletos = {
                ...gradoData,
                IdGrado: gradoEditando ? gradoEditando.IdGrado : undefined
            };

            const resultado = await guardarGrado(datosCompletos);

            if (resultado.success) {
                const productoSeleccionado = productos.find(p => p.IdProducto == gradoData.IdProducto);
                const nombreProducto = productoSeleccionado ? productoSeleccionado.NOMPRODUCTO : 'Producto';

                Swal.fire({
                    icon: 'success',
                    title: gradoEditando ? 'Grado actualizado' : 'Grado guardado',
                    html: `
          <div class="text-left">
            <p><strong>Grado:</strong> ${gradoData.NOMGRADO}</p>
            <p><strong>Tamaño:</strong> ${gradoData.TAMGRADO}</p>
            <p><strong>Producto:</strong> ${nombreProducto}</p>
            <p><strong>ID:</strong> ${resultado.idGrado}</p>
            <p class="text-sm text-gray-600 mt-2">${resultado.message}</p>
          </div>
        `,
                    timer: 2000
                });

                await cargarGrados();
                setMostrarFormulario(false);
                setGradoEditando(null);

            } else {
                throw new Error(resultado.message || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error guardando grado:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                html: `
        <div class="text-left">
          <p class="font-semibold">No se pudo guardar el grado</p>
          <p class="mt-2 text-sm">${error.message}</p>
          <p class="mt-2 text-xs text-gray-600">Verifique los datos e intente nuevamente.</p>
        </div>
      `,
                confirmButtonText: 'Entendido'
            });
        }
    };

    const handleEditarGrado = (grado) => {
        setGradoEditando(grado);
        setMostrarFormulario(true);

        if (!mostrarListado) {
            setMostrarListado(true);
        }

        setTimeout(() => {
            document.getElementById('formulario-grados')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    const handleNuevoGrado = () => {
        setGradoEditando(null);
        setMostrarFormulario(true);

        if (!mostrarListado) {
            setMostrarListado(true);
        }

        document.getElementById('formulario-grados')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    // Filtrar grados
    const gradosFiltrados = grados.filter(grado => {
        const coincideBusqueda =
            !busqueda ||
            grado.NOMGRADO.toLowerCase().includes(busqueda.toLowerCase()) ||
            grado.TAMGRADO?.toLowerCase().includes(busqueda.toLowerCase()) ||
            grado.NOMPRODUCTO?.toLowerCase().includes(busqueda.toLowerCase());

        const coincideEstado =
            filtroEstado === 'todos' ||
            (filtroEstado === 'activos' && (grado.ACTIVO === 1 || grado.ACTIVO === true)) ||
            (filtroEstado === 'inactivos' && (grado.ACTIVO === 0 || grado.ACTIVO === false));

        const coincideProducto =
            filtroProducto === 'todos' ||
            grado.IdProducto == filtroProducto;

        return coincideBusqueda && coincideEstado && coincideProducto;
    });

    return (
        <div className="space-y-6">
            {/* ========== HEADER CON ESTADÍSTICAS ========== */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <Layers className="w-8 h-8 text-primary" />
                            Gestión de Grados
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Administra los grados de productos de All Season Flowers
                        </p>
                    </div>

                    {/* BOTÓN NUEVO GRADO */}
                    <button
                        onClick={handleNuevoGrado}
                        className="mt-4 md:mt-0 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 font-bold text-base group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="relative">NUEVO GRADO</span>
                        <div className="ml-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </button>
                </div>

                {/* CARDS DE ESTADÍSTICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Grados */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-700">Total Grados</p>
                                <p className="text-2xl font-bold text-blue-900">{estadisticas.total}</p>
                            </div>
                            <div className="bg-blue-500 text-white p-3 rounded-lg">
                                <Layers className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Grados Activos */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-700">Grados Activos</p>
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
                                placeholder="Buscar por grado, tamaño o producto..."
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
                            onClick={cargarGrados}
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
                        <Layers className="w-6 h-6" />
                        VER GRADOS EXISTENTES
                    </button>
                    <p className="text-gray-500 mt-3">Mostrar listado completo de grados registrados</p>
                </div>
            )}

            {/* ========== FORMULARIO (COLAPSABLE) ========== */}
            {mostrarFormulario && (
                <div id="formulario-grados" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {gradoEditando ? '✏️ Editar Grado' : '➕ Nuevo Grado'}
                            </h2>
                            <button
                                onClick={() => {
                                    setMostrarFormulario(false);
                                    setGradoEditando(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <GradosForm
                            grado={gradoEditando}
                            productos={productos}
                            onSave={handleGuardarGrado}
                            onCancel={() => {
                                setMostrarFormulario(false);
                                setGradoEditando(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ========== LISTADO DE GRADOS ========== */}
            {mostrarListado && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                📋 Listado de Grados
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({gradosFiltrados.length} de {grados.length})
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
                                    <p className="text-gray-600">Cargando grados...</p>
                                </div>
                            </div>
                        ) : (
                            <GradosList
                                grados={gradosFiltrados}
                                onEditar={handleEditarGrado}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* ========== AYUDAS RÁPIDAS ========== */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    💡 Tips de Gestión de Grados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Nombre Único por Producto</div>
                        <p className="text-sm text-gray-600">Cada grado debe tener un nombre único para el producto seleccionado.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Tamaño del Grado</div>
                        <p className="text-sm text-gray-600">El tamaño es obligatorio y debe describir la categoría (ej: GRANDE, MEDIO).</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Relación con Productos</div>
                        <p className="text-sm text-gray-600">Cada grado está asociado a un producto específico.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Grados;