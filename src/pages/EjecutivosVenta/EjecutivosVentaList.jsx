// src/pages/EjecutivosVenta/EjecutivosVentaList.jsx
import React from 'react';
import { Edit, CheckCircle, XCircle, Mail, CreditCard } from 'lucide-react';

const EjecutivosVentaList = ({ ejecutivos, onEditar }) => {
    const renderDesktop = () => (
        <table className="min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ejecutivo</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contacto</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acción</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {ejecutivos.map((ej) => (
                    <tr key={ej.IdEjecutivo} className={`hover:bg-gray-50 transition-colors ${ej.ACTIVO === 0 ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${ej.ACTIVO === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {ej.NOMEJECUTIVO.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">{ej.NOMEJECUTIVO}</div>
                                    {ej.IdentifEjecutivo && <div className="text-xs text-gray-500 flex items-center gap-1"><CreditCard className="w-3 h-3" />{ej.IdentifEjecutivo}</div>}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            {ej.E_MAILEJECUTIVO ? (
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <a href={`mailto:${ej.E_MAILEJECUTIVO}`} className="text-blue-600 hover:underline">{ej.E_MAILEJECUTIVO}</a>
                                </div>
                            ) : <span className="text-gray-400 text-sm">Sin email</span>}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${ej.ACTIVO === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {ej.ACTIVO === 1 ? <><CheckCircle className="w-3 h-3" />Activo</> : <><XCircle className="w-3 h-3" />Inactivo</>}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <button
                                onClick={() => onEditar(ej)}
                                className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.05] transition-all duration-200 flex items-center gap-2 font-semibold"
                            >
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
            {ejecutivos.map((ej) => (
                <div key={ej.IdEjecutivo} className={`bg-white rounded-xl border ${ej.ACTIVO === 1 ? 'border-gray-200' : 'border-gray-300 bg-gray-50/50'} p-4 shadow-sm`}>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${ej.ACTIVO === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {ej.NOMEJECUTIVO.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{ej.NOMEJECUTIVO}</h3>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${ej.ACTIVO === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {ej.ACTIVO === 1 ? <><CheckCircle className="w-3 h-3" />Activo</> : <><XCircle className="w-3 h-3" />Inactivo</>}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => onEditar(ej)}
                            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 font-semibold"
                        >
                            <Edit className="w-4 h-4" /><span>Editar</span>
                        </button>
                    </div>
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                        {ej.IdentifEjecutivo && (
                            <div className="flex items-center gap-2 text-sm">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{ej.IdentifEjecutivo}</span>
                            </div>
                        )}
                        {ej.E_MAILEJECUTIVO && (
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <a href={`mailto:${ej.E_MAILEJECUTIVO}`} className="text-blue-600 hover:underline truncate">{ej.E_MAILEJECUTIVO}</a>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200">
            {renderDesktop()}
            {renderMobile()}
            {ejecutivos.length === 0 && (
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay ejecutivos de venta para mostrar</h3>
                    <p className="text-gray-500">Utiliza el botón "Nuevo" para comenzar</p>
                </div>
            )}
            {ejecutivos.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                        <div className="text-sm text-gray-600">
                            Mostrando <span className="font-semibold">{ejecutivos.length}</span> ejecutivo{ejecutivos.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-semibold text-green-600">{ejecutivos.filter(e => e.ACTIVO === 1).length} activos</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EjecutivosVentaList;
