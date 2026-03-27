// src/pages/Clientes/ClientesList.jsx 
import React from 'react';
import { Edit, CheckCircle, XCircle, FileText, Phone, Mail, MapPin, User } from 'lucide-react';

const ClientesList = ({ clientes, onEditar }) => {
    // Formatear teléfono para visualización
    const formatearTelefono = (telefono) => {
        if (!telefono) return 'No registrado';
        if (/^\d{10}$/.test(telefono)) {
            return `(+57) ${telefono.slice(0, 3)} ${telefono.slice(3, 6)} ${telefono.slice(6)}`;
        }
        return telefono;
    };

    // Formatear NIT con DV
    const formatearNIT = (nit, dv) => {
        if (!nit) return 'No registrado';
        return dv ? `${nit}-${dv}` : nit;
    };

    // Versión desktop: Tabla
    const renderDesktop = () => (
        <table className="min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Cliente
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Información
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Estado
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Acción
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {clientes.map((cliente) => (
                    <tr
                        key={cliente.IdCliente}
                        className={`hover:bg-gray-50 transition-colors ${cliente.ACTIVO === 0 ? 'bg-gray-50/50' : ''}`}
                    >
                        {/* COLUMNA 1: Información principal */}
                        <td className="px-6 py-4">
                            <div className="flex items-start space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${(cliente.ACTIVO === 1 || cliente.ACTIVO === true)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {cliente.NOMBRE.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-900">{cliente.NOMBRE}</h4>
                                        {cliente.IVA === 1 && (
                                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                                                IVA
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FileText className="w-3 h-3" />
                                            <span className="font-mono">{cliente.CodCliente || 'Sin código'}</span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            NIT: {formatearNIT(cliente.NIT, cliente.DV)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>

                        {/* COLUMNA 2: Información de contacto */}
                        <td className="px-6 py-4">
                            <div className="space-y-2">
                                {cliente.Contaco && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-700">{cliente.Contaco}</span>
                                    </div>
                                )}

                                {cliente.TEL1 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-700">
                                            {formatearTelefono(cliente.TEL1)}
                                        </span>
                                    </div>
                                )}

                                {cliente.E_MAIL && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-700 truncate max-w-[200px]">
                                            {cliente.E_MAIL}
                                        </span>
                                    </div>
                                )}

                                {(cliente.CIUDAD || cliente.PAIS) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-600">
                                            {cliente.CIUDAD ? `${cliente.CIUDAD}, ` : ''}{cliente.PAIS}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </td>

                        {/* COLUMNA 3: Estado */}
                        <td className="px-6 py-4">
                            <div className="space-y-2">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${(cliente.ACTIVO === 1 || cliente.ACTIVO === true)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {(cliente.ACTIVO === 1 || cliente.ACTIVO === true) ? (
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

                                <div className="text-xs text-gray-500">
                                    Registrado: {new Date(cliente.FechaRegistro).toLocaleDateString('es-CO')}
                                </div>
                            </div>
                        </td>

                        {/* COLUMNA 4: SOLO BOTÓN EDITAR */}
                        <td className="px-6 py-4">
                            <button
                                onClick={() => onEditar(cliente)}
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
            {clientes.map((cliente) => (
                <div
                    key={cliente.IdCliente}
                    className={`bg-white rounded-xl border ${cliente.ACTIVO === 1 ? 'border-gray-200' : 'border-gray-300 bg-gray-50/50'} p-4 shadow-sm`}
                >
                    {/* Header de la card */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${(cliente.ACTIVO === 1 || cliente.ACTIVO === true)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                {cliente.NOMBRE.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{cliente.NOMBRE}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono text-gray-600">
                                        {cliente.CodCliente || 'Sin código'}
                                    </span>
                                    {cliente.IVA === 1 && (
                                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                                            IVA
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onEditar(cliente)}
                            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg flex items-center gap-2 font-semibold border border-white/30"
                        >
                            <Edit className="w-4 h-4" />
                            <span>Editar</span>
                        </button>
                    </div>

                    {/* Línea divisoria */}
                    <div className="border-t border-gray-100 my-3"></div>

                    {/* Información del cliente */}
                    <div className="space-y-3">
                        {/* NIT */}
                        {cliente.NIT && (
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">
                                    <span className="font-medium">NIT:</span> {formatearNIT(cliente.NIT, cliente.DV)}
                                </span>
                            </div>
                        )}

                        {/* Contacto */}
                        {cliente.Contaco && (
                            <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">
                                    <span className="font-medium">Contacto:</span> {cliente.Contaco}
                                </span>
                            </div>
                        )}

                        {/* Teléfono */}
                        {cliente.TEL1 && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <a
                                    href={`tel:${cliente.TEL1}`}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    {formatearTelefono(cliente.TEL1)}
                                </a>
                            </div>
                        )}

                        {/* Email */}
                        {cliente.E_MAIL && (
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <a
                                    href={`mailto:${cliente.E_MAIL}`}
                                    className="text-blue-600 hover:text-blue-800 truncate"
                                >
                                    {cliente.E_MAIL}
                                </a>
                            </div>
                        )}

                        {/* Ubicación */}
                        {(cliente.CIUDAD || cliente.PAIS) && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-600">
                                    {cliente.CIUDAD ? `${cliente.CIUDAD}, ` : ''}{cliente.PAIS}
                                </span>
                            </div>
                        )}

                        {/* Estado y fecha */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${(cliente.ACTIVO === 1 || cliente.ACTIVO === true)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {(cliente.ACTIVO === 1 || cliente.ACTIVO === true) ? (
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

                            <div className="text-xs text-gray-500">
                                {new Date(cliente.FechaRegistro).toLocaleDateString('es-CO')}
                            </div>
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
            {clientes.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay clientes para mostrar</h3>
                    <p className="text-gray-500">Utiliza el botón "Nuevo Cliente" para comenzar</p>
                </div>
            )}

            {/* PIE DE TABLA/CARDS */}
            {clientes.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                        <div className="text-sm text-gray-600">
                            Mostrando <span className="font-semibold">{clientes.length}</span> cliente{clientes.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-semibold text-green-600">
                                {clientes.filter(c => c.ACTIVO === 1).length} activos
                            </span>
                            {' • '}
                            <span className="font-semibold text-purple-600">
                                {clientes.filter(c => c.IVA === 1).length} con IVA
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientesList;