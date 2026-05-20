// src/pages/EjecutivosVenta/EjecutivosVentaForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Mail, CreditCard, User, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { validarNombreEjecutivoVenta, eliminarEjecutivoVenta } from '../../services/ejecutivosVenta/ejecutivosVentaService';

const EjecutivosVentaForm = ({ ejecutivo, onSave, onCancel, onEliminado }) => {
    const initialState = { NOMEJECUTIVO: '', E_MAILEJECUTIVO: '', IdentifEjecutivo: '', ACTIVO: 1 };

    const [formData, setFormData] = useState(initialState);
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [validando, setValidando] = useState(false);
    const [nombreValido, setNombreValido] = useState(true);

    useEffect(() => {
        if (!ejecutivo) {
            setFormData(initialState);
            setErrores({});
            setNombreValido(true);
        }
    }, [ejecutivo]);

    useEffect(() => {
        if (ejecutivo) {
            setFormData({ ...ejecutivo, ACTIVO: ejecutivo.ACTIVO === 1 ? 1 : 0 });
        }
    }, [ejecutivo]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value }));
        if (errores[name]) setErrores(prev => { const n = { ...prev }; delete n[name]; return n; });

        if (name === 'NOMEJECUTIVO' && value.trim() !== '') {
            const nombreCambiado = !ejecutivo || value.trim() !== ejecutivo.NOMEJECUTIVO?.trim();
            if (nombreCambiado) {
                setTimeout(async () => {
                    setValidando(true);
                    const existe = await validarNombreEjecutivoVenta(value.trim(), ejecutivo?.IdEjecutivo || null);
                    if (existe) {
                        setErrores(prev => ({ ...prev, NOMEJECUTIVO: 'Ya existe un ejecutivo de venta con ese nombre' }));
                        setNombreValido(false);
                    } else {
                        setErrores(prev => { const n = { ...prev }; delete n.NOMEJECUTIVO; return n; });
                        setNombreValido(true);
                    }
                    setValidando(false);
                }, 500);
            }
        }

        if (name === 'E_MAILEJECUTIVO' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                setErrores(prev => ({ ...prev, E_MAILEJECUTIVO: 'Formato de email inválido' }));
            } else {
                setErrores(prev => { const n = { ...prev }; delete n.E_MAILEJECUTIVO; return n; });
            }
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};
        if (!formData.NOMEJECUTIVO.trim()) nuevosErrores.NOMEJECUTIVO = 'El nombre es obligatorio';
        if (formData.NOMEJECUTIVO.length > 50) nuevosErrores.NOMEJECUTIVO = 'Máximo 50 caracteres';
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;
        if (!nombreValido) { Swal.fire('Error', 'El nombre ya está en uso. Use un nombre diferente.', 'error'); return; }
        setGuardando(true);
        try {
            await onSave(formData);
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async () => {
        if (!ejecutivo) return;
        const confirmacion = await Swal.fire({
            title: '¿Desactivar ejecutivo?',
            html: `<p>Se desactivará <strong>${ejecutivo.NOMEJECUTIVO}</strong>.</p><p class="text-sm text-gray-500 mt-2">El registro no se eliminará permanentemente.</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        });
        if (!confirmacion.isConfirmed) return;
        try {
            await eliminarEjecutivoVenta(ejecutivo.IdEjecutivo);
            Swal.fire({ icon: 'success', title: 'Desactivado', text: `${ejecutivo.NOMEJECUTIVO} fue desactivado correctamente`, timer: 2000 });
            if (onEliminado) onEliminado();
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    Información del Ejecutivo de Venta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Nombre */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                        <input
                            type="text" name="NOMEJECUTIVO" value={formData.NOMEJECUTIVO}
                            onChange={handleChange} maxLength={50}
                            placeholder="Ej: Juan Carlos Pérez"
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${errores.NOMEJECUTIVO ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {validando && <div className="text-blue-600 text-sm mt-1 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />Validando...</div>}
                        {errores.NOMEJECUTIVO && <div className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errores.NOMEJECUTIVO}</div>}
                    </div>
                    {/* Identificación */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Identificación</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text" name="IdentifEjecutivo" value={formData.IdentifEjecutivo}
                                onChange={handleChange} maxLength={50}
                                placeholder="Cédula o documento"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="email" name="E_MAILEJECUTIVO" value={formData.E_MAILEJECUTIVO}
                                onChange={handleChange} maxLength={50}
                                placeholder="correo@ejemplo.com"
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${errores.E_MAILEJECUTIVO ? 'border-red-500' : 'border-gray-300'}`}
                            />
                        </div>
                        {errores.E_MAILEJECUTIVO && <div className="text-red-600 text-sm mt-1">{errores.E_MAILEJECUTIVO}</div>}
                    </div>
                    {/* ACTIVO */}
                    <div className="md:col-span-2">
                        <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
                            <div className="relative">
                                <input type="checkbox" name="ACTIVO" checked={formData.ACTIVO === 1} onChange={handleChange} className="sr-only" />
                                <div className={`w-12 h-6 rounded-full transition-colors ${formData.ACTIVO === 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.ACTIVO === 1 ? 'translate-x-7' : 'translate-x-1'}`}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{formData.ACTIVO === 1 ? 'Activo' : 'Inactivo'}</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex gap-3">
                    <button type="submit" disabled={guardando}
                        className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-semibold disabled:opacity-70">
                        <Save className="w-5 h-5" />{guardando ? 'Guardando...' : (ejecutivo ? 'Actualizar' : 'Guardar')}
                    </button>
                    <button type="button" onClick={onCancel}
                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold">
                        <X className="w-5 h-5" />Cancelar
                    </button>
                </div>
                {ejecutivo && (
                    <button type="button" onClick={handleEliminar}
                        className="border border-red-300 text-red-600 px-5 py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2 font-semibold">
                        <Trash2 className="w-4 h-4" />Desactivar
                    </button>
                )}
            </div>
        </form>
    );
};

export default EjecutivosVentaForm;
