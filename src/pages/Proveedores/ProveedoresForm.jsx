// src/pages/Proveedores/ProveedoresForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Hash, Building, Mail, Phone, MapPin, Globe, CheckCircle, AlertCircle, RefreshCw, User, Package } from 'lucide-react';
import Swal from 'sweetalert2';

// Servicios para validaciones
import { validarNITExistente, validarNombreProveedorExistente, getUltimoCodigoProveedor, generarCodigoProveedor } from '../../services/proveedores/proveedoresService';

const ProveedoresForm = ({ proveedor, onSave, onCancel }) => {
    // Estado del formulario basado en la tabla GEN_Proveedores
    const [formData, setFormData] = useState({
        Proveedor: '',
        CodProveedor: '',
        Nit: '',
        DV: '',
        Contacto: '',
        Direccion: '',
        Ciudad: '',
        Estado: 'Activo',
        Pais: 'Colombia',
        Telefono: '',
        Correo: '',
        Email: '',
        IVA: 0
    });

    // Estados para validaciones
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [validandoNit, setValidandoNit] = useState(false);
    const [nitValido, setNitValido] = useState(true);
    const [validandoNombre, setValidandoNombre] = useState(false);
    const [nombreValido, setNombreValido] = useState(true);

    // Resetear formulario cuando proveedor cambie a null (nuevo proveedor)
    useEffect(() => {
        if (!proveedor) {
            setFormData({
                Proveedor: '',
                CodProveedor: '',
                Nit: '',
                DV: '',
                Contacto: '',
                Direccion: '',
                Ciudad: '',
                Estado: 'Activo',
                Pais: 'Colombia',
                Telefono: '',
                Correo: '',
                Email: '',
                IVA: 0
            });
            setErrores({});
            setNitValido(true);
            setNombreValido(true);
        }
    }, [proveedor]);

    // Cargar datos si estamos editando
    useEffect(() => {
        if (proveedor) {
            setFormData({
                ...proveedor,
                IVA: proveedor.IVA || 0
            });
        }
    }, [proveedor]);

    // Autogenerar código de proveedor
    const handleGenerarCodigo = async () => {
        try {
            // Usar servicio REAL - usa la función IMPORTADA
            const codigoGenerado = await generarCodigoProveedor();

            if (codigoGenerado) {
                setFormData(prev => ({ ...prev, CodProveedor: codigoGenerado }));

                Swal.fire({
                    icon: 'success',
                    title: 'Código generado',
                    text: `Código asignado: ${codigoGenerado}`,
                    timer: 1500
                });
            }
        } catch (error) {
            console.error('Error generando código:', error);

            // Fallback local
            const randomNum = Math.floor(Math.random() * 999) + 1;
            const fallbackCode = `PROV-${String(randomNum).padStart(3, '0')}`;
            setFormData(prev => ({ ...prev, CodProveedor: fallbackCode }));

            Swal.fire({
                icon: 'info',
                title: 'Código generado (modo local)',
                text: `Código: ${fallbackCode}`,
                timer: 1500
            });
        }
    };

    // Validar NIT
    const validarNIT = async (nit) => {
        if (!nit) return true;

        // Validar que solo sean números
        if (!/^\d+$/.test(nit.toString())) {
            setErrores(prev => ({ ...prev, Nit: 'El NIT solo debe contener números' }));
            return false;
        }

        setValidandoNit(true);
        try {
            // Usar servicio REAL
            const existe = await validarNITExistente(nit, proveedor?.IdProveedor || null);

            if (existe) {
                setErrores(prev => ({ ...prev, Nit: 'Este NIT ya está registrado' }));
                setValidandoNit(false);
                return false;
            }

            setErrores(prev => {
                const nuevos = { ...prev };
                delete nuevos.Nit;
                return nuevos;
            });
            setNitValido(true);
            setValidandoNit(false);
            return true;
        } catch (error) {
            setValidandoNit(false);
            return true; // Por seguridad, no bloquear por error de validación
        }
    };

    // Validar nombre del proveedor
    const validarNombreProveedor = async (nombre) => {
        if (!nombre || nombre.trim() === '') {
            setErrores(prev => ({ ...prev, Proveedor: 'El nombre es obligatorio' }));
            return false;
        }

        setValidandoNombre(true);
        try {
            const existe = await validarNombreProveedorExistente(
                nombre.trim(),
                proveedor?.IdProveedor || null
            );

            if (existe) {
                setErrores(prev => ({
                    ...prev,
                    Proveedor: 'Ya existe un proveedor con este nombre'
                }));
                setNombreValido(false);
                setValidandoNombre(false);
                return false;
            }

            setErrores(prev => {
                const nuevos = { ...prev };
                delete nuevos.Proveedor;
                return nuevos;
            });
            setNombreValido(true);
            setValidandoNombre(false);
            return true;
        } catch (error) {
            setValidandoNombre(false);
            return true;
        }
    };

    // Manejar cambios en los inputs
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));

        // Limpiar error del campo cuando el usuario escribe
        if (errores[name]) {
            setErrores(prev => {
                const nuevos = { ...prev };
                delete nuevos[name];
                return nuevos;
            });
        }

        // Validar NIT en tiempo real
        if (name === 'Nit') {
            setTimeout(() => validarNIT(value), 500);
        }

        // Validar nombre en tiempo real
        if (name === 'Proveedor' && value.trim() !== '') {
            if (!proveedor || (proveedor && value.trim() !== proveedor.Proveedor.trim())) {
                setTimeout(() => validarNombreProveedor(value), 500);
            } else {
                setNombreValido(true);
                setErrores(prev => {
                    const nuevos = { ...prev };
                    delete nuevos.Proveedor;
                    return nuevos;
                });
            }
        }

        // Validar email en tiempo real
        if ((name === 'Correo' || name === 'Email') && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                setErrores(prev => ({ ...prev, [name]: 'Formato de email inválido' }));
            } else {
                setErrores(prev => {
                    const nuevos = { ...prev };
                    delete nuevos[name];
                    return nuevos;
                });
            }
        }
    };

    // Validar formulario completo
    const validarFormulario = () => {
        const nuevosErrores = {};

        // Nombre obligatorio
        if (!formData.Proveedor.trim()) {
            nuevosErrores.Proveedor = 'El nombre del proveedor es obligatorio';
        }

        // Código proveedor (máx 8 caracteres)
        if (formData.CodProveedor && formData.CodProveedor.length > 8) {
            nuevosErrores.CodProveedor = 'Máximo 8 caracteres';
        }

        // Contacto (máx 30 caracteres)
        if (formData.Contacto && formData.Contacto.length > 30) {
            nuevosErrores.Contacto = 'Máximo 30 caracteres';
        }

        // Ciudad (máx 20 caracteres)
        if (formData.Ciudad && formData.Ciudad.length > 20) {
            nuevosErrores.Ciudad = 'Máximo 20 caracteres';
        }

        // Teléfono solo números
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

        // Validar NIT final
        if (formData.Nit && !(await validarNIT(formData.Nit))) {
            Swal.fire('Error', 'El NIT no es válido o ya existe', 'error');
            return;
        }

        // Validar nombre único final
        const nombreCambiado = proveedor && formData.Proveedor.trim() !== proveedor.Proveedor.trim();
        if (!proveedor || nombreCambiado) {
            if (!(await validarNombreProveedor(formData.Proveedor))) {
                Swal.fire('Error', 'El nombre del proveedor ya existe. Use un nombre diferente.', 'error');
                return;
            }
        }

        setGuardando(true);

        try {
            await onSave(formData);
        } catch (error) {
            console.error('Error guardando proveedor:', error);
            Swal.fire('Error', 'No se pudo guardar el proveedor', 'error');
        } finally {
            setGuardando(false);
        }
    };

    // Campos de países comunes
    const paises = [
        'Colombia', 'Estados Unidos', 'México', 'España', 'Argentina',
        'Chile', 'Perú', 'Ecuador', 'Venezuela', 'Panamá', 'Costa Rica'
    ];

    // Campos de ciudades comunes en Colombia
    const ciudadesColombia = [
        'Bogotá D.C.', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
        'Bucaramanga', 'Pereira', 'Manizales', 'Armenia', 'Ibagué',
        'Villavicencio', 'Cúcuta', 'Santa Marta', 'Montería', 'Sincelejo'
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    Información Básica del Proveedor
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre del Proveedor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Proveedor *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="Proveedor"
                                value={formData.Proveedor}
                                onChange={handleChange}
                                placeholder="Ej: Distribuidora Alimentos S.A."
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.Proveedor ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                maxLength={50}
                            />
                            {validandoNombre && (
                                <div className="text-blue-600 text-sm mt-1 flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Validando nombre...
                                </div>
                            )}
                            {errores.Proveedor && (
                                <div className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errores.Proveedor}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Nombre completo o razón social. Debe ser único.
                        </p>
                    </div>

                    {/* Código Proveedor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Código Proveedor
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    name="CodProveedor"
                                    value={formData.CodProveedor}
                                    onChange={handleChange}
                                    placeholder="PROV-001"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.CodProveedor ? 'border-red-500' : 'border-gray-300'}`}
                                    maxLength={8}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerarCodigo}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-xl flex items-center gap-2 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span className="hidden sm:inline">Autogenerar</span>
                            </button>
                        </div>
                        {errores.CodProveedor && (
                            <div className="text-red-600 text-sm mt-1">{errores.CodProveedor}</div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Máximo 8 caracteres</p>
                    </div>

                    {/* NIT */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            NIT
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="Nit"
                                    value={formData.Nit}
                                    onChange={handleChange}
                                    placeholder="9001234567"
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.Nit ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {validandoNit && (
                                    <div className="text-blue-600 text-sm mt-1">Validando NIT...</div>
                                )}
                                {errores.Nit && (
                                    <div className="text-red-600 text-sm mt-1">{errores.Nit}</div>
                                )}
                            </div>
                            <div className="w-20">
                                <input
                                    type="text"
                                    name="DV"
                                    value={formData.DV}
                                    onChange={handleChange}
                                    placeholder="DV"
                                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                    maxLength={1}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Solo números, sin puntos ni guiones</p>
                    </div>

                    {/* Contacto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Persona de Contacto
                        </label>
                        <input
                            type="text"
                            name="Contacto"
                            value={formData.Contacto}
                            onChange={handleChange}
                            placeholder="Ej: Carlos Rodríguez"
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.Contacto ? 'border-red-500' : 'border-gray-300'}`}
                            maxLength={30}
                        />
                        {errores.Contacto && (
                            <div className="text-red-600 text-sm mt-1">{errores.Contacto}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: INFORMACIÓN DE CONTACTO Y UBICACIÓN */}
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Información de Contacto y Ubicación
                </h3>

                <div className="space-y-6">
                    {/* Dirección */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dirección
                        </label>
                        <textarea
                            name="Direccion"
                            value={formData.Direccion}
                            onChange={handleChange}
                            placeholder="Carrera 45 #26-85, Bodega 12"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                            rows="2"
                            maxLength={255}
                        />
                        <p className="text-xs text-gray-500 mt-1">Máximo 255 caracteres</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* País */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                País
                            </label>
                            <select
                                name="Pais"
                                value={formData.Pais}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white"
                            >
                                {paises.map(pais => (
                                    <option key={pais} value={pais}>{pais}</option>
                                ))}
                            </select>
                        </div>

                        {/* Ciudad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ciudad
                            </label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    name="Ciudad"
                                    value={formData.Ciudad}
                                    onChange={handleChange}
                                    placeholder="Ej: Bogotá"
                                    list="ciudades-list"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.Ciudad ? 'border-red-500' : 'border-gray-300'}`}
                                    maxLength={20}
                                />
                                <datalist id="ciudades-list">
                                    {ciudadesColombia.map(ciudad => (
                                        <option key={ciudad} value={ciudad} />
                                    ))}
                                </datalist>
                            </div>
                            {errores.Ciudad && (
                                <div className="text-red-600 text-sm mt-1">{errores.Ciudad}</div>
                            )}
                        </div>

                        {/* Estado/Departamento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado
                            </label>
                            <input
                                type="text"
                                name="Estado"
                                value={formData.Estado}
                                onChange={handleChange}
                                placeholder="Ej: Cundinamarca"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                maxLength={50}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Teléfono */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="tel"
                                    name="Telefono"
                                    value={formData.Telefono}
                                    onChange={handleChange}
                                    placeholder="6011234567"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.Telefono ? 'border-red-500' : 'border-gray-300'}`}
                                    maxLength={25}
                                />
                            </div>
                            {errores.Telefono && (
                                <div className="text-red-600 text-sm mt-1">{errores.Telefono}</div>
                            )}
                        </div>

                        {/* Correo (para facturación) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Correo para Facturación
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    name="Correo"
                                    value={formData.Correo}
                                    onChange={handleChange}
                                    placeholder="facturacion@proveedor.com"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.Correo ? 'border-red-500' : 'border-gray-300'}`}
                                    maxLength={50}
                                />
                            </div>
                            {errores.Correo && (
                                <div className="text-red-600 text-sm mt-1">{errores.Correo}</div>
                            )}
                        </div>

                        {/* Email (contacto general) */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email de Contacto General
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    name="Email"
                                    value={formData.Email}
                                    onChange={handleChange}
                                    placeholder="contacto@proveedor.com"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.Email ? 'border-red-500' : 'border-gray-300'}`}
                                    maxLength={50}
                                />
                            </div>
                            {errores.Email && (
                                <div className="text-red-600 text-sm mt-1">{errores.Email}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: CONFIGURACIÓN */}
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Configuración
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Aplica IVA */}
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="IVA"
                                name="IVA"
                                checked={formData.IVA === 1}
                                onChange={handleChange}
                                className="w-5 h-5 text-primary rounded focus:ring-primary"
                            />
                            <label htmlFor="IVA" className="ml-2 text-gray-700 font-medium">
                                Aplica IVA
                            </label>
                        </div>
                        <p className="text-sm text-gray-600">
                            {formData.IVA === 1
                                ? '✓ Se facturará con IVA (19%)'
                                : '✗ No se aplicará IVA'}
                        </p>
                    </div>
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
                            : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:shadow-xl hover:scale-[1.02]'
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
                            <span>{proveedor ? 'ACTUALIZAR PROVEEDOR' : 'GUARDAR PROVEEDOR'}</span>
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
                    <li>El código proveedor se puede autogenerar o personalizar (máx. 8 caracteres)</li>
                    <li>La validación de NIT verifica que no esté duplicado</li>
                    <li>El nombre del proveedor debe ser único en el sistema</li>
                </ul>
            </div>
        </form>
    );
};

export default ProveedoresForm;