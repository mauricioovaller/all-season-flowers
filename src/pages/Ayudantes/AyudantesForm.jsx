// src/pages/Ayudantes/AyudantesForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Users, User, CreditCard, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

// Servicio para validaciones
import { validarCampoUnicoAyudante } from '../../services/ayudantes/ayudantesService';

const AyudantesForm = ({ ayudante, onSave, onCancel }) => {
    // Estado del formulario
    const [formData, setFormData] = useState({
        NomAyudante: '',
        NoCedula: '',
        ACTIVO: 1
    });

    // Estados para validaciones
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [validandoCampo, setValidandoCampo] = useState({});
    const [camposValidos, setCamposValidos] = useState({
        NomAyudante: true,
        NoCedula: true
    });

    useEffect(() => {
        // Resetear formulario cuando ayudanteEditando cambie a null
        if (!ayudante) {
            setFormData({
                NomAyudante: '',
                NoCedula: '',
                ACTIVO: 1
            });
            setErrores({});
            setCamposValidos({
                NomAyudante: true,
                NoCedula: true
            });
        }
    }, [ayudante]);

    // Cargar datos si estamos editando
    useEffect(() => {
        if (ayudante) {
            setFormData({
                ...ayudante,
                ACTIVO: ayudante.ACTIVO === 1 ? 1 : 0,
                NoCedula: ayudante.NoCedula || ''
            });
        }
    }, [ayudante]);

    // Validar campo único
    const validarCampoUnicoAyudanteForm = async (campo, valor) => {
        if (campo === "NomAyudante") {
            if (!valor || valor.trim() === '') {
                setErrores(prev => ({ ...prev, [campo]: 'El nombre es obligatorio' }));
                return false;
            }

            // Validar longitud máxima
            if (valor.length > 50) {
                setErrores(prev => ({
                    ...prev,
                    [campo]: 'Máximo 50 caracteres'
                }));
                return false;
            }
        } else if (campo === "NoCedula" && valor && valor.trim() !== '') {
            // Validar que contenga números, "/", "-" y espacios opcionales
            if (!/^[0-9\/\-\s]+$/.test(valor)) {
                setErrores(prev => ({
                    ...prev,
                    [campo]: 'Solo se permiten números, "/" y "-"'
                }));
                return false;
            }
            // Validar longitud máxima
            if (valor.length > 150) {
                setErrores(prev => ({
                    ...prev,
                    [campo]: 'Máximo 150 caracteres'
                }));
                return false;
            }
        }

        setValidandoCampo(prev => ({ ...prev, [campo]: true }));

        try {
            const existe = await validarCampoUnicoAyudante(
                campo,
                campo === "NoCedula" && valor === '' ? null : valor,
                ayudante?.IdAyudante || null
            );

            if (existe) {
                const mensajes = {
                    NomAyudante: 'Ya existe un ayudante con ese nombre',
                    NoCedula: 'Ya existe un ayudante con esa cédula'
                };

                setErrores(prev => ({
                    ...prev,
                    [campo]: mensajes[campo]
                }));

                setCamposValidos(prev => ({ ...prev, [campo]: false }));
                setValidandoCampo(prev => ({ ...prev, [campo]: false }));
                return false;
            }

            setErrores(prev => {
                const nuevos = { ...prev };
                delete nuevos[campo];
                return nuevos;
            });

            setCamposValidos(prev => ({ ...prev, [campo]: true }));
            setValidandoCampo(prev => ({ ...prev, [campo]: false }));
            return true;
        } catch (error) {
            setValidandoCampo(prev => ({ ...prev, [campo]: false }));
            return true; // Por seguridad, no bloquear por error de validación
        }
    };

    // Manejar cambios en los inputs
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        const newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Limpiar error del campo cuando el usuario escribe
        if (errores[name]) {
            setErrores(prev => {
                const nuevos = { ...prev };
                delete nuevos[name];
                return nuevos;
            });
        }

        // Validar campos únicos después de un tiempo
        const camposUnicos = ["NomAyudante"];
        if (camposUnicos.includes(name)) {
            // Solo validar si es nuevo ayudante o si el valor cambió
            const valorCambiado = ayudante && value !== ayudante[name];
            if (!ayudante || valorCambiado) {
                setTimeout(() => validarCampoUnicoAyudanteForm(name, value), 500);
            } else {
                setCamposValidos(prev => ({ ...prev, [name]: true }));
                setErrores(prev => {
                    const nuevos = { ...prev };
                    delete nuevos[name];
                    return nuevos;
                });
            }
        }

        // Validar longitud máxima en tiempo real
        if (name === 'NomAyudante' && value.length > 50) {
            setErrores(prev => ({
                ...prev,
                NomAyudante: 'Máximo 50 caracteres'
            }));
        }

        // Validar formato de identificación en tiempo real
        if (name === 'NoCedula' && value && !/^[0-9\/\-\s]*$/.test(value)) {
            setErrores(prev => ({
                ...prev,
                NoCedula: 'Solo se permiten números, "/" y "-"'
            }));
        }

        // Validar longitud máxima de identificación
        if (name === 'NoCedula' && value.length > 150) {
            setErrores(prev => ({
                ...prev,
                NoCedula: 'Máximo 150 caracteres'
            }));
        }
    };

    // Validar formulario completo
    const validarFormulario = () => {
        const nuevosErrores = {};

        // Nombre obligatorio
        if (!formData.NomAyudante || formData.NomAyudante.trim() === '') {
            nuevosErrores.NomAyudante = 'El nombre es obligatorio';
        }

        // Longitud máxima NomAyudante
        if (formData.NomAyudante.length > 50) {
            nuevosErrores.NomAyudante = 'Máximo 50 caracteres';
        }

        // Validar formato de cédula/identificación (si se proporciona)
        if (formData.NoCedula && formData.NoCedula.trim() !== '') {
            if (!/^[0-9\/\-\s]+$/.test(formData.NoCedula)) {
                nuevosErrores.NoCedula = 'Solo se permiten números, "/" y "-"';
            } else if (formData.NoCedula.length > 150) {
                nuevosErrores.NoCedula = 'Máximo 150 caracteres';
            }
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    // Enviar formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            Swal.fire('Error', 'Por favor corrige los errores en el formulario', 'error');
            return;
        }

        // Validar campos únicos finales
        const camposUnicos = ["NomAyudante"];
        for (const campo of camposUnicos) {
            const valorCambiado = ayudante && formData.NomAyudante.trim() !== ayudante.NomAyudante?.trim();
            if (!ayudante || valorCambiado) {
                if (!(await validarCampoUnicoAyudanteForm("NomAyudante", formData.NomAyudante))) {
                    Swal.fire('Error', 'Ya existe un ayudante con ese nombre.', 'error');
                    return;
                }
            }
        }

        setGuardando(true);

        try {
            // Preparar datos para enviar (convertir cédula vacía a null)
            const datosParaEnviar = {
                ...formData,
                NoCedula: formData.NoCedula === '' ? null : formData.NoCedula
            };

            await onSave(datosParaEnviar);
        } catch (error) {
            console.error('Error guardando ayudante:', error);
            Swal.fire('Error', error.message, 'error');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Información del Ayudante
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre del Ayudante */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre Completo *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="NomAyudante"
                                value={formData.NomAyudante}
                                onChange={handleChange}
                                placeholder="Ej: Carlos Rodríguez"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.NomAyudante ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={50}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <div>
                                {validandoCampo.NomAyudante && (
                                    <div className="text-blue-600 text-sm flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        Validando...
                                    </div>
                                )}
                                {errores.NomAyudante && (
                                    <div className="text-red-600 text-sm flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errores.NomAyudante}
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                {formData.NomAyudante.length}/50
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Nombre único del ayudante
                        </p>
                    </div>

                    {/* Número de Cédula */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Cédula (Opcional)
                        </label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="NoCedula"
                                value={formData.NoCedula}
                                onChange={handleChange}
                                placeholder="Ej: 1234567890 o 123456/789012 o 123-456-789"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.NoCedula ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={150}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <div>
                                {validandoCampo.NoCedula && (
                                    <div className="text-blue-600 text-sm flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        Validando...
                                    </div>
                                )}
                                {errores.NoCedula && (
                                    <div className="text-red-600 text-sm flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errores.NoCedula}
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Opcional. Números y separadores (/, -). Ej: 1234567890 o 123456/789012. Máximo 150 caracteres.
                        </p>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: CONFIGURACIÓN */}
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Configuración
                </h3>

                <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="ACTIVO"
                            name="ACTIVO"
                            checked={formData.ACTIVO === 1}
                            onChange={handleChange}
                            className="w-5 h-5 text-primary rounded focus:ring-primary"
                        />
                        <label htmlFor="ACTIVO" className="ml-2 text-gray-700 font-medium">
                            Ayudante Activo
                        </label>
                    </div>
                    <p className="text-sm text-gray-600">
                        {formData.ACTIVO === 1
                            ? '✓ Disponible para asignaciones'
                            : '✗ No disponible para asignaciones'}
                    </p>
                </div>
            </div>

            {/* RESUMEN DE VALIDACIÓN */}
            {Object.keys(errores).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                        <AlertCircle className="w-5 h-5" />
                        Errores por corregir
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {Object.entries(errores).map(([campo, mensaje]) => (
                            <li key={campo}>{mensaje}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* RESUMEN DEL AYUDANTE */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                    <CheckCircle className="w-5 h-5" />
                    Resumen del Ayudante
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                    <p><span className="font-medium">Nombre:</span> {formData.NomAyudante || 'No definido'}</p>
                    <p><span className="font-medium">Cédula:</span> {formData.NoCedula || 'No proporcionada'}</p>
                    <p><span className="font-medium">Estado:</span> {formData.ACTIVO === 1 ? 'Activo' : 'Inactivo'}</p>
                </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={guardando || Object.keys(errores).length > 0}
                    className={`
      flex-1 py-4 px-6 rounded-xl font-bold text-lg
      flex items-center justify-center gap-3 transition-all
      ${guardando || Object.keys(errores).length > 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:shadow-xl hover:scale-[1.02]'
                        }
    `}
                >
                    {guardando ? (
                        <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            <span>Guardando...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-6 h-6" />
                            <span>{ayudante ? 'ACTUALIZAR AYUDANTE' : 'GUARDAR AYUDANTE'}</span>
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="py-4 px-6 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 font-semibold text-lg"
                >
                    <X className="w-6 h-6" />
                    <span>CANCELAR</span>
                </button>
            </div>

            {/* AYUDA RÁPIDA */}
            <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-xl">
                <p className="font-semibold text-blue-800 mb-2">📝 Notas importantes:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Los campos marcados con * son obligatorios</li>
                    <li>El nombre del ayudante debe ser único en el sistema</li>
                    <li>La cédula es opcional pero debe ser única si se proporciona</li>
                    <li>Los ayudantes inactivos no estarán disponibles para asignaciones</li>
                    <li>La cédula solo debe contener números</li>
                </ul>
            </div>
        </form>
    );
};

export default AyudantesForm;