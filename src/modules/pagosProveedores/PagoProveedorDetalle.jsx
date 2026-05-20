// src/modules/pagosProveedores/PagoProveedorDetalle.jsx
import React from "react";

const PagoProveedorDetalle = ({ comprasSeleccionadas = [] }) => {
  const totalPago = comprasSeleccionadas.reduce(
    (sum, c) => sum + (parseFloat(c.valorPago) || 0),
    0
  );

  if (comprasSeleccionadas.length === 0) {
    return (
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-6 text-center">
        <div className="text-gray-500 mb-2">
          <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No hay compras seleccionadas</h3>
        <p className="text-gray-500">
          Use el botón "Seleccionar compras" en el formulario para agregar compras a este pago.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Compras del Pago</h3>
        <p className="text-sm text-gray-600">
          {comprasSeleccionadas.length} {comprasSeleccionadas.length === 1 ? 'compra' : 'compras'} incluidas en este pago
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Compra
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Compra
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saldo
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Pago
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Moneda
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comprasSeleccionadas.map((compra) => (
              <tr key={compra.idCompra} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {compra.numeroCompraFormateado}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {compra.fechaCompra
                    ? new Date(compra.fechaCompra + 'T00:00:00').toLocaleDateString('es-CO')
                    : 'â€”'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                  ${(compra.totalCompra || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-green-700 font-medium text-right">
                  ${(compra.saldoCompra || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-700 text-right">
                  ${(compra.valorPago || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                  {compra.moneda || 'â€”'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan="4" className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Total del Pago:
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-700 text-right">
                ${totalPago.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PagoProveedorDetalle;
