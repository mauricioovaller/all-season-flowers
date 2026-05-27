// src/modules/pedidos/ModalFitosanitario.jsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { apiUrl } from "../../config/api.js";
import ModalVisorPreliminar from "./ModalVisorPreliminar";
import {
  obtenerUltimoNumeroFitosanitario,
  generarFitosanitario,
  generarPDFFitosanitario
} from "../../services/pedidos/pedidosService";

export default function ModalFitosanitario({
  isOpen,
  onClose,
  pedidoId,
  pedidoNumero,
  fitoExistente = false,
  numeroFitoExistente = "",
  onFitosanitarioGenerada
}) {
  const [cargando, setCargando] = useState(false);
  const [ultimoNumero, setUltimoNumero] = useState(null);
  const [siguienteNumero, setSiguienteNumero] = useState("");
  const [error, setError] = useState(null);

  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [urlPDF, setUrlPDF] = useState(null);

  // Cargar último número de fitosanitario al abrir el modal (solo si no existe)
  useEffect(() => {
    if (isOpen && !fitoExistente) {
      cargarUltimoNumeroFitosanitario();
    }
  }, [isOpen, fitoExistente]);

  const cargarUltimoNumeroFitosanitario = async () => {
    try {
      setCargando(true);
      setError(null);

      const resultado = await obtenerUltimoNumeroFitosanitario();

      if (resultado.success) {
        setUltimoNumero(resultado.ultimoNumero);
        setSiguienteNumero(resultado.siguienteNumeroFormateado || `FITO-${String(resultado.ultimoNumero + 1).padStart(6, "0")}`);
      } else {
        // Fallback: usar valor por defecto
        setUltimoNumero(resultado.ultimoNumero || 0);
        setSiguienteNumero(`FITO-${String((resultado.ultimoNumero || 0) + 1).padStart(6, "0")}`);

        if (resultado.message) {
          console.warn(resultado.message);
        }
      }
    } catch (err) {
      console.error("Error al cargar último número:", err);
      setError("No se pudo conectar con el servidor");
      // Fallback extremo
      setSiguienteNumero("FITO-000001");
    } finally {
      setCargando(false);
    }
  };

  const handleGenerarFitosanitario = async () => {
    if (!pedidoId || pedidoId === "000000") {
      Swal.fire("Error", "ID de pedido inválido", "error");
      return;
    }

    try {
      setCargando(true);

      // Mostrar confirmación
      const confirmacion = await Swal.fire({
        title: '¿Generar Fitosanitario?',
        html: `
          <div class="text-left">
            <p>Se asignará al pedido:</p>
            <p class="font-bold">${pedidoNumero}</p>
            <p class="mt-2">El siguiente número de fitosanitario:</p>
            <p class="text-xl font-bold text-amber-600">${siguienteNumero}</p>
            <p class="text-sm text-gray-500 mt-3">¿Está seguro de continuar?</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, generar fitosanitario',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#F59E0B',
      });

      if (!confirmacion.isConfirmed) {
        setCargando(false);
        return;
      }

      // Llamar al servicio para generar el fitosanitario
      const resultado = await generarFitosanitario(
        parseInt(pedidoId),
        siguienteNumero
      );

      if (resultado.success) {
        // Éxito
        Swal.fire({
          icon: 'success',
          title: '¡Fitosanitario Generado!',
          html: `
            <div class="text-center">
              <p class="font-bold text-lg">${siguienteNumero}</p>
              <div class="mt-3 text-sm text-left bg-amber-50 p-3 rounded border border-amber-200">
                <p><strong>Pedido:</strong> ${pedidoNumero}</p>
                <p><strong>Fitosanitario:</strong> ${siguienteNumero}</p>
                <p><strong>Vigencia:</strong> ${resultado.fechaVigenciaInicial} al ${resultado.fechaVigenciaFinal}</p>
                <p><strong>Mensaje:</strong> ${resultado.message}</p>
              </div>
              <p class="text-xs text-gray-500 mt-4">
                Ahora puedes imprimir el fitosanitario desde el botón de impresión.
              </p>
            </div>
          `,
          confirmButtonText: 'Aceptar'
        });

        // Notificar al componente padre
        onFitosanitarioGenerada({
          numeroFitosanitario: siguienteNumero,
          numeroFitosanitarioInt: resultado.numeroFitosanitarioInt || parseInt(siguienteNumero.replace('FITO-', '')),
          fechaVigenciaInicial: resultado.fechaVigenciaInicial,
          fechaVigenciaFinal: resultado.fechaVigenciaFinal,
          fecha: new Date().toISOString(),
          pedidoId: pedidoId,
          ...resultado
        });

      } else {
        throw new Error(resultado.error || "Error desconocido");
      }

    } catch (err) {
      console.error("Error al generar fitosanitario:", err);

      Swal.fire({
        icon: 'error',
        title: 'Error al generar fitosanitario',
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

  const handleImprimirFitosanitario = async () => {
    console.log("🔵 handleImprimirFitosanitario INICIADO");

    try {
      setCargando(true);
      console.log("1. Cargando estado: true");

      if (!numeroFitoExistente) {
        console.error("❌ Error: numeroFitoExistente es:", numeroFitoExistente);
        throw new Error("No hay número de fitosanitario disponible");
      }

      console.log("2. Número fitosanitario:", numeroFitoExistente);

      // Mostrar mensaje de carga
      Swal.fire({
        title: 'Generando Fitosanitario...',
        text: 'Obteniendo datos para el PDF',
        allowOutsideClick: false,
        didOpen: () => {
          console.log("3. SweetAlert mostrado");
          Swal.showLoading();
        }
      });

      // Llamar directamente a la API para obtener el PDF como Blob
      const API_URL = apiUrl("pedidos");

      console.log("4. Número limpio para API:", numeroFitoExistente.replace("FITO-", ""));
      console.log("5. Llamando a API...");

      const res = await fetch(`${API_URL}/ApiGenerarPDFFitosanitario.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numeroFitosanitario: numeroFitoExistente.replace("FITO-", ""),
          tipo: "fitosanitario"
        }),
      });

      console.log("6. Respuesta HTTP:", res.status, res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error respuesta API:", errorText);
        throw new Error(`Error HTTP: ${res.status}`);
      }

      // Obtener como Blob
      const pdfBlob = await res.blob();
      console.log("7. Blob obtenido, tamaño:", pdfBlob.size, "type:", pdfBlob.type);

      // Crear URL para el visor
      const fileURL = URL.createObjectURL(pdfBlob);
      console.log("8. URL creada:", fileURL.substring(0, 50) + "...");

      // Cerrar loading
      Swal.close();
      console.log("9. SweetAlert cerrado");

      // Mostrar en visor
      setUrlPDF(fileURL);
      setMostrarVisor(true);
      console.log("✅ Visor activado");

    } catch (error) {
      console.error("❌ ERROR CAPTURADO:", error);
      console.error("Stack trace:", error.stack);

      Swal.close();

      Swal.fire({
        icon: 'error',
        title: 'Error al generar fitosanitario',
        html: `
        <div class="text-left">
          <p class="font-medium">${error.message}</p>
          <p class="text-sm text-gray-500 mt-2">Consulta la consola para más detalles.</p>
        </div>
        `,
        confirmButtonText: 'Entendido'
      });
    } finally {
      setCargando(false);
      console.log("🔄 Cargando estado: false");
    }
  };

  // Función para cerrar el visor
  const handleCerrarVisor = () => {
    console.log("🔴 Cerrando visor");
    setMostrarVisor(false);
    if (urlPDF) {
      URL.revokeObjectURL(urlPDF); // Liberar memoria
      setUrlPDF(null);
    }
  };

  // ============================================
  // 1. MODAL PARA FITOSANITARIO EXISTENTE
  // ============================================
  if (fitoExistente && isOpen) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">🌿 Fitosanitario ya Generado</h3>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={cargando}
                >
                  ✕
                </button>
              </div>

              <div className="text-center p-4">
                <div className="text-4xl mb-3 text-amber-500">✅</div>
                <p className="text-gray-700 mb-2">Este pedido ya tiene un fitosanitario asignado:</p>
                <div className="text-xl font-bold text-amber-600 mb-6">
                  {numeroFitoExistente || "FITO-000000"}
                </div>

                <div className="space-y-3">
                  {/* Botón para imprimir fitosanitario */}
                  <button
                    onClick={() => {
                      console.log("🟢 Botón CLICKEADO");
                      handleImprimirFitosanitario();
                    }}
                    disabled={cargando}
                    className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        <span>📄 Imprimir Fitosanitario</span>
                      </>
                    )}
                  </button>

                  {/* Botón para cerrar */}
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-600 mb-1">Información:</p>
                  <p>• El estado del pedido ha cambiado a "Fitosanitado"</p>
                  <p>• Puedes imprimir el fitosanitario cuantas veces necesites</p>
                  <p>• Validez: 2 días desde la fecha de entrega</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VISOR DE PDF */}
        {mostrarVisor && urlPDF && (
          <ModalVisorPreliminar
            url={urlPDF}
            onClose={handleCerrarVisor}
          />
        )}
      </>
    );
  }

  // ============================================
  // 2. MODAL PARA GENERAR NUEVO FITOSANITARIO
  // ============================================
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">🌿 Generar Fitosanitario</h3>
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
                  onClick={cargarUltimoNumeroFitosanitario}
                  className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
                >
                  Reintentar
                </button>
              </div>
            ) : null}

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Se asignará un nuevo fitosanitario al pedido <span className="font-semibold">{pedidoNumero}</span>
              </p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Último fitosanitario generado */}
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Último fitosanitario</div>
                  <div className="text-sm font-semibold">
                    {ultimoNumero !== null
                      ? ultimoNumero > 0
                        ? `FITO-${String(ultimoNumero).padStart(6, "0")}`
                        : "Ninguno"
                      : cargando ? "Cargando..." : "---"
                    }
                  </div>
                </div>

                {/* Próximo fitosanitario */}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-xs text-gray-600 mb-1">Próximo fitosanitario</div>
                  <div className="text-lg font-bold text-amber-600">
                    {siguienteNumero || (cargando ? "Cargando..." : "---")}
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="text-xs text-gray-500 p-3 bg-green-50 rounded border border-green-100 mt-3">
                <div className="font-medium text-green-700 mb-1">✓ ¿Qué pasará al generar el fitosanitario?</div>
                <ul className="list-disc pl-4 space-y-1 mt-1">
                  <li>Se asignará el número <span className="font-semibold">{siguienteNumero || "FITO-XXXXXX"}</span> al pedido</li>
                  <li>El estado del pedido cambiará a "Fitosanitado"</li>
                  <li>Se guardará la fecha de vigencia (2 días desde entrega)</li>
                  <li>Podrás imprimir el fitosanitario desde el botón de impresión</li>
                  <li>No se podrá generar otro fitosanitario para este pedido</li>
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
                onClick={handleGenerarFitosanitario}
                disabled={cargando || !siguienteNumero}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${cargando || !siguienteNumero
                  ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
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
                    <span>Generar Fitosanitario</span>
                  </>
                )}
              </button>
            </div>

            {/* Advertencia importante */}
            <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <p className="font-medium">📋 Nota importante:</p>
              <p>El fitosanitario tendrá validez de 2 días desde la fecha de entrega del pedido.</p>
            </div>
          </div>
        </div>
      </div>

      {/* VISOR DE PDF */}
      {mostrarVisor && urlPDF && (
        <ModalVisorPreliminar
          url={urlPDF}
          onClose={handleCerrarVisor}
        />
      )}
    </>
  );
}