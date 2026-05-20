// src/pages/Aerolineas/AerolineasList.jsx
import React from 'react';
import { Edit, Mail, Phone, MapPin, User, Plane } from 'lucide-react';

const AerolineasList = ({ aerolineas, onEditar }) => {
    const renderDesktop = () => (
        <table className="min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contacto</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acción</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {aerolineas.map((a) => (
                    <tr key={a.IdAerolinea} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                            {a.CODAEROLINEA
                                ? <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-blue-100 text-blue-800 uppercase">{a.CODAEROLINEA}</span>
                                : <span className="text-gray-400 text-sm">—</span>}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Plane className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-semibold text-gray-900">{a.NOMAEROLINEA}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="space-y-1">
                                {a.E_MAILAEROLINEA && <div className="flex items-center gap-1 text-sm"><Mail className="w-3 h-3 text-gray-400" /><a href={`mailto:${a.E_MAILAEROLINEA}`} className="text-blue-600 hover:underline text-xs">{a.E_MAILAEROLINEA}</a></div>}
                                {a.TELAEROLINEA && <div className="flex items-center gap-1 text-sm text-gray-600"><Phone className="w-3 h-3 text-gray-400" />{a.TELAEROLINEA}</div>}
                                {a.CONTACTOAEROLINEA && <div className="flex items-center gap-1 text-sm text-gray-600"><User className="w-3 h-3 text-gray-400" />{a.CONTACTOAEROLINEA}</div>}
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
            {aerolineas.map((a) => (
                <div key={a.IdAerolinea} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                <Plane className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                {a.CODAEROLINEA && <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 uppercase mr-2">{a.CODAEROLINEA}</span>}
                                <h3 className="font-semibold text-gray-900">{a.NOMAEROLINEA}</h3>
                            </div>
                        </div>
                        <button onClick={() => onEditar(a)}
                            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 font-semibold">
                            <Edit className="w-4 h-4" /><span>Editar</span>
                        </button>
                    </div>
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                        {a.E_MAILAEROLINEA && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><a href={`mailto:${a.E_MAILAEROLINEA}`} className="text-blue-600 hover:underline">{a.E_MAILAEROLINEA}</a></div>}
                        {a.TELAEROLINEA && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{a.TELAEROLINEA}</span></div>}
                        {a.DIRAEROLINEA && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{a.DIRAEROLINEA}</span></div>}
                        {a.CONTACTOAEROLINEA && <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{a.CONTACTOAEROLINEA}</span></div>}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200">
            {renderDesktop()}
            {renderMobile()}
            {aerolineas.length === 0 && (
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay aerolíneas para mostrar</h3>
                    <p className="text-gray-500">Utiliza el botón "Nuevo" para comenzar</p>
                </div>
            )}
            {aerolineas.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">Mostrando <span className="font-semibold">{aerolineas.length}</span> aerolínea{aerolineas.length !== 1 ? 's' : ''}</div>
                </div>
            )}
        </div>
    );
};

export default AerolineasList;
