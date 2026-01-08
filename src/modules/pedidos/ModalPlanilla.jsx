// src/modules/pedidos/ModalPlanilla.jsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import ModalVisorPreliminar from "./ModalVisorPreliminar";
import {
  obtenerUltimoNumeroPlanilla,
  generarPlanilla,
  generarPDFPlanilla,
  obtenerPlanilla
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
  onPlanillaGenerada,
  datosPedido = {}
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
    precinto: "0"
  });

  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [urlPDF, setUrlPDF] = useState(null);
  const [planillaData, setPlanillaData] = useState(null);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (!planillaExistente) {
        cargarUltimoNumeroPlanilla();
      } else if (numeroPlanillaExistente) {
        cargarDatosPlanillaExistente();
      }
    }
  }, [isOpen, planillaExistente, numeroPlanillaExistente]);

  const cargarDatosPlanillaExistente = async () => {
    try {
      setCargando(true);
      const resultado = await obtenerPlanilla(numeroPlanillaExistente.replace("PLAN-", ""));

      if (resultado.success) {
        setPlanillaData(resultado.planilla);
        setFormData({
          conductorId: resultado.planilla.IdConductor?.toString() || "",
          ayudanteId: resultado.planilla.IdAyudante?.toString() || "",
          placa: resultado.planilla.Placa || "",
          precinto: resultado.planilla.Precinto?.toString() || "0"
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
      setError(null);

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

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
          precinto: formData.precinto.trim()
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

      // Mostrar mensaje de carga
      Swal.fire({
        title: 'Generando Planilla...',
        text: 'Obteniendo datos para el PDF',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // Extraer número para la URL
      const numero = numeroPlanilla.replace("PLAN-", "");

      // URL de la API - MISMO FORMATO QUE FACTURA
      const apiUrl = `https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/pedidos/ApiGenerarPDFPlanilla.php`;

      console.log("Enviando solicitud a API...");

      // ✅ CAMBIO PRINCIPAL: Solicitar como FORM-DATA, no JSON
      const formData = new FormData();
      formData.append('numeroPlanilla', numero);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData  // ← Enviar como form-data, igual que factura
      });

      console.log("Respuesta HTTP:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error respuesta API:", errorText);
        throw new Error(`Error del servidor: ${response.status}`);
      }

      // ✅ CAMBIO: Obtener directamente como BLOB
      const pdfBlob = await response.blob();

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("No se recibió el PDF o está vacío");
      }

      console.log("✅ Blob obtenido, tamaño:", pdfBlob.size, "type:", pdfBlob.type);

      // Crear URL para el blob
      const fileURL = URL.createObjectURL(pdfBlob);

      // Mostrar en visor
      setUrlPDF(fileURL);
      setMostrarVisor(true);

      Swal.close();
      console.log("✅ PDF cargado en visor");

    } catch (error) {
      console.error("ERROR:", error);

      Swal.close();

      // Método de respaldo temporal
      Swal.fire({
        icon: 'warning',
        title: 'Error al cargar en visor',
        text: 'Intentando abrir en nueva pestaña',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        const numero = (planillaExistente ? numeroPlanillaExistente : siguienteNumero).replace("PLAN-", "");
        const directUrl = `https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/pedidos/ApiGenerarPDFPlanilla.php?numeroPlanilla=${numero}`;
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

  // ============================================
  // 1. MODAL PARA PLANILLA EXISTENTE
  // ============================================
  if (planillaExistente && isOpen) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">📋 Planilla ya Generada</h3>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={cargando || cargandoPlanilla}
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                  <p className="text-gray-700 mb-1">Este pedido ya tiene una planilla asignada:</p>
                  <div className="text-2xl font-bold text-blue-600">
                    {numeroPlanillaExistente || "PLAN-0000"}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Puedes modificarla o imprimirla</p>
                </div>

                {/* Formulario para modificar */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Conductor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conductor <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.conductorId}
                        onChange={(e) => handleFormChange('conductorId', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={cargando}
                      >
                        <option value="">Seleccionar conductor</option>
                        {conductores.map((conductor) => (
                          <option key={conductor.id} value={conductor.id}>
                            {conductor.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ayudante */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ayudante
                      </label>
                      <select
                        value={formData.ayudanteId}
                        onChange={(e) => handleFormChange('ayudanteId', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={cargando}
                      >
                        <option value="">Sin ayudante</option>
                        {ayudantes.map((ayudante) => (
                          <option key={ayudante.id} value={ayudante.id}>
                            {ayudante.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Placa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placa del Vehículo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.placa}
                        onChange={(e) => handleFormChange('placa', e.target.value.toUpperCase())}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ABC-123"
                        maxLength="10"
                        disabled={cargando}
                      />
                    </div>

                    {/* Precinto */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Precinto <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.precinto}
                        onChange={(e) => handleFormChange('precinto', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="000001"
                        disabled={cargando}
                      />
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="p-3 bg-gray-50 rounded-lg border text-xs text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">Información del pedido:</p>
                    <p>• Factura asociada: <span className="font-semibold">{numeroFacturaExistente || "Sin factura"}</span></p>
                    <p>• Pedido: <span className="font-semibold">{pedidoNumero}</span></p>
                    <p>• Los campos marcados con <span className="text-red-500">*</span> son obligatorios</p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Botón para actualizar */}
                <button
                  onClick={handleGenerarPlanilla}
                  disabled={cargando}
                  className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${cargando
                    ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {cargando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Actualizar Planilla</span>
                    </>
                  )}
                </button>

                {/* Botón para imprimir */}
                <button
                  onClick={handleImprimirPlanilla}
                  disabled={cargandoPlanilla}
                  className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${cargandoPlanilla
                    ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  {cargandoPlanilla ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generando PDF...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>📄 Imprimir Planilla</span>
                    </>
                  )}
                </button>

                {/* Botón para cerrar */}
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={cargando || cargandoPlanilla}
                >
                  Cerrar
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-600 mb-1">Información:</p>
                <p>• Puedes modificar los datos de la planilla cuantas veces necesites</p>
                <p>• Los cambios se guardarán automáticamente al hacer clic en "Actualizar Planilla"</p>
                <p>• Puedes imprimir la planilla actualizada cuantas veces necesites</p>
                <p>• La planilla incluye 3 documentos: Carta Policía, Carta Aerolínea y Despacho</p>
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
  // 2. MODAL PARA GENERAR NUEVA PLANILLA
  // ============================================
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">📋 Generar Planilla</h3>
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
                  onClick={cargarUltimoNumeroPlanilla}
                  className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
                >
                  Reintentar
                </button>
              </div>
            ) : null}

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Se generará una nueva planilla para el pedido <span className="font-semibold">{pedidoNumero}</span>
              </p>

              {/* Validación de factura */}
              {!facturaExistente && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
                  <p className="text-sm text-red-600 font-medium">⚠️ Advertencia:</p>
                  <p className="text-sm text-red-600">Este pedido no tiene factura asignada. Debe generar una factura primero.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Última planilla generada */}
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="text-xs text-gray-500 mb-1">Última planilla</div>
                  <div className="text-sm font-semibold">
                    {ultimoNumero !== null
                      ? ultimoNumero > 0
                        ? `PLAN-${String(ultimoNumero).padStart(4, "0")}`
                        : "Ninguna"
                      : cargando ? "Cargando..." : "---"
                    }
                  </div>
                </div>

                {/* Próxima planilla */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-gray-600 mb-1">Próxima planilla</div>
                  <div className="text-lg font-bold text-blue-600">
                    {siguienteNumero || (cargando ? "Cargando..." : "---")}
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Conductor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conductor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.conductorId}
                      onChange={(e) => handleFormChange('conductorId', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={cargando}
                    >
                      <option value="">Seleccionar conductor</option>
                      {conductores.map((conductor) => (
                        <option key={conductor.id} value={conductor.id}>
                          {conductor.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ayudante */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ayudante
                    </label>
                    <select
                      value={formData.ayudanteId}
                      onChange={(e) => handleFormChange('ayudanteId', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={cargando}
                    >
                      <option value="">Sin ayudante</option>
                      {ayudantes.map((ayudante) => (
                        <option key={ayudante.id} value={ayudante.id}>
                          {ayudante.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Placa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Placa del Vehículo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.placa}
                      onChange={(e) => handleFormChange('placa', e.target.value.toUpperCase())}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ABC-123"
                      maxLength="10"
                      disabled={cargando}
                    />
                  </div>

                  {/* Precinto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Precinto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.precinto}
                      onChange={(e) => handleFormChange('precinto', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="000001"
                      defaultValue="0"
                      disabled={cargando}
                    />
                  </div>
                </div>

                {/* Información adicional */}
                <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded border border-blue-100 mt-3">
                  <div className="font-medium text-blue-700 mb-1">✓ ¿Qué pasará al generar la planilla?</div>
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li>Se asignará el número <span className="font-semibold">{siguienteNumero || "PLAN-XXXX"}</span> al pedido</li>
                    <li>Se generarán 3 documentos: Carta Policía, Carta Aerolínea y Despacho</li>
                    <li>Los datos del conductor y vehículo quedarán registrados</li>
                    <li>Podrás imprimir la planilla completa desde el botón de impresión</li>
                    <li>Podrás modificar los datos después si es necesario</li>
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
                onClick={handleGenerarPlanilla}
                disabled={cargando || !siguienteNumero || !facturaExistente}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${cargando || !siguienteNumero || !facturaExistente
                  ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
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
                    <span>Generar Planilla</span>
                  </>
                )}
              </button>
            </div>

            {/* Advertencia importante */}
            <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <p className="font-medium">⚠️ Requisitos:</p>
              <p>1. El pedido debe tener factura asignada</p>
              <p>2. Conductor y placa son obligatorios</p>
              <p>3. Precinto debe ser un número válido (0 por defecto)</p>
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