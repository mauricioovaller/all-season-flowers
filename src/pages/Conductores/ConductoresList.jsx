// src/pages/Conductores/ConductoresList.jsx
import React from 'react';
import { Edit, Trash2, CheckCircle, XCircle, Truck, User, CreditCard, Phone, Car, Palette, Hash } from 'lucide-react';

const ConductoresList = ({ conductores, onEditar }) => {
    // Formatear teléfono para visualización
    const formatearTelefono = (telefono) => {
        if (!telefono) return 'No registrado';
        if (/^\d{10}$/.test(telefono)) {
            return `(+57) ${telefono.slice(0, 3)} ${telefono.slice(3, 6)} ${telefono.slice(6)}`;
        }
        return telefono;
    };

    // Versión desktop: Tabla
    const renderDesktop = () => (
        <table className="min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Conductor
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contacto y Vehículo
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Estado
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Acciones
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {conductores.map((conductor) => (
                    <tr
                        key={conductor.IdConductor}
                        className={`hover:bg-gray-50 transition-colors ${conductor.ACTIVO === 0 ? 'bg-gray-50/50' : ''}`}
                    >
                        {/* COLUMNA 1: Información principal */}
                        <td className="px-6 py-4">
                            <div className="flex items-start space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${(conductor.ACTIVO === 1 || conductor.ACTIVO === true)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{conductor.NombreConductor}</h4>
                                    <div className="mt-1 space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <CreditCard className="w-3 h-3" />
                                            <span>Cédula: {conductor.NoCedula}</span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            ID: {conductor.IdConductor}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>

                        {/* COLUMNA 2: Contacto y vehículo */}
                        <td className="px-6 py-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-3 h-3 text-gray-400" />
                                    <span className="text-gray-700">
                                        {formatearTelefono(conductor.Telefono)}
                                    </span>
                                </div>

                                {(conductor.TipoVehiculo || conductor.Placas) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Car className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-700">
                                            {conductor.TipoVehiculo || 'Vehículo'} • {conductor.Placas}
                                        </span>
                                    </div>
                                )}

                                {(conductor.Marca || conductor.Color) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Palette className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-600">
                                            {[conductor.Marca, conductor.Color].filter(Boolean).join(' - ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </td>

                        {/* COLUMNA 3: Estado */}
                        <td className="px-6 py-4">
                            <div className="space-y-2">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${(conductor.ACTIVO === 1 || conductor.ACTIVO === true)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {(conductor.ACTIVO === 1 || conductor.ACTIVO === true) ? (
                                        <>
                                            <CheckCircle className="w-3 h-3" />
                                            Activo
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-3 h-3" />
                                            Inactivo
                                        </>
                                    )}
                                </div>
                            </div>
                        </td>

                        {/* COLUMNA 4: Acciones */}
                        <td className="px-6 py-4">
                            <button
                                onClick={() => onEditar(conductor)}
                                className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.05] transition-all duration-200 flex items-center justify-center gap-2 font-semibold min-w-[110px] border border-white/30"
                            >
                                <Edit className="w-5 h-5" />
                                <span>Editar</span>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    // Versión móvil: Cards
    const renderMobile = () => (
        <div className="space-y-4 md:hidden">
            {conductores.map((conductor) => (
                <div
                    key={conductor.IdConductor}
                    className={`bg-white rounded-xl border ${conductor.ACTIVO === 1 ? 'border-gray-200' : 'border-gray-300 bg-gray-50/50'} p-4 shadow-sm`}
                >
                    {/* Header de la card */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${(conductor.ACTIVO === 1 || conductor.ACTIVO === true)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{conductor.NombreConductor}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono text-gray-600">
                                        Cédula: {conductor.NoCedula}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Información del conductor */}
                    <div className="space-y-3">
                        {/* Teléfono */}
                        {conductor.Telefono && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <a
                                    href={`tel:${conductor.Telefono}`}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    {formatearTelefono(conductor.Telefono)}
                                </a>
                            </div>
                        )}

                        {/* Vehículo */}
                        {(conductor.TipoVehiculo || conductor.Placas) && (
                            <div className="flex items-center gap-2 text-sm">
                                <Car className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">
                                    <span className="font-medium">Vehículo:</span> {conductor.TipoVehiculo || 'Sin tipo'} • {conductor.Placas}
                                </span>
                            </div>
                        )}

                        {/* Marca y Color */}
                        {(conductor.Marca || conductor.Color) && (
                            <div className="flex items-center gap-2 text-sm">
                                <Palette className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">
                                    <span className="font-medium">Características:</span> {[conductor.Marca, conductor.Color].filter(Boolean).join(' - ')}
                                </span>
                            </div>
                        )}

                        {/* ID */}
                        <div className="flex items-center gap-2 text-sm">
                            <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600">
                                <span className="font-medium">ID:</span> {conductor.IdConductor}
                            </span>
                        </div>
                    </div>

                    {/* Línea divisoria */}
                    <div className="border-t border-gray-100 my-3"></div>

                    {/* Estado y acciones */}
                    <div className="flex justify-between items-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${(conductor.ACTIVO === 1 || conductor.ACTIVO === true)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {(conductor.ACTIVO === 1 || conductor.ACTIVO === true) ? (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    Activo
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-3 h-3" />
                                    Inactivo
                                </>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => onEditar(conductor)}
                                className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg flex items-center gap-2 font-semibold border border-white/30 text-sm"
                            >
                                <Edit className="w-3 h-3" />
                                <span>Editar</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200">
            {/* Versión Desktop (hidden en móvil) */}
            {renderDesktop()}

            {/* Versión Móvil (hidden en desktop) */}
            {renderMobile()}

            {/* SIN DATOS */}
            {conductores.length === 0 && (
                <div className="text-center py-12">
                    <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay conductores para mostrar</h3>
                    <p className="text-gray-500">Utiliza el botón "Nuevo Conductor" para comenzar</p>
                </div>
            )}

            {/* PIE DE TABLA/CARDS */}
            {conductores.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                        <div className="text-sm text-gray-600">
                            Mostrando <span className="font-semibold">{conductores.length}</span> conductor{conductores.length !== 1 ? 'es' : ''}
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-semibold text-green-600">
                                {conductores.filter(c => c.ACTIVO === 1).length} activos
                            </span>
                            {' • '}
                            <span className="font-semibold text-gray-600">
                                {conductores.filter(c => c.ACTIVO === 0).length} inactivos
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConductoresList;