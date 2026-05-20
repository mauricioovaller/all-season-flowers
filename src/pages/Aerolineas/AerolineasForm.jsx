// src/pages/Aerolineas/AerolineasForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Mail, Phone, MapPin, User, AlertCircle, RefreshCw, Trash2, Plane } from 'lucide-react';
import Swal from 'sweetalert2';
import { validarNombreAerolinea, eliminarAerolinea } from '../../services/aerolineas/aerolineasService';

const AerolineasForm = ({ aerolinea, onSave, onCancel, onEliminado }) => {
    const initialState = { NOMAEROLINEA: '', CODAEROLINEA: '', DIRAEROLINEA: '', TELAEROLINEA: '', E_MAILAEROLINEA: '', CONTACTOAEROLINEA: '' };
    const [formData, setFormData] = useState(initialState);
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [validando, setValidando] = useState(false);
    const [nombreValido, setNombreValido] = useState(true);

    useEffect(() => {
        if (!aerolinea) { setFormData(initialState); setErrores({}); setNombreValido(true); }
    }, [aerolinea]);

    useEffect(() => {
        if (aerolinea) setFormData({ NOMAEROLINEA: aerolinea.NOMAEROLINEA || '', CODAEROLINEA: aerolinea.CODAEROLINEA || '', DIRAEROLINEA: aerolinea.DIRAEROLINEA || '', TELAEROLINEA: aerolinea.TELAEROLINEA || '', E_MAILAEROLINEA: aerolinea.E_MAILAEROLINEA || '', CONTACTOAEROLINEA: aerolinea.CONTACTOAEROLINEA || '' });
    }, [aerolinea]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let val = value;
        if (name === 'CODAEROLINEA') val = value.toUpperCase();
        setFormData(prev => ({ ...prev, [name]: val }));
        if (errores[name]) setErrores(prev => { const n = { ...prev }; delete n[name]; return n; });

        if (name === 'NOMAEROLINEA' && val.trim() !== '') {
            const cambiado = !aerolinea || val.trim() !== aerolinea.NOMAEROLINEA?.trim();
            if (cambiado) {
                setTimeout(async () => {
                    setValidando(true);
                    const existe = await validarNombreAerolinea(val.trim(), aerolinea?.IdAerolinea || null);
                    if (existe) { setErrores(prev => ({ ...prev, NOMAEROLINEA: 'Ya existe una aerolínea con ese nombre' })); setNombreValido(false); }
                    else { setErrores(prev => { const n = { ...prev }; delete n.NOMAEROLINEA; return n; }); setNombreValido(true); }
                    setValidando(false);
                }, 500);
            }
        }

        if (name === 'E_MAILAEROLINEA' && val) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) setErrores(prev => ({ ...prev, E_MAILAEROLINEA: 'Formato de email inválido' }));
            else setErrores(prev => { const n = { ...prev }; delete n.E_MAILAEROLINEA; return n; });
        }
    };

    const validarFormulario = () => {
        const e = {};
        if (!formData.NOMAEROLINEA.trim()) e.NOMAEROLINEA = 'El nombre es obligatorio';
        if (formData.CODAEROLINEA.length > 10) e.CODAEROLINEA = 'Máximo 10 caracteres';
        setErrores(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (!validarFormulario()) return;
        if (!nombreValido) { Swal.fire('Error', 'El nombre ya está en uso.', 'error'); return; }
        setGuardando(true);
        try { await onSave({ ...formData, IdAerolinea: aerolinea?.IdAerolinea }); } finally { setGuardando(false); }
    };

    const handleEliminar = async () => {
        if (!aerolinea) return;
        const conf = await Swal.fire({ title: '¿Eliminar aerolínea?', html: `<p>Se eliminará <strong>${aerolinea.NOMAEROLINEA}</strong>.</p><p class="text-sm text-red-600 mt-2">Esta acción no se puede deshacer.</p>`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
        if (!conf.isConfirmed) return;
        try {
            await eliminarAerolinea(aerolinea.IdAerolinea);
            Swal.fire({ icon: 'success', title: 'Eliminada', text: `${aerolinea.NOMAEROLINEA} fue eliminada`, timer: 2000 });
            if (onEliminado) onEliminado();
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Plane className="w-5 h-5 text-green-600" />Información de la Aerolínea
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                        <input type="text" name="NOMAEROLINEA" value={formData.NOMAEROLINEA} onChange={handleChange} maxLength={60}
                            placeholder="Ej: Avianca" className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${errores.NOMAEROLINEA ? 'border-red-500' : 'border-gray-300'}`} />
                        {validando && <div className="text-blue-600 text-sm mt-1 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />Validando...</div>}
                        {errores.NOMAEROLINEA && <div className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errores.NOMAEROLINEA}</div>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
                        <input type="text" name="CODAEROLINEA" value={formData.CODAEROLINEA} onChange={handleChange} maxLength={10}
                            placeholder="Ej: AV" className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 uppercase font-bold ${errores.CODAEROLINEA ? 'border-red-500' : 'border-gray-300'}`} />
                        {errores.CODAEROLINEA && <div className="text-red-600 text-sm mt-1">{errores.CODAEROLINEA}</div>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" name="TELAEROLINEA" value={formData.TELAEROLINEA} onChange={handleChange} maxLength={30}
                                placeholder="Teléfono de contacto" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" name="DIRAEROLINEA" value={formData.DIRAEROLINEA} onChange={handleChange} maxLength={100}
                                placeholder="Dirección" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="email" name="E_MAILAEROLINEA" value={formData.E_MAILAEROLINEA} onChange={handleChange} maxLength={80}
                                placeholder="correo@ejemplo.com" className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${errores.E_MAILAEROLINEA ? 'border-red-500' : 'border-gray-300'}`} />
                        </div>
                        {errores.E_MAILAEROLINEA && <div className="text-red-600 text-sm mt-1">{errores.E_MAILAEROLINEA}</div>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Persona de contacto</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" name="CONTACTOAEROLINEA" value={formData.CONTACTOAEROLINEA} onChange={handleChange} maxLength={80}
                                placeholder="Nombre del contacto" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex gap-3">
                    <button type="submit" disabled={guardando}
                        className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-semibold disabled:opacity-70">
                        <Save className="w-5 h-5" />{guardando ? 'Guardando...' : (aerolinea ? 'Actualizar' : 'Guardar')}
                    </button>
                    <button type="button" onClick={onCancel}
                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold">
                        <X className="w-5 h-5" />Cancelar
                    </button>
                </div>
                {aerolinea && (
                    <button type="button" onClick={handleEliminar}
                        className="border border-red-300 text-red-600 px-5 py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2 font-semibold">
                        <Trash2 className="w-4 h-4" />Eliminar
                    </button>
                )}
            </div>
        </form>
    );
};

export default AerolineasForm;
