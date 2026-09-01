// src/modules/pagosClientes/ModalBuscarPagosClientes.jsx
import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { getDatosSelect } from "../../services/pedidos/pedidosService";
import { buscarPagosClientes } from "../../services/pagosClientes/pagosClientesService";

const ModalBuscarPagosClientes = ({ isOpen, onClose, onSeleccionarPago }) => {
  const [filtros, setFiltros] = useState({
    numeroPago: "",
    idCliente: "",
    numeroFactura: "",
    fechaDesde: "",
    fechaHasta: "",
    idMedioPago: ""
  });

  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    async function cargarDatos() {
      try {
        setCargandoDatos(true);
        const datosAPI = await getDatosSelect();

        // Mapear clientes
        const clientesMapeados = datosAPI.clientes?.map(c => ({
          id: c.IdCliente.toString(),
          nombre: c.NOMBRE || ''
        })) || [];

        setClientes(clientesMapeados);

        // Nota: No cargamos medios de pago ya que no se usan en los filtros
      } catch (err) {
        console.error("Error cargando datos:", err);
        Swal.fire("Error", "No se pudieron cargar los datos", "error");
      } finally {
        setCargandoDatos(false);
      }
    }

    if (isOpen) {
      cargarDatos();
    }
  }, [isOpen]);

  // Buscar pagos cuando cambien los filtros
  const buscarPagos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await buscarPagosClientes(filtros);

      if (res.success) {
        setPagos(res.pagos || []);
      } else {
        Swal.fire("Error", res.message || "Error al buscar pagos", "error");
        setPagos([]);
      }
    } catch (err) {
      console.error("Error buscando pagos:", err);
      Swal.fire("Error", "No se pudieron buscar los pagos", "error");
      setPagos([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Efecto para buscar automáticamente cuando cambian los filtros
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        buscarPagos();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, filtros, buscarPagos]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      numeroPago: "",
      idCliente: "",
      numeroFactura: "",
      fechaDesde: "",
      fechaHasta: "",
      idMedioPago: ""
    });
  };

  const handleSeleccionar = (pago) => {
    onSeleccionarPago(pago);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Fondo oscuro */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Buscar Pagos de Clientes
                </h3>
                <p className="text-sm text-blue-100">
                  Busque y seleccione un pago para editarlo
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Número de Pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Pago
                </label>
                <input
                  type="text"
                  value={filtros.numeroPago}
                  onChange={(e) => handleFiltroChange("numeroPago", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="PAG-CLI-000001"
                />
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  value={filtros.idCliente}
                  onChange={(e) => handleFiltroChange("idCliente", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los clientes</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Número de Factura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Factura
                </label>
                <input
                  type="text"
                  value={filtros.numeroFactura}
                  onChange={(e) => handleFiltroChange("numeroFactura", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="FAC-000001"
                />
              </div>

              {/* Fecha Desde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => handleFiltroChange("fechaDesde", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Fecha Hasta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => handleFiltroChange("fechaHasta", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={handleLimpiarFiltros}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Limpiar Filtros
              </button>
              <button
                onClick={buscarPagos}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>

          {/* Resultados */}
          <div className="px-6 py-4">
            {cargandoDatos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando datos...</p>
              </div>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Buscando pagos...</p>
              </div>
            ) : pagos.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No se encontraron pagos</h3>
                <p className="text-gray-500">
                  No hay pagos que coincidan con los filtros aplicados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Facturas
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medio de Pago
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Total
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Moneda
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagos.map((pago) => (
                      <tr key={pago.idEncabPagoCliente} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {pago.numeroPago}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(pago.fecha + 'T00:00:00').toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {pago.cliente}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {pago.facturas && pago.facturas.length > 0 ? (
                            <div className="max-w-xs">
                              {pago.facturas.slice(0, 2).map((factura, idx) => (
                                <div key={idx} className="mb-1 last:mb-0">
                                  <span className="font-medium">{factura.numeroFactura}</span>:
                                  <span className="ml-1">{factura.valorPago?.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ))}
                              {pago.facturas.length > 2 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  +{pago.facturas.length - 2} más
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Sin facturas</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {pago.medioPago}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {pago.valorTotalPago?.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {pago.moneda}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleSeleccionar(pago)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Seleccionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {pagos.length > 0 && `Mostrando ${pagos.length} pagos`}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalBuscarPagosClientes;