// src/components/pedidos/PedidoEmpaque.jsx - VERSIÓN CON CÁLCULO DE FÜLLES
import React, { useState, useEffect } from "react";
import EmpaqueItem from "./EmpaqueItem";

// Colores diferenciados para cada empaque
const coloresEmpaques = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', header: 'bg-blue-100' },
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', header: 'bg-green-100' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', header: 'bg-purple-100' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', header: 'bg-amber-100' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', header: 'bg-rose-100' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', header: 'bg-cyan-100' },
];

function formatCurrency(v) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(v || 0);
}

export default function PedidoEmpaque({
  empaques,
  onChangeEmpaques,
  productos = [],
  tiposEmpaque = [],
  unidadesFacturacion = [],
  predios = [],
}) {
  // Estado para controlar qué empaques están expandidos
  const [empaquesExpandidos, setEmpaquesExpandidos] = useState({});


  // Efecto para recalcular totales cuando cambian los empaques
  useEffect(() => {
    if (empaques.length > 0) {
      const empaquesConTotales = empaques.map(empaque => {
        // Si ya tiene totales calculados, mantenerlos
        if (empaque.totalTallosEmpaque && empaque.valorTotalEmpaque && empaque.fullesEmpaque) {
          return empaque;
        }

        // Recalcular si faltan totales
        return recalcularTotalesEmpaque(empaque);
      });

      // Verificar si hubo cambios
      const huboCambios = empaquesConTotales.some((newEmp, index) => {
        const oldEmp = empaques[index];
        return newEmp.totalTallosEmpaque !== oldEmp.totalTallosEmpaque ||
          newEmp.valorTotalEmpaque !== oldEmp.valorTotalEmpaque ||
          newEmp.fullesEmpaque !== oldEmp.fullesEmpaque;
      });

      if (huboCambios) {
        onChangeEmpaques(empaquesConTotales);
      }
    }
  }, [empaques, tiposEmpaque]); // Se ejecuta cuando cambian los empaques o tiposEmpaque

  // Función para agregar un nuevo empaque
  function addEmpaque() {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nuevoEmpaque = {
      id,
      tipoEmpaque: "",
      cantidadEmpaque: 1,
      poCodeEmpaque: "",
      items: [],
      totalTallosEmpaque: 0,
      valorTotalEmpaque: 0,
      fullesEmpaque: 0, // <-- NUEVO: Fulles del empaque
    };
    onChangeEmpaques([...empaques, nuevoEmpaque]);
    // Expandir automáticamente el nuevo empaque
    setEmpaquesExpandidos(prev => ({ ...prev, [id]: true }));
  }

  // Función para eliminar un empaque
  function removeEmpaque(index) {
    const copy = [...empaques];
    const empaqueId = copy[index].id;
    copy.splice(index, 1);
    onChangeEmpaques(copy);
    // Remover del estado de expandidos
    setEmpaquesExpandidos(prev => {
      const nuevo = { ...prev };
      delete nuevo[empaqueId];
      return nuevo;
    });
  }

  // Función para alternar expansión de empaque
  function toggleEmpaqueExpandido(empaqueId) {
    setEmpaquesExpandidos(prev => ({
      ...prev,
      [empaqueId]: !prev[empaqueId]
    }));
  }

  // Función para actualizar datos del empaque
  function updateEmpaque(index, field, value) {
    const copy = [...empaques];
    copy[index] = { ...copy[index], [field]: value };

    // Recalcular totales del empaque (incluyendo fulles)
    if (field !== "items") {
      copy[index] = recalcularTotalesEmpaque(copy[index]);
    }

    onChangeEmpaques(copy);
  }

  // Función para actualizar items dentro de un empaque
  function updateItemsEmpaque(empaqueIndex, newItems) {
    const copy = [...empaques];
    copy[empaqueIndex].items = newItems;
    copy[empaqueIndex] = recalcularTotalesEmpaque(copy[empaqueIndex]);
    onChangeEmpaques(copy);
  }

  // Función para recalcular totales de un empaque (INCLUYENDO FÜLLES)
  function recalcularTotalesEmpaque(empaque) {
    let totalTallos = 0;
    let totalValor = 0;
    let totalFulles = 0; // <-- NUEVO

    // Calcular fulles según equivalencia del tipo de empaque
    const tipoEmpaque = tiposEmpaque.find(t => t.id === empaque.tipoEmpaque);
    const equivFull = tipoEmpaque?.equivFull || 1;
    const cantidadEmpaques = Number(empaque.cantidadEmpaque) || 0;
    totalFulles = cantidadEmpaques * equivFull;

    if (empaque.items && empaque.items.length > 0) {
      empaque.items.forEach(item => {
        totalTallos += Number(item.totTallosRegistro) || 0;
        totalValor += Number(item.valorRegistro) || 0;
      });
    }

    return {
      ...empaque,
      totalTallosEmpaque: totalTallos,
      valorTotalEmpaque: totalValor,
      fullesEmpaque: totalFulles, // <-- NUEVO
    };
  }

  // Calcular totales generales (INCLUYENDO FÜLLES CORRECTAMENTE)
  const totalPiezas = empaques.reduce((sum, emp) => sum + (Number(emp.cantidadEmpaque) || 0), 0);
  const totalFulles = empaques.reduce((sum, emp) => {
    const tipoEmpaque = tiposEmpaque.find(t => t.id === emp.tipoEmpaque);
    const equivFull = tipoEmpaque?.equivFull || 1;
    const cantidadEmpaques = Number(emp.cantidadEmpaque) || 0;
    return sum + (cantidadEmpaques * equivFull);
  }, 0);
  const totalTallos = empaques.reduce((sum, emp) => sum + (Number(emp.totalTallosEmpaque) || 0), 0);
  const totalValor = empaques.reduce((sum, emp) => sum + (Number(emp.valorTotalEmpaque) || 0), 0);

  return (
    <section className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-slate-700">Empaques</h3>
          <p className="text-xs text-gray-500">Cada empaque tiene un color diferente</p>
        </div>
        <button
          type="button"
          onClick={addEmpaque}
          className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition font-medium text-xs md:text-sm"
        >
          + Nuevo Empaque
        </button>
      </div>

      {/* Totales Generales COMPACTOS - AHORA CON FÜLLES CORRECTOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 p-2 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Empaques</div>
          <div className="text-base font-bold text-gray-900">{totalPiezas}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Fulles</div>
          <div className="text-base font-bold text-gray-900">{totalFulles.toFixed(3)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Tallos</div>
          <div className="text-base font-bold text-gray-900">{totalTallos}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Valor</div>
          <div className="text-base font-bold text-green-600">{formatCurrency(totalValor)}</div>
        </div>
      </div>

      {/* Lista de Empaques */}
      <div className="space-y-3">
        {empaques.map((empaque, empIndex) => {
          const estaExpandido = empaquesExpandidos[empaque.id];
          const tipoEmpaqueObj = tiposEmpaque.find(t => t.id === empaque.tipoEmpaque);
          const tipoEmpaqueDesc = tipoEmpaqueObj?.descripcion || "Seleccionar tipo";
          const equivFull = tipoEmpaqueObj?.equivFull || 1;
          const fullesCalculados = (Number(empaque.cantidadEmpaque) || 0) * equivFull;

          const colorIndex = empIndex % coloresEmpaques.length;
          const colores = coloresEmpaques[colorIndex];

          return (
            <div key={empaque.id} className={`border rounded-lg md:rounded-xl overflow-hidden ${colores.bg} ${colores.border}`}>
              {/* ENCABEZADO DEL EMPAQUE - SIEMPRE VISIBLE Y COMPACTO */}
              <div className={`p-2 ${colores.header} border-b ${colores.border}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleEmpaqueExpandido(empaque.id)}
                      className={`${colores.text} hover:opacity-80 flex-shrink-0`}
                    >
                      <svg
                        className={`w-4 h-4 transform transition-transform ${estaExpandido ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-gray-700 truncate">
                          Empaque #{empIndex + 1}
                        </span>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-white border">
                          {tipoEmpaqueDesc}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        PO: {empaque.poCodeEmpaque || "Sin código"} | Cant: {empaque.cantidadEmpaque} | Fulles: {fullesCalculados.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-medium">
                        <span className="text-gray-600">{empaque.totalTallosEmpaque || 0} tallos</span>
                      </div>
                      <div className="text-xs font-bold text-green-600">
                        {formatCurrency(empaque.valorTotalEmpaque || 0)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEmpaque(empIndex)}
                      className="text-red-600 hover:text-red-800 text-xs bg-white hover:bg-red-50 border border-red-200 px-2 py-1 rounded transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* CONTENIDO DEL EMPAQUE - SOLO SI ESTÁ EXPANDIDO */}
              {estaExpandido && (
                <>
                  {/* Configuración del Empaque - COMPACTA */}
                  <div className="p-3 border-b bg-white/50">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Tipo de Empaque */}
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">Tipo *</label>
                        <select
                          value={empaque.tipoEmpaque || ""}
                          onChange={(e) => updateEmpaque(empIndex, "tipoEmpaque", e.target.value)}
                          className="border rounded p-1.5 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-- Seleccione --</option>
                          {tiposEmpaque.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.descripcion} {t.equivFull !== 1 ? `(${t.equivFull} fulles)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cantidad de Empaques */}
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">Cantidad *</label>
                        <input
                          type="number"
                          value={empaque.cantidadEmpaque || 1}
                          onChange={(e) => updateEmpaque(empIndex, "cantidadEmpaque", e.target.value)}
                          className="border rounded p-1.5 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                        />
                      </div>

                      {/* PO-CODE del Empaque */}
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">PO-CODE</label>
                        <input
                          type="text"
                          value={empaque.poCodeEmpaque || ""}
                          onChange={(e) => updateEmpaque(empIndex, "poCodeEmpaque", e.target.value)}
                          className="border rounded p-1.5 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="PO del empaque"
                        />
                      </div>
                    </div>

                    {/* Totales del Empaque en línea - AHORA CON FÜLLES */}
                    <div className="mt-2 grid grid-cols-3 gap-1 p-1.5 bg-gray-50 rounded border">
                      <div className="text-center">
                        <div className="text-xs text-gray-600">Fulles</div>
                        <div className="text-sm font-bold">{fullesCalculados.toFixed(3)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600">Tallos</div>
                        <div className="text-sm font-bold">{empaque.totalTallosEmpaque || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600">Valor</div>
                        <div className="text-sm font-bold text-green-600">{formatCurrency(empaque.valorTotalEmpaque || 0)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Productos dentro del empaque */}
                  <div className="p-3">
                    <EmpaqueItem
                      empaqueIndex={empIndex}
                      items={empaque.items || []}
                      onChangeItems={(newItems) => updateItemsEmpaque(empIndex, newItems)}
                      productos={productos}
                      tiposEmpaque={tiposEmpaque}
                      unidadesFacturacion={unidadesFacturacion}
                      predios={predios}
                      cantidadEmpaque={empaque.cantidadEmpaque || 1}
                      estaExpandido={estaExpandido}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Estado vacío */}
      {empaques.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium text-sm">No hay empaques</p>
          <p className="text-xs text-gray-500 mt-0.5">Agregue empaques para comenzar</p>
        </div>
      )}

      {/* Instrucción rápida */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Tip:</span> Fulles se calculan según la equivalencia del tipo de empaque
        </p>
      </div>
    </section>
  );
}