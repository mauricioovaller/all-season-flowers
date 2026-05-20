// src/modules/pagosClientes/PagoClienteDetalle.jsx
import React from "react";

const PagoClienteDetalle = ({ detalle, onChangeItem, soloLectura }) => {
  const handleChange = (index, field, value) => {
    onChangeItem(index, field, value);
  };

  if (detalle.length === 0) {
    return (
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-6 text-center">
        <div className="text-gray-500 mb-2">
          <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No hay detalles de pago</h3>
        <p className="text-gray-500">
          Los detalles del pago se cargarán automáticamente cuando seleccione una factura.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Detalles del Pago</h3>
        <p className="text-sm text-gray-600">
          {detalle.length} {detalle.length === 1 ? 'producto' : 'productos'} en la factura
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variedad
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grado
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Facturado
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Parcial
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {detalle.map((item, index) => (
              <tr key={item.idDetPagoCliente || index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.producto || "Producto no disponible"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.variedad || "N/A"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.grado || "N/A"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  ${(item.valorFacturado || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {soloLectura ? (
                    <span className="text-sm text-gray-900">
                      ${(item.valorParcial || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.valorParcial || 0}
                      onChange={(e) => handleChange(index, "valorParcial", parseFloat(e.target.value) || 0)}
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan="4" className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Total del Pago:
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-600">
                ${detalle.reduce((sum, item) => sum + (parseFloat(item.valorParcial) || 0), 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <p className="mb-1">
            <span className="font-medium">Nota:</span> El valor parcial se refiere a la porción del pago que corresponde a cada producto.
          </p>
          <p>
            La suma de los valores parciales debe coincidir con el valor total del pago.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PagoClienteDetalle;