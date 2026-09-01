import React from 'react';

export default function DevolucionComisionDetalle({ detalle, setDetalle, header }) {
  const handleChange = (index, field, value) => {
    setDetalle(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  if (!detalle || detalle.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Undo2Icon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No hay productos cargados para esta factura</p>
      </div>
    );
  }

  const isUSD = header.moneda === 'USD' || header.moneda === 'EUR';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Producto</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Variedad</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Grado</th>
            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Tallos Fact.</th>
            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Tallos Dev.</th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Precio</th>
            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Motivo</th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Flete</th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Fumig.</th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Otros</th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {detalle.map((d, i) => {
            const tallosDev = parseInt(d.tallosDevolucion) || 0;
            const precio = parseFloat(d.precioVenta) || 0;
            const flete = parseFloat(d.flete) || 0;
            const fumigacion = parseFloat(d.fumigacion) || 0;
            const otros = parseFloat(d.otros) || 0;
            const subtotal = tallosDev * precio + flete + fumigacion + otros;
            const tallosFact = parseInt(d.tallosFacturados) || 0;

            return (
              <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 ${tallosDev > 0 ? 'bg-amber-50/50' : ''}`}>
                <td className="px-3 py-2 text-gray-700 font-medium">{d.producto || d.descripcion || "-"}</td>
                <td className="px-3 py-2 text-gray-600">{d.variedad || "-"}</td>
                <td className="px-3 py-2 text-gray-600">{d.grado || "-"}</td>
                <td className="px-3 py-2 text-center text-gray-700 font-medium">{tallosFact}</td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="number"
                    value={d.tallosDevolucion}
                    onChange={e => handleChange(i, 'tallosDevolucion', e.target.value)}
                    max={tallosFact}
                    className={`w-20 text-center border rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-500 text-sm ${tallosDev > tallosFact && tallosFact > 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  />
                </td>
                <td className="px-3 py-2 text-right text-gray-700">
                  {isUSD ? `$${precio.toFixed(3)}` : `$${precio.toFixed(0)}`}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={d.motivo || ''}
                    onChange={e => handleChange(i, 'motivo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-500 text-sm"
                    placeholder="Motivo"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={d.flete}
                    onChange={e => handleChange(i, 'flete', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-500 text-sm text-right"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={d.fumigacion}
                    onChange={e => handleChange(i, 'fumigacion', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-500 text-sm text-right"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={d.otros}
                    onChange={e => handleChange(i, 'otros', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-500 text-sm text-right"
                  />
                </td>
                <td className="px-3 py-2 text-right font-semibold text-violet-700">
                  ${subtotal.toLocaleString('en-US', { minimumFractionDigits: isUSD ? 3 : 0 })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-xs text-gray-400 mt-3">
        Ingrese los tallos devueltos, motivo y cargos adicionales para cada producto.
        Los tallos devueltos no pueden superar los tallos facturados.
      </p>
    </div>
  );
}

function Undo2Icon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  );
}
