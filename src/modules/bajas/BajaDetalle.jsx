import React from 'react';
import { Trash2, Plus } from 'lucide-react';

const BajaDetalle = ({ detalles, onChange, productos, variedades, grados }) => {
  const variedadesFiltradas = (idProducto) =>
    variedades.filter((v) => v.idProducto === idProducto);

  const gradosFiltrados = (idProducto) =>
    grados.filter((g) => g.idProducto === idProducto);

  const handleChange = (index, field, value) => {
    const nuevos = [...detalles];
    if (field === 'IdProducto') {
      nuevos[index] = {
        ...nuevos[index],
        IdProducto: parseInt(value) || 0,
        IdVariedad: 0,
        IdGrado: 0,
      };
    } else if (field === 'IdVariedad') {
      nuevos[index] = { ...nuevos[index], IdVariedad: parseInt(value) || 0, IdGrado: 0 };
    } else if (field === 'IdGrado') {
      nuevos[index] = { ...nuevos[index], IdGrado: parseInt(value) || 0 };
    } else {
      nuevos[index] = { ...nuevos[index], [field]: value };
    }
    onChange(nuevos);
  };

  const agregarFila = () => {
    onChange([
      ...detalles,
      { IdProducto: 0, IdVariedad: 0, IdGrado: 0, Tallos: 0, MotivoSalida: '' },
    ]);
  };

  const eliminarFila = (index) => {
    if (detalles.length <= 1) return;
    onChange(detalles.filter((_, i) => i !== index));
  };

  const getProductoNombre = (id) => productos.find((p) => p.id === id)?.nombre || '';
  const getVariedadNombre = (id) => variedades.find((v) => v.id === id)?.nombre || '';
  const getGradoNombre = (id) => grados.find((g) => g.id === id)?.nombre || '';
  const getProductoVariedades = (idProd) => variedadesFiltradas(idProd);
  const getProductoGrados = (idProd) => gradosFiltrados(idProd);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Detalle de Productos</h3>
        <button
          type="button"
          onClick={agregarFila}
          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />Agregar
        </button>
      </div>

      <div className="space-y-2">
        {detalles.map((det, i) => (
          <div
            key={i}
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-end"
          >
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Producto</label>
              <select
                value={det.IdProducto || ''}
                onChange={(e) => handleChange(i, 'IdProducto', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Seleccione --</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Variedad</label>
              <select
                value={det.IdVariedad || ''}
                onChange={(e) => handleChange(i, 'IdVariedad', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={!det.IdProducto}
              >
                <option value="">-- Opcional --</option>
                {getProductoVariedades(det.IdProducto).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}{v.color ? ` (${v.color})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Grado</label>
              <select
                value={det.IdGrado || ''}
                onChange={(e) => handleChange(i, 'IdGrado', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={!det.IdProducto}
              >
                <option value="">-- Opcional --</option>
                {getProductoGrados(det.IdProducto).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}{g.tamano ? ` (${g.tamano})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Tallos</label>
              <input
                type="number"
                min="1"
                value={det.Tallos || ''}
                onChange={(e) => handleChange(i, 'Tallos', parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Motivo Salida</label>
              <div className="flex gap-1">
                <select
                  value={det.MotivoSalida || ''}
                  onChange={(e) => handleChange(i, 'MotivoSalida', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Opcional --</option>
                  <option value="Daño">Daño</option>
                  <option value="Pérdida">Pérdida</option>
                  <option value="Obsequio">Obsequio</option>
                  <option value="Merma">Merma</option>
                  <option value="Otro">Otro</option>
                </select>
                {detalles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarFila(i)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BajaDetalle;
