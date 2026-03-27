// src/pages/Proveedores/ProveedoresList.jsx
import React from 'react';
import { Edit, CheckCircle, XCircle, FileText, Phone, Mail, MapPin, Building, Package } from 'lucide-react';

const ProveedoresList = ({ proveedores, onEditar }) => {
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
                        Proveedor
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
                {proveedores.map((proveedor) => (
                    <tr
                        key={proveedor.IdProveedor}
                        className={`hover:bg-gray-50 transition-colors ${proveedor.Estado === 'Inactivo' ? 'bg-gray-50/50' : ''}`}
                    >
                        {/* COLUMNA 1: Información principal */}
                        <td className="px-6 py-4">
                            <div className="flex items-start space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${proveedor.Estado === 'Activo'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {proveedor.Proveedor.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-900">{proveedor.Proveedor}</h4>
                                        {proveedor.IVA === 1 && (
                                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                                                IVA
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FileText className="w-3 h-3" />
                                            <span className="font-mono">{proveedor.CodProveedor || 'Sin código'}</span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            NIT: {formatearNIT(proveedor.Nit, proveedor.DV)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>

                        {/* COLUMNA 2: Información de contacto */}
                        <td className="px-6 py-4">
                            <div className="space-y-2">
                                {proveedor.Contacto && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Building className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-700">{proveedor.Contacto}</span>
                                    </div>
                                )}

                                {proveedor.Telefono && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-700">
                                            {formatearTelefono(proveedor.Telefono)}
                                        </span>
                                    </div>
                                )}

                                {(proveedor.Correo || proveedor.Email) && (
                                    <div className="space-y-1">
                                        {proveedor.Correo && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-3 h-3 text-gray-400" />
                                                <span className="text-gray-700 truncate max-w-[200px]">
                                                    Facturación: {proveedor.Correo}
                                                </span>
                                            </div>
                                        )}
                                        {proveedor.Email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-3 h-3 text-gray-400" />
                                                <span className="text-gray-700 truncate max-w-[200px]">
                                                    Contacto: {proveedor.Email}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(proveedor.Ciudad || proveedor.Pais) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-600">
                                            {proveedor.Ciudad ? `${proveedor.Ciudad}, ` : ''}{proveedor.Pais}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </td>

                        {/* COLUMNA 3: Estado */}
                        <td className="px-6 py-4">
                            <div className="space-y-2">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${proveedor.Estado === 'Activo'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {proveedor.Estado === 'Activo' ? (
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

                                {proveedor.Direccion && (
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                        <MapPin className="w-3 h-3 inline mr-1" />
                                        {proveedor.Direccion}
                                    </div>
                                )}
                            </div>
                        </td>

                        {/* COLUMNA 4: SOLO BOTÓN EDITAR */}
                        <td className="px-6 py-4">
                            <button
                                onClick={() => onEditar(proveedor)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.05] transition-all duration-200 flex items-center justify-center gap-2 font-semibold min-w-[110px] border border-white/30"
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
            {proveedores.map((proveedor) => (
                <div
                    key={proveedor.IdProveedor}
                    className={`bg-white rounded-xl border ${proveedor.Estado === 'Activo' ? 'border-gray-200' : 'border-gray-300 bg-gray-50/50'} p-4 shadow-sm`}
                >
                    {/* Header de la card */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${proveedor.Estado === 'Activo'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {proveedor.Proveedor.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{proveedor.Proveedor}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono text-gray-600">
                                        {proveedor.CodProveedor || 'Sin código'}
                                    </span>
                                    {proveedor.IVA === 1 && (
                                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                                            IVA
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onEditar(proveedor)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg flex items-center gap-2 font-semibold border border-white/30"
                        >
                            <Edit className="w-4 h-4" />
                            <span>Editar</span>
                        </button>
                    </div>

                    {/* Línea divisoria */}
                    <div className="border-t border-gray-100 my-3"></div>

                    {/* Información del proveedor */}
                    <div className="space-y-3">
                        {/* NIT */}
                        {proveedor.Nit && (
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">
                                    <span className="font-medium">NIT:</span> {formatearNIT(proveedor.Nit, proveedor.DV)}
                                </span>
                            </div>
                        )}

                        {/* Contacto */}
                        {proveedor.Contacto && (
                            <div className="flex items-center gap-2 text-sm">
                                <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">
                                    <span className="font-medium">Contacto:</span> {proveedor.Contacto}
                                </span>
                            </div>
                        )}

                        {/* Teléfono */}
                        {proveedor.Telefono && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <a
                                    href={`tel:${proveedor.Telefono}`}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    {formatearTelefono(proveedor.Telefono)}
                                </a>
                            </div>
                        )}

                        {/* Emails */}
                        {(proveedor.Correo || proveedor.Email) && (
                            <div className="space-y-2">
                                {proveedor.Correo && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <a
                                            href={`mailto:${proveedor.Correo}`}
                                            className="text-blue-600 hover:text-blue-800 truncate"
                                        >
                                            <span className="font-medium">Facturación:</span> {proveedor.Correo}
                                        </a>
                                    </div>
                                )}
                                {proveedor.Email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <a
                                            href={`mailto:${proveedor.Email}`}
                                            className="text-blue-600 hover:text-blue-800 truncate"
                                        >
                                            <span className="font-medium">Contacto:</span> {proveedor.Email}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ubicación */}
                        {(proveedor.Ciudad || proveedor.Pais) && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-600">
                                    {proveedor.Ciudad ? `${proveedor.Ciudad}, ` : ''}{proveedor.Pais}
                                </span>
                            </div>
                        )}

                        {/* Dirección */}
                        {proveedor.Direccion && (
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-600">
                                    <span className="font-medium">Dirección:</span> {proveedor.Direccion}
                                </span>
                            </div>
                        )}

                        {/* Estado */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${proveedor.Estado === 'Activo'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {proveedor.Estado === 'Activo' ? (
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

                            {proveedor.IVA === 1 && (
                                <div className="text-xs font-medium text-purple-600">
                                    Aplica IVA
                                </div>
                            )}
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
            {proveedores.length === 0 && (
                <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay proveedores para mostrar</h3>
                    <p className="text-gray-500">Utiliza el botón "Nuevo Proveedor" para comenzar</p>
                </div>
            )}

            {/* PIE DE TABLA/CARDS */}
            {proveedores.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                        <div className="text-sm text-gray-600">
                            Mostrando <span className="font-semibold">{proveedores.length}</span> proveedor{proveedores.length !== 1 ? 'es' : ''}
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-semibold text-green-600">
                                {proveedores.filter(p => p.Estado === 'Activo').length} activos
                            </span>
                            {' • '}
                            <span className="font-semibold text-blue-600">
                                {proveedores.filter(p => p.IVA === 1).length} con IVA
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProveedoresList;