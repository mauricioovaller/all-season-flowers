// src/modules/compras/ModalGenerarOrdenCompra.jsx
import React, { useState } from "react";
import Swal from "sweetalert2";
import ModalVisorPreliminar from "../../modules/compras/ModalVisorPreliminar";
import { generarPDFOrdenCompra } from "../../services/compras/comprasService";

export default function ModalGenerarOrdenCompra({
  isOpen,
  onClose,
  compraNumero,
  compraId,
}) {
  const [cargando, setCargando] = useState(false);
  const [mostrarPDF, setMostrarPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  if (!isOpen) return null;

  const handleGenerarPDF = async (conPrecio = true) => {
    try {
      setCargando(true);

      // Mostrar mensaje de carga
      Swal.fire({
        title: 'Generando Orden de Compra...',
        text: 'Preparando documento PDF',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      console.log("📋 Generando PDF para compra:", compraId);

      // Llamar al servicio
      const pdfBlob = await generarPDFOrdenCompra(compraId, conPrecio);

      console.log("✅ PDF recibido como blob");

      // Crear URL para el visor
      const url = URL.createObjectURL(pdfBlob);
      console.log("🌐 URL creada para el PDF");

      // Cerrar loading
      Swal.close();

      // Guardar URL y mostrar visor
      setPdfUrl(url);
      setMostrarPDF(true);

      console.log("👁️ Mostrando visor de PDF");

    } catch (error) {
      console.error("❌ Error generando PDF:", error);

      Swal.close();

      Swal.fire({
        icon: 'error',
        title: 'Error al generar PDF',
        html: `
          <div class="text-left">
            <p class="font-medium">${error.message}</p>
            <p class="text-sm text-gray-500 mt-2">
              No se pudo generar la orden de compra. Verifica que:
            </p>
            <ul class="list-disc pl-5 text-xs text-gray-600 mt-1">
              <li>La compra esté guardada correctamente</li>
              <li>El servidor esté disponible</li>
              <li>Los datos de la compra sean válidos</li>
            </ul>
          </div>
        `,
        confirmButtonText: 'Entendido'
      });
    } finally {
      setCargando(false);
    }
  };

  const handleCerrarPDF = () => {
    console.log("🔴 Cerrando visor de PDF");
    setMostrarPDF(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl); // Liberar memoria
      setPdfUrl(null);
    }
    // No cerramos el modal principal cuando se cierra el PDF
  };

  const handleCerrarTodo = () => {
    // Primero cerrar el PDF si está abierto
    if (mostrarPDF) {
      handleCerrarPDF();
    }
    // Luego cerrar el modal principal
    onClose();
  };

  return (
    <>
      {/* Modal principal - SIMPLE */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                📋 Generar Orden de Compra
              </h3>
              <button
                onClick={handleCerrarTodo}
                className="text-gray-500 hover:text-gray-700"
                disabled={cargando}
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Generar orden de compra para:
              </p>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center mb-4">
                <p className="font-bold text-lg text-purple-600">{compraNumero}</p>
                <p className="text-sm text-gray-500 mt-1">ID de compra: {compraId}</p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-1">
                  ¿Qué pasará al generar la orden?
                </p>
                <ul className="text-xs text-blue-600 space-y-1 list-disc pl-4">
                  <li>Se generará el PDF de orden de compra</li>
                  <li>Se usará el ID de compra como número de orden</li>
                  <li>El PDF se abrirá en el visor</li>
                  <li>Podrás imprimirlo o guardarlo desde el visor</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCerrarTodo}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleGenerarPDF(false)}
                disabled={cargando}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${cargando
                    ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
              >
                {cargando ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m6 2H6a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z" />
                  </svg>
                )}
                <span>{cargando ? 'Generando...' : 'Sin Precio'}</span>
              </button>
              <button
                onClick={() => handleGenerarPDF(true)}
                disabled={cargando}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${cargando
                    ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
              >
                {cargando ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{cargando ? 'Generando...' : 'Con Precio'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal del PDF (se abre cuando se genera) */}
      {mostrarPDF && pdfUrl && (
        <ModalVisorPreliminar
          url={pdfUrl}
          onClose={handleCerrarPDF}
        />
      )}
    </>
  );
}