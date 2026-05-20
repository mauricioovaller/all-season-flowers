// src/pages/Agencias/AgenciasList.jsx
import React from 'react';
import { Edit, Mail, Phone, MapPin, User, Building2 } from 'lucide-react';

const AgenciasList = ({ agencias, onEditar }) => {
    const renderDesktop = () => (
        <table className="min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Agencia</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contacto</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acción</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {agencias.map((a) => (
                    <tr key={a.IdAgencia} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-800">
                                    {a.NOMAGENCIA.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">{a.NOMAGENCIA}</div>
                                    {a.DIRAGENCIA && <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{a.DIRAGENCIA}</div>}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="space-y-1">
                                {a.E_MAILAGENCIA && <div className="flex items-center gap-1 text-sm"><Mail className="w-3 h-3 text-gray-400" /><a href={`mailto:${a.E_MAILAGENCIA}`} className="text-blue-600 hover:underline text-xs">{a.E_MAILAGENCIA}</a></div>}
                                {a.TELAGENCIA && <div className="flex items-center gap-1 text-sm text-gray-600"><Phone className="w-3 h-3 text-gray-400" />{a.TELAGENCIA}</div>}
                                {a.CONTACTOAGENCIA && <div className="flex items-center gap-1 text-sm text-gray-600"><User className="w-3 h-3 text-gray-400" />{a.CONTACTOAGENCIA}</div>}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <button onClick={() => onEditar(a)}
                                className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.05] transition-all duration-200 flex items-center gap-2 font-semibold">
                                <Edit className="w-4 h-4" /><span>Editar</span>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderMobile = () => (
        <div className="space-y-4 md:hidden">
            {agencias.map((a) => (
                <div key={a.IdAgencia} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-800">
                                {a.NOMAGENCIA.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="font-semibold text-gray-900">{a.NOMAGENCIA}</h3>
                        </div>
                        <button onClick={() => onEditar(a)}
                            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 font-semibold">
                            <Edit className="w-4 h-4" /><span>Editar</span>
                        </button>
                    </div>
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                        {a.E_MAILAGENCIA && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><a href={`mailto:${a.E_MAILAGENCIA}`} className="text-blue-600 hover:underline">{a.E_MAILAGENCIA}</a></div>}
                        {a.TELAGENCIA && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{a.TELAGENCIA}</span></div>}
                        {a.DIRAGENCIA && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{a.DIRAGENCIA}</span></div>}
                        {a.CONTACTOAGENCIA && <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{a.CONTACTOAGENCIA}</span></div>}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200">
            {renderDesktop()}
            {renderMobile()}
            {agencias.length === 0 && (
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay agencias para mostrar</h3>
                    <p className="text-gray-500">Utiliza el botón "Nuevo" para comenzar</p>
                </div>
            )}
            {agencias.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">Mostrando <span className="font-semibold">{agencias.length}</span> agencia{agencias.length !== 1 ? 's' : ''}</div>
                </div>
            )}
        </div>
    );
};

export default AgenciasList;
