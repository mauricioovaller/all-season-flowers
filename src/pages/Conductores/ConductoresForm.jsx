// src/pages/Conductores/ConductoresForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Truck, User, CreditCard, Phone, Car, Palette, Hash, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

// Servicio para validaciones
import { validarCampoUnico } from '../../services/conductores/conductoresService';

const ConductoresForm = ({ conductor, onSave, onCancel }) => {
    // Estado del formulario
    const [formData, setFormData] = useState({
        NombreConductor: '',
        NoCedula: '',
        Telefono: '',
        TipoVehiculo: '',
        Marca: '',
        Color: '',
        Placas: '',
        ACTIVO: 1
    });

    // Estados para validaciones
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [validandoCampo, setValidandoCampo] = useState({});
    const [camposValidos, setCamposValidos] = useState({
        NombreConductor: true,
        NoCedula: true,
        Placas: true
    });

    useEffect(() => {
        // Resetear formulario cuando conductorEditando cambie a null
        if (!conductor) {
            setFormData({
                NombreConductor: '',
                NoCedula: '',
                Telefono: '',
                TipoVehiculo: '',
                Marca: '',
                Color: '',
                Placas: '',
                ACTIVO: 1
            });
            setErrores({});
            setCamposValidos({
                NombreConductor: true,
                NoCedula: true,
                Placas: true
            });
        }
    }, [conductor]);

    // Cargar datos si estamos editando
    useEffect(() => {
        if (conductor) {
            setFormData({
                ...conductor,
                ACTIVO: conductor.ACTIVO === 1 ? 1 : 0
            });
        }
    }, [conductor]);

    // Validar campo único
    const validarCampoUnicoConductor = async (campo, valor) => {
        if (!valor || valor.trim() === '') {
            setErrores(prev => ({ ...prev, [campo]: 'Este campo es obligatorio' }));
            return false;
        }

        // Validar longitud máxima según campo
        const longitudes = {
            NombreConductor: 100,
            NoCedula: 50,
            Telefono: 50,
            TipoVehiculo: 50,
            Marca: 50,
            Color: 50,
            Placas: 50
        };

        if (valor.length > longitudes[campo]) {
            setErrores(prev => ({
                ...prev,
                [campo]: `Máximo ${longitudes[campo]} caracteres`
            }));
            return false;
        }

        // Solo validar unicidad para estos campos
        const camposUnicos = ["NombreConductor", "NoCedula", "Placas"];
        if (!camposUnicos.includes(campo)) {
            return true;
        }

        setValidandoCampo(prev => ({ ...prev, [campo]: true }));

        try {
            const existe = await validarCampoUnico(
                campo,
                valor.trim(),
                conductor?.IdConductor || null
            );

            if (existe) {
                const mensajes = {
                    NombreConductor: 'Ya existe un conductor con ese nombre',
                    NoCedula: 'Ya existe un conductor con esa cédula',
                    Placas: 'Ya existe un conductor con esas placas'
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

        // Si es un campo único, validar después de un tiempo
        const camposUnicos = ["NombreConductor", "NoCedula", "Placas"];
        if (camposUnicos.includes(name)) {
            // Solo validar si es nuevo conductor o si el valor cambió
            const valorCambiado = conductor && value.trim() !== conductor[name]?.trim();
            if (!conductor || valorCambiado) {
                setTimeout(() => validarCampoUnicoConductor(name, value), 500);
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
        const longitudes = {
            NombreConductor: 100,
            NoCedula: 50,
            Telefono: 50,
            TipoVehiculo: 50,
            Marca: 50,
            Color: 50,
            Placas: 50
        };

        if (name in longitudes && value.length > longitudes[name]) {
            setErrores(prev => ({
                ...prev,
                [name]: `Máximo ${longitudes[name]} caracteres`
            }));
        }

        // Validar formato de teléfono (solo números y espacios)
        if (name === 'Telefono' && value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
            setErrores(prev => ({
                ...prev,
                Telefono: 'Solo números y caracteres telefónicos'
            }));
        }
    };

    // Validar formulario completo
    const validarFormulario = () => {
        const nuevosErrores = {};

        // Campos obligatorios
        const camposObligatorios = ["NombreConductor", "NoCedula", "Telefono", "Placas"];
        camposObligatorios.forEach(campo => {
            if (!formData[campo] || formData[campo].trim() === '') {
                const nombres = {
                    NombreConductor: 'Nombre del conductor',
                    NoCedula: 'Número de cédula',
                    Telefono: 'Teléfono',
                    Placas: 'Placas del vehículo'
                };
                nuevosErrores[campo] = `${nombres[campo]} es obligatorio`;
            }
        });

        // Longitudes máximas
        const longitudes = {
            NombreConductor: [100, formData.NombreConductor],
            NoCedula: [50, formData.NoCedula],
            Telefono: [50, formData.Telefono],
            TipoVehiculo: [50, formData.TipoVehiculo],
            Marca: [50, formData.Marca],
            Color: [50, formData.Color],
            Placas: [50, formData.Placas]
        };

        Object.entries(longitudes).forEach(([campo, [max, valor]]) => {
            if (valor && valor.length > max) {
                nuevosErrores[campo] = `Máximo ${max} caracteres`;
            }
        });

        // Validar formato de teléfono
        if (formData.Telefono && !/^[\d\s\-\+\(\)]+$/.test(formData.Telefono)) {
            nuevosErrores.Telefono = 'Solo números y caracteres telefónicos';
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

        // SOLO VALIDAR NOMBRE (remover validación de cédula y placas)
        const valorCambiado = conductor && formData.NombreConductor.trim() !== conductor.NombreConductor?.trim();
        if (!conductor || valorCambiado) {
            if (!(await validarCampoUnicoConductor("NombreConductor", formData.NombreConductor))) {
                Swal.fire('Error', 'Ya existe un conductor con ese nombre.', 'error');
                return;
            }
        }

        setGuardando(true);

        try {
            await onSave(formData);
        } catch (error) {
            console.error('Error guardando conductor:', error);
            Swal.fire('Error', error.message, 'error');
        } finally {
            setGuardando(false);
        }
    };

    // Ejemplos de tipos de vehículos
    const tiposVehiculos = [
        'Camión', 'Furgón', 'Pickup', 'Van', 'Camioneta',
        'Motocicleta', 'Bicicleta', 'Carro Particular', 'Otro'
    ];

    // Ejemplos de marcas de vehículos
    const marcasVehiculos = [
        'Toyota', 'Nissan', 'Ford', 'Chevrolet', 'Mazda',
        'Hyundai', 'Kia', 'Volkswagen', 'Mercedes', 'BMW',
        'Honda', 'Suzuki', 'Mitsubishi', 'Renault', 'Otro'
    ];

    // Ejemplos de colores
    const colores = [
        'Rojo', 'Azul', 'Verde', 'Negro', 'Blanco', 'Gris',
        'Plateado', 'Dorado', 'Amarillo', 'Naranja', 'Morado', 'Otro'
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Información Personal
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre del Conductor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre Completo *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="NombreConductor"
                                value={formData.NombreConductor}
                                onChange={handleChange}
                                placeholder="Ej: Juan Pérez García"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.NombreConductor ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={100}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <div>
                                {validandoCampo.NombreConductor && (
                                    <div className="text-blue-600 text-sm flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        Validando...
                                    </div>
                                )}
                                {errores.NombreConductor && (
                                    <div className="text-red-600 text-sm flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errores.NombreConductor}
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                {formData.NombreConductor.length}/100
                            </div>
                        </div>
                    </div>

                    {/* Número de Cédula */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Cédula *
                        </label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="NoCedula"
                                value={formData.NoCedula}
                                onChange={handleChange}
                                placeholder="Ej: 1234567890"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.NoCedula ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={50}
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
                            <div className="text-xs text-gray-500">
                                {formData.NoCedula.length}/50
                            </div>
                        </div>
                    </div>

                    {/* Teléfono */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono *
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="tel"
                                name="Telefono"
                                value={formData.Telefono}
                                onChange={handleChange}
                                placeholder="Ej: 3001234567"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.Telefono ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={50}
                            />
                        </div>
                        {errores.Telefono && (
                            <div className="text-red-600 text-sm mt-1">{errores.Telefono}</div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Número de contacto del conductor
                        </p>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: INFORMACIÓN DEL VEHÍCULO */}
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    Información del Vehículo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tipo de Vehículo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Vehículo
                        </label>
                        <div className="relative">
                            <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                name="TipoVehiculo"
                                value={formData.TipoVehiculo}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white"
                            >
                                <option value="">Seleccione tipo...</option>
                                {tiposVehiculos.map(tipo => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </div>
                        {errores.TipoVehiculo && (
                            <div className="text-red-600 text-sm mt-1">{errores.TipoVehiculo}</div>
                        )}
                    </div>

                    {/* Marca */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Marca del Vehículo
                        </label>
                        <div className="relative">
                            <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                name="Marca"
                                value={formData.Marca}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white"
                            >
                                <option value="">Seleccione marca...</option>
                                {marcasVehiculos.map(marca => (
                                    <option key={marca} value={marca}>{marca}</option>
                                ))}
                            </select>
                        </div>
                        {errores.Marca && (
                            <div className="text-red-600 text-sm mt-1">{errores.Marca}</div>
                        )}
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color del Vehículo
                        </label>
                        <div className="relative">
                            <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                name="Color"
                                value={formData.Color}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white"
                            >
                                <option value="">Seleccione color...</option>
                                {colores.map(color => (
                                    <option key={color} value={color}>{color}</option>
                                ))}
                            </select>
                        </div>
                        {errores.Color && (
                            <div className="text-red-600 text-sm mt-1">{errores.Color}</div>
                        )}
                    </div>

                    {/* Placas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Placas del Vehículo *
                        </label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="Placas"
                                value={formData.Placas}
                                onChange={handleChange}
                                placeholder="Ej: ABC123, XYZ789"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.Placas ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={50}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <div>
                                {validandoCampo.Placas && (
                                    <div className="text-blue-600 text-sm flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        Validando...
                                    </div>
                                )}
                                {errores.Placas && (
                                    <div className="text-red-600 text-sm flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errores.Placas}
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                {formData.Placas.length}/50
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Placas únicas del vehículo
                        </p>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: CONFIGURACIÓN */}
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
                            Conductor Activo
                        </label>
                    </div>
                    <p className="text-sm text-gray-600">
                        {formData.ACTIVO === 1
                            ? '✓ Disponible para asignaciones y entregas'
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

            {/* RESUMEN DEL CONDUCTOR */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                    <CheckCircle className="w-5 h-5" />
                    Resumen del Conductor
                </div>
                <div className="text-sm text-blue-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <p><span className="font-medium">Nombre:</span> {formData.NombreConductor || 'No definido'}</p>
                    <p><span className="font-medium">Cédula:</span> {formData.NoCedula || 'No definido'}</p>
                    <p><span className="font-medium">Teléfono:</span> {formData.Telefono || 'No definido'}</p>
                    <p><span className="font-medium">Vehículo:</span> {formData.TipoVehiculo || 'No definido'}</p>
                    <p><span className="font-medium">Marca/Color:</span> {[formData.Marca, formData.Color].filter(Boolean).join(' - ') || 'No definido'}</p>
                    <p><span className="font-medium">Placas:</span> {formData.Placas || 'No definido'}</p>
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
                            <span>{conductor ? 'ACTUALIZAR CONDUCTOR' : 'GUARDAR CONDUCTOR'}</span>
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
                    <li>Nombre, cédula y placas deben ser únicos en el sistema</li>
                    <li>Los conductores inactivos no estarán disponibles para asignaciones</li>
                    <li>Complete toda la información del vehículo para mejor control</li>
                    <li>Verifique el formato correcto del teléfono</li>
                </ul>
            </div>
        </form>
    );
};

export default ConductoresForm;