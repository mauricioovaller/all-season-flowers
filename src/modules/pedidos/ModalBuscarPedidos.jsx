// src/modules/pedidos/ModalBuscarPedidos.jsx
import React, { useState, useEffect } from "react";
import { buscarPedidos } from "../../services/pedidos/pedidosService";

export default function ModalBuscarPedidos({ isOpen, onClose, onSeleccionarPedido }) {
  const [filtros, setFiltros] = useState({
    filtroNumero: "",
    filtroCliente: "",
    filtroFecha: "",
    filtroEstado: "todos"
  });
  
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Estados para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const pedidosPorPagina = 10;

  // Cargar pedidos cuando se abre el modal o cambian los filtros
  useEffect(() => {
    if (isOpen) {
      buscarPedidosConFiltros();
    }
  }, [isOpen, paginaActual]);

  const buscarPedidosConFiltros = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const res = await buscarPedidos({
        ...filtros,
        pagina: paginaActual,
        porPagina: pedidosPorPagina
      });
      
      if (res.success) {
        setPedidos(res.pedidos || []);
        // Calcular total de páginas
        const total = Math.ceil((res.total || 0) / pedidosPorPagina);
        setTotalPaginas(total || 1);
      } else {
        setError(res.message || "Error al buscar pedidos");
      }
    } catch (err) {
      console.error("Error buscando pedidos:", err);
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleBuscar = () => {
    setPaginaActual(1); // Reiniciar a primera página
    buscarPedidosConFiltros();
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      filtroNumero: "",
      filtroCliente: "",
      filtroFecha: "",
      filtroEstado: "todos"
    });
    setPaginaActual(1);
  };

  const handleSeleccionar = (pedido) => {
    onSeleccionarPedido(pedido);
    onClose();
  };

  // Formatear fecha para mostrar
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-CO');
  };

  // Formatear moneda
  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Buscar Pedidos</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número Pedido
              </label>
              <input
                type="text"
                value={filtros.filtroNumero}
                onChange={(e) => handleFiltroChange("filtroNumero", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="PED-000123 o 123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <input
                type="text"
                value={filtros.filtroCliente}
                onChange={(e) => handleFiltroChange("filtroCliente", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Nombre del cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={filtros.filtroFecha}
                onChange={(e) => handleFiltroChange("filtroFecha", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filtros.filtroEstado}
                onChange={(e) => handleFiltroChange("filtroEstado", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="todos">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Completado">Completado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Botones de acción filtros */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleBuscar}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </button>
              <button
                onClick={handleLimpiarFiltros}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Limpiar
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {pedidos.length} {pedidos.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
            </div>
          </div>
        </div>

        {/* Body - Lista de pedidos */}
        <div className="flex-1 overflow-auto p-6">
          {cargando ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Buscando pedidos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-red-600">{error}</p>
              <button
                onClick={buscarPedidosConFiltros}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Reintentar
              </button>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <div className="text-gray-400 mb-2">📦</div>
              <p className="text-gray-600">No se encontraron pedidos</p>
              <p className="text-sm text-gray-500 mt-1">Intenta con otros filtros de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map((pedido) => (
                <div
                  key={pedido.idPedido}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => handleSeleccionar(pedido)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-gray-800">
                          {pedido.numeroPedido || `PED-${String(pedido.idPedido).padStart(6, '0')}`}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          pedido.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                          pedido.estado === 'En Proceso' ? 'bg-yellow-100 text-yellow-800' :
                          pedido.estado === 'Cancelado' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {pedido.estado || 'Pendiente'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Cliente:</span>
                          <p className="font-medium">{pedido.cliente}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Ejecutivo:</span>
                          <p className="font-medium">{pedido.ejecutivo || 'No asignado'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">F. Solicitud:</span>
                          <p className="font-medium">{formatFecha(pedido.fechaSolicitud)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">F. Entrega:</span>
                          <p className="font-medium">{formatFecha(pedido.fechaEntrega)}</p>
                        </div>
                      </div>
                      {pedido.purchaseOrder && (
                        <div className="mt-2">
                          <span className="text-gray-500">PO Cliente:</span>
                          <p className="font-medium">{pedido.purchaseOrder}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatMoneda(pedido.valorTotal)}
                      </div>
                      <button
                        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeleccionar(pedido);
                        }}
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {pedidos.length > 0 && totalPaginas > 1 && (
            <div className="mt-6 flex justify-center items-center gap-4">
              <button
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className={`px-3 py-1 rounded ${paginaActual === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
              >
                ← Anterior
              </button>
              
              <span className="text-sm text-gray-600">
                Página {paginaActual} de {totalPaginas}
              </span>
              
              <button
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className={`px-3 py-1 rounded ${paginaActual === totalPaginas ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <div className="text-sm text-gray-500">
              Selecciona un pedido para cargarlo en el formulario
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}