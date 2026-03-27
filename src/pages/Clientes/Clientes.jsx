// src/pages/Clientes/Clientes.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    Users, Plus, Search, Edit, Trash2, Filter,
    Download, RefreshCw, UserCheck, UserX
} from 'lucide-react';

// Componente de formulario (lo crearemos completo en PASO 2)
import ClientesForm from './ClientesForm';
// Componente de listado (lo crearemos en PASO 3)
import ClientesList from './ClientesList';

// Servicio (lo crearemos en seguida)
import {
    getClientes,
    guardarCliente,
    eliminarCliente
} from '../../services/clientes/clientesService';

const Clientes = () => {
    // Estados principales
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [clienteEditando, setClienteEditando] = useState(null);
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
        if (mostrarListado && clientes.length === 0) {
            cargarClientes();
        }
    }, [mostrarListado]); // Solo cargar cuando mostrarListado cambie a true

    // Calcular estadísticas cuando cambien los clientes
    useEffect(() => {
        calcularEstadisticas();
    }, [clientes]);

    const cargarClientes = async () => {
        try {
            setLoading(true);

            const data = await getClientes({
                busqueda: busqueda,
                estado: filtroEstado
            });

            if (data.success) {
                // Asegurar que ACTIVO sea número (1/0) en lugar de booleano
                const clientesCorregidos = data.clientes.map(cliente => ({
                    ...cliente,
                    ACTIVO: cliente.ACTIVO === true ? 1 : 0,
                    IVA: cliente.IVA === true ? 1 : 0
                }));

                setClientes(clientesCorregidos || []);

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
                    text: data.message || 'No se pudieron cargar los clientes',
                    timer: 3000
                });
                setClientes([]);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error cargando clientes:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor.',
                timer: 3000
            });

            setClientes([]);
            setLoading(false);
        }
    };

    const calcularEstadisticas = () => {
        const total = clientes.length;

        // Contar activos correctamente (aceptando 1 o true)
        const activos = clientes.filter(c =>
            c.ACTIVO === 1 || c.ACTIVO === true
        ).length;

        // Contar con IVA correctamente (aceptando 1 o true)
        const conIVA = clientes.filter(c =>
            c.IVA === 1 || c.IVA === true
        ).length;

        const inactivos = total - activos;

        setEstadisticas({ total, activos, conIVA, inactivos });
    };

    const handleGuardarCliente = async (clienteData) => {
        try {
            // Preparar datos con IdCliente si estamos editando
            const datosCompletos = {
                ...clienteData,
                IdCliente: clienteEditando ? clienteEditando.IdCliente : undefined
            };

            // Usar servicio REAL
            const resultado = await guardarCliente(datosCompletos);

            if (resultado.success) {
                Swal.fire({
                    icon: 'success',
                    title: clienteEditando ? 'Cliente actualizado' : 'Cliente guardado',
                    html: `
          <div class="text-left">
            <p><strong>Cliente:</strong> ${clienteData.NOMBRE}</p>
            <p><strong>Código:</strong> ${clienteData.CodCliente || 'Sin código'}</p>
            <p><strong>ID:</strong> ${resultado.idCliente}</p>
            <p class="text-sm text-gray-600 mt-2">${resultado.message}</p>
          </div>
        `,
                    timer: 2000
                });

                // Recargar lista
                await cargarClientes();

                // Limpiar formulario
                setMostrarFormulario(false);
                setClienteEditando(null);

            } else {
                throw new Error(resultado.message || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error guardando cliente:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                html: `
        <div class="text-left">
          <p class="font-semibold">No se pudo guardar el cliente</p>
          <p class="mt-2 text-sm">${error.message}</p>
          <p class="mt-2 text-xs text-gray-600">Verifique los datos e intente nuevamente.</p>
        </div>
      `,
                confirmButtonText: 'Entendido'
            });
        }
    };

    const handleEditarCliente = (cliente) => {
        setClienteEditando(cliente);
        setMostrarFormulario(true);

        // Asegurar que el listado esté visible
        if (!mostrarListado) {
            setMostrarListado(true);
        }

        // Scroll suave al formulario
        setTimeout(() => {
            document.getElementById('formulario-clientes')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    const handleNuevoCliente = () => {
        setClienteEditando(null);
        setMostrarFormulario(true);
        setErrores({});

        // Si el listado está oculto, mostrarlo para que el formulario sea visible
        if (!mostrarListado) {
            setMostrarListado(true);
        }

        document.getElementById('formulario-clientes')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    // Filtrar clientes según búsqueda y filtros
    const clientesFiltrados = clientes.filter(cliente => {
        const coincideBusqueda =
            !busqueda ||
            cliente.NOMBRE.toLowerCase().includes(busqueda.toLowerCase()) ||
            cliente.CodCliente.toLowerCase().includes(busqueda.toLowerCase()) ||
            cliente.NIT?.includes(busqueda) ||
            cliente.Contaco?.toLowerCase().includes(busqueda.toLowerCase());

        const coincideEstado =
            filtroEstado === 'todos' ||
            (filtroEstado === 'activos' && (cliente.ACTIVO === 1 || cliente.ACTIVO === true)) ||
            (filtroEstado === 'inactivos' && (cliente.ACTIVO === 0 || cliente.ACTIVO === false));

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
                            Gestión de Clientes
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Administra la información de los clientes de All Season Flowers
                        </p>
                    </div>

                    {/* BOTÓN SIEMPRE VISIBLE - MOVER AQUÍ */}
                    <button
                        onClick={handleNuevoCliente}
                        className="mt-4 md:mt-0 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 font-bold text-base group relative overflow-hidden"
                    >
                        {/* Efecto de brillo */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                        {/* Icono con animación */}
                        <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                        </div>

                        {/* Texto */}
                        <span className="relative">NUEVO CLIENTE</span>

                        {/* Indicador de acción */}
                        <div className="ml-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </button>
                </div>

                {/* CARDS DE ESTADÍSTICAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Clientes */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-700">Total Clientes</p>
                                <p className="text-2xl font-bold text-blue-900">{estadisticas.total}</p>
                            </div>
                            <div className="bg-blue-500 text-white p-3 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Clientes Activos */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-700">Clientes Activos</p>
                                <p className="text-2xl font-bold text-green-900">{estadisticas.activos}</p>
                            </div>
                            <div className="bg-green-500 text-white p-3 rounded-lg">
                                <UserCheck className="w-6 h-6" />
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
                                <UserX className="w-6 h-6" />
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
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="activos">Solo activos</option>
                                <option value="inactivos">Solo inactivos</option>
                            </select>
                        </div>

                        {/* Botones de acción */}
                        <button
                            onClick={cargarClientes}
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
                        VER CLIENTES EXISTENTES
                    </button>
                    <p className="text-gray-500 mt-3">Mostrar listado completo de clientes registrados</p>
                </div>
            )}

            {/* ========== FORMULARIO (COLAPSABLE) ========== */}
            {mostrarFormulario && (
                <div id="formulario-clientes" className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {clienteEditando ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
                            </h2>
                            <button
                                onClick={() => {
                                    setMostrarFormulario(false);
                                    setClienteEditando(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Componente de formulario - Lo crearemos en PASO 2 */}
                        <ClientesForm
                            cliente={clienteEditando}
                            onSave={handleGuardarCliente}
                            onCancel={() => {
                                setMostrarFormulario(false);
                                setClienteEditando(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ========== LISTADO DE CLIENTES ========== */}
            {mostrarListado && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                📋 Listado de Clientes
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({clientesFiltrados.length} de {clientes.length})
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
                                    <p className="text-gray-600">Cargando clientes...</p>
                                </div>
                            </div>
                        ) : (
                            <ClientesList
                                clientes={clientesFiltrados}
                                onEditar={handleEditarCliente}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* ========== AYUDAS RÁPIDAS ========== */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    💡 Tips de Gestión de Clientes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Código Único</div>
                        <p className="text-sm text-gray-600">Usa el botón "Autogenerar" o crea un código personalizado de máximo 8 caracteres.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Estado Activo/Inactivo</div>
                        <p className="text-sm text-gray-600">Los clientes inactivos no aparecerán en los procesos de venta y pedidos.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="text-primary font-bold text-sm mb-2">✓ Campo IVA</div>
                        <p className="text-sm text-gray-600">Marca esta casilla si el cliente está obligado a facturar con IVA.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Clientes;