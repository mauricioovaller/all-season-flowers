// src/components/pedidos/PedidoDetail.jsx
import React, { useEffect } from "react";

function formatCurrency(v) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(v || 0);
}

export default function PedidoDetail({
  items,
  onChangeItems,
  productos = [],
  variedades = [],
  grados = [],
  tiposEmpaque = [],
  unidadesFacturacion = [],
  predios = [],
  itemRefsRef,
}) {

  // Efecto para recalcular campos cuando cambian items
  useEffect(() => {
    const recalculatedItems = items.map(item => {
      // Si ya tenemos todos los datos calculados, no recalcular
      if (item.tallosCaja !== undefined && item.totTallosRegistro !== undefined && item.valorRegistro !== undefined) {
        return item;
      }

      // Recalcular tallos por caja
      const tallosRamo = Number(item.tallosRamo) || 0;
      const ramosCaja = Number(item.ramosCaja) || 0;
      const tallosCaja = tallosRamo * ramosCaja;

      // Recalcular total de tallos en el registro
      const cantidadEmpaque = Number(item.cantidadEmpaque) || 0;
      const totTallosRegistro = tallosCaja * cantidadEmpaque;

      // Recalcular valor del registro
      const precioVenta = Number(item.precioVenta) || 0;
      let valorRegistro = 0;

      // Calcular según unidad de facturación
      if (item.unidadFacturacion === "1") { // Tallos
        valorRegistro = totTallosRegistro * precioVenta;
      } else if (item.unidadFacturacion === "2") { // Ramos
        valorRegistro = cantidadEmpaque * ramosCaja * precioVenta;
      } else if (item.unidadFacturacion === "3") { // Cajas
        valorRegistro = cantidadEmpaque * precioVenta;
      } else {
        valorRegistro = totTallosRegistro * precioVenta; // Default por tallos
      }

      return {
        ...item,
        tallosCaja,
        totTallosRegistro,
        valorRegistro,
      };
    });

    // Solo actualizar si hubo cambios
    const needsUpdate = recalculatedItems.some((newItem, index) => {
      const oldItem = items[index];
      return newItem.tallosCaja !== oldItem.tallosCaja ||
        newItem.totTallosRegistro !== oldItem.totTallosRegistro ||
        newItem.valorRegistro !== oldItem.valorRegistro;
    });

    if (needsUpdate) {
      onChangeItems(recalculatedItems);
    }
  }, [items, onChangeItems]);

  function addItem() {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newItem = {
      id,
      poCodeDet: "",
      producto: "",
      variedad: "",
      grado: "",
      tipoEmpaque: "",
      cantidadEmpaque: 1,
      unidadFacturacion: "1", // Tallos por defecto
      tallosRamo: 0,
      ramosCaja: 0,
      tallosCaja: 0,
      precioVenta: 0,
      totTallosRegistro: 0,
      valorRegistro: 0,
      predio: "",
      tallosDevolucion: 0,
      motivoDevolucion: "",
      otrCargoDevolucion: 0,
    };
    onChangeItems([...items, newItem]);
  }

  function removeItem(index) {
    const copy = items.slice();
    copy.splice(index, 1);
    onChangeItems(copy);
  }

  function updateItem(index, field, value) {
    console.log("updateItem", { index, field, value });
    const copy = items.map((it) => ({ ...it }));
    const item = copy[index];
    if (!item) return;

    if (field === "producto") {
      const prod = productos.find((p) => String(p.id) === String(value));
      if (prod) {
        item.producto = prod.id;
        // Limpiar variedad al cambiar producto
        item.variedad = "";
      } else {
        item.producto = "";
        item.variedad = "";
      }
    } else if (field === "tallosRamo" || field === "ramosCaja") {
      item[field] = Number(value || 0);
      // Recalcular tallos por caja
      item.tallosCaja = (Number(item.tallosRamo) || 0) * (Number(item.ramosCaja) || 0);
    } else if (["cantidadEmpaque", "precioVenta", "tallosDevolucion", "otrCargoDevolucion"].includes(field)) {
      item[field] = Number(value || 0);
    } else {
      item[field] = value;
    }

    // Recalcular totales
    const tallosCaja = (Number(item.tallosRamo) || 0) * (Number(item.ramosCaja) || 0);
    const cantidadEmpaque = Number(item.cantidadEmpaque) || 0;
    const totTallosRegistro = tallosCaja * cantidadEmpaque;
    
    const precioVenta = Number(item.precioVenta) || 0;
    let valorRegistro = 0;

    // Calcular según unidad de facturación
    if (item.unidadFacturacion === "1") { // Tallos
      valorRegistro = totTallosRegistro * precioVenta;
    } else if (item.unidadFacturacion === "2") { // Ramos
      valorRegistro = cantidadEmpaque * (Number(item.ramosCaja) || 0) * precioVenta;
    } else if (item.unidadFacturacion === "3") { // Cajas
      valorRegistro = cantidadEmpaque * precioVenta;
    } else {
      valorRegistro = totTallosRegistro * precioVenta; // Default por tallos
    }

    item.tallosCaja = tallosCaja;
    item.totTallosRegistro = totTallosRegistro;
    item.valorRegistro = valorRegistro;

    onChangeItems(copy);
  }

  // Filtrar variedades por producto seleccionado
  const getVariedadesPorProducto = (productoId) => {
    if (!productoId) return [];
    return variedades.filter(v => String(v.productoId) === String(productoId));
  };

  const totalPiezas = items.reduce((s, it) => s + Number(it.cantidadEmpaque || 0), 0);
  const totalTallos = items.reduce((s, it) => s + Number(it.totTallosRegistro || 0), 0);
  const totalValor = items.reduce((s, it) => s + Number(it.valorRegistro || 0), 0);

  return (
    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h3 className="text-xl font-semibold text-slate-700">Detalle del Pedido</h3>
        <button
          type="button"
          onClick={addItem}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition font-medium text-sm sm:text-base"
        >
          + Agregar Producto
        </button>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Total Piezas</div>
          <div className="text-lg font-bold text-gray-900">{totalPiezas}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Total Tallos</div>
          <div className="text-lg font-bold text-gray-900">{totalTallos}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Equiv. Fulles</div>
          <div className="text-lg font-bold text-gray-900">{totalPiezas}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Total Valor</div>
          <div className="text-lg font-bold text-green-600">{formatCurrency(totalValor)}</div>
        </div>
      </div>

      {/* Tabla Desktop */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="text-left text-gray-700">
                <th className="p-2 border-b font-semibold">PO-CODE</th>
                <th className="p-2 border-b font-semibold">Producto</th>
                <th className="p-2 border-b font-semibold">Variedad</th>
                <th className="p-2 border-b font-semibold">Grado</th>
                <th className="p-2 border-b font-semibold">Tipo Empaque</th>
                <th className="p-2 border-b font-semibold w-20 text-center">Cant. Emp.</th>
                <th className="p-2 border-b font-semibold">Unidad Fact.</th>
                <th className="p-2 border-b font-semibold w-20 text-center">Tallos/Ramo</th>
                <th className="p-2 border-b font-semibold w-20 text-center">Ramos/Caja</th>
                <th className="p-2 border-b font-semibold w-20 text-center">Tallos/Caja</th>
                <th className="p-2 border-b font-semibold w-24 text-right">Precio Venta</th>
                <th className="p-2 border-b font-semibold w-24 text-center">Tot Tallos</th>
                <th className="p-2 border-b font-semibold w-28 text-right">Valor Registro</th>
                <th className="p-2 border-b font-semibold">Predio</th>
                <th className="p-2 border-b font-semibold w-20 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} className="border-b hover:bg-gray-50">
                  {/* PO-CODE */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={it.poCodeDet || ""}
                      onChange={(e) => updateItem(idx, "poCodeDet", e.target.value)}
                      className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="PO-CODE"
                    />
                  </td>

                  {/* Producto */}
                  <td className="p-2">
                    <select
                      value={it.producto || ""}
                      onChange={(e) => updateItem(idx, "producto", e.target.value)}
                      ref={(el) => {
                        if (itemRefsRef) itemRefsRef.current[idx] = el;
                      }}
                      className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccione...</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.descripcion} - {p.codigo}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Variedad */}
                  <td className="p-2">
                    <select
                      value={it.variedad || ""}
                      onChange={(e) => updateItem(idx, "variedad", e.target.value)}
                      className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccione...</option>
                      {getVariedadesPorProducto(it.producto).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nombre}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Grado */}
                  <td className="p-2">
                    <select
                      value={it.grado || ""}
                      onChange={(e) => updateItem(idx, "grado", e.target.value)}
                      className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccione...</option>
                      {grados.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nombre}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Tipo Empaque */}
                  <td className="p-2">
                    <select
                      value={it.tipoEmpaque || ""}
                      onChange={(e) => updateItem(idx, "tipoEmpaque", e.target.value)}
                      className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccione...</option>
                      {tiposEmpaque.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.descripcion}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Cantidad Empaque */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={it.cantidadEmpaque || ""}
                      onChange={(e) => updateItem(idx, "cantidadEmpaque", e.target.value)}
                      className="border rounded p-1 w-full text-xs text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </td>

                  {/* Unidad Facturación */}
                  <td className="p-2">
                    <select
                      value={it.unidadFacturacion || ""}
                      onChange={(e) => updateItem(idx, "unidadFacturacion", e.target.value)}
                      className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccione...</option>
                      {unidadesFacturacion.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Tallos Ramo */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={it.tallosRamo || ""}
                      onChange={(e) => updateItem(idx, "tallosRamo", e.target.value)}
                      className="border rounded p-1 w-full text-xs text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </td>

                  {/* Ramos Caja */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={it.ramosCaja || ""}
                      onChange={(e) => updateItem(idx, "ramosCaja", e.target.value)}
                      className="border rounded p-1 w-full text-xs text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </td>

                  {/* Tallos Caja (readonly) */}
                  <td className="p-2 text-center text-gray-700 font-medium">
                    {it.tallosCaja || 0}
                  </td>

                  {/* Precio Venta */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={it.precioVenta || ""}
                      onChange={(e) => updateItem(idx, "precioVenta", e.target.value)}
                      className="border rounded p-1 w-full text-xs text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      step="0.01"
                      min="0"
                    />
                  </td>

                  {/* Total Tallos Registro (readonly) */}
                  <td className="p-2 text-center text-gray-700 font-medium">
                    {it.totTallosRegistro || 0}
                  </td>

                  {/* Valor Registro (readonly) */}
                  <td className="p-2 text-right text-green-600 font-medium">
                    {formatCurrency(it.valorRegistro || 0)}
                  </td>

                  {/* Predio */}
                  <td className="p-2">
                    <select
                      value={it.predio || ""}
                      onChange={(e) => updateItem(idx, "predio", e.target.value)}
                      className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccione...</option>
                      {predios.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Acciones */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50 m-2">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
              </svg>
            </div>
            <p className="text-sm">No hay productos en el detalle</p>
            <p className="text-xs mt-1">Haga clic en "Agregar Producto" para comenzar</p>
          </div>
        )}
      </div>

      {/* Vista Mobile */}
      <div className="md:hidden space-y-3">
        {items.map((it, idx) => (
          <div key={it.id} className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="space-y-3">
              {/* PO-CODE */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">PO-CODE</label>
                <input
                  type="text"
                  value={it.poCodeDet || ""}
                  onChange={(e) => updateItem(idx, "poCodeDet", e.target.value)}
                  className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="PO-CODE"
                />
              </div>

              {/* Producto y Variedad */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Producto</label>
                  <select
                    value={it.producto || ""}
                    onChange={(e) => updateItem(idx, "producto", e.target.value)}
                    className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione...</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Variedad</label>
                  <select
                    value={it.variedad || ""}
                    onChange={(e) => updateItem(idx, "variedad", e.target.value)}
                    className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione...</option>
                    {getVariedadesPorProducto(it.producto).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grado y Tipo Empaque */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Grado</label>
                  <select
                    value={it.grado || ""}
                    onChange={(e) => updateItem(idx, "grado", e.target.value)}
                    className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione...</option>
                    {grados.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo Empaque</label>
                  <select
                    value={it.tipoEmpaque || ""}
                    onChange={(e) => updateItem(idx, "tipoEmpaque", e.target.value)}
                    className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione...</option>
                    {tiposEmpaque.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cantidad y Unidad Facturación */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cant. Empaque</label>
                  <input
                    type="number"
                    value={it.cantidadEmpaque || ""}
                    onChange={(e) => updateItem(idx, "cantidadEmpaque", e.target.value)}
                    className="border rounded p-2 w-full text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unidad Fact.</label>
                  <select
                    value={it.unidadFacturacion || ""}
                    onChange={(e) => updateItem(idx, "unidadFacturacion", e.target.value)}
                    className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione...</option>
                    {unidadesFacturacion.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tallos y Ramos */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tallos/Ramo</label>
                  <input
                    type="number"
                    value={it.tallosRamo || ""}
                    onChange={(e) => updateItem(idx, "tallosRamo", e.target.value)}
                    className="border rounded p-2 w-full text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ramos/Caja</label>
                  <input
                    type="number"
                    value={it.ramosCaja || ""}
                    onChange={(e) => updateItem(idx, "ramosCaja", e.target.value)}
                    className="border rounded p-2 w-full text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
              </div>

              {/* Precio y Predio */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Precio Venta</label>
                  <input
                    type="number"
                    value={it.precioVenta || ""}
                    onChange={(e) => updateItem(idx, "precioVenta", e.target.value)}
                    className="border rounded p-2 w-full text-sm text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Predio</label>
                  <select
                    value={it.predio || ""}
                    onChange={(e) => updateItem(idx, "predio", e.target.value)}
                    className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione...</option>
                    {predios.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2 rounded">
                <div className="text-center">
                  <div className="text-gray-600">Tallos/Caja</div>
                  <div className="font-medium">{it.tallosCaja || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Total Tallos</div>
                  <div className="font-medium">{it.totTallosRegistro || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Valor</div>
                  <div className="font-medium text-green-600">{formatCurrency(it.valorRegistro || 0)}</div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-red-600 hover:text-red-800 text-xs font-medium bg-red-50 hover:bg-red-100 px-3 py-2 rounded transition w-full"
              >
                Eliminar Producto
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
            <p>No hay productos en el detalle</p>
          </div>
        )}
      </div>
    </section>
  );
}