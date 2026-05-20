// src/pages/Agencias/AgenciasForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Mail, Phone, MapPin, User, AlertCircle, RefreshCw, Trash2, Building2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { validarNombreAgencia, eliminarAgencia } from '../../services/agencias/agenciasService';

const AgenciasForm = ({ agencia, onSave, onCancel, onEliminado }) => {
    const initialState = { NOMAGENCIA: '', DIRAGENCIA: '', TELAGENCIA: '', E_MAILAGENCIA: '', CONTACTOAGENCIA: '' };
    const [formData, setFormData] = useState(initialState);
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [validando, setValidando] = useState(false);
    const [nombreValido, setNombreValido] = useState(true);

    useEffect(() => {
        if (!agencia) { setFormData(initialState); setErrores({}); setNombreValido(true); }
    }, [agencia]);

    useEffect(() => {
        if (agencia) setFormData({ NOMAGENCIA: agencia.NOMAGENCIA || '', DIRAGENCIA: agencia.DIRAGENCIA || '', TELAGENCIA: agencia.TELAGENCIA || '', E_MAILAGENCIA: agencia.E_MAILAGENCIA || '', CONTACTOAGENCIA: agencia.CONTACTOAGENCIA || '' });
    }, [agencia]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errores[name]) setErrores(prev => { const n = { ...prev }; delete n[name]; return n; });

        if (name === 'NOMAGENCIA' && value.trim() !== '') {
            const cambiado = !agencia || value.trim() !== agencia.NOMAGENCIA?.trim();
            if (cambiado) {
                setTimeout(async () => {
                    setValidando(true);
                    const existe = await validarNombreAgencia(value.trim(), agencia?.IdAgencia || null);
                    if (existe) { setErrores(prev => ({ ...prev, NOMAGENCIA: 'Ya existe una agencia con ese nombre' })); setNombreValido(false); }
                    else { setErrores(prev => { const n = { ...prev }; delete n.NOMAGENCIA; return n; }); setNombreValido(true); }
                    setValidando(false);
                }, 500);
            }
        }

        if (name === 'E_MAILAGENCIA' && value) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) setErrores(prev => ({ ...prev, E_MAILAGENCIA: 'Formato de email inválido' }));
            else setErrores(prev => { const n = { ...prev }; delete n.E_MAILAGENCIA; return n; });
        }
    };

    const validarFormulario = () => {
        const e = {};
        if (!formData.NOMAGENCIA.trim()) e.NOMAGENCIA = 'El nombre es obligatorio';
        setErrores(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (!validarFormulario()) return;
        if (!nombreValido) { Swal.fire('Error', 'El nombre ya está en uso.', 'error'); return; }
        setGuardando(true);
        try { await onSave({ ...formData, IdAgencia: agencia?.IdAgencia }); } finally { setGuardando(false); }
    };

    const handleEliminar = async () => {
        if (!agencia) return;
        const conf = await Swal.fire({ title: '¿Eliminar agencia?', html: `<p>Se eliminará <strong>${agencia.NOMAGENCIA}</strong>.</p><p class="text-sm text-red-600 mt-2">Esta acción no se puede deshacer.</p>`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
        if (!conf.isConfirmed) return;
        try {
            await eliminarAgencia(agencia.IdAgencia);
            Swal.fire({ icon: 'success', title: 'Eliminada', text: `${agencia.NOMAGENCIA} fue eliminada`, timer: 2000 });
            if (onEliminado) onEliminado();
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-green-600" />Información de la Agencia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                        <input type="text" name="NOMAGENCIA" value={formData.NOMAGENCIA} onChange={handleChange} maxLength={60}
                            placeholder="Nombre de la agencia" className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${errores.NOMAGENCIA ? 'border-red-500' : 'border-gray-300'}`} />
                        {validando && <div className="text-blue-600 text-sm mt-1 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />Validando...</div>}
                        {errores.NOMAGENCIA && <div className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errores.NOMAGENCIA}</div>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" name="TELAGENCIA" value={formData.TELAGENCIA} onChange={handleChange} maxLength={30}
                                placeholder="Teléfono de contacto" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="email" name="E_MAILAGENCIA" value={formData.E_MAILAGENCIA} onChange={handleChange} maxLength={80}
                                placeholder="correo@ejemplo.com" className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${errores.E_MAILAGENCIA ? 'border-red-500' : 'border-gray-300'}`} />
                        </div>
                        {errores.E_MAILAGENCIA && <div className="text-red-600 text-sm mt-1">{errores.E_MAILAGENCIA}</div>}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" name="DIRAGENCIA" value={formData.DIRAGENCIA} onChange={handleChange} maxLength={100}
                                placeholder="Dirección" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Persona de contacto</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" name="CONTACTOAGENCIA" value={formData.CONTACTOAGENCIA} onChange={handleChange} maxLength={80}
                                placeholder="Nombre del contacto" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex gap-3">
                    <button type="submit" disabled={guardando}
                        className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-semibold disabled:opacity-70">
                        <Save className="w-5 h-5" />{guardando ? 'Guardando...' : (agencia ? 'Actualizar' : 'Guardar')}
                    </button>
                    <button type="button" onClick={onCancel}
                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold">
                        <X className="w-5 h-5" />Cancelar
                    </button>
                </div>
                {agencia && (
                    <button type="button" onClick={handleEliminar}
                        className="border border-red-300 text-red-600 px-5 py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2 font-semibold">
                        <Trash2 className="w-4 h-4" />Eliminar
                    </button>
                )}
            </div>
        </form>
    );
};

export default AgenciasForm;
