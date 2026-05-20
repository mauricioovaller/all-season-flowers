// src/pages/Empaques/EmpaquesList.jsx
import React from 'react';
import { Edit, Package, Hash } from 'lucide-react';

const EmpaquesList = ({ empaques, onEditar }) => {
    const renderDesktop = () => (
        <table className="min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Abreviatura</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Equiv. Full</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acción</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {empaques.map((emp) => (
                    <tr key={emp.IdTipoEmpaque} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-green-100 text-green-800 uppercase tracking-wide">
                                {emp.Abreviatura}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">{emp.Descripcion}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{emp.EquivFull !== null && emp.EquivFull !== undefined ? Number(emp.EquivFull).toFixed(2) : '—'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <button onClick={() => onEditar(emp)}
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
            {empaques.map((emp) => (
                <div key={emp.IdTipoEmpaque} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-green-100 text-green-800 uppercase">{emp.Abreviatura}</span>
                            <span className="font-semibold text-gray-900">{emp.Descripcion}</span>
                        </div>
                        <button onClick={() => onEditar(emp)}
                            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 font-semibold">
                            <Edit className="w-4 h-4" /><span>Editar</span>
                        </button>
                    </div>
                    {(emp.EquivFull !== null && emp.EquivFull !== undefined) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span>Equiv. Full: <strong>{Number(emp.EquivFull).toFixed(2)}</strong></span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200">
            {renderDesktop()}
            {renderMobile()}
            {empaques.length === 0 && (
                <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay tipos de empaque para mostrar</h3>
                    <p className="text-gray-500">Utiliza el botón "Nuevo" para comenzar</p>
                </div>
            )}
            {empaques.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">Mostrando <span className="font-semibold">{empaques.length}</span> tipo{empaques.length !== 1 ? 's' : ''} de empaque</div>
                </div>
            )}
        </div>
    );
};

export default EmpaquesList;
