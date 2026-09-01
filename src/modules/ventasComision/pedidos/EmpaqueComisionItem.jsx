import React, { useState } from 'react';

export default function EmpaqueComisionItem({
  productos, empaqueIndex, datosSelect, porcentajeComisionGlobal,
  onUpdateProductos, getNomProducto,
}) {
  function addProducto() {
    const nuevos = [...productos, {
      idProducto: "",
      idVariedad: "",
      idGrado: "",
      descripcion: "",
      idUnidad: "",
      idPredio: "",
      tallosRamo: "",
      ramosCaja: "",
      precioVenta: "",
      porcentajeComision: porcentajeComisionGlobal || "",
      receta: [],
    }];
    onUpdateProductos(empaqueIndex, nuevos);
  }

  function removeProducto(prodIdx) {
    onUpdateProductos(empaqueIndex, productos.filter((_, i) => i !== prodIdx));
  }

  function updateProducto(prodIdx, field, value) {
    const nuevos = [...productos];
    nuevos[prodIdx] = { ...nuevos[prodIdx], [field]: value };
    if (field === 'idProducto' && value) {
      const prod = datosSelect.productos?.find(p => p.id === value);
      if (prod) {
        nuevos[prodIdx].descripcion = `${prod.descripcion} (${prod.codigo || ''})`.trim();
      }
    }
    onUpdateProductos(empaqueIndex, nuevos);
  }

  function addReceta(prodIdx) {
    const nuevos = [...productos];
    nuevos[prodIdx].receta = [...(nuevos[prodIdx].receta || []), { idProducto: "", idVariedad: "", cantidad: "" }];
    onUpdateProductos(empaqueIndex, nuevos);
  }

  function updateReceta(prodIdx, recIdx, field, value) {
    const nuevos = [...productos];
    const receta = [...(nuevos[prodIdx].receta || [])];
    receta[recIdx] = { ...receta[recIdx], [field]: value };
    nuevos[prodIdx].receta = receta;
    onUpdateProductos(empaqueIndex, nuevos);
  }

  function removeReceta(prodIdx, recIdx) {
    const nuevos = [...productos];
    nuevos[prodIdx].receta = nuevos[prodIdx].receta.filter((_, i) => i !== recIdx);
    onUpdateProductos(empaqueIndex, nuevos);
  }

  const esReceta = (prod) => {
    const desc = getNomProducto(prod.idProducto).toLowerCase();
    return desc.includes('bouquet') || desc.includes('mix') || (prod.receta && prod.receta.length > 0);
  };

  return (
    <div className="space-y-3">
      <button onClick={addProducto}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all text-xs font-medium shadow-md shadow-emerald-600/20">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Agregar Producto
      </button>

      {productos.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-4 text-center">No hay productos en este empaque</p>
      ) : (
        productos.map((prod, prodIdx) => {
          const tallosRamo = parseInt(prod.tallosRamo) || 0;
          const ramosCaja = parseInt(prod.ramosCaja) || 0;
          const precio = parseFloat(prod.precioVenta) || 0;
          const tallosCaja = tallosRamo * ramosCaja;
          const valorRegistro = tallosCaja * precio;
          const pctCom = prod.porcentajeComision || porcentajeComisionGlobal || 0;

          return (
            <div key={prodIdx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              {/* Cabecera del producto */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Producto #{prodIdx + 1}
                </span>
                <button onClick={() => removeProducto(prodIdx)}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar producto">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Datos del producto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Producto</label>
                  <select value={prod.idProducto} onChange={e => updateProducto(prodIdx, 'idProducto', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm bg-white">
                    <option value="">Seleccione</option>
                    {(datosSelect.productos || []).map(p => (
                      <option key={p.id} value={p.id}>{p.descripcion} ({p.codigo || ''})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Variedad</label>
                  <select value={prod.idVariedad} onChange={e => updateProducto(prodIdx, 'idVariedad', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm bg-white">
                    <option value="">Seleccione</option>
                    {(datosSelect.variedades || []).filter(v => !prod.idProducto || v.productoId === prod.idProducto).map(v => (
                      <option key={v.id} value={v.id}>{v.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Grado</label>
                  <select value={prod.idGrado} onChange={e => updateProducto(prodIdx, 'idGrado', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm bg-white">
                    <option value="">Seleccione</option>
                    {(datosSelect.grados || []).filter(g => !prod.idProducto || g.productoId === prod.idProducto).map(g => (
                      <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descripción</label>
                  <input type="text" value={prod.descripcion} onChange={e => updateProducto(prodIdx, 'descripcion', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm"
                    placeholder="Descripción" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Unidad</label>
                  <select value={prod.idUnidad} onChange={e => updateProducto(prodIdx, 'idUnidad', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm bg-white">
                    <option value="">Seleccione</option>
                    {(datosSelect.unidades || []).map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Predio</label>
                  <select value={prod.idPredio} onChange={e => updateProducto(prodIdx, 'idPredio', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm bg-white">
                    <option value="">Seleccione</option>
                    {(datosSelect.predios || []).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tallos/Ramo</label>
                  <input type="number" value={prod.tallosRamo} onChange={e => updateProducto(prodIdx, 'tallosRamo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ramos/Caja</label>
                  <input type="number" value={prod.ramosCaja} onChange={e => updateProducto(prodIdx, 'ramosCaja', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Precio Venta</label>
                  <input type="number" step="0.01" value={prod.precioVenta} onChange={e => updateProducto(prodIdx, 'precioVenta', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">% Comisión</label>
                  <div className="relative">
                    <input type="number" step="0.01" min="0" max="100"
                      value={prod.porcentajeComision}
                      onChange={e => updateProducto(prodIdx, 'porcentajeComision', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 text-sm pr-8"
                      placeholder={porcentajeComisionGlobal || "0"} />
                    <span className="absolute right-2.5 top-2.5 text-gray-400 text-xs">%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Global: {porcentajeComisionGlobal || "0"}%</p>
                </div>
              </div>

              {/* Receta */}
              {esReceta(prod) && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Ingredientes (Receta)</span>
                    <button onClick={() => addReceta(prodIdx)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar
                    </button>
                  </div>
                  {(!prod.receta || prod.receta.length === 0) ? (
                    <p className="text-xs text-gray-400 italic">Sin ingredientes. Agregue los componentes del bouquet.</p>
                  ) : (
                    <div className="space-y-2">
                      {prod.receta.map((rec, recIdx) => (
                        <div key={recIdx} className="flex items-center gap-2 bg-amber-50 rounded-lg p-2 border border-amber-200">
                          <select value={rec.idProducto} onChange={e => updateReceta(prodIdx, recIdx, 'idProducto', e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-amber-500 text-xs bg-white">
                            <option value="">Producto</option>
                            {(datosSelect.productos || []).map(p => <option key={p.id} value={p.id}>{p.descripcion}</option>)}
                          </select>
                          <select value={rec.idVariedad} onChange={e => updateReceta(prodIdx, recIdx, 'idVariedad', e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-amber-500 text-xs bg-white">
                            <option value="">Variedad</option>
                            {(datosSelect.variedades || []).filter(v => !rec.idProducto || v.productoId === rec.idProducto).map(v => (
                              <option key={v.id} value={v.id}>{v.nombre}</option>
                            ))}
                          </select>
                          <input type="number" value={rec.cantidad} onChange={e => updateReceta(prodIdx, recIdx, 'cantidad', e.target.value)}
                            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-amber-500 text-xs text-center"
                            placeholder="Cant" />
                          <button onClick={() => removeReceta(prodIdx, recIdx)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtotal */}
              {tallosCaja > 0 && precio > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center justify-end gap-4 text-sm">
                  <span className="text-gray-500">
                    <b>{tallosRamo}</b> T/R × <b>{ramosCaja}</b> R/C = <b>{tallosCaja}</b> tallos × <b>${precio.toFixed(2)}</b>
                  </span>
                  <span className="text-violet-700 font-bold">= ${valorRegistro.toFixed(2)}</span>
                  <span className="text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-1 rounded">
                    Com: ${(valorRegistro * parseFloat(pctCom) / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
