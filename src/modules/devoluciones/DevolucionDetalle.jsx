// src/modules/devoluciones/DevolucionDetalle.jsx
import React from "react";

export default function DevolucionDetalle({
  detalle = [],
  onChangeItem,
  soloLectura = false,
  monedaNombre = ''
}) {
  const handleChange = (index, field, value) => {
    const nuevoValor = field === "motivo" ? value : parseFloat(value) || 0;
    onChangeItem(index, field, nuevoValor);
  };

  const calcularTotalFila = (item) => {
    const tallos = Number(item.tallosDevolucion) || 0;
    const precio = Number(item.precioUnitario) || 0;
    const flete = Number(item.flete) || 0;
    const fumigacion = Number(item.fumigacion) || 0;
    const otros = Number(item.otros) || 0;
    return (tallos * precio) + flete + fumigacion + otros;
  };

  const esUSD = monedaNombre && /d[oó]lar/i.test(monedaNombre);
  const formatMoneda = (valor, isUSD) => {
    const d = (isUSD ?? esUSD) ? 3 : 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: (isUSD ?? esUSD) ? 'USD' : 'COP',
      minimumFractionDigits: d,
      maximumFractionDigits: d
    }).format(valor || 0);
  };

  if (detalle.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-slate-700 mb-3">
          📋 Productos a Devolver
        </h3>
        <p className="text-center text-gray-500 py-8">No hay productos en esta factura</p>
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
          const maxTallos = item.tallosFacturados || 0;
          const tallosDev = Number(item.tallosDevolucion) || 0;
          const totalFila = calcularTotalFila(item);

          return (
            <div key={item.idDetProducto} className="border rounded-lg p-3 bg-gray-50 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{item.producto}</p>
                  <p className="text-xs text-gray-500">
                    {item.variedad || "-"} | {item.grado || "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Facturados</p>
                  <p className="font-semibold">{item.tallosFacturados}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Precio Und</p>
                  <p className="font-medium">{formatMoneda(item.precioUnitario)}</p>
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-500">Flete</p>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.flete || 0}
                    onChange={(e) => handleChange(index, "flete", e.target.value)}
                    disabled={soloLectura}
                    className={`w-full px-2 py-1 border rounded text-right ${soloLectura ? 'bg-gray-100' : ''}`}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fumigación</p>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.fumigacion || 0}
                    onChange={(e) => handleChange(index, "fumigacion", e.target.value)}
                    disabled={soloLectura}
                    className={`w-full px-2 py-1 border rounded text-right ${soloLectura ? 'bg-gray-100' : ''}`}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Otros</p>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.otros || 0}
                    onChange={(e) => handleChange(index, "otros", e.target.value)}
                    disabled={soloLectura}
                    className={`w-full px-2 py-1 border rounded text-right ${soloLectura ? 'bg-gray-100' : ''}`}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <p className="text-sm text-gray-600">Total línea</p>
                <p className="text-lg font-bold text-green-600">{formatMoneda(totalFila)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vista para pantallas medianas y grandes: tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variedad
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grado
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Facturados
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Und
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tallos Devolución
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Motivo
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flete
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fumigación
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Otros
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {detalle.map((item, index) => {
              const maxTallos = item.tallosFacturados || 0;
              const tallosDev = Number(item.tallosDevolucion) || 0;
              const totalFila = calcularTotalFila(item);

              return (
                <tr key={item.idDetProducto} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">{item.producto}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.variedad || "-"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{item.grado || "-"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-right font-medium">
                    {item.tallosFacturados}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    {formatMoneda(item.precioUnitario)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      max={maxTallos}
                      step="1"
                      value={tallosDev}
                      onChange={(e) => handleChange(index, "tallosDevolucion", e.target.value)}
                      disabled={soloLectura}
                      className={`w-20 px-2 py-1 border rounded text-right ${soloLectura ? 'bg-gray-100' : ''}`}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="text"
                      value={item.motivo || ""}
                      onChange={(e) => handleChange(index, "motivo", e.target.value)}
                      disabled={soloLectura}
                      className={`w-40 px-2 py-1 border rounded ${soloLectura ? 'bg-gray-100' : ''}`}
                      placeholder="Motivo"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.flete || 0}
                      onChange={(e) => handleChange(index, "flete", e.target.value)}
                      disabled={soloLectura}
                      className={`w-20 px-2 py-1 border rounded text-right ${soloLectura ? 'bg-gray-100' : ''}`}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.fumigacion || 0}
                      onChange={(e) => handleChange(index, "fumigacion", e.target.value)}
                      disabled={soloLectura}
                      className={`w-20 px-2 py-1 border rounded text-right ${soloLectura ? 'bg-gray-100' : ''}`}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.otros || 0}
                      onChange={(e) => handleChange(index, "otros", e.target.value)}
                      disabled={soloLectura}
                      className={`w-20 px-2 py-1 border rounded text-right ${soloLectura ? 'bg-gray-100' : ''}`}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-green-600">
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