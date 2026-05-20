// src/modules/pagosProveedores/ModalSeleccionarCompras.jsx
import React, { useState, useEffect } from 'react';
import { getComprasProveedorConSaldo } from '../../services/pagosProveedores/pagosProveedoresService';

const ModalSeleccionarCompras = ({
    isOpen,
    onClose,
    idProveedor,
    comprasSeleccionadas = [],
    onComprasSeleccionadasChange,
    idPagoExcluir = null
}) => {
    const [comprasDisponibles, setComprasDisponibles] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [seleccionadas, setSeleccionadas] = useState([]);   // array de idCompra
    const [valoresPago, setValoresPago] = useState({});       // { idCompra: monto }

    // Cargar compras disponibles al abrir el modal
    useEffect(() => {
        if (isOpen && idProveedor) {
            cargarComprasDisponibles();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, idProveedor]);

    // Inicializar selecciones con las compras ya seleccionadas.
    // A diferencia de pagosClientes, idCompra es directamente la clave (no hay mapeo invoice→id).
    useEffect(() => {
        if (!isOpen) return;

        if (comprasSeleccionadas.length === 0) {
            setSeleccionadas([]);
            setValoresPago({});
            return;
        }

        // Esperar a que comprasDisponibles esté cargado
        if (comprasDisponibles.length === 0) return;

        const iniciales = comprasSeleccionadas
            .map(c => c.idCompra)
            .filter(id => id != null);

        setSeleccionadas(iniciales);

        const valoresIniciales = {};
        comprasSeleccionadas.forEach(c => {
            if (c.idCompra != null) valoresIniciales[c.idCompra] = c.valorPago || 0;
        });
        setValoresPago(valoresIniciales);
    }, [isOpen, comprasDisponibles, comprasSeleccionadas]);

    const cargarComprasDisponibles = async () => {
        setCargando(true);
        setError('');
        try {
            const resultado = await getComprasProveedorConSaldo(idProveedor, idPagoExcluir);
            if (resultado.success) {
                setComprasDisponibles(resultado.compras || []);
            } else {
                setError(resultado.message || 'Error al cargar compras');
            }
        } catch (err) {
            console.error('Error al cargar compras:', err);
            setError('Error al cargar compras. Intente nuevamente.');
        } finally {
            setCargando(false);
        }
    };

    const toggleSeleccionCompra = (idCompra) => {
        const nuevas = [...seleccionadas];
        const idx = nuevas.indexOf(idCompra);

        if (idx === -1) {
            nuevas.push(idCompra);
            if (!valoresPago[idCompra]) {
                const compra = comprasDisponibles.find(c => c.idCompra === idCompra);
                setValoresPago(prev => ({
                    ...prev,
                    [idCompra]: compra?.saldoPendiente || 0
                }));
            }
        } else {
            nuevas.splice(idx, 1);
            const nuevosValores = { ...valoresPago };
            delete nuevosValores[idCompra];
            setValoresPago(nuevosValores);
        }

        setSeleccionadas(nuevas);
    };

    const handleValorPagoChange = (idCompra, valor) => {
        setValoresPago(prev => ({
            ...prev,
            [idCompra]: parseFloat(valor) || 0
        }));
    };

    const handleAceptar = () => {
        const comprasConValores = seleccionadas.map(idCompra => {
            const compra = comprasDisponibles.find(c => c.idCompra === idCompra);
            return {
                idCompra,
                numeroCompraFormateado: compra?.numeroCompraFormateado || `COMP-${String(idCompra).padStart(6, '0')}`,
                fechaCompra: compra?.fechaCompra,
                totalCompra: compra?.valorCompra || 0,
                saldoCompra: compra?.saldoPendiente || 0,
                idMoneda: compra?.idMoneda,
                moneda: compra?.moneda,
                trm: compra?.trm,
                valorPago: valoresPago[idCompra] || 0
            };
        });

        onComprasSeleccionadasChange(comprasConValores);
        onClose();
    };

    // Filtrar por búsqueda
    const comprasFiltradas = comprasDisponibles.filter(compra => {
        if (!busqueda.trim()) return true;
        const t = busqueda.toLowerCase();
        return (
            compra.numeroCompraFormateado?.toLowerCase().includes(t) ||
            String(compra.idCompra).includes(t) ||
            compra.proveedor?.toLowerCase().includes(t)
        );
    });

    const valorTotalSeleccionado = seleccionadas.reduce(
        (total, idCompra) => total + (valoresPago[idCompra] || 0),
        0
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Seleccionar Compras
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                            ×
                        </button>
                    </div>
                    <p className="text-gray-600 mt-1">
                        Seleccione las compras que desea incluir en este pago
                    </p>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Panel izquierdo - Compras disponibles */}
                    <div className="w-1/2 border-r p-4 overflow-y-auto">
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Buscar compras..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {cargando ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="text-gray-600 mt-2">Cargando compras...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 text-red-600">
                                <p>{error}</p>
                                <button
                                    onClick={cargarComprasDisponibles}
                                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Reintentar
                                </button>
                            </div>
                        ) : comprasFiltradas.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No hay compras disponibles con saldo pendiente</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {comprasFiltradas.map((compra) => {
                                    const isSeleccionada = seleccionadas.includes(compra.idCompra);
                                    return (
                                        <div
                                            key={compra.idCompra}
                                            className={`p-3 border rounded-md cursor-pointer transition-colors ${isSeleccionada ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => toggleSeleccionCompra(compra.idCompra)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSeleccionada}
                                                            onChange={() => { }}
                                                            className="mr-3 h-4 w-4 text-blue-600"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-gray-800">
                                                                {compra.numeroCompraFormateado}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Fecha: {compra.fechaCompra}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-800">
                                                        {compra.moneda} {compra.valorCompra?.toLocaleString('es-CO')}
                                                    </p>
                                                    <p className="text-sm text-green-600 font-medium">
                                                        Saldo: {compra.saldoPendiente?.toLocaleString('es-CO')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Panel derecho - Compras seleccionadas */}
                    <div className="w-1/2 p-4 overflow-y-auto">
                        <h3 className="font-medium text-gray-700 mb-4">
                            Compras seleccionadas ({seleccionadas.length})
                        </h3>

                        {seleccionadas.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No hay compras seleccionadas</p>
                                <p className="text-sm mt-1">Seleccione compras del panel izquierdo</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {seleccionadas.map((idCompra) => {
                                    const compra = comprasDisponibles.find(c => c.idCompra === idCompra);
                                    const valorPago = valoresPago[idCompra] || 0;
                                    const saldo = compra?.saldoPendiente || 0;
                                    const excedeSaldo = valorPago > saldo + 0.01;

                                    return (
                                        <div key={idCompra} className="p-3 border rounded-md bg-gray-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {compra?.numeroCompraFormateado || `COMP-${String(idCompra).padStart(6, '0')}`}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Fecha: {compra?.fechaCompra}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Saldo pendiente: {saldo.toLocaleString('es-CO')} {compra?.moneda}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => toggleSeleccionCompra(idCompra)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>

                                            <div className="mt-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Valor a pagar
                                                </label>
                                                <div className="flex items-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={valorPago}
                                                        onChange={(e) => handleValorPagoChange(idCompra, e.target.value)}
                                                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${excedeSaldo ? 'border-yellow-500 bg-yellow-50' : ''
                                                            }`}
                                                    />
                                                    <span className="ml-2 text-gray-600">{compra?.moneda}</span>
                                                </div>
                                                {excedeSaldo && (
                                                    <p className="text-yellow-600 text-sm mt-1">
                                                        ⚠️ El valor excede el saldo pendiente
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Totales */}
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-700">Total del pago:</span>
                                        <span className="text-xl font-bold text-blue-700">
                                            {valorTotalSeleccionado.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {seleccionadas.length} compra(s) seleccionada(s)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                            Total seleccionado:{' '}
                            <strong>
                                {valorTotalSeleccionado.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                            </strong>
                        </span>
                        <div className="space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAceptar}
                                disabled={seleccionadas.length === 0}
                                className={`px-4 py-2 rounded-md ${seleccionadas.length === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                            >
                                Aceptar ({seleccionadas.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalSeleccionarCompras;
