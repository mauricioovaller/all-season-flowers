// src/modules/pedidos/ModalPlanilla.jsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import API_BASE from "../../config/api.js";
import ModalVisorPreliminar from "./ModalVisorPreliminar";
import {
  obtenerUltimoNumeroPlanilla,
  generarPlanilla,
  obtenerPlanilla,
  obtenerDestinoPedido
} from "../../services/pedidos/pedidosService";

export default function ModalPlanilla({
  isOpen,
  onClose,
  pedidoId,
  pedidoNumero,
  facturaExistente = false,
  numeroFacturaExistente = "",
  planillaExistente = false,
  numeroPlanillaExistente = "",
  conductores = [],
  ayudantes = [],
  onPlanillaGenerada
}) {
  const [cargando, setCargando] = useState(false);
  const [cargandoPlanilla, setCargandoPlanilla] = useState(false);
  const [ultimoNumero, setUltimoNumero] = useState(null);
  const [siguienteNumero, setSiguienteNumero] = useState("");
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    conductorId: "",
    ayudanteId: "",
    placa: "",
    precinto: "0",
    destinoFinal: ""
  });

  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [urlPDF, setUrlPDF] = useState(null);

  // Auto-cargar Placa SOLO cuando el usuario cambia el conductor (no en carga inicial)
  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'conductorId' && value) {
        const conductor = conductores.find(c => c.id === value);
        if (conductor && conductor.placas) {
          updated.placa = conductor.placas;
        }
      }
      return updated;
    });
  };

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (!planillaExistente) {
        cargarDatosPlanillaNueva();
      } else if (numeroPlanillaExistente) {
        cargarDatosPlanillaExistente();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, planillaExistente, numeroPlanillaExistente]);

  const cargarDestinoPedido = async () => {
    try {
      const resultado = await obtenerDestinoPedido(parseInt(pedidoId));
      if (resultado.success && resultado.destino_completo) {
        setFormData(prev => ({
          ...prev,
          destinoFinal: resultado.destino_completo
        }));
      }
    } catch (err) {
      console.error("Error al cargar destino del pedido:", err);
    }
  };

  const cargarDatosPlanillaNueva = async () => {
    setError(null);
    // Cargar último número de planilla y destino del pedido en paralelo
    await Promise.all([
      cargarUltimoNumeroPlanilla(),
      cargarDestinoPedido()
    ]);
  };

  const cargarDatosPlanillaExistente = async () => {
    try {
      setCargando(true);
      const resultado = await obtenerPlanilla(numeroPlanillaExistente.replace("PLAN-", ""));

      if (resultado.success) {
        const destino = resultado.planilla.DestinoFinal || resultado.planilla.destino_completo || "";
        setFormData({
          conductorId: resultado.planilla.IdConductor?.toString() || "",
          ayudanteId: resultado.planilla.IdAyudante?.toString() || "",
          placa: resultado.planilla.Placa || "",
          precinto: resultado.planilla.Precinto?.toString() || "0",
          destinoFinal: destino
        });
      }
    } catch (err) {
      console.error("Error al cargar datos de planilla:", err);
    } finally {
      setCargando(false);
    }
  };

  const cargarUltimoNumeroPlanilla = async () => {
    try {
      setCargando(true);

      const resultado = await obtenerUltimoNumeroPlanilla();

      if (resultado.success) {
        setUltimoNumero(resultado.ultimoNumero);
        setSiguienteNumero(resultado.siguienteNumeroFormateado || `PLAN-${String(resultado.ultimoNumero + 1).padStart(4, "0")}`);
      } else {
        setUltimoNumero(resultado.ultimoNumero || 0);
        setSiguienteNumero(`PLAN-${String((resultado.ultimoNumero || 0) + 1).padStart(4, "0")}`);
      }
    } catch (err) {
      console.error("Error al cargar último número:", err);
      setError("No se pudo conectar con el servidor");
      setSiguienteNumero("PLAN-0001");
    } finally {
      setCargando(false);
    }
  };

  const validarFormulario = () => {
    const errores = [];

    if (!formData.conductorId) {
      errores.push("El conductor es obligatorio");
    }

    if (!formData.placa || formData.placa.trim() === "") {
      errores.push("La placa del vehículo es obligatoria");
    }

    if (!formData.precinto || formData.precinto.trim() === "") {
      errores.push("El número de precinto es obligatorio");
    }

    if (!formData.destinoFinal || formData.destinoFinal.trim() === "") {
      errores.push("El destino final es obligatorio");
    }

    return errores;
  };

  const handleGenerarPlanilla = async () => {
    if (!facturaExistente || !numeroFacturaExistente) {
      Swal.fire({
        icon: 'error',
        title: 'Factura requerida',
        text: 'El pedido debe tener una factura asignada antes de generar la planilla.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Si Destino Final está vacío, ofrecer recuperarlo de la dirección del cliente
    if (!formData.destinoFinal || formData.destinoFinal.trim() === "") {
      const recovery = await Swal.fire({
        title: 'Destino Final vacío',
        text: 'El Destino Final está vacío. ¿Desea usar la dirección del cliente para completar este campo?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, usar dirección del cliente',
        cancelButtonText: 'No, prefiero escribirla',
        confirmButtonColor: '#3B82F6',
      });

      if (recovery.isConfirmed) {
        const result = await obtenerDestinoPedido(parseInt(pedidoId));
        if (result.success && result.destino_completo) {
          formData.destinoFinal = result.destino_completo;
          setFormData(prev => ({ ...prev, destinoFinal: result.destino_completo }));
        }
      }
    }

    const errores = validarFormulario();
    if (errores.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Errores de validación',
        html: `
          <div class="text-left">
            <p class="font-semibold mb-2">Por favor corrija los siguientes errores:</p>
            <ul class="list-disc pl-5 space-y-1">
              ${errores.map(error => `<li class="text-sm">${error}</li>`).join('')}
            </ul>
          </div>
        `,
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      setCargando(true);

      const confirmacion = await Swal.fire({
        title: planillaExistente ? '¿Actualizar Planilla?' : '¿Generar Planilla?',
        html: `
          <div class="text-left">
            <p>Se ${planillaExistente ? 'actualizará' : 'asignará'} al pedido:</p>
            <p class="font-bold">${pedidoNumero}</p>
            <p class="mt-2">${planillaExistente ? 'Planilla existente:' : 'Nueva planilla:'}</p>
            <p class="text-xl font-bold text-blue-600">${planillaExistente ? numeroPlanillaExistente : siguienteNumero}</p>
            <div class="mt-3 text-sm bg-blue-50 p-2 rounded">
              <p><strong>Conductor:</strong> ${conductores.find(c => c.id === formData.conductorId)?.nombre || 'No seleccionado'}</p>
              <p><strong>Placa:</strong> ${formData.placa}</p>
              <p><strong>Precinto:</strong> ${formData.precinto}</p>
              <p><strong>Destino:</strong> <span class="text-xs">${formData.destinoFinal.substring(0, 50)}...</span></p>
            </div>
            <p class="text-sm text-gray-500 mt-3">¿Está seguro de continuar?</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: planillaExistente ? 'Sí, actualizar' : 'Sí, generar planilla',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3B82F6',
      });

      if (!confirmacion.isConfirmed) {
        setCargando(false);
        return;
      }

      const resultado = await generarPlanilla(
        parseInt(pedidoId),
        planillaExistente ? numeroPlanillaExistente.replace("PLAN-", "") : siguienteNumero.replace("PLAN-", ""),
        {
          conductorId: parseInt(formData.conductorId),
          ayudanteId: formData.ayudanteId ? parseInt(formData.ayudanteId) : 0,
          placa: formData.placa.trim(),
          precinto: formData.precinto.trim(),
          destinoFinal: formData.destinoFinal.trim()
        }
      );

      if (resultado.success) {
        Swal.fire({
          icon: 'success',
          title: planillaExistente ? '¡Planilla Actualizada!' : '¡Planilla Generada!',
          html: `
            <div class="text-center">
              <p class="font-bold text-lg">${planillaExistente ? numeroPlanillaExistente : siguienteNumero}</p>
              <div class="mt-3 text-sm text-left bg-blue-50 p-3 rounded border border-blue-200">
                <p><strong>Pedido:</strong> ${pedidoNumero}</p>
                <p><strong>Planilla:</strong> ${planillaExistente ? numeroPlanillaExistente : siguienteNumero}</p>
                <p><strong>Conductor:</strong> ${conductores.find(c => c.id === formData.conductorId)?.nombre || 'No especificado'}</p>
                <p><strong>Placa:</strong> ${formData.placa}</p>
                <p><strong>Precinto:</strong> ${formData.precinto}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
                <p><strong>Mensaje:</strong> ${resultado.message}</p>
              </div>
              <p class="text-xs text-gray-500 mt-4">
                Ahora puedes imprimir la planilla desde el botón de impresión.
              </p>
            </div>
          `,
          confirmButtonText: 'Aceptar'
        });

        if (onPlanillaGenerada) {
          onPlanillaGenerada({
            numeroPlanilla: planillaExistente ? numeroPlanillaExistente : siguienteNumero,
            numeroPlanillaInt: resultado.numeroPlanillaInt || parseInt((planillaExistente ? numeroPlanillaExistente : siguienteNumero).replace('PLAN-', '')),
            fecha: new Date().toISOString(),
            pedidoId: pedidoId,
            conductorId: parseInt(formData.conductorId),
            ayudanteId: formData.ayudanteId ? parseInt(formData.ayudanteId) : 0,
            placa: formData.placa,
            precinto: formData.precinto,
            ...resultado
          });
        }

      } else {
        throw new Error(resultado.error || "Error desconocido");
      }

    } catch (err) {
      console.error("Error al generar planilla:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error al generar planilla',
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
  // FUNCIÓN PRINCIPAL PARA IMPRIMIR PLANILLA
  // ============================================
  const handleImprimirPlanilla = async () => {
    console.log("🔵 handleImprimirPlanilla INICIADO");

    try {
      setCargandoPlanilla(true);

      const numeroPlanilla = planillaExistente ? numeroPlanillaExistente : siguienteNumero;

      if (!numeroPlanilla) {
        throw new Error("No hay número de planilla disponible");
      }

      console.log("Número planilla:", numeroPlanilla);

      Swal.fire({
        title: 'Generando Planilla...',
        text: 'Obteniendo datos para el PDF',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const numero = numeroPlanilla.replace("PLAN-", "");

      const apiUrl = `${API_BASE}/pedidos/ApiGenerarPDFPlanilla.php`;

      console.log("Enviando solicitud a API...");

      const formData = new FormData();
      formData.append('numeroPlanilla', numero);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });

      console.log("Respuesta HTTP:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error respuesta API:", errorText);
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const pdfBlob = await response.blob();

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("No se recibió el PDF o está vacío");
      }

      console.log("✅ Blob obtenido, tamaño:", pdfBlob.size, "type:", pdfBlob.type);

      const fileURL = URL.createObjectURL(pdfBlob);

      setUrlPDF(fileURL);
      setMostrarVisor(true);

      Swal.close();
      console.log("✅ PDF cargado en visor");

    } catch (error) {
      console.error("ERROR:", error);

      Swal.close();

      Swal.fire({
        icon: 'warning',
        title: 'Error al cargar en visor',
        text: 'Intentando abrir en nueva pestaña',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        const numero = (planillaExistente ? numeroPlanillaExistente : siguienteNumero).replace("PLAN-", "");
        const directUrl = `${API_BASE}/pedidos/ApiGenerarPDFPlanilla.php?numeroPlanilla=${numero}`;
        window.open(directUrl, '_blank');
      });
    } finally {
      setCargandoPlanilla(false);
    }
  };

  const handleCerrarVisor = () => {
    console.log("🔴 Cerrando visor");
    setMostrarVisor(false);
    if (urlPDF) {
      URL.revokeObjectURL(urlPDF);
      setUrlPDF(null);
    }
  };

  // Componente de formulario reutilizable para ambos modos
  const renderFormFields = (disabled = false) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          Conductor <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.conductorId}
          onChange={(e) => handleFormChange('conductorId', e.target.value)}
          className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled}
        >
          <option value="">Seleccionar conductor</option>
          {conductores.map((conductor) => (
            <option key={conductor.id} value={conductor.id}>
              {conductor.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          Placa del Vehículo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.placa}
          onChange={(e) => handleFormChange('placa', e.target.value.toUpperCase())}
          className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="ABC-123"
          maxLength="50"
          disabled={disabled}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          Ayudante
        </label>
        <select
          value={formData.ayudanteId}
          onChange={(e) => handleFormChange('ayudanteId', e.target.value)}
          className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled}
        >
          <option value="">Sin ayudante</option>
          {ayudantes.map((ayudante) => (
            <option key={ayudante.id} value={ayudante.id}>
              {ayudante.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          N° Precinto <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.precinto}
          onChange={(e) => handleFormChange('precinto', e.target.value)}
          className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="000001"
          disabled={disabled}
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          Destino Final <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.destinoFinal}
          onChange={(e) => handleFormChange('destinoFinal', e.target.value)}
          className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Dirección de destino final"
          rows="2"
          disabled={disabled}
        />
        <p className="text-xs text-gray-400 mt-0.5">
          Dirección del cliente como valor predeterminado
        </p>
      </div>
    </div>
  );

  // ============================================
  // 1. MODAL PARA PLANILLA EXISTENTE
  // ============================================
  if (planillaExistente && isOpen) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
            {/* Header compacto */}
            <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-800">📋 Planilla {numeroPlanillaExistente}</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Creada</span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                disabled={cargando || cargandoPlanilla}
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Datos de la planilla */}
              <div className="flex gap-3 text-xs text-gray-600 bg-blue-50 rounded p-2">
                <span>Pedido: <strong>{pedidoNumero}</strong></span>
                <span className="text-gray-300">|</span>
                <span>Factura: <strong>{numeroFacturaExistente || "N/A"}</strong></span>
              </div>

              {/* Formulario */}
              {renderFormFields(cargando)}

              {/* Información adicional */}
              <div className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Campos obligatorios. Si cambia el conductor, la placa se actualizará automáticamente.
              </div>
            </div>

            {/* Footer con botones */}
            <div className="px-4 py-3 border-t bg-gray-50 rounded-b-xl">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleGenerarPlanilla}
                  disabled={cargando}
                  className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-sm transition-colors ${cargando
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {cargando ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Actualizar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleImprimirPlanilla}
                  disabled={cargandoPlanilla}
                  className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-sm transition-colors ${cargandoPlanilla
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  {cargandoPlanilla ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>PDF...</span>
                    </>
                  ) : (
                    <>
                      <span>📄</span>
                      <span>Imprimir</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-white text-sm transition-colors"
                  disabled={cargando || cargandoPlanilla}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>

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
  // 2. MODAL PARA GENERAR NUEVA PLANILLA
  // ============================================
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
          {/* Header compacto */}
          <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50 rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-800">📋 Generar Planilla</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              disabled={cargando}
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Indicador de pedido */}
            <div className="text-xs text-gray-600 bg-blue-50 rounded p-2">
              Pedido: <strong>{pedidoNumero}</strong>
            </div>

            {/* Error */}
            {error && (
              <div className="p-2 bg-red-50 rounded border border-red-200 text-xs text-red-600">
                {error}
                <button
                  onClick={cargarDatosPlanillaNueva}
                  className="ml-2 text-red-700 hover:text-red-900 font-medium underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Validación de factura */}
            {!facturaExistente && (
              <div className="p-2 bg-red-50 rounded border border-red-200 text-xs text-red-600">
                ⚠️ Este pedido no tiene factura asignada. Genere una factura primero.
              </div>
            )}

            {/* Última / Próxima planilla */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-gray-50 rounded border text-center">
                <div className="text-xs text-gray-500">Última planilla</div>
                <div className="text-sm font-semibold">
                  {ultimoNumero !== null
                    ? ultimoNumero > 0
                      ? `PLAN-${String(ultimoNumero).padStart(4, "0")}`
                      : "Ninguna"
                    : cargando ? "..." : "---"
                  }
                </div>
              </div>
              <div className="p-2 bg-blue-50 rounded border border-blue-200 text-center">
                <div className="text-xs text-gray-600">Próxima planilla</div>
                <div className="text-base font-bold text-blue-600">
                  {siguienteNumero || (cargando ? "..." : "---")}
                </div>
              </div>
            </div>

            {/* Formulario */}
            {renderFormFields(cargando)}

            {/* Información adicional */}
            <div className="text-xs text-gray-500">
              <span className="text-red-500">*</span> Campos obligatorios. Al seleccionar un conductor, la placa se carga automáticamente. El destino final se pre-carga con la dirección del cliente.
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t bg-gray-50 rounded-b-xl">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onClose}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-white text-sm transition-colors disabled:opacity-50"
                disabled={cargando}
              >
                Cancelar
              </button>
              <div className="flex-1"></div>
              <button
                onClick={handleGenerarPlanilla}
                disabled={cargando || !siguienteNumero || !facturaExistente}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm transition-colors ${cargando || !siguienteNumero || !facturaExistente
                  ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {cargando ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Generar Planilla</span>
                  </>
                )}
              </button>
            </div>

            {/* Advertencia de requisitos */}
            <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <strong>Requisitos:</strong> Factura asignada • Conductor y placa obligatorios • Precinto válido • Destino final obligatorio
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
