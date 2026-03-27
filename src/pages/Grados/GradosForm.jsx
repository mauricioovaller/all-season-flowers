// src/pages/Grados/GradosForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Layers, Package, Ruler, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

// Servicio para validaciones
import { validarNombreGradoExistente } from '../../services/grados/gradosService';

const GradosForm = ({ grado, productos, onSave, onCancel }) => {
    // Estado del formulario
    const [formData, setFormData] = useState({
        IdProducto: '',
        NOMGRADO: '',
        TAMGRADO: '',
        ACTIVO: 1
    });

    // Estados para validaciones
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [validandoNombre, setValidandoNombre] = useState(false);
    const [nombreValido, setNombreValido] = useState(true);

    useEffect(() => {
        // Resetear formulario cuando gradoEditando cambie a null
        if (!grado) {
            setFormData({
                IdProducto: '',
                NOMGRADO: '',
                TAMGRADO: '',
                ACTIVO: 1
            });
            setErrores({});
            setNombreValido(true);
        }
    }, [grado]);

    // Cargar datos si estamos editando
    useEffect(() => {
        if (grado) {
            setFormData({
                ...grado,
                ACTIVO: grado.ACTIVO === 1 ? 1 : 0
            });
        }
    }, [grado]);

    // Validar nombre único por producto
    const validarNombreGrado = async (nombre, idProducto) => {
        if (!nombre || nombre.trim() === '') {
            setErrores(prev => ({ ...prev, NOMGRADO: 'El nombre es obligatorio' }));
            return false;
        }

        if (!idProducto) {
            setErrores(prev => ({ ...prev, IdProducto: 'Debe seleccionar un producto' }));
            return false;
        }

        // Validar longitud máxima
        if (nombre.length > 20) {
            setErrores(prev => ({ ...prev, NOMGRADO: 'Máximo 20 caracteres' }));
            return false;
        }

        setValidandoNombre(true);
        try {
            const existe = await validarNombreGradoExistente(
                nombre.trim(),
                idProducto,
                grado?.IdGrado || null
            );

            if (existe) {
                setErrores(prev => ({
                    ...prev,
                    NOMGRADO: 'Ya existe un grado con este nombre para el producto seleccionado'
                }));
                setNombreValido(false);
                setValidandoNombre(false);
                return false;
            }

            setErrores(prev => {
                const nuevos = { ...prev };
                delete nuevos.NOMGRADO;
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
        if (name === 'NOMGRADO' || name === 'IdProducto') {
            const nombre = name === 'NOMGRADO' ? value : formData.NOMGRADO;
            const idProducto = name === 'IdProducto' ? value : formData.IdProducto;

            if (nombre && nombre.trim() !== '' && idProducto) {
                // Solo validar si es nuevo grado o si cambió el nombre/producto
                const nombreCambiado = grado && nombre.trim() !== grado.NOMGRADO.trim();
                const productoCambiado = grado && idProducto != grado.IdProducto;

                if (!grado || nombreCambiado || productoCambiado) {
                    setTimeout(() => validarNombreGrado(nombre, idProducto), 500);
                } else {
                    setNombreValido(true);
                    setErrores(prev => {
                        const nuevos = { ...prev };
                        delete nuevos.NOMGRADO;
                        return nuevos;
                    });
                }
            }

            // Validar longitud máxima en tiempo real
            if (name === 'NOMGRADO' && value.length > 20) {
                setErrores(prev => ({ ...prev, NOMGRADO: 'Máximo 20 caracteres' }));
            }
        }

        // Validar longitud de TAMGRADO
        if (name === 'TAMGRADO' && value.length > 10) {
            setErrores(prev => ({ ...prev, TAMGRADO: 'Máximo 10 caracteres' }));
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
        if (!formData.NOMGRADO.trim()) {
            nuevosErrores.NOMGRADO = 'El nombre es obligatorio';
        }

        // Tamaño obligatorio
        if (!formData.TAMGRADO.trim()) {
            nuevosErrores.TAMGRADO = 'El tamaño es obligatorio';
        }

        // Longitud máxima NOMGRADO
        if (formData.NOMGRADO.length > 20) {
            nuevosErrores.NOMGRADO = 'Máximo 20 caracteres';
        }

        // Longitud máxima TAMGRADO
        if (formData.TAMGRADO.length > 10) {
            nuevosErrores.TAMGRADO = 'Máximo 10 caracteres';
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
        const nombreCambiado = grado && formData.NOMGRADO.trim() !== grado.NOMGRADO.trim();
        const productoCambiado = grado && formData.IdProducto != grado.IdProducto;
        
        if (!grado || nombreCambiado || productoCambiado) {
            if (!(await validarNombreGrado(formData.NOMGRADO, formData.IdProducto))) {
                Swal.fire('Error', 'Ya existe un grado con este nombre para el producto seleccionado.', 'error');
                return;
            }
        }

        setGuardando(true);

        try {
            await onSave(formData);
        } catch (error) {
            console.error('Error guardando grado:', error);
            Swal.fire('Error', error.message, 'error');
        } finally {
            setGuardando(false);
        }
    };

    // Obtener nombre del producto seleccionado
    const getNombreProductoSeleccionado = () => {
        if (!formData.IdProducto) return '';
        const producto = productos.find(p => p.IdProducto == formData.IdProducto);
        return producto ? producto.NOMPRODUCTO : '';
    };

    // Ejemplos de tamaños
    const ejemplosTamanos = ['GRANDE', 'MEDIO', 'PEQUEÑO', 'EXTRA_GRANDE', 'EXTRA_PEQ', 'ESTANDAR', 'PREMIUM'];

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
                        Seleccione el producto al que pertenece este grado
                    </p>
                </div>
            </div>

            {/* SECCIÓN 2: INFORMACIÓN DEL GRADO */}
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Información del Grado
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre del Grado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Grado *
                        </label>
                        <div className="relative">
                            <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="NOMGRADO"
                                value={formData.NOMGRADO}
                                onChange={handleChange}
                                placeholder="Ej: Grado A, Calidad Premium"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.NOMGRADO ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={20}
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
                                {errores.NOMGRADO && (
                                    <div className="text-red-600 text-sm flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errores.NOMGRADO}
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                {formData.NOMGRADO.length}/20 caracteres
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Nombre único para el producto seleccionado
                        </p>
                    </div>

                    {/* Tamaño del Grado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tamaño del Grado *
                        </label>
                        <div className="relative">
                            <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="TAMGRADO"
                                value={formData.TAMGRADO}
                                onChange={handleChange}
                                placeholder="Ej: GRANDE, MEDIO, PEQUEÑO"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${errores.TAMGRADO ? 'border-red-500' : 'border-gray-300'}`}
                                maxLength={10}
                            />
                        </div>
                        {errores.TAMGRADO && (
                            <div className="text-red-600 text-sm mt-1">{errores.TAMGRADO}</div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Tamaño o categoría (máx. 10 caracteres)
                        </p>
                    </div>
                </div>

                {/* Ejemplos de tamaños */}
                <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Ejemplos de tamaños:</p>
                    <div className="flex flex-wrap gap-2">
                        {ejemplosTamanos.map(tamano => (
                            <span
                                key={tamano}
                                className="text-xs px-2 py-1 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                                onClick={() => setFormData(prev => ({ ...prev, TAMGRADO: tamano }))}
                            >
                                {tamano}
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
                            Grado Activo
                        </label>
                    </div>
                    <p className="text-sm text-gray-600">
                        {formData.ACTIVO === 1
                            ? '✓ Aparecerá en listas y podrá ser utilizado'
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

            {/* RESUMEN DEL GRADO */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                    <CheckCircle className="w-5 h-5" />
                    Resumen del Grado
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                    <p><span className="font-medium">Producto:</span> {getNombreProductoSeleccionado() || 'No seleccionado'}</p>
                    <p><span className="font-medium">Grado:</span> {formData.NOMGRADO || 'No definido'}</p>
                    <p><span className="font-medium">Tamaño:</span> {formData.TAMGRADO || 'No definido'}</p>
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
                            <span>{grado ? 'ACTUALIZAR GRADO' : 'GUARDAR GRADO'}</span>
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
                    <li>El nombre del grado debe ser único para el producto seleccionado</li>
                    <li>El grado se asocia permanentemente al producto seleccionado</li>
                    <li>Grados inactivos no aparecerán en procesos de venta</li>
                    <li>Use tamaños estándar para facilitar la clasificación</li>
                </ul>
            </div>
        </form>
    );
};

export default GradosForm;