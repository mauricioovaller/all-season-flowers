// src/modules/pedidos/ModalFactura.jsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  obtenerUltimoNumeroFactura,
  generarFactura,
  generarPDFFactura,
  abrirPDF,
  generarYMostrarPDF
} from "../../services/pedidos/pedidosService";

export default function ModalFactura({
  isOpen,
  onClose,
  pedidoId,
  pedidoNumero,
  facturaExistente = false,
  numeroFacturaExistente = "",
  onFacturaGenerada
}) {
  const [cargando, setCargando] = useState(false);
  const [ultimoNumero, setUltimoNumero] = useState(null);
  const [siguienteNumero, setSiguienteNumero] = useState("");
  const [error, setError] = useState(null);

  // Cargar último número de factura al abrir el modal (solo si no existe factura)
  useEffect(() => {
    if (isOpen && !facturaExistente) {
      cargarUltimoNumeroFactura();
    }
  }, [isOpen, facturaExistente]);

  const cargarUltimoNumeroFactura = async () => {
    try {
      setCargando(true);
      setError(null);

      const resultado = await obtenerUltimoNumeroFactura();

      if (resultado.success) {
        setUltimoNumero(resultado.ultimoNumero);
        setSiguienteNumero(resultado.siguienteNumeroFormateado || `FACT-${String(resultado.ultimoNumero + 1).padStart(6, "0")}`);
      } else {
        // Fallback: usar valor por defecto
        setUltimoNumero(resultado.ultimoNumero || 0);
        setSiguienteNumero(`FACT-${String((resultado.ultimoNumero || 0) + 1).padStart(6, "0")}`);

        if (resultado.message) {
          console.warn(resultado.message);
        }
      }
    } catch (err) {
      console.error("Error al cargar último número:", err);
      setError("No se pudo conectar con el servidor");
      // Fallback extremo
      setSiguienteNumero("FACT-000001");
    } finally {
      setCargando(false);
    }
  };

  const handleGenerarFactura = async () => {
    if (!pedidoId || pedidoId === "000000") {
      Swal.fire("Error", "ID de pedido inválido", "error");
      return;
    }

    try {
      setCargando(true);

      // Mostrar confirmación
      const confirmacion = await Swal.fire({
        title: '¿Generar Factura?',
        html: `
          <div class="text-left">
            <p>Se asignará al pedido:</p>
            <p class="font-bold">${pedidoNumero}</p>
            <p class="mt-2">El siguiente número de factura:</p>
            <p class="text-xl font-bold text-green-600">${siguienteNumero}</p>
            <p class="text-sm text-gray-500 mt-3">¿Está seguro de continuar?</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, generar factura',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#10B981',
      });

      if (!confirmacion.isConfirmed) {
        setCargando(false);
        return;
      }

      // Llamar al servicio para generar la factura
      const resultado = await generarFactura(
        parseInt(pedidoId),
        siguienteNumero
      );

      if (resultado.success) {
        // Éxito
        Swal.fire({
          icon: 'success',
          title: '¡Factura Generada!',
          html: `
            <div class="text-center">
              <p class="font-bold text-lg">${siguienteNumero}</p>
              <div class="mt-3 text-sm text-left bg-green-50 p-3 rounded border border-green-200">
                <p><strong>Pedido:</strong> ${pedidoNumero}</p>
                <p><strong>Factura:</strong> ${siguienteNumero}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
                <p><strong>Mensaje:</strong> ${resultado.message}</p>
              </div>
              <p class="text-xs text-gray-500 mt-4">
                Ahora puedes imprimir la factura desde el botón de impresión.
              </p>
            </div>
          `,
          confirmButtonText: 'Aceptar'
        });

        // Notificar al componente padre
        onFacturaGenerada({
          numeroFactura: siguienteNumero,
          numeroFacturaInt: resultado.numeroFacturaInt || parseInt(siguienteNumero.replace('FACT-', '')),
          fecha: new Date().toISOString(),
          pedidoId: pedidoId,
          ...resultado
        });

      } else {
        throw new Error(resultado.error || "Error desconocido");
      }

    } catch (err) {
      console.error("Error al generar factura:", err);

      Swal.fire({
        icon: 'error',
        title: 'Error al generar factura',
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

  const handleImprimirFactura = async () => {
    try {
      setCargando(true);

      if (!numeroFacturaExistente) {
        throw new Error("No hay número de factura disponible");
      }

      // Mostrar mensaje de carga
      Swal.fire({
        title: 'Generando Factura...',
        text: 'Obteniendo datos para el PDF',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Obtener datos de la factura
      const datosFactura = await generarPDFFactura(numeroFacturaExistente);

      // Cerrar loading
      Swal.close();

      // Verificar que tenemos datos válidos
      if (!datosFactura || !datosFactura.success) {
        throw new Error(datosFactura?.error || "No se pudieron obtener los datos de la factura");
      }

      // Generar y mostrar el PDF
      generarYMostrarPDF(datosFactura);

    } catch (error) {
      console.error("Error al generar PDF:", error);

      Swal.fire({
        icon: 'error',
        title: 'Error al generar factura',
        html: `
        <div class="text-left">
          <p class="font-medium">${error.message}</p>
          <div class="mt-3 text-sm text-gray-600 bg-red-50 p-3 rounded">
            <p>Posibles causas:</p>
            <ul class="list-disc pl-4 mt-1">
              <li>El servidor de facturas no está disponible</li>
              <li>Error en la base de datos</li>
              <li>La factura no existe en el sistema</li>
              <li>La librería jsPDF no está cargada correctamente</li>
            </ul>
            <p class="mt-2">Revise la consola para más detalles.</p>
          </div>
        </div>
      `,
        confirmButtonText: 'Entendido'
      });

    } finally {
      setCargando(false);
    }
  };

  // ============================================
  // 1. MODAL PARA FACTURA EXISTENTE
  // ============================================
  if (facturaExistente && isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">🧾 Factura ya Generada</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                disabled={cargando}
              >
                ✕
              </button>
            </div>

            <div className="text-center p-4">
              <div className="text-4xl mb-3 text-green-500">✅</div>
              <p className="text-gray-700 mb-2">Este pedido ya tiene una factura asignada:</p>
              <div className="text-xl font-bold text-green-600 mb-6">
                {numeroFacturaExistente || "FACT-000000"}
              </div>

              <div className="space-y-3">
                {/* Botón para imprimir factura */}
                <button
                  onClick={handleImprimirFactura}
                  disabled={cargando}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {cargando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generando PDF...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>📄 Imprimir Factura</span>
                    </>
                  )}
                </button>

                {/* Botón para descargar factura (opcional) */}
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-600 mb-1">Información:</p>
                <p>• El estado del pedido ha cambiado a "Facturado"</p>
                <p>• Puedes imprimir la factura cuantas veces necesites</p>
                <p>• Para anular o modificar la factura, contacta al administrador</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // 2. MODAL PARA GENERAR NUEVA FACTURA
  // ============================================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🧾 Generar Factura</h3>
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
                onClick={cargarUltimoNumeroFactura}
                className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Se asignará una nueva factura al pedido <span className="font-semibold">{pedidoNumero}</span>
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Última factura generada */}
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-xs text-gray-500 mb-1">Última factura</div>
                <div className="text-sm font-semibold">
                  {ultimoNumero !== null
                    ? ultimoNumero > 0
                      ? `FACT-${String(ultimoNumero).padStart(6, "0")}`
                      : "Ninguna"
                    : cargando ? "Cargando..." : "---"
                  }
                </div>
              </div>

              {/* Próxima factura */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs text-gray-600 mb-1">Próxima factura</div>
                <div className="text-lg font-bold text-green-600">
                  {siguienteNumero || (cargando ? "Cargando..." : "---")}
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded border border-blue-100 mt-3">
              <div className="font-medium text-blue-700 mb-1">✓ ¿Qué pasará al generar la factura?</div>
              <ul className="list-disc pl-4 space-y-1 mt-1">
                <li>Se asignará el número <span className="font-semibold">{siguienteNumero || "FACT-XXXXXX"}</span> al pedido</li>
                <li>El estado del pedido cambiará a "Facturado"</li>
                <li>Se guardará la fecha de facturación</li>
                <li>Podrás imprimir la factura desde el botón de impresión</li>
                <li>No se podrá generar otra factura para este pedido</li>
              </ul>
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
              onClick={handleGenerarFactura}
              disabled={cargando || !siguienteNumero}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${cargando || !siguienteNumero
                ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
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
                  <span>Generar Factura</span>
                </>
              )}
            </button>
          </div>

          {/* Advertencia importante */}
          <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            <p className="font-medium">⚠️ Advertencia:</p>
            <p>Esta acción no se puede deshacer. Asegúrate de que todos los datos del pedido sean correctos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}