// src/modules/devolucionesCompras/DevolucionCompraDetalle.jsx
import React from "react";

export default function DevolucionCompraDetalle({
  detalle = [],
  onChangeItem,
  soloLectura = false
}) {
  const handleChange = (index, field, value) => {
    const nuevoValor = field === "motivo" ? value : parseFloat(value) || 0;
    onChangeItem(index, field, nuevoValor);
  };

  const calcularTotalFila = (item) => {
    const tallos = Number(item.tallosDevolucion) || 0;
    const precio = Number(item.precioCompra) || 0;
    return tallos * precio;
  };

  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  if (detalle.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-slate-700 mb-3">
          📋 Productos a Devolver
        </h3>
        <p className="text-center text-gray-500 py-8">No hay productos en esta compra</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-slate-700 mb-3">
        📋 Productos a Devolver
      </h3>

      {/* Vista para móviles: tarjetas */}
      <div className="block md:hidden space-y-4">
        {detalle.map((item, index) => {
          const maxTallos = item.tallosComprados || 0;
          const tallosDev = Number(item.tallosDevolucion) || 0;
          const totalFila = calcularTotalFila(item);

          return (
            <div key={item.idDetProductoCompra} className="border rounded-lg p-3 bg-gray-50 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{item.nombreProducto}</p>
                  <p className="text-xs text-gray-500">
                    {item.nombreVariedad || "-"} | {item.nombreGrado || "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Comprados</p>
                  <p className="font-semibold">{item.tallosComprados}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Precio Und</p>
                  <p className="font-medium">{formatMoneda(item.precioCompra)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tallos Devolución</p>
                  <input
                    type="number"
                    min="0"
                    max={maxTallos}
                    step="1"
                    value={tallosDev}
                    onChange={(e) => handleChange(index, "tallosDevolucion", e.target.value)}
                    disabled={soloLectura}
                    className={`w-full px-2 py-1 border rounded text-right ${soloLectura ? 'bg-gray-100' : ''}`}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Motivo</p>
                <input
                  type="text"
                  value={item.motivo || ""}
                  onChange={(e) => handleChange(index, "motivo", e.target.value)}
                  disabled={soloLectura}
                  className={`w-full px-2 py-1 border rounded ${soloLectura ? 'bg-gray-100' : ''}`}
                  placeholder="Motivo"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-gray-600">Total línea:</span>
                <span className="font-semibold text-blue-700">{formatMoneda(totalFila)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vista para desktop: tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variedad | Grado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comprados
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Und
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tallos Devolución
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Motivo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Línea
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {detalle.map((item, index) => {
              const maxTallos = item.tallosComprados || 0;
              const tallosDev = Number(item.tallosDevolucion) || 0;
              const totalFila = calcularTotalFila(item);

              return (
                <tr key={item.idDetProductoCompra} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                    {item.nombreProducto}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {item.nombreVariedad || "-"} | {item.nombreGrado || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                    {item.tallosComprados}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                    {formatMoneda(item.precioCompra)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      max={maxTallos}
                      step="1"
                      value={tallosDev}
                      onChange={(e) => handleChange(index, "tallosDevolucion", e.target.value)}
                      disabled={soloLectura}
                      className={`w-24 px-2 py-1 border rounded text-right ${soloLectura ? 'bg-gray-100' : ''}`}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="text"
                      value={item.motivo || ""}
                      onChange={(e) => handleChange(index, "motivo", e.target.value)}
                      disabled={soloLectura}
                      className={`w-full px-2 py-1 border rounded ${soloLectura ? 'bg-gray-100' : ''}`}
                      placeholder="Motivo"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-700 text-right">
                    {formatMoneda(totalFila)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}