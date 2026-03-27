// src/pages/Productos/ProductosForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Package, FileText, Printer, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

// Servicio para validaciones
import { validarNombreProductoExistente } from '../../services/productos/productosService';

const ProductosForm = ({ producto, onSave, onCancel }) => {
    // Estado del formulario
    const [formData, setFormData] = useState({
        NOMPRODUCTO: '',
        TAXRECORD: '',
        NOMIMPRESION: '',
        ACTIVO: 1
    });

    // Estados para validaciones
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [validandoNombre, setValidandoNombre] = useState(false);
    const [nombreValido, setNombreValido] = useState(true);

    useEffect(() => {
        // Resetear formulario cuando productoEditando cambie a null (nuevo producto)
        if (!producto) {
            setFormData({
                NOMPRODUCTO: '',
                TAXRECORD: '',
                NOMIMPRESION: '',
                ACTIVO: 1
            });
            setErrores({});
            setNombreValido(true);
        }
    }, [producto]);

    // Cargar datos si estamos editando
    useEffect(() => {
        if (producto) {
            setFormData({
                ...producto,
                ACTIVO: producto.ACTIVO === 1 ? 1 : 0
            });
        }
    }, [producto]);

    // Validar nombre único
    const validarNombreProducto = async (nombre) => {
        if (!nombre || nombre.trim() === '') {
            setErrores(prev => ({ ...prev, NOMPRODUCTO: 'El nombre es obligatorio' }));
            return false;
        }

        // Validar longitud máxima
        if (nombre.length > 20) {
            setErrores(prev => ({ ...prev, NOMPRODUCTO: 'Máximo 20 caracteres' }));
            return false;
        }

        setValidandoNombre(true);
        try {
            const existe = await validarNombreProductoExistente(
                nombre.trim(),
                producto?.IdProducto || null
            );

            if (existe) {
                setErrores(prev => ({
                    ...prev,
                    NOMPRODUCTO: 'Ya existe un producto con este nombre'
                }));
                setNombreValido(false);
                setValidandoNombre(false);
                return false;
            }

            setErrores(prev => {
                const nuevos = { ...prev };
                delete nuevos.NOMPRODUCTO;
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

        // Validar nombre en tiempo real
        if (name === 'NOMPRODUCTO') {
            // Solo validar si:
            // 1. Es nuevo producto (producto es null) O
            // 2. Estamos editando pero el nombre cambió
            if (!producto || (producto && value.trim() !== producto.NOMPRODUCTO.trim())) {
                setTimeout(() => validarNombreProducto(value), 500);
            } else {
                // Si estamos editando y el nombre no cambió, está válido
                setNombreValido(true);
                setErrores(prev => {
                    const nuevos = { ...prev };
                    delete nuevos.NOMPRODUCTO;
                    return nuevos;
                });
            }

            // Validar longitud máxima en tiempo real
            if (value.length > 20) {
                setErrores(prev => ({ ...prev, NOMPRODUCTO: 'Máximo 20 caracteres' }));
            }
        }

        // Validar longitud de TAXRECORD
        if (name === 'TAXRECORD' && value.length > 10) {
            setErrores(prev => ({ ...prev, TAXRECORD: 'Máximo 10 caracteres' }));
        }

        // Validar longitud de NOMIMPRESION
        if (name === 'NOMIMPRESION' && value.length > 20) {
            setErrores(prev => ({ ...prev, NOMIMPRESION: 'Máximo 20 caracteres' }));
        }
    };

    // Validar formulario completo
    const validarFormulario = () => {
        const nuevosErrores = {};

        // Nombre obligatorio
        if (!formData.NOMPRODUCTO.trim()) {
            nuevosErrores.NOMPRODUCTO = 'El nombre es obligatorio';
        }

        // Longitud máxima NOMPRODUCTO
        if (formData.NOMPRODUCTO.length > 20) {
            nuevosErrores.NOMPRODUCTO = 'Máximo 20 caracteres';
        }

        // Longitud máxima TAXRECORD
        if (formData.TAXRECORD && formData.TAXRECORD.length > 10) {
            nuevosErrores.TAXRECORD = 'Máximo 10 caracteres';
        }

        // Longitud máxima NOMIMPRESION
        if (formData.NOMIMPRESION && formData.NOMIMPRESION.length > 20) {
            nuevosErrores.NOMIMPRESION = 'Máximo 20 caracteres';
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

        // Validar nombre único final
        const nombreCambiado = producto && formData.NOMPRODUCTO.trim() !== producto.NOMPRODUCTO.trim();
        if (!producto || nombreCambiado) {
            if (!(await validarNombreProducto(formData.NOMPRODUCTO))) {
                Swal.fire('Error', 'El nombre del producto ya existe. Use un nombre diferente.', 'error');
                return;
            }
        }

        setGuardando(true);

        try {
            await onSave(formData);
        } catch (error) {
            console.error('Error guardando producto:', error);
            Swal.fire('Error', error.message, 'error');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Información del Producto
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre del Producto */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Producto *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="NOMPRODUCTO"
                                value={formData.NOMPRODUCTO}
                                onChange={handleChange}
                                placeholder="Ej: Rosas Rojas Premium"
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.NOMPRODUCTO ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                maxLength={20}
                            />
                            <div className="flex justify-between mt-1">
                                <div>
                                    {validandoNombre && (
                                        <div className="text-blue-600 text-sm flex items-center gap-1">
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            Validando nombre...
                                        </div>
                                    )}
                                    {errores.NOMPRODUCTO && (
                                        <div className="text-red-600 text-sm flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {errores.NOMPRODUCTO}
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {formData.NOMPRODUCTO.length}/20 caracteres
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Nombre único del producto. Máximo 20 caracteres.
                        </p>
                    </div>

                    {/* Nombre para Impresión */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre para Impresión
                        </label>
                        <div className="relative">
                            <Printer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="NOMIMPRESION"
                                value={formData.NOMIMPRESION}
                                onChange={handleChange}
                                placeholder="Ej: Rosas Rojas"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.NOMIMPRESION ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={20}
                            />
                        </div>
                        {errores.NOMIMPRESION && (
                            <div className="text-red-600 text-sm mt-1">{errores.NOMIMPRESION}</div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Nombre abreviado para tickets y facturas
                        </p>
                    </div>

                    {/* Registro Tributario */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Registro Tributario
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="TAXRECORD"
                                value={formData.TAXRECORD}
                                onChange={handleChange}
                                placeholder="Ej: 1234567890"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.TAXRECORD ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={10}
                            />
                        </div>
                        {errores.TAXRECORD && (
                            <div className="text-red-600 text-sm mt-1">{errores.TAXRECORD}</div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Código tributario o de impuesto
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
                            Producto Activo
                        </label>
                    </div>
                    <p className="text-sm text-gray-600">
                        {formData.ACTIVO === 1
                            ? '✓ Aparecerá en listas y podrá ser utilizado'
                            : '✗ No aparecerá en procesos activos'}
                    </p>
                </div>
                {/* Agregar esta nota para claridad */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">💡 Nota:</span> Para activar/desactivar este producto, marque o desmarque la casilla "Producto Activo" y guarde los cambios.
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
                            <span>{producto ? 'ACTUALIZAR PRODUCTO' : 'GUARDAR PRODUCTO'}</span>
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
                    <li>El nombre del producto debe ser único en el sistema</li>
                    <li>Productos inactivos no aparecerán en procesos de venta</li>
                    <li>El nombre para impresión se usará en tickets y facturas</li>
                </ul>
            </div>
        </form>
    );
};

export default ProductosForm;