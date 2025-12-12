// src/components/pedidos/EmpaqueItem.jsx - VERSIÓN REORGANIZADA COMPACTA
import React, { useState, useEffect, useCallback } from "react";
import { getVariedadesYGrados } from "../../services/pedidos/pedidosService";

function formatCurrency(v) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(v || 0);
}

export default function EmpaqueItem({
  empaqueIndex,
  items,
  onChangeItems,
  productos = [],
  tiposEmpaque = [],
  unidadesFacturacion = [],
  predios = [],
  cantidadEmpaque = 1,
  estaExpandido: empaqueExpandido,
}) {
  const [variedadesPorProducto, setVariedadesPorProducto] = useState({});
  const [gradosPorProducto, setGradosPorProducto] = useState({});
  const [cargandoVariedades, setCargandoVariedades] = useState({});
  const [itemExpandido, setItemExpandido] = useState({});

  // Efecto para auto-cálculo de tallos en bouquets
  useEffect(() => {
    const nuevosItems = items.map(item => {
      if (item.esBouquet && item.receta && item.receta.length > 0) {
        const sumaReceta = item.receta.reduce((sum, ing) => sum + (Number(ing.tallosPorBouquet) || 0), 0);
        if (Number(item.tallosRamo) !== sumaReceta) {
          return {
            ...item,
            tallosRamo: sumaReceta,
            ...recalcularItem({ ...item, tallosRamo: sumaReceta }, cantidadEmpaque)
          };
        }
      }
      return item;
    });

    const hayCambios = nuevosItems.some((newItem, index) => {
      const oldItem = items[index];
      return newItem.tallosRamo !== oldItem.tallosRamo;
    });

    if (hayCambios) {
      onChangeItems(nuevosItems);
    }
  }, [items, cantidadEmpaque, onChangeItems]);

  useEffect(() => {
    items.forEach((item, index) => {
      if (item.producto && !variedadesPorProducto[item.producto]) {
        // Solo cargar si no está ya cargado
        cargarVariedadesYGrados(item.producto, index, "producto").then(() => {
          // Después de cargar, asegurar que el select muestre el valor correcto
          // Esto se hará automáticamente porque el estado se actualiza
        });
      }
    });
  }, [items]); // Se ejecuta cuando items cambia

  // Efecto para cargar variedades/grados de los ingredientes en recetas
  useEffect(() => {
    const cargarVariedadesParaRecetas = async () => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.esBouquet && item.receta && item.receta.length > 0) {
          for (let j = 0; j < item.receta.length; j++) {
            const ingrediente = item.receta[j];
            if (ingrediente.producto && !variedadesPorProducto[ingrediente.producto]) {
              try {
                await cargarVariedadesYGrados(ingrediente.producto, i, "ingrediente");
                // Pequeña pausa
                await new Promise(resolve => setTimeout(resolve, 50));
              } catch (error) {
                console.error(`Error cargando variedades para ingrediente ${ingrediente.producto}:`, error);
              }
            }
          }
        }
      }
      setTimeout(() => {
        sincronizarVariedadesIngredientes();
      }, 500);
    };

    cargarVariedadesParaRecetas();
  }, [items]); // Se ejecuta cuando cambian los items


  // Efecto para recalcular productos cuando se cargan datos iniciales
  useEffect(() => {
    // Solo recalcular si hay items y el empaque está expandido
    if (items.length > 0 && empaqueExpandido) {
      const nuevosItems = items.map(item => {
        // Asegurar que totTallosRegistro y valorRegistro estén calculados
        if (!item.totTallosRegistro || !item.valorRegistro || item.totTallosRegistro === 0) {
          return recalcularItem(item, cantidadEmpaque);
        }
        return item;
      });

      // Verificar si hubo cambios
      const huboCambios = nuevosItems.some((newItem, index) => {
        const oldItem = items[index];
        return newItem.totTallosRegistro !== oldItem.totTallosRegistro ||
          newItem.valorRegistro !== oldItem.valorRegistro;
      });

      if (huboCambios) {
        onChangeItems(nuevosItems);
      }
    }
  }, [items, cantidadEmpaque, empaqueExpandido]); // Dependencias clave

  function addItem() {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newItem = {
      id,
      producto: "",
      variedad: "",
      grado: "",
      descripcion: "",
      unidadFacturacion: "",
      tallosRamo: 0,
      ramosCaja: 0,
      tallosCaja: 0,
      precioVenta: 0,
      totTallosRegistro: 0,
      valorRegistro: 0,
      predio: "",
      esBouquet: false,
      receta: [],
      cantidadBouquets: 1,
    };
    onChangeItems([...items, newItem]);
    setItemExpandido(prev => ({ ...prev, [id]: true }));
  }

  function removeItem(index) {
    const copy = items.slice();
    const itemId = copy[index].id;
    copy.splice(index, 1);
    onChangeItems(copy);
    setItemExpandido(prev => {
      const nuevo = { ...prev };
      delete nuevo[itemId];
      return nuevo;
    });
  }

  function toggleItemExpandido(itemId) {
    setItemExpandido(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }

  // Función para construir la descripción automáticamente
  function construirDescripcionAutomatica(item) {
    let descripcion = "";

    const productoObj = productos.find(p => p.id === item.producto);
    const variedadObj = getVariedadesPorProducto(item.producto).find(v => v.id === item.variedad);
    const gradoObj = getGradosPorProducto(item.producto).find(g => g.id === item.grado);

    if (productoObj) descripcion = productoObj.descripcion;
    if (variedadObj) descripcion = descripcion ? `${descripcion} ${variedadObj.nombre}` : variedadObj.nombre;
    if (gradoObj) descripcion = descripcion ? `${descripcion} ${gradoObj.nombre}` : gradoObj.nombre;

    return descripcion.trim();
  }

  function updateItem(index, field, value) {
    const copy = items.map((it) => ({ ...it }));
    const item = copy[index];
    if (!item) return;

    if (field === "producto") {
      const prod = productos.find((p) => String(p.id) === String(value));
      if (prod) {
        item.producto = prod.id;
        item.variedad = "";
        item.grado = "";
        item.descripcion = prod.descripcion || "";

        const nombreProducto = (prod.descripcion || "").toLowerCase();
        item.esBouquet = nombreProducto.includes("bouquet") ||
          nombreProducto.includes("ramo compuesto") ||
          nombreProducto.includes("composición");

        if (item.esBouquet) {
          item.ramosCaja = 1;
          item.cantidadBouquets = item.cantidadBouquets || 1;
          item.receta = item.receta || [];
          if (item.receta.length === 0) {
            item.receta = [{
              id: `${Date.now()}_ingrediente`,
              producto: "",
              variedad: "",
              tallosPorBouquet: 1,
            }];
          }
        } else {
          item.cantidadBouquets = 0;
          item.receta = [];
        }

        cargarVariedadesYGrados(prod.id, index, "producto");

        setTimeout(() => {
          const nuevaDescripcion = construirDescripcionAutomatica(item);
          if (nuevaDescripcion && nuevaDescripcion !== item.descripcion) {
            item.descripcion = nuevaDescripcion;
            copy[index] = recalcularItem(item, cantidadEmpaque);
            onChangeItems(copy);
          }
        }, 100);
      } else {
        item.producto = "";
        item.variedad = "";
        item.grado = "";
        item.descripcion = "";
        item.esBouquet = false;
        item.receta = [];
      }
    } else if (field === "variedad" || field === "grado") {
      item[field] = value;
      const nuevaDescripcion = construirDescripcionAutomatica(item);
      if (nuevaDescripcion && nuevaDescripcion !== item.descripcion) {
        item.descripcion = nuevaDescripcion;
      }

    } else if (["tallosRamo", "ramosCaja", "cantidadBouquets"].includes(field)) {
      // Campos enteros
      item[field] = Number(value || 0);

    } else if (field === "precioVenta") {
      // Para precio, guardar como string mientras se escribe
      // La conversión a número se hará en recalcularItem
      item[field] = value;
    } else {
      item[field] = value;
    }

    copy[index] = recalcularItem(item, cantidadEmpaque);
    onChangeItems(copy);
  }

  function recalcularItem(item, cantEmpaqueFisico) {
    const cantidadEmpaques = Number(cantEmpaqueFisico) || 1;

    // Asegurar que tenemos números válidos
    const tallosRamo = Number(item.tallosRamo) || 0;
    const ramosCaja = Number(item.ramosCaja) || 0;
    const cantidadBouquets = Number(item.cantidadBouquets) || 1;

    // Convertir precioVenta a número (maneja decimales con punto o coma)
    const precioStr = String(item.precioVenta || "0");
    const precioNumero = parseFloat(precioStr.replace(/,/g, '.')) || 0;

    let tallosCaja = 0;
    let totTallosRegistro = 0;
    let valorRegistro = 0;

    if (item.esBouquet) {
      // Para bouquets
      tallosCaja = tallosRamo;
      totTallosRegistro = tallosRamo * cantidadBouquets * cantidadEmpaques;

      const unidad = unidadesFacturacion.find(u => u.id === item.unidadFacturacion);
      if (unidad?.nombre === "Stem/Tallo") {
        valorRegistro = totTallosRegistro * precioNumero;
      } else {
        valorRegistro = cantidadBouquets * cantidadEmpaques * precioNumero;
      }
    } else {
      // Para productos simples
      tallosCaja = tallosRamo * ramosCaja;
      totTallosRegistro = tallosCaja * cantidadEmpaques;

      const unidad = unidadesFacturacion.find(u => u.id === item.unidadFacturacion);
      if (unidad?.nombre === "Stem/Tallo") {
        valorRegistro = totTallosRegistro * precioNumero;
      } else if (unidad?.nombre === "Bunch/Ramo" || unidad?.nombre === "Bouquet" || unidad?.nombre === "Consumer/Bunch") {
        valorRegistro = cantidadEmpaques * ramosCaja * precioNumero;
      } else {
        valorRegistro = totTallosRegistro * precioNumero;
      }
    }

    return {
      ...item,
      tallosRamo, // Asegurar que sea número
      ramosCaja, // Asegurar que sea número
      cantidadBouquets, // Asegurar que sea número
      precioVenta: item.precioVenta, // Mantener como string para input
      tallosCaja,
      totTallosRegistro,
      valorRegistro,
    };
  }

  const cargarVariedadesYGrados = async (idProducto, itemIndex, tipo = "producto") => {
    if (!idProducto) return Promise.resolve(); // ← Cambiar return

    const key = tipo === "producto"
      ? `producto_${empaqueIndex}_${itemIndex}`
      : `ingrediente_${empaqueIndex}_${itemIndex}_${Date.now()}`;

    try {
      setCargandoVariedades(prev => ({ ...prev, [key]: true }));
      const datos = await getVariedadesYGrados(idProducto);

      setVariedadesPorProducto(prev => ({
        ...prev,
        [idProducto]: datos.variedades || []
      }));

      setGradosPorProducto(prev => ({
        ...prev,
        [idProducto]: datos.grados || []
      }));

      return Promise.resolve(); // ← Agregar este return

    } catch (error) {
      console.error(`Error cargando variedades y grados:`, error);
      setVariedadesPorProducto(prev => ({ ...prev, [idProducto]: [] }));
      setGradosPorProducto(prev => ({ ...prev, [idProducto]: [] }));
      return Promise.reject(error); // ← Agregar este return
    } finally {
      setTimeout(() => {
        setCargandoVariedades(prev => ({ ...prev, [key]: false }));
      }, 500);
    }
  };

  const getVariedadesPorProducto = (productoId) => {
    if (!productoId) return [];
    return variedadesPorProducto[productoId] || [];
  };

  const getGradosPorProducto = (productoId) => {
    if (!productoId) return [];
    return gradosPorProducto[productoId] || [];
  };

  // ----- FUNCIONES PARA RECETAS (SIMPLIFICADAS) -----
  function addIngredienteReceta(itemIndex) {
    const copy = items.map((it) => ({ ...it }));
    const item = copy[itemIndex];

    if (!item.receta) item.receta = [];

    const ingredienteId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    item.receta.push({
      id: ingredienteId,
      producto: "",
      variedad: "",
      tallosPorBouquet: 1,
    });

    copy[itemIndex] = recalcularItem(item, cantidadEmpaque);
    onChangeItems(copy);
  }

  function removeIngredienteReceta(itemIndex, ingredienteIndex) {
    const copy = items.map((it) => ({ ...it }));
    const item = copy[itemIndex];

    if (item.receta && item.receta.length > ingredienteIndex) {
      item.receta.splice(ingredienteIndex, 1);
      copy[itemIndex] = recalcularItem(item, cantidadEmpaque);
      onChangeItems(copy);
    }
  }

  function updateIngredienteReceta(itemIndex, ingredienteIndex, field, value) {
    const copy = items.map((it) => ({ ...it }));
    const item = copy[itemIndex];

    if (item.receta && item.receta.length > ingredienteIndex) {
      const ingrediente = item.receta[ingredienteIndex];

      if (field === "producto") {
        const prod = productos.find((p) => String(p.id) === String(value));
        if (prod) {
          ingrediente.producto = prod.id;
          ingrediente.variedad = "";
          // Cargar variedades para este producto de ingrediente
          cargarVariedadesYGrados(prod.id, itemIndex, "ingrediente").then(() => {
            // Después de cargar las variedades, si hay una variedad guardada, seleccionarla
            const variedadGuardada = item.receta?.[ingredienteIndex]?.variedad;
            if (variedadGuardada) {
              setTimeout(() => {
                // Esto permite que el select de variedad se actualice con el valor guardado
                const nuevaCopy = [...items];
                if (nuevaCopy[itemIndex]?.receta?.[ingredienteIndex]) {
                  nuevaCopy[itemIndex].receta[ingredienteIndex].variedad = variedadGuardada;
                  onChangeItems(nuevaCopy);
                }
              }, 300);
            }
          });
        } else {
          ingrediente.producto = "";
          ingrediente.variedad = "";
        }
      } else if (field === "tallosPorBouquet") {
        ingrediente[field] = Number(value || 0);
      } else {
        ingrediente[field] = value;
      }

      copy[itemIndex] = recalcularItem(item, cantidadEmpaque);
      onChangeItems(copy);
    }
  }

  // Función para sincronizar variedades de ingredientes después de cargar
  const sincronizarVariedadesIngredientes = useCallback(() => {
    const nuevosItems = [...items];
    let huboCambios = false;

    nuevosItems.forEach((item, itemIndex) => {
      if (item.esBouquet && item.receta) {
        item.receta.forEach((ingrediente, ingIndex) => {
          if (ingrediente.producto && ingrediente.variedad) {
            const variedadesDisponibles = getVariedadesPorProducto(ingrediente.producto);
            const variedadExiste = variedadesDisponibles.some(v => String(v.id) === String(ingrediente.variedad));

            if (!variedadExiste && variedadesDisponibles.length > 0) {
              // Si la variedad guardada no existe en las opciones cargadas
              // Podemos resetearla o mantenerla según tu lógica de negocio
              // item.receta[ingIndex].variedad = ""; // <- Descomenta si quieres resetear
              // huboCambios = true;
            }
          }
        });
      }
    });

    if (huboCambios) {
      onChangeItems(nuevosItems);
    }
  }, [items, variedadesPorProducto]);

  const calcularSumaReceta = (receta) => {
    if (!receta || receta.length === 0) return 0;
    return receta.reduce((sum, ing) => sum + (Number(ing.tallosPorBouquet) || 0), 0);
  };

  // Si el empaque NO está expandido, mostrar solo resumen
  if (!empaqueExpandido) {
    return (
      <div className="border rounded p-2 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="text-xs font-medium text-gray-700">
            {items.length} producto{items.length !== 1 ? 's' : ''}
          </div>
          <div className="text-xs">
            <span className="font-medium">
              {items.reduce((sum, item) => sum + (item.totTallosRegistro || 0), 0)} tallos •{" "}
              {formatCurrency(items.reduce((sum, item) => sum + (item.valorRegistro || 0), 0))}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Si el empaque SÍ está expandido, mostrar todo
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={addItem}
          className="bg-green-600 text-white rounded px-3 py-1.5 hover:bg-green-700 transition font-medium text-xs"
        >
          + Agregar Producto
        </button>
      </div>

      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const key = `producto_${empaqueIndex}_${idx}`;
          const cargando = cargandoVariedades[key];
          const sumaReceta = calcularSumaReceta(item.receta);
          const tallosBouquet = Number(item.tallosRamo) || 0;
          const recetaValida = item.esBouquet ? sumaReceta === tallosBouquet : true;
          const estaItemExpandido = itemExpandido[item.id] !== false;
          const nombreProducto = productos.find(p => p.id === item.producto)?.descripcion || "Sin seleccionar";

          return (
            <div key={item.id} className="border rounded bg-white shadow-sm">
              {/* Encabezado del producto */}
              <div className="p-2 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleItemExpandido(item.id)}
                      className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                    >
                      <svg
                        className={`w-3 h-3 transform transition-transform ${estaItemExpandido ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">
                          {nombreProducto}
                        </span>
                        {item.esBouquet && (
                          <span className="text-xs font-medium bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                            BQ
                          </span>
                        )}
                      </div>
                      {item.descripcion && (
                        <div className="text-xs text-gray-500 truncate mt-0.5 max-w-[250px]">
                          {item.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-medium">{item.totTallosRegistro || 0} tallos</div>
                      <div className="text-xs font-bold text-green-600">{formatCurrency(item.valorRegistro || 0)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-600 hover:text-red-800 text-xs bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Campos del producto - SOLO SI ESTÁ EXPANDIDO - REORGANIZADO */}
              {estaItemExpandido && (
                <div className="p-2 space-y-2">
                  {/* FILA 1: Producto, Variedad, Grado, Descripción */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
                    {/* Producto */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Producto *</label>
                      <select
                        value={item.producto || ""}
                        onChange={(e) => updateItem(idx, "producto", e.target.value)}
                        className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        disabled={cargando}
                      >
                        <option value="">-- Seleccione --</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variedad */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Variedad</label>
                      <select
                        value={item.variedad || ""}
                        onChange={(e) => updateItem(idx, "variedad", e.target.value)}
                        className="border rounded p-1 w-full text-xs"
                        disabled={!item.producto || cargando}
                      >
                        <option value="">-- Seleccione --</option>
                        {getVariedadesPorProducto(item.producto).map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Grado */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Grado</label>
                      <select
                        value={item.grado || ""}
                        onChange={(e) => updateItem(idx, "grado", e.target.value)}
                        className="border rounded p-1 w-full text-xs"
                        disabled={!item.producto || cargando}
                      >
                        <option value="">-- Seleccione --</option>
                        {getGradosPorProducto(item.producto).map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Descripción *</label>
                      <input
                        type="text"
                        value={item.descripcion || ""}
                        onChange={(e) => updateItem(idx, "descripcion", e.target.value)}
                        className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Se autocompleta"
                        required
                      />
                    </div>
                  </div>

                  {/* FILA 2: Unidad, Tallos/Ramo, Ramos/Caja, Precio, Total Tallos, Predio */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-1.5">
                    {/* Unidad */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Unidad *</label>
                      <select
                        value={item.unidadFacturacion || ""}
                        onChange={(e) => updateItem(idx, "unidadFacturacion", e.target.value)}
                        className="border rounded p-1 w-full text-xs"
                      >
                        <option value="">-- Seleccione --</option>
                        {unidadesFacturacion.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tallos por Ramo/Bouquet */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        {item.esBouquet ? "Tallos/BQ" : "Tallos/Ramo"} *
                      </label>
                      {item.esBouquet ? (
                        <div className="border rounded p-1 bg-gray-50 text-xs text-center font-medium">
                          {sumaReceta}
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={item.tallosRamo || ""}
                          onChange={(e) => updateItem(idx, "tallosRamo", e.target.value)}
                          className="border rounded p-1 w-full text-xs text-center"
                          min="0"
                        />
                      )}
                    </div>

                    {/* Ramos por Caja o Cant. Bouquets */}
                    {!item.esBouquet ? (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Ramos/Caja *</label>
                        <input
                          type="number"
                          value={item.ramosCaja || ""}
                          onChange={(e) => updateItem(idx, "ramosCaja", e.target.value)}
                          className="border rounded p-1 w-full text-xs text-center"
                          min="0"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Cant. BQs *</label>
                        <input
                          type="number"
                          value={item.cantidadBouquets || ""}
                          onChange={(e) => updateItem(idx, "cantidadBouquets", e.target.value)}
                          className="border rounded p-1 w-full text-xs text-center"
                          min="1"
                        />
                      </div>
                    )}

                    {/* Precio Venta - VERSIÓN SIMPLE QUE SÍ FUNCIONA */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Precio *</label>
                      <input
                        type="text"
                        value={item.precioVenta || ""}
                        onChange={(e) => {
                          // Solo guardar lo que el usuario escribe
                          updateItem(idx, "precioVenta", e.target.value);
                        }}
                        className="border rounded p-1 w-full text-xs text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Total Tallos (readonly) */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Total Tallos</label>
                      <div className="border rounded p-1 bg-gray-50 text-xs text-center font-medium">
                        {item.totTallosRegistro || 0}
                      </div>
                    </div>

                    {/* Predio */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Predio</label>
                      <select
                        value={item.predio || ""}
                        onChange={(e) => updateItem(idx, "predio", e.target.value)}
                        className="border rounded p-1 w-full text-xs"
                      >
                        <option value="">-- Seleccione --</option>
                        {predios.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Receta para Bouquet */}
                  {item.esBouquet && item.receta && item.receta.length > 0 && (
                    <div className="border rounded p-1.5 bg-purple-50">
                      <div className="flex justify-between items-center mb-1">
                        <h6 className="font-medium text-purple-800 text-xs">Receta</h6>
                        <button
                          type="button"
                          onClick={() => addIngredienteReceta(idx)}
                          className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                        >
                          + Ingrediente
                        </button>
                      </div>

                      <div className="space-y-1">
                        {item.receta.map((ing, ingIdx) => (
                          <div key={ing.id} className="border rounded p-1 bg-white">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="text-xs text-gray-600">#{ingIdx + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeIngredienteReceta(idx, ingIdx)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <div>
                                <select
                                  value={ing.producto || ""}
                                  onChange={(e) => updateIngredienteReceta(idx, ingIdx, "producto", e.target.value)}
                                  className="border rounded p-0.5 w-full text-xs"
                                >
                                  <option value="">Producto</option>
                                  {productos.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.descripcion}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <select
                                  value={ing.variedad || ""}
                                  onChange={(e) => updateIngredienteReceta(idx, ingIdx, "variedad", e.target.value)}
                                  className="border rounded p-0.5 w-full text-xs"
                                  disabled={!ing.producto}
                                >
                                  <option value="">Variedad</option>
                                  {getVariedadesPorProducto(ing.producto).map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.nombre}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <input
                                  type="number"
                                  value={ing.tallosPorBouquet || 0}
                                  onChange={(e) => updateIngredienteReceta(idx, ingIdx, "tallosPorBouquet", e.target.value)}
                                  className="border rounded p-0.5 w-full text-xs text-center"
                                  min="1"
                                  placeholder="Tallos"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-1 text-center text-xs">
                        <span className={`font-bold ${recetaValida ? 'text-green-600' : 'text-red-600'}`}>
                          {sumaReceta} tallos totales
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Resumen */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-gray-50 rounded text-xs">
                    <div className="text-center">
                      <div className="text-gray-600">Tallos/Caja</div>
                      <div className="font-medium">{item.tallosCaja || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Total Tallos</div>
                      <div className="font-medium">{item.totTallosRegistro || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Valor Total</div>
                      <div className="font-medium text-green-600">{formatCurrency(item.valorRegistro || 0)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-3 border-2 border-dashed rounded bg-gray-50">
          <p className="text-gray-600 text-xs">No hay productos en este empaque</p>
        </div>
      )}
    </div>
  );
}