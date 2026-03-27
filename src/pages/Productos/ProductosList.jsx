// src/pages/Productos/ProductosList.jsx
import React from 'react';
import { Edit, CheckCircle, XCircle, Package, Printer, FileText } from 'lucide-react';

const ProductosList = ({ productos, onEditar }) => {  // Remover onEliminar del parámetro
    // Versión desktop: Tabla
    const renderDesktop = () => (
        <table className="min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Producto
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Información Adicional
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
                {productos.map((producto) => (
                    <tr
                        key={producto.IdProducto}
                        className={`hover:bg-gray-50 transition-colors ${producto.ACTIVO === 0 ? 'bg-gray-50/50' : ''}`}
                    >
                        {/* COLUMNA 1: Información principal */}
                        <td className="px-6 py-4">
                            <div className="flex items-start space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${(producto.ACTIVO === 1 || producto.ACTIVO === true)
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{producto.NOMPRODUCTO}</h4>
                                    <div className="mt-1">
                                        <div className="text-sm text-gray-500">
                                            ID: {producto.IdProducto}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>

                        {/* COLUMNA 2: Información adicional */}
                        <td className="px-6 py-4">
                            <div className="space-y-2">
                                {producto.NOMIMPRESION && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Printer className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-700">{producto.NOMIMPRESION}</span>
                                    </div>
                                )}

                                {producto.TAXRECORD && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <FileText className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-700">
                                            {producto.TAXRECORD}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </td>

                        {/* COLUMNA 3: Estado */}
                        <td className="px-6 py-4">
                            <div className="space-y-2">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${(producto.ACTIVO === 1 || producto.ACTIVO === true)
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {(producto.ACTIVO === 1 || producto.ACTIVO === true) ? (
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

                        {/* COLUMNA 4: SOLO BOTÓN EDITAR */}
                        <td className="px-6 py-4">
                            <button
                                onClick={() => onEditar(producto)}
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
            {productos.map((producto) => (
                <div
                    key={producto.IdProducto}
                    className={`bg-white rounded-xl border ${producto.ACTIVO === 1 ? 'border-gray-200' : 'border-gray-300 bg-gray-50/50'} p-4 shadow-sm`}
                >
                    {/* Header de la card */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${(producto.ACTIVO === 1 || producto.ACTIVO === true)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{producto.NOMPRODUCTO}</h3>
                                <div className="text-xs text-gray-500 mt-1">
                                    ID: {producto.IdProducto}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onEditar(producto)}
                            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg flex items-center gap-2 font-semibold border border-white/30"
                        >
                            <Edit className="w-4 h-4" />
                            <span>Editar</span>
                        </button>
                    </div>

                    {/* Información adicional */}
                    {(producto.NOMIMPRESION || producto.TAXRECORD) && (
                        <div className="space-y-2 mb-3">
                            {producto.NOMIMPRESION && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Printer className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-700">
                                        <span className="font-medium">Impresión:</span> {producto.NOMIMPRESION}
                                    </span>
                                </div>
                            )}
                            
                            {producto.TAXRECORD && (
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-700">
                                        <span className="font-medium">Tributario:</span> {producto.TAXRECORD}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Línea divisoria */}
                    <div className="border-t border-gray-100 my-3"></div>

                    {/* Estado */}
                    <div className="flex justify-between items-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${(producto.ACTIVO === 1 || producto.ACTIVO === true)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                            {(producto.ACTIVO === 1 || producto.ACTIVO === true) ? (
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
                            Haga clic en "Editar" para cambiar estado
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
            {productos.length === 0 && (
                <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay productos para mostrar</h3>
                    <p className="text-gray-500">Utiliza el botón "Nuevo Producto" para comenzar</p>
                </div>
            )}

            {/* PIE DE TABLA/CARDS */}
            {productos.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                        <div className="text-sm text-gray-600">
                            Mostrando <span className="font-semibold">{productos.length}</span> producto{productos.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-semibold text-green-600">
                                {productos.filter(p => p.ACTIVO === 1).length} activos
                            </span>
                            {' • '}
                            <span className="font-semibold text-gray-600">
                                {productos.filter(p => p.ACTIVO === 0).length} inactivos
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductosList;