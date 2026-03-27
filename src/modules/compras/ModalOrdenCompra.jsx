// src/modules/compras/ModalOrdenCompra.jsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  obtenerUltimoNumeroOrdenCompra,
  generarOrdenCompra,
} from "../../services/compras/comprasService";

export default function ModalOrdenCompra({
  isOpen,
  onClose,
  compraId,
  compraNumero,
  ordenCompraExistente = false,
  numeroOrdenCompraExistente = "",
  proveedor,
  comprador,
  fechaEntrega,
  observaciones,
  empaques = [],
  datosSelect = {},
  onOrdenCompraGenerada
}) {
  const [cargando, setCargando] = useState(false);
  const [ultimoNumero, setUltimoNumero] = useState(null);
  const [siguienteNumero, setSiguienteNumero] = useState("");
  const [error, setError] = useState(null);
  
  // Datos del proveedor y comprador
  const [infoProveedor, setInfoProveedor] = useState(null);
  const [infoComprador, setInfoComprador] = useState(null);

  // Cargar último número de orden de compra al abrir el modal
  useEffect(() => {
    if (isOpen && !ordenCompraExistente) {
      cargarUltimoNumeroOrdenCompra();
    }
    
    // Cargar información del proveedor y comprador
    if (isOpen && proveedor && comprador) {
      const proveedorInfo = datosSelect.proveedores?.find(p => p.id === proveedor);
      const compradorInfo = datosSelect.compradores?.find(c => c.id === comprador);
      
      setInfoProveedor(proveedorInfo);
      setInfoComprador(compradorInfo);
    }
  }, [isOpen, ordenCompraExistente, proveedor, comprador, datosSelect]);

  const cargarUltimoNumeroOrdenCompra = async () => {
    try {
      setCargando(true);
      setError(null);

      const resultado = await obtenerUltimoNumeroOrdenCompra();

      if (resultado.success) {
        setUltimoNumero(resultado.ultimoNumero);
        setSiguienteNumero(resultado.siguienteNumeroFormateado || `OC-${String(resultado.ultimoNumero + 1).padStart(6, "0")}`);
      } else {
        // Fallback: usar valor por defecto
        setUltimoNumero(resultado.ultimoNumero || 0);
        setSiguienteNumero(`OC-${String((resultado.ultimoNumero || 0) + 1).padStart(6, "0")}`);

        if (resultado.message) {
          console.warn(resultado.message);
        }
      }
    } catch (err) {
      console.error("Error al cargar último número:", err);
      setError("No se pudo conectar con el servidor");
      // Fallback extremo
      setSiguienteNumero("OC-000001");
    } finally {
      setCargando(false);
    }
  };

  // Calcular totales de la compra para mostrar en resumen
  const calcularResumenCompra = () => {
    let totalPiezas = 0;
    let totalFulles = 0;
    let totalTallos = 0;
    let totalValor = 0;

    empaques.forEach(empaque => {
      totalPiezas += Number(empaque.cantidadEmpaque) || 0;
      
      // Calcular fulles
      const tipoEmpaque = datosSelect.tiposEmpaque?.find(t => t.id === empaque.tipoEmpaque);
      const equivFull = tipoEmpaque?.equivFull || 1;
      totalFulles += (Number(empaque.cantidadEmpaque) || 0) * equivFull;
      
      // Sumar totales de items
      if (empaque.items && empaque.items.length > 0) {
        empaque.items.forEach(item => {
          totalTallos += Number(item.totTallosRegistro) || 0;
          totalValor += Number(item.valorRegistro) || 0;
        });
      }
    });

    return {
      totalPiezas,
      totalFulles: totalFulles.toFixed(3),
      totalTallos,
      totalValor
    };
  };

  const handleGenerarOrdenCompra = async () => {
    if (!compraId || compraId === "000000") {
      Swal.fire("Error", "ID de compra inválido", "error");
      return;
    }

    try {
      setCargando(true);

      // Mostrar confirmación
      const confirmacion = await Swal.fire({
        title: '¿Generar Orden de Compra?',
        html: `
          <div class="text-left">
            <p>Se asignará a la compra:</p>
            <p class="font-bold">${compraNumero}</p>
            <p class="mt-2">El siguiente número de orden:</p>
            <p class="text-xl font-bold text-purple-600">${siguienteNumero}</p>
            <div class="mt-3 text-xs text-gray-600">
              <p><strong>Proveedor:</strong> ${infoProveedor?.nombre || 'No disponible'}</p>
              <p><strong>Comprador:</strong> ${infoComprador?.nombre || 'No disponible'}</p>
              <p><strong>Entrega:</strong> ${fechaEntrega || 'No especificada'}</p>
            </div>
            <p class="text-sm text-gray-500 mt-3">¿Está seguro de continuar?</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, generar orden',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#8B5CF6',
      });

      if (!confirmacion.isConfirmed) {
        setCargando(false);
        return;
      }

      // Llamar al servicio para generar la orden de compra
      const resultado = await generarOrdenCompra(
        parseInt(compraId),
        siguienteNumero
      );

      if (resultado.success) {
        // Éxito
        Swal.fire({
          icon: 'success',
          title: '¡Orden de Compra Generada!',
          html: `
            <div class="text-center">
              <p class="font-bold text-lg">${siguienteNumero}</p>
              <div class="mt-3 text-sm text-left bg-purple-50 p-3 rounded border border-purple-200">
                <p><strong>Compra:</strong> ${compraNumero}</p>
                <p><strong>Orden:</strong> ${siguienteNumero}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
                <p><strong>Proveedor:</strong> ${infoProveedor?.nombre || 'No disponible'}</p>
                <p><strong>Comprador:</strong> ${infoComprador?.nombre || 'No disponible'}</p>
                <p><strong>Mensaje:</strong> ${resultado.message}</p>
              </div>
              <p class="text-xs text-gray-500 mt-4">
                Ahora puedes imprimir la orden de compra desde el botón de impresión.
              </p>
            </div>
          `,
          confirmButtonText: 'Aceptar'
        });

        // Notificar al componente padre
        onOrdenCompraGenerada({
          numeroOrdenCompra: siguienteNumero,
          numeroOrdenCompraInt: resultado.numeroOrdenCompraInt || parseInt(siguienteNumero.replace('OC-', '')),
          fecha: new Date().toISOString(),
          compraId: compraId,
          ...resultado
        });

      } else {
        throw new Error(resultado.error || "Error desconocido");
      }

    } catch (err) {
      console.error("Error al generar orden de compra:", err);

      Swal.fire({
        icon: 'error',
        title: 'Error al generar orden de compra',
        html: `
          <div class="text-left">
            <p>${err.message}</p>
            <p class="text-sm text-gray-500 mt-3">Intente nuevamente o contacte al administrador.</p>
          </div>
        `,
        confirmButtonText: 'Entendido'
      });

    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // 1. MODAL PARA ORDEN DE COMPRA EXISTENTE
  // ============================================
  if (ordenCompraExistente && isOpen) {
    const resumen = calcularResumenCompra();
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">📋 Orden de Compra Generada</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                disabled={cargando}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información de la compra */}
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">Información de la Compra</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Compra:</span> {compraNumero}</p>
                    <p><span className="font-medium">Orden:</span> {numeroOrdenCompraExistente}</p>
                    <p><span className="font-medium">Proveedor:</span> {infoProveedor?.nombre || 'No disponible'}</p>
                    <p><span className="font-medium">Comprador:</span> {infoComprador?.nombre || 'No disponible'}</p>
                    <p><span className="font-medium">Fecha Entrega:</span> {fechaEntrega || 'No especificada'}</p>
                  </div>
                </div>

                {/* Observaciones */}
                {observaciones && (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold text-gray-700 mb-2">Observaciones</h4>
                    <p className="text-sm text-gray-600">{observaciones}</p>
                  </div>
                )}
              </div>

              {/* Resumen de la compra */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Resumen de la Compra</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-gray-600">Empaques</div>
                      <div className="font-bold text-lg">{resumen.totalPiezas}</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-gray-600">Fulles</div>
                      <div className="font-bold text-lg">{resumen.totalFulles}</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-gray-600">Tallos</div>
                      <div className="font-bold text-lg">{resumen.totalTallos.toLocaleString()}</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-gray-600">Valor</div>
                      <div className="font-bold text-lg text-green-600">
                        ${resumen.totalValor.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalle de empaques */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold text-gray-700 mb-2">Empaques ({empaques.length})</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {empaques.map((empaque, idx) => (
                      <div key={idx} className="text-xs p-2 bg-white rounded border">
                        <div className="flex justify-between">
                          <span>Empaque {idx + 1}</span>
                          <span className="font-medium">
                            {empaque.cantidadEmpaque} x {datosSelect.tiposEmpaque?.find(t => t.id === empaque.tipoEmpaque)?.descripcion || 'Tipo'}
                          </span>
                        </div>
                        <div className="text-gray-500 mt-1">
                          {empaque.items?.length || 0} producto(s)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t">
            <div className="flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                disabled={cargando}
              >
                Cerrar
              </button>
              <div className="text-sm text-gray-500 text-center">
                La orden de compra ha sido generada exitosamente.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // 2. MODAL PARA GENERAR NUEVA ORDEN DE COMPRA
  // ============================================
  if (!isOpen) return null;

  const resumen = calcularResumenCompra();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📋 Generar Orden de Compra</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={cargando}
            >
              ✕
            </button>
          </div>

          {error ? (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={cargarUltimoNumeroOrdenCompra}
                className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información de la compra */}
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Se asignará una nueva orden de compra a:
                </p>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-semibold text-gray-800">{compraNumero}</p>
                </div>
              </div>

              {/* Información del proveedor y comprador */}
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border">
                  <h4 className="font-medium text-blue-700 mb-1">Información del Proveedor</h4>
                  <p className="text-sm">{infoProveedor?.nombre || 'Proveedor no seleccionado'}</p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border">
                  <h4 className="font-medium text-green-700 mb-1">Información del Comprador</h4>
                  <p className="text-sm">{infoComprador?.nombre || 'Comprador no seleccionado'}</p>
                </div>

                {fechaEntrega && (
                  <div className="p-3 bg-amber-50 rounded-lg border">
                    <h4 className="font-medium text-amber-700 mb-1">Fecha de Entrega</h4>
                    <p className="text-sm">{fechaEntrega}</p>
                  </div>
                )}
              </div>

              {/* Números de orden */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Última orden generada */}
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Última orden</div>
                  <div className="text-sm font-semibold">
                    {ultimoNumero !== null
                      ? ultimoNumero > 0
                        ? `OC-${String(ultimoNumero).padStart(6, "0")}`
                        : "Ninguna"
                      : cargando ? "Cargando..." : "---"
                    }
                  </div>
                </div>

                {/* Próxima orden */}
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-xs text-gray-600 mb-1">Próxima orden</div>
                  <div className="text-lg font-bold text-purple-600">
                    {siguienteNumero || (cargando ? "Cargando..." : "---")}
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen de la compra */}
            <div>
              <div className="p-4 bg-gray-50 rounded-lg border mb-4">
                <h4 className="font-semibold text-gray-700 mb-3">Resumen de la Compra</h4>
                
                {/* Totales */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-xs text-gray-600">Empaques</div>
                    <div className="text-lg font-bold">{resumen.totalPiezas}</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-xs text-gray-600">Fulles</div>
                    <div className="text-lg font-bold">{resumen.totalFulles}</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-xs text-gray-600">Tallos</div>
                    <div className="text-lg font-bold">{resumen.totalTallos.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-xs text-gray-600">Valor Total</div>
                    <div className="text-lg font-bold text-green-600">
                      ${resumen.totalValor.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Detalle de empaques */}
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Empaques ({empaques.length})</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {empaques.map((empaque, idx) => {
                      const tipoEmpaque = datosSelect.tiposEmpaque?.find(t => t.id === empaque.tipoEmpaque);
                      return (
                        <div key={idx} className="text-xs p-2 bg-white rounded border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Empaque {idx + 1}</span>
                            <span className="text-gray-600">
                              {empaque.cantidadEmpaque} x {tipoEmpaque?.descripcion || 'Tipo'}
                            </span>
                          </div>
                          <div className="mt-1 text-gray-500">
                            {empaque.items?.length || 0} producto(s) • PO: {empaque.poCodeEmpaque || 'Sin código'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded border border-blue-100">
                <div className="font-medium text-blue-700 mb-1">✓ ¿Qué pasará al generar la orden de compra?</div>
                <ul className="list-disc pl-4 space-y-1 mt-1">
                  <li>Se asignará el número <span className="font-semibold">{siguienteNumero || "OC-XXXXXX"}</span> a la compra</li>
                  <li>Se registrará la fecha de generación</li>
                  <li>Podrás imprimir la orden de compra desde el botón de impresión</li>
                  <li>No se podrá generar otra orden para esta compra</li>
                  <li>La orden será enviada al proveedor</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerarOrdenCompra}
              disabled={cargando || !siguienteNumero}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${cargando || !siguienteNumero
                ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
            >
              {cargando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Generar Orden de Compra</span>
                </>
              )}
            </button>
          </div>

          {/* Advertencia importante */}
          <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            <p className="font-medium">⚠️ Advertencia:</p>
            <p>Esta acción no se puede deshacer. Asegúrate de que todos los datos de la compra sean correctos antes de generar la orden.</p>
          </div>
        </div>
      </div>
    </div>
  );
}