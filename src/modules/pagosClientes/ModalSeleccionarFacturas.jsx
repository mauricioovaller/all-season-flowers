import React, { useState, useEffect } from 'react';
import { getFacturasClienteConSaldo } from '../../services/pagosClientes/pagosClientesService';

const ModalSeleccionarFacturas = ({
  isOpen,
  onClose,
  idCliente,
  idMonedaSeleccionada,
  facturasSeleccionadas = [],
  onFacturasSeleccionadasChange,
  idPagoExcluir = null
}) => {
  const [facturasDisponibles, setFacturasDisponibles] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [valoresPago, setValoresPago] = useState({});

  // Cargar facturas disponibles al abrir el modal
  useEffect(() => {
    if (isOpen && idCliente) {
      cargarFacturasDisponibles();
    }
    // cargarFacturasDisponibles es estable (definida fuera del efecto, no cambia en cada render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, idCliente]);

  // Inicializar seleccionadas con las facturas ya seleccionadas.
  // Se espera a que facturasDisponibles esté cargado para poder mapear
  // invoice (número comercial) → idFactura (IdEncabPedido), que es la clave
  // usada en toda la lógica interna del modal.
  useEffect(() => {
    if (!isOpen) return;

    if (facturasSeleccionadas.length === 0) {
      setSeleccionadas([]);
      setValoresPago({});
      return;
    }

    // Si las facturas disponibles aún no cargaron, esperar
    if (facturasDisponibles.length === 0) return;

    const iniciales = facturasSeleccionadas.map(f => {
      // Nueva selección: ya tiene idFactura correcto
      if (f.idFactura) return f.idFactura;
      // Pago cargado desde BD: solo tiene invoice (número comercial)
      // Buscar el idFactura (IdEncabPedido) correspondiente
      const encontrada = facturasDisponibles.find(
        d => String(d.numeroFactura) === String(f.invoice)
      );
      return encontrada?.idFactura ?? null;
    }).filter(id => id != null);

    setSeleccionadas(iniciales);

    const valoresIniciales = {};
    facturasSeleccionadas.forEach(f => {
      const id = f.idFactura || facturasDisponibles.find(
        d => String(d.numeroFactura) === String(f.invoice)
      )?.idFactura;
      if (id != null) valoresIniciales[id] = f.valorPago || 0;
    });
    setValoresPago(valoresIniciales);
  }, [isOpen, facturasDisponibles, facturasSeleccionadas]);

  const cargarFacturasDisponibles = async () => {
    setCargando(true);
    setError('');

    try {
      const resultado = await getFacturasClienteConSaldo(idCliente, idPagoExcluir);

      if (resultado.success) {
        // Filtrar por moneda si se especificó
        let facturasFiltradas = resultado.facturas;
        if (idMonedaSeleccionada) {
          facturasFiltradas = facturasFiltradas.filter(f => f.idMoneda === idMonedaSeleccionada);
        }

        setFacturasDisponibles(facturasFiltradas);
      } else {
        setError(resultado.message || 'Error al cargar facturas');
      }
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      setError('Error al cargar facturas. Intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const toggleSeleccionFactura = (idFactura) => {
    const nuevasSeleccionadas = [...seleccionadas];
    const index = nuevasSeleccionadas.indexOf(idFactura);

    if (index === -1) {
      // Agregar factura
      nuevasSeleccionadas.push(idFactura);

      // Inicializar valor de pago si no existe
      if (!valoresPago[idFactura]) {
        const factura = facturasDisponibles.find(f => f.idFactura === idFactura);
        setValoresPago(prev => ({
          ...prev,
          [idFactura]: factura?.saldoPendiente || 0
        }));
      }
    } else {
      // Remover factura
      nuevasSeleccionadas.splice(index, 1);

      // Limpiar valor de pago
      const nuevosValores = { ...valoresPago };
      delete nuevosValores[idFactura];
      setValoresPago(nuevosValores);
    }

    setSeleccionadas(nuevasSeleccionadas);
  };

  const handleValorPagoChange = (idFactura, valor) => {
    const valorNumerico = parseFloat(valor) || 0;
    setValoresPago(prev => ({
      ...prev,
      [idFactura]: valorNumerico
    }));
  };

  const handleAceptar = () => {
    // Preparar datos de facturas seleccionadas
    const facturasConValores = seleccionadas.map(idFactura => {
      const factura = facturasDisponibles.find(f => f.idFactura === idFactura);
      return {
        idFactura,
        invoice: factura?.numeroFactura, // Número comercial de factura (ep.Factura), NO IdEncabPedido
          numeroFactura: factura?.numeroFactura || factura?.numeroFacturaFormateado || idFactura,
          esLegacy: factura?.esLegacy || false,
        fechaFactura: factura?.fechaFactura,
        totalFactura: factura?.valorFactura || 0,
        saldoFactura: factura?.saldoPendiente || 0,
        idMonedaFactura: factura?.idMoneda,
        monedaFactura: factura?.moneda,
        valorPago: valoresPago[idFactura] || 0
      };
    });

    onFacturasSeleccionadasChange(facturasConValores);
    onClose();
  };

  const handleCancelar = () => {
    onClose();
  };

  // Filtrar facturas por búsqueda
  const facturasFiltradas = facturasDisponibles.filter(factura => {
    if (!busqueda.trim()) return true;

    const termino = busqueda.toLowerCase();
    return (
      factura.numeroFacturaFormateado?.toLowerCase().includes(termino) ||
      factura.numeroFactura?.toString().toLowerCase().includes(termino) ||
      factura.idFactura?.toString().toLowerCase().includes(termino) ||
      factura.cliente?.toLowerCase().includes(termino)
    );
  });

  // Calcular totales
  const valorTotalSeleccionado = seleccionadas.reduce((total, idFactura) => {
    return total + (valoresPago[idFactura] || 0);
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Seleccionar Facturas
            </h2>
            <button
              onClick={handleCancelar}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            Seleccione las facturas que desea incluir en este pago
          </p>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex">
          {/* Panel izquierdo - Facturas disponibles */}
          <div className="w-1/2 border-r p-4 overflow-y-auto">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar facturas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {cargando ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando facturas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p>{error}</p>
                <button
                  onClick={cargarFacturasDisponibles}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Reintentar
                </button>
              </div>
            ) : facturasFiltradas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay facturas disponibles con saldo pendiente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {facturasFiltradas.map((factura) => {
                  const isSeleccionada = seleccionadas.includes(factura.idFactura);

                  return (
                    <div
                      key={factura.idFactura}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${isSeleccionada
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                        }`}
                      onClick={() => toggleSeleccionFactura(factura.idFactura)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSeleccionada}
                              onChange={() => { }}
                              className="mr-3 h-4 w-4 text-blue-600"
                            />
                            <div>
                              <p className="font-medium text-gray-800">
                                {factura.numeroFacturaFormateado || factura.numeroFactura || factura.idFactura}
                                {factura.esLegacy && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Legacy
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                Fecha: {factura.fechaFactura}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">
                            {factura.moneda} {factura.valorFactura?.toLocaleString('es-CO')}
                          </p>
                          <p className="text-sm text-gray-600">
                            Saldo: {factura.saldoPendiente?.toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel derecho - Facturas seleccionadas */}
          <div className="w-1/2 p-4 overflow-y-auto">
            <h3 className="font-medium text-gray-700 mb-4">
              Facturas seleccionadas ({seleccionadas.length})
            </h3>

            {seleccionadas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay facturas seleccionadas</p>
                <p className="text-sm mt-1">
                  Seleccione facturas del panel izquierdo
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {seleccionadas.map((idFactura) => {
                  const factura = facturasDisponibles.find(f => f.idFactura === idFactura);
                  const valorPago = valoresPago[idFactura] || 0;
                  const saldo = factura?.saldoPendiente || 0;
                  const excedeSaldo = valorPago > saldo;

                  return (
                    <div
                      key={idFactura}
                      className="p-3 border rounded-md bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-800">
                            {factura?.numeroFacturaFormateado || factura?.numeroFactura || idFactura}
                          </p>
                          <p className="text-sm text-gray-600">
                            Saldo pendiente: {saldo.toLocaleString('es-CO')} {factura?.moneda}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleSeleccionFactura(idFactura)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valor a pagar
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={valorPago}
                            onChange={(e) => handleValorPagoChange(idFactura, e.target.value)}
                            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${excedeSaldo ? 'border-yellow-500 bg-yellow-50' : ''
                              }`}
                          />
                          <span className="ml-2 text-gray-600">
                            {factura?.moneda}
                          </span>
                        </div>

                        {excedeSaldo && (
                          <p className="text-yellow-600 text-sm mt-1">
                            ⚠️ El valor excede el saldo pendiente
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Totales */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total del pago:</span>
                    <span className="text-xl font-bold text-blue-700">
                      {valorTotalSeleccionado.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {seleccionadas.length} factura(s) seleccionada(s)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600">
                Total seleccionado: <strong>{valorTotalSeleccionado.toLocaleString('es-CO')}</strong>
              </span>
            </div>
            <div className="space-x-3">
              <button
                onClick={handleCancelar}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAceptar}
                disabled={seleccionadas.length === 0}
                className={`px-4 py-2 rounded-md ${seleccionadas.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
              >
                Aceptar ({seleccionadas.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSeleccionarFacturas;