// src/pages/Clientes/ClientesForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Hash, User, Mail, Phone, MapPin, Building, Globe, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

// Servicio para validaciones
import { validarNITExistente, getUltimoCodigoCliente, generarCodigoCliente } from '../../services/clientes/clientesService';

const ClientesForm = ({ cliente, onSave, onCancel }) => {
    // Estado del formulario
    const [formData, setFormData] = useState({
        NOMBRE: '',
        CodCliente: '',
        NIT: '',
        DV: '',
        Contaco: '',
        Direc1: '',
        CIUDAD: '',
        ESTADO: 'Activo',
        PAIS: 'Colombia',
        TEL1: '',
        E_MAIL: '',
        ACTIVO: 1,
        IVA: 0
    });

    // Estados para validaciones
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [validandoNIT, setValidandoNIT] = useState(false);
    const [nitValido, setNitValido] = useState(true);
    const [validandoNombre, setValidandoNombre] = useState(false);
    const [nombreValido, setNombreValido] = useState(true);


    useEffect(() => {
        // Resetear formulario cuando clienteEditando cambie a null (nuevo cliente)
        if (!cliente) {
            setFormData({
                NOMBRE: '',
                CodCliente: '',
                NIT: '',
                DV: '',
                Contaco: '',
                Direc1: '',
                CIUDAD: '',
                ESTADO: 'Activo',
                PAIS: 'Colombia',
                TEL1: '',
                E_MAIL: '',
                ACTIVO: 1,
                IVA: 0
            });
            setErrores({});
            setNitValido(true);
        }
    }, [cliente]); // Este efecto se ejecuta cuando 'cliente' cambia
    // Cargar datos si estamos editando
    useEffect(() => {
        if (cliente) {
            setFormData({
                ...cliente,
                ACTIVO: cliente.ACTIVO === 1 ? 1 : 0,
                IVA: cliente.IVA === 1 ? 1 : 0
            });
        }
    }, [cliente]);

    // Autogenerar código
    const handleGenerarCodigo = async () => {
        try {
            // Usar servicio REAL - importa generarCodigoCliente primero
            const codigoGenerado = await generarCodigoCliente(); // Esta debe ser la función del servicio

            if (codigoGenerado) {
                setFormData(prev => ({ ...prev, CodCliente: codigoGenerado }));

                Swal.fire({
                    icon: 'success',
                    title: 'Código generado',
                    text: `Código asignado: ${codigoGenerado}`,
                    timer: 1500
                });
            }
        } catch (error) {
            console.error('Error generando código:', error);

            const randomNum = Math.floor(Math.random() * 999) + 1;
            const fallbackCode = `CLI-${String(randomNum).padStart(3, '0')}`;
            setFormData(prev => ({ ...prev, CodCliente: fallbackCode }));

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
        if (!/^\d+$/.test(nit)) {
            setErrores(prev => ({ ...prev, NIT: 'El NIT solo debe contener números' }));
            return false;
        }

        setValidandoNIT(true);
        try {
            // Usar servicio REAL
            const existe = await validarNITExistente(nit, cliente?.IdCliente || null);

            if (existe) {
                setErrores(prev => ({ ...prev, NIT: 'Este NIT ya está registrado' }));
                setValidandoNIT(false);
                return false;
            }

            setErrores(prev => {
                const nuevos = { ...prev };
                delete nuevos.NIT;
                return nuevos;
            });
            setNitValido(true);
            setValidandoNIT(false);
            return true;
        } catch (error) {
            setValidandoNIT(false);
            return true; // Por seguridad, no bloquear por error de validación
        }
    };

    const validarNombreCliente = async (nombre) => {
        if (!nombre || nombre.trim() === '') {
            setErrores(prev => ({ ...prev, NOMBRE: 'El nombre es obligatorio' }));
            return false;
        }

        setValidandoNombre(true);
        try {
            const existe = await validarNombreClienteExistente(
                nombre.trim(),
                cliente?.IdCliente || null
            );

            if (existe) {
                setErrores(prev => ({
                    ...prev,
                    NOMBRE: 'Ya existe un cliente con este nombre'
                }));
                setNombreValido(false);
                setValidandoNombre(false);
                return false;
            }

            setErrores(prev => {
                const nuevos = { ...prev };
                delete nuevos.NOMBRE;
                return nuevos;
            });
            setNombreValido(true);
            setValidandoNombre(false);
            return true;
        } catch (error) {
            setValidandoNombre(false);
            return true; // Por seguridad, no bloquear por error de validación
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
        if (name === 'NIT') {
            setTimeout(() => validarNIT(value), 500);
        }

        // Validar nombre en tiempo real (solo si no estamos editando o es un nombre diferente)
        if (name === 'NOMBRE' && value.trim() !== '') {
            // Solo validar si:
            // 1. Es nuevo cliente (cliente es null) O
            // 2. Estamos editando pero el nombre cambió
            if (!cliente || (cliente && value.trim() !== cliente.NOMBRE.trim())) {
                setTimeout(() => validarNombreCliente(value), 500);
            } else {
                // Si estamos editando y el nombre no cambió, está válido
                setNombreValido(true);
                setErrores(prev => {
                    const nuevos = { ...prev };
                    delete nuevos.NOMBRE;
                    return nuevos;
                });
            }
        }

        // Validar email en tiempo real
        if (name === 'E_MAIL' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                setErrores(prev => ({ ...prev, E_MAIL: 'Formato de email inválido' }));
            } else {
                setErrores(prev => {
                    const nuevos = { ...prev };
                    delete nuevos.E_MAIL;
                    return nuevos;
                });
            }
        }
    };

    // Validar formulario completo
    const validarFormulario = () => {
        const nuevosErrores = {};

        // Nombre obligatorio
        if (!formData.NOMBRE.trim()) {
            nuevosErrores.NOMBRE = 'El nombre es obligatorio';
        }

        // Código cliente (máx 8 caracteres)
        if (formData.CodCliente && formData.CodCliente.length > 8) {
            nuevosErrores.CodCliente = 'Máximo 8 caracteres';
        }

        // Contacto (máx 30 caracteres)
        if (formData.Contaco && formData.Contaco.length > 30) {
            nuevosErrores.Contaco = 'Máximo 30 caracteres';
        }

        // Ciudad (máx 20 caracteres)
        if (formData.CIUDAD && formData.CIUDAD.length > 20) {
            nuevosErrores.CIUDAD = 'Máximo 20 caracteres';
        }

        // Teléfono solo números
        if (formData.TEL1 && !/^[\d\s\-\+\(\)]+$/.test(formData.TEL1)) {
            nuevosErrores.TEL1 = 'Solo números y caracteres telefónicos';
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
        if (formData.NIT && !(await validarNIT(formData.NIT))) {
            Swal.fire('Error', 'El NIT no es válido o ya existe', 'error');
            return;
        }

        // Validar nombre único final (solo si es nuevo cliente o el nombre cambió)
        const nombreCambiado = cliente && formData.NOMBRE.trim() !== cliente.NOMBRE.trim();
        if (!cliente || nombreCambiado) {
            if (!(await validarNombreCliente(formData.NOMBRE))) {
                Swal.fire('Error', 'El nombre del cliente ya existe. Use un nombre diferente.', 'error');
                return;
            }
        }

        setGuardando(true);

        try {
            await onSave(formData);
        } catch (error) {
            console.error('Error guardando cliente:', error);
        } finally {
            setGuardando(false);
        }
    };

    // Campos de países comunes (puedes expandir)
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
                    <User className="w-5 h-5 text-primary" />
                    Información Básica
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Cliente *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="NOMBRE"
                                value={formData.NOMBRE}
                                onChange={handleChange}
                                placeholder="Ej: Floristería Jardín de Oro"
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.NOMBRE ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                maxLength={100}
                            />
                            {validandoNombre && (
                                <div className="text-blue-600 text-sm mt-1 flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Validando nombre...
                                </div>
                            )}
                            {errores.NOMBRE && (
                                <div className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errores.NOMBRE}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Nombre completo o razón social. Debe ser único.
                        </p>
                    </div>

                    {/* Código Cliente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Código Cliente
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    name="CodCliente"
                                    value={formData.CodCliente}
                                    onChange={handleChange}
                                    placeholder="CLI-001"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.CodCliente ? 'border-red-500' : 'border-gray-300'}`}
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
                        {errores.CodCliente && (
                            <div className="text-red-600 text-sm mt-1">{errores.CodCliente}</div>
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
                                    name="NIT"
                                    value={formData.NIT}
                                    onChange={handleChange}
                                    placeholder="9001234567"
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.NIT ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {validandoNIT && (
                                    <div className="text-blue-600 text-sm mt-1">Validando NIT...</div>
                                )}
                                {errores.NIT && (
                                    <div className="text-red-600 text-sm mt-1">{errores.NIT}</div>
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
                            name="Contaco"
                            value={formData.Contaco}
                            onChange={handleChange}
                            placeholder="Ej: María González"
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.Contaco ? 'border-red-500' : 'border-gray-300'}`}
                            maxLength={30}
                        />
                        {errores.Contaco && (
                            <div className="text-red-600 text-sm mt-1">{errores.Contaco}</div>
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
                            name="Direc1"
                            value={formData.Direc1}
                            onChange={handleChange}
                            placeholder="Calle 100 #45-67, Edificio Torre Central, Oficina 502"
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
                                name="PAIS"
                                value={formData.PAIS}
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
                                    name="CIUDAD"
                                    value={formData.CIUDAD}
                                    onChange={handleChange}
                                    placeholder="Ej: Bogotá"
                                    list="ciudades-list"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.CIUDAD ? 'border-red-500' : 'border-gray-300'}`}
                                    maxLength={20}
                                />
                                <datalist id="ciudades-list">
                                    {ciudadesColombia.map(ciudad => (
                                        <option key={ciudad} value={ciudad} />
                                    ))}
                                </datalist>
                            </div>
                            {errores.CIUDAD && (
                                <div className="text-red-600 text-sm mt-1">{errores.CIUDAD}</div>
                            )}
                        </div>

                        {/* Estado/Departamento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado/Departamento
                            </label>
                            <input
                                type="text"
                                name="ESTADO"
                                value={formData.ESTADO}
                                onChange={handleChange}
                                placeholder="Ej: Cundinamarca"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                maxLength={15}
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
                                    name="TEL1"
                                    value={formData.TEL1}
                                    onChange={handleChange}
                                    placeholder="6011234567"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.TEL1 ? 'border-red-500' : 'border-gray-300'}`}
                                    maxLength={25}
                                />
                            </div>
                            {errores.TEL1 && (
                                <div className="text-red-600 text-sm mt-1">{errores.TEL1}</div>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    name="E_MAIL"
                                    value={formData.E_MAIL}
                                    onChange={handleChange}
                                    placeholder="cliente@empresa.com"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.E_MAIL ? 'border-red-500' : 'border-gray-300'}`}
                                    maxLength={50}
                                />
                            </div>
                            {errores.E_MAIL && (
                                <div className="text-red-600 text-sm mt-1">{errores.E_MAIL}</div>
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
                    {/* Estado Activo/Inactivo */}
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
                                Cliente Activo
                            </label>
                        </div>
                        <p className="text-sm text-gray-600">
                            {formData.ACTIVO === 1
                                ? '✓ Aparecerá en listas y podrá hacer pedidos'
                                : '✗ No aparecerá en procesos activos'}
                        </p>
                    </div>

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
                            <span>{cliente ? 'ACTUALIZAR CLIENTE' : 'GUARDAR CLIENTE'}</span>
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
                    <li>El código cliente se puede autogenerar o personalizar (máx. 8 caracteres)</li>
                    <li>Clientes inactivos no aparecerán en procesos de venta</li>
                    <li>La validación de NIT verifica que no esté duplicado</li>
                </ul>
            </div>
        </form>
    );
};

export default ClientesForm;