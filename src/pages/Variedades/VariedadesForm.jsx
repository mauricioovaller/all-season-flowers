// src/pages/Variedades/VariedadesForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Palette, Package, Tag, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

// Servicio para validaciones
import { validarNombreVariedadExistente } from '../../services/variedades/variedadesService';

const VariedadesForm = ({ variedad, productos, onSave, onCancel }) => {
    // Estado del formulario
    const [formData, setFormData] = useState({
        IdProducto: '',
        NOMVARIEDAD: '',
        COLOR: '',
        ACTIVO: 1
    });

    // Estados para validaciones
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [validandoNombre, setValidandoNombre] = useState(false);
    const [nombreValido, setNombreValido] = useState(true);

    useEffect(() => {
        // Resetear formulario cuando variedadEditando cambie a null
        if (!variedad) {
            setFormData({
                IdProducto: '',
                NOMVARIEDAD: '',
                COLOR: '',
                ACTIVO: 1
            });
            setErrores({});
            setNombreValido(true);
        }
    }, [variedad]);

    // Cargar datos si estamos editando
    useEffect(() => {
        if (variedad) {
            setFormData({
                ...variedad,
                ACTIVO: variedad.ACTIVO === 1 ? 1 : 0
            });
        }
    }, [variedad]);

    // Validar nombre único por producto
    const validarNombreVariedad = async (nombre, idProducto) => {
        if (!nombre || nombre.trim() === '') {
            setErrores(prev => ({ ...prev, NOMVARIEDAD: 'El nombre es obligatorio' }));
            return false;
        }

        if (!idProducto) {
            setErrores(prev => ({ ...prev, IdProducto: 'Debe seleccionar un producto' }));
            return false;
        }

        // Validar longitud máxima
        if (nombre.length > 30) {
            setErrores(prev => ({ ...prev, NOMVARIEDAD: 'Máximo 30 caracteres' }));
            return false;
        }

        setValidandoNombre(true);
        try {
            const existe = await validarNombreVariedadExistente(
                nombre.trim(),
                idProducto,
                variedad?.IdVariedad || null
            );

            if (existe) {
                setErrores(prev => ({
                    ...prev,
                    NOMVARIEDAD: 'Ya existe una variedad con este nombre para el producto seleccionado'
                }));
                setNombreValido(false);
                setValidandoNombre(false);
                return false;
            }

            setErrores(prev => {
                const nuevos = { ...prev };
                delete nuevos.NOMVARIEDAD;
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

        // Si cambia el producto o el nombre, validar unicidad
        if (name === 'NOMVARIEDAD' || name === 'IdProducto') {
            const nombre = name === 'NOMVARIEDAD' ? value : formData.NOMVARIEDAD;
            const idProducto = name === 'IdProducto' ? value : formData.IdProducto;

            if (nombre && nombre.trim() !== '' && idProducto) {
                // Solo validar si es nueva variedad o si cambió el nombre/producto
                const nombreCambiado = variedad && nombre.trim() !== variedad.NOMVARIEDAD.trim();
                const productoCambiado = variedad && idProducto != variedad.IdProducto;

                if (!variedad || nombreCambiado || productoCambiado) {
                    setTimeout(() => validarNombreVariedad(nombre, idProducto), 500);
                } else {
                    setNombreValido(true);
                    setErrores(prev => {
                        const nuevos = { ...prev };
                        delete nuevos.NOMVARIEDAD;
                        return nuevos;
                    });
                }
            }

            // Validar longitud máxima en tiempo real
            if (name === 'NOMVARIEDAD' && value.length > 30) {
                setErrores(prev => ({ ...prev, NOMVARIEDAD: 'Máximo 30 caracteres' }));
            }
        }

        // Validar longitud de COLOR
        if (name === 'COLOR' && value.length > 5) {
            setErrores(prev => ({ ...prev, COLOR: 'Máximo 5 caracteres' }));
        }
    };

    // Validar formulario completo
    const validarFormulario = () => {
        const nuevosErrores = {};

        // Producto obligatorio
        if (!formData.IdProducto) {
            nuevosErrores.IdProducto = 'Debe seleccionar un producto';
        }

        // Nombre obligatorio
        if (!formData.NOMVARIEDAD.trim()) {
            nuevosErrores.NOMVARIEDAD = 'El nombre es obligatorio';
        }

        // Longitud máxima NOMVARIEDAD
        if (formData.NOMVARIEDAD.length > 30) {
            nuevosErrores.NOMVARIEDAD = 'Máximo 30 caracteres';
        }

        // Longitud máxima COLOR
        if (formData.COLOR && formData.COLOR.length > 5) {
            nuevosErrores.COLOR = 'Máximo 5 caracteres';
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
        const nombreCambiado = variedad && formData.NOMVARIEDAD.trim() !== variedad.NOMVARIEDAD.trim();
        const productoCambiado = variedad && formData.IdProducto != variedad.IdProducto;
        
        if (!variedad || nombreCambiado || productoCambiado) {
            if (!(await validarNombreVariedad(formData.NOMVARIEDAD, formData.IdProducto))) {
                Swal.fire('Error', 'Ya existe una variedad con este nombre para el producto seleccionado.', 'error');
                return;
            }
        }

        setGuardando(true);

        try {
            await onSave(formData);
        } catch (error) {
            console.error('Error guardando variedad:', error);
            Swal.fire('Error', error.message, 'error');
        } finally {
            setGuardando(false);
        }
    };

    // Obtener nombre del producto seleccionado (para mostrar en errores/ayudas)
    const getNombreProductoSeleccionado = () => {
        if (!formData.IdProducto) return '';
        const producto = productos.find(p => p.IdProducto == formData.IdProducto);
        return producto ? producto.NOMPRODUCTO : '';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECCIÓN 1: SELECCIÓN DE PRODUCTO */}
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Producto Relacionado
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Producto *
                    </label>
                    <div className="relative">
                        <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                            name="IdProducto"
                            value={formData.IdProducto}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.IdProducto ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Seleccione un producto...</option>
                            {productos.map(producto => (
                                <option key={producto.IdProducto} value={producto.IdProducto}>
                                    {producto.NOMPRODUCTO}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errores.IdProducto && (
                        <div className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errores.IdProducto}
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        Seleccione el producto al que pertenece esta variedad
                    </p>
                </div>
            </div>

            {/* SECCIÓN 2: INFORMACIÓN DE LA VARIEDAD */}
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Información de la Variedad
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre de la Variedad */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de la Variedad *
                        </label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="NOMVARIEDAD"
                                value={formData.NOMVARIEDAD}
                                onChange={handleChange}
                                placeholder="Ej: Royal, Premium, Clásica"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.NOMVARIEDAD ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={30}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <div>
                                {validandoNombre && (
                                    <div className="text-blue-600 text-sm flex items-center gap-1">
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        Validando nombre...
                                    </div>
                                )}
                                {errores.NOMVARIEDAD && (
                                    <div className="text-red-600 text-sm flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errores.NOMVARIEDAD}
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                {formData.NOMVARIEDAD.length}/30 caracteres
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Nombre único para el producto seleccionado
                        </p>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color (Opcional)
                        </label>
                        <div className="relative">
                            <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="COLOR"
                                value={formData.COLOR}
                                onChange={handleChange}
                                placeholder="Ej: ROJO, AZUL, VERDE"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.COLOR ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={5}
                            />
                        </div>
                        {errores.COLOR && (
                            <div className="text-red-600 text-sm mt-1">{errores.COLOR}</div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Código de color corto (máx. 5 caracteres)
                        </p>
                    </div>
                </div>

                {/* Ejemplos de colores */}
                <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Ejemplos de códigos de color:</p>
                    <div className="flex flex-wrap gap-2">
                        {['ROJO', 'AZUL', 'VERDE', 'AMAR', 'BLAN', 'NEGA', 'ROSA', 'NARA', 'MORA', 'GRIS'].map(color => (
                            <span
                                key={color}
                                className="text-xs px-2 py-1 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                                onClick={() => setFormData(prev => ({ ...prev, COLOR: color }))}
                            >
                                {color}
                            </span>
                        ))}
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
                            Variedad Activa
                        </label>
                    </div>
                    <p className="text-sm text-gray-600">
                        {formData.ACTIVO === 1
                            ? '✓ Aparecerá en listas y podrá ser utilizada'
                            : '✗ No aparecerá en procesos activos'}
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

            {/* RESUMEN DE LA VARIEDAD */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                    <CheckCircle className="w-5 h-5" />
                    Resumen de la Variedad
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                    <p><span className="font-medium">Producto:</span> {getNombreProductoSeleccionado() || 'No seleccionado'}</p>
                    <p><span className="font-medium">Variedad:</span> {formData.NOMVARIEDAD || 'No definido'}</p>
                    <p><span className="font-medium">Color:</span> {formData.COLOR || 'No asignado'}</p>
                    <p><span className="font-medium">Estado:</span> {formData.ACTIVO === 1 ? 'Activa' : 'Inactiva'}</p>
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
                            <span>{variedad ? 'ACTUALIZAR VARIEDAD' : 'GUARDAR VARIEDAD'}</span>
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
                    <li>El nombre de la variedad debe ser único para el producto seleccionado</li>
                    <li>La variedad se asocia permanentemente al producto seleccionado</li>
                    <li>Variedades inactivas no aparecerán en procesos de venta</li>
                    <li>Use códigos de color cortos para facilitar la identificación</li>
                </ul>
            </div>
        </form>
    );
};

export default VariedadesForm;