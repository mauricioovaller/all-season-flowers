// src/modules/pedidos/ModalEtiqueta.jsx
import React, { useState } from "react";
import Swal from "sweetalert2";
import ModalVisorPreliminar from "./ModalVisorPreliminar";
import { generarPDFEtiquetas } from "../../services/pedidos/pedidosService";

export default function ModalEtiqueta({
  isOpen,
  onClose,
  pedidoId,
  pedidoNumero,
  totalPiezas = 0,
  datosPedido = {}
}) {
  const [cargando, setCargando] = useState(false);
  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [urlPDF, setUrlPDF] = useState(null);

  const handleImprimirEtiquetas = async () => {
    console.log("🔵 handleImprimirEtiquetas INICIADO");

    if (!pedidoId || pedidoId === "000000") {
      Swal.fire("Error", "ID de pedido inválido", "error");
      return;
    }

    if (totalPiezas === 0) {
      Swal.fire("Error", "El pedido no tiene piezas para generar etiquetas", "error");
      return;
    }

    try {
      setCargando(true);
      console.log("1. Generando etiquetas para pedido:", pedidoId);

      // Mostrar mensaje de carga
      Swal.fire({
        title: 'Generando Etiquetas...',
        html: `
          <div class="text-center">
            <p>Creando ${totalPiezas} etiquetas para:</p>
            <p class="font-bold">${pedidoNumero}</p>
            <p class="text-sm text-gray-500 mt-2">Por favor espere...</p>
          </div>
        `,
        allowOutsideClick: false,
        didOpen: () => {
          console.log("2. SweetAlert mostrado");
          Swal.showLoading();
        }
      });

      // 🔥 VERSIÓN SIMPLIFICADA: Llamar directamente a la API
      const API_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/pedidos";
      
      console.log("3. Llamando a API...");
      const res = await fetch(`${API_URL}/ApiGenerarPDFEtiqueta.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idPedido: parseInt(pedidoId),
          tipo: "marcacion"
        }),
      });

      console.log("4. Respuesta HTTP:", res.status, res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error respuesta API:", errorText);
        throw new Error(`Error HTTP: ${res.status}`);
      }

      // Obtener como Blob
      const pdfBlob = await res.blob();
      console.log("5. Blob obtenido, tamaño:", pdfBlob.size, "type:", pdfBlob.type);

      // Crear URL para el visor
      const fileURL = URL.createObjectURL(pdfBlob);
      console.log("6. URL creada:", fileURL.substring(0, 50) + "...");

      // Cerrar loading
      Swal.close();
      console.log("7. SweetAlert cerrado");

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
        title: 'Error al generar etiquetas',
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

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">🏷️ Generar Etiquetas</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                disabled={cargando}
              >
                ✕
              </button>
            </div>

            <div className="text-center p-4">
              <div className="text-4xl mb-3 text-purple-500">🏷️</div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">Se generarán etiquetas para el pedido:</p>
                <div className="text-xl font-bold text-gray-800 mb-2">{pedidoNumero}</div>
                
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 mt-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Total de etiquetas a generar</div>
                    <div className="text-2xl font-bold text-purple-600">{totalPiezas} etiquetas</div>
                    <div className="text-xs text-gray-500 mt-1">
                      (Una etiqueta por cada pieza del pedido)
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del pedido (opcional) */}
              {datosPedido && (
                <div className="text-left p-3 bg-gray-50 rounded border mb-4">
                  <p className="font-medium text-gray-700 mb-2">Información que incluirán las etiquetas:</p>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Cliente:</span> {datosPedido.cliente || "No especificado"}</p>
                    <p><span className="font-medium">AWB:</span> {datosPedido.awb || "No especificado"}</p>
                    <p><span className="font-medium">PO:</span> {datosPedido.poCliente || "No especificado"}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Botón para imprimir etiquetas */}
                <button
                  onClick={handleImprimirEtiquetas}
                  disabled={cargando || totalPiezas === 0}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      <span>📄 Generar {totalPiezas} Etiquetas</span>
                    </>
                  )}
                </button>

                {/* Botón para cancelar */}
                <button
                  onClick={onClose}
                  disabled={cargando}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>

              {/* Información adicional */}
              <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-600 mb-1">Notas importantes:</p>
                <p>• Se generará una etiqueta por cada pieza del pedido</p>
                <p>• La numeración será automática (1, 2, 3...)</p>
                <p>• El PDF incluirá todas las etiquetas en páginas separadas</p>
                <p>• Puedes imprimir las etiquetas cuantas veces necesites</p>
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