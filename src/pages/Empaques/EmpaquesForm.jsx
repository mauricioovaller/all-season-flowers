// src/pages/Empaques/EmpaquesForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Package, AlertCircle, RefreshCw, Trash2, Hash } from 'lucide-react';
import Swal from 'sweetalert2';
import { validarAbreviatura as validarAbreviaturaEmpaque, eliminarEmpaque } from '../../services/empaques/empaquesService';

const EmpaquesForm = ({ empaque, onSave, onCancel, onEliminado }) => {
    const initialState = { Abreviatura: '', Descripcion: '', EquivFull: '' };
    const [formData, setFormData] = useState(initialState);
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [validando, setValidando] = useState(false);
    const [abreviaturaValida, setAbreviaturaValida] = useState(true);

    useEffect(() => {
        if (!empaque) { setFormData(initialState); setErrores({}); setAbreviaturaValida(true); }
    }, [empaque]);

    useEffect(() => {
        if (empaque) setFormData({ Abreviatura: empaque.Abreviatura || '', Descripcion: empaque.Descripcion || '', EquivFull: empaque.EquivFull !== undefined && empaque.EquivFull !== null ? empaque.EquivFull : '' });
    }, [empaque]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let val = value;
        if (name === 'Abreviatura') val = value.toUpperCase();
        setFormData(prev => ({ ...prev, [name]: val }));
        if (errores[name]) setErrores(prev => { const n = { ...prev }; delete n[name]; return n; });

        if (name === 'Abreviatura' && val.trim() !== '') {
            const cambiado = !empaque || val.trim() !== empaque.Abreviatura?.trim();
            if (cambiado) {
                setTimeout(async () => {
                    setValidando(true);
                    const existe = await validarAbreviaturaEmpaque(val.trim(), empaque?.IdTipoEmpaque || null);
                    if (existe) { setErrores(prev => ({ ...prev, Abreviatura: 'Ya existe un empaque con esa abreviatura' })); setAbreviaturaValida(false); }
                    else { setErrores(prev => { const n = { ...prev }; delete n.Abreviatura; return n; }); setAbreviaturaValida(true); }
                    setValidando(false);
                }, 500);
            }
        }
    };

    const validarFormulario = () => {
        const e = {};
        if (!formData.Abreviatura.trim()) e.Abreviatura = 'La abreviatura es obligatoria';
        else if (formData.Abreviatura.length > 5) e.Abreviatura = 'Máximo 5 caracteres';
        if (!formData.Descripcion.trim()) e.Descripcion = 'La descripción es obligatoria';
        if (formData.EquivFull !== '' && isNaN(parseFloat(formData.EquivFull))) e.EquivFull = 'Debe ser un número válido';
        setErrores(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (!validarFormulario()) return;
        if (!abreviaturaValida) { Swal.fire('Error', 'La abreviatura ya está en uso. Use otra diferente.', 'error'); return; }
        setGuardando(true);
        try { await onSave({ ...formData, EquivFull: formData.EquivFull !== '' ? parseFloat(formData.EquivFull) : null }); } finally { setGuardando(false); }
    };

    const handleEliminar = async () => {
        if (!empaque) return;
        const conf = await Swal.fire({ title: '¿Eliminar empaque?', html: `<p>Se eliminará el empaque <strong>${empaque.Descripcion}</strong> (<strong>${empaque.Abreviatura}</strong>).</p><p class="text-sm text-red-600 mt-2">Esta acción no se puede deshacer.</p>`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
        if (!conf.isConfirmed) return;
        try {
            await eliminarEmpaque(empaque.IdTipoEmpaque);
            Swal.fire({ icon: 'success', title: 'Eliminado', text: `${empaque.Descripcion} fue eliminado`, timer: 2000 });
            if (onEliminado) onEliminado();
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />Información del Empaque
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Abreviatura * (máx. 5 caracteres)</label>
                        <input type="text" name="Abreviatura" value={formData.Abreviatura} onChange={handleChange} maxLength={5}
                            placeholder="Ej: FULL" className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 uppercase font-bold text-green-800 ${errores.Abreviatura ? 'border-red-500' : 'border-gray-300'}`} />
                        {validando && <div className="text-blue-600 text-sm mt-1 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />Validando...</div>}
                        {errores.Abreviatura && <div className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errores.Abreviatura}</div>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Equiv. Full</label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="number" name="EquivFull" value={formData.EquivFull} onChange={handleChange} step="0.01" min="0"
                                placeholder="0.00" className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${errores.EquivFull ? 'border-red-500' : 'border-gray-300'}`} />
                        </div>
                        {errores.EquivFull && <div className="text-red-600 text-sm mt-1">{errores.EquivFull}</div>}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                        <input type="text" name="Descripcion" value={formData.Descripcion} onChange={handleChange} maxLength={50}
                            placeholder="Ej: Full Box" className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${errores.Descripcion ? 'border-red-500' : 'border-gray-300'}`} />
                        {errores.Descripcion && <div className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errores.Descripcion}</div>}
                    </div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex gap-3">
                    <button type="submit" disabled={guardando}
                        className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-semibold disabled:opacity-70">
                        <Save className="w-5 h-5" />{guardando ? 'Guardando...' : (empaque ? 'Actualizar' : 'Guardar')}
                    </button>
                    <button type="button" onClick={onCancel}
                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold">
                        <X className="w-5 h-5" />Cancelar
                    </button>
                </div>
                {empaque && (
                    <button type="button" onClick={handleEliminar}
                        className="border border-red-300 text-red-600 px-5 py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2 font-semibold">
                        <Trash2 className="w-4 h-4" />Eliminar
                    </button>
                )}
            </div>
        </form>
    );
};

export default EmpaquesForm;
