// src/pages/Reportes/SolicitudMuiscas.jsx
import React, { useState, useEffect } from 'react';
import { Plane, Search, Download, RefreshCw, Calendar, FileText } from 'lucide-react';
import { getSolicitudMuiscas } from '../../services/reportes/reportesService';
import { CLIENTE } from '../../config/cliente';
import * as XLSX from 'xlsx';

const SolicitudMuiscas = () => {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Inicializar fechas al mes actual
    useEffect(() => {
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        setFechaFin(hoy.toISOString().split('T')[0]);
        setFechaInicio(primerDia.toISOString().split('T')[0]);
    }, []);

    const consultar = async () => {
        if (!fechaInicio || !fechaFin) {
            setError('Ingrese el rango de fechas');
            return;
        }
        if (fechaInicio > fechaFin) {
            setError('La fecha inicial no puede ser mayor a la fecha final');
            return;
        }

        setError('');
        setLoading(true);
        setResultado(null);

        const data = await getSolicitudMuiscas({ fechaInicio, fechaFin });
        if (!data.success) {
            setError(data.message || 'Error al consultar solicitud muiscas');
        } else {
            setResultado(data);
        }
        setLoading(false);
    };

    const limpiar = () => {
        setResultado(null);
        setError('');
    };

    // ── EXPORTAR A EXCEL ─────────────────────────────────────────────────────
    const exportarExcel = () => {
        if (!resultado || !resultado.solicitudes) return;

        const datosExcel = resultado.solicitudes.map((s, idx) => ({
            '#': idx + 1,
            'Cliente': s.cliente,
            'Guía Master': s.guiaMaster,
            'Agencia': s.agencia,
            'Aerolínea': s.aerolinea,
        }));

        const ws = XLSX.utils.json_to_sheet(datosExcel);

        // Ajustar anchos de columna
        const colWidths = [
            { wch: 5 },  // #
            { wch: 30 }, // Cliente
            { wch: 20 }, // Guía Master
            { wch: 20 }, // Agencia
            { wch: 20 }, // Aerolínea
        ];
        ws['!cols'] = colWidths;

        // Crear estilos para encabezados
        const encabezadoStyle = {
            fill: { fgColor: { rgb: "165033" } },
            font: { bold: true, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center" },
        };

        // Aplicar estilos a los encabezados
        const headerRow = ['#', 'Cliente', 'Guía Master', 'Agencia', 'Aerolínea'];
        headerRow.forEach((header, idx) => {
            const cellRef = XLSX.utils.encode_col(idx) + '1';
            if (ws[cellRef]) ws[cellRef].s = encabezadoStyle;
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Solicitud Muiscas');

        // Descargar
        const nombreArchivo = `SolicitudMuiscas_${fechaInicio}_${fechaFin}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
    };

    return (
        <div className="space-y-6">
            {/* ─── ENCABEZADO ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-700">
                <div className="flex items-center gap-3 mb-2">
                    <Plane className="w-6 h-6 text-green-700" />
                    <h1 className="text-2xl font-bold text-gray-800">Solicitud Muiscas</h1>
                </div>
                <p className="text-gray-600 text-sm">
                    Reporte de clientes, guías master, agencias y aerolíneas
                </p>
            </div>

            {/* ─── FILTROS ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-700" />
                    Rango de Fechas de Entrega
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                        />
                    </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={consultar}
                        disabled={loading}
                        className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Consultando...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Consultar
                            </>
                        )}
                    </button>
                    {resultado && (
                        <button
                            onClick={limpiar}
                            className="flex items-center gap-2 bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-medium transition"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Mensajes de error */}
                {error && (
                    <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* ─── RESULTADOS ──────────────────────────────────────────────── */}
            {resultado && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Resultados: <span className="text-green-700">{resultado.total}</span> registros
                        </h2>
                        <button
                            onClick={exportarExcel}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                        >
                            <Download className="w-4 h-4" />
                            Exportar Excel
                        </button>
                    </div>

                    {/* Tabla */}
                    {resultado.solicitudes && resultado.solicitudes.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-green-700 text-white">
                                        <th className="px-4 py-3 text-left font-semibold">#</th>
                                        <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                                        <th className="px-4 py-3 text-left font-semibold">Guía Master</th>
                                        <th className="px-4 py-3 text-left font-semibold">Agencia</th>
                                        <th className="px-4 py-3 text-left font-semibold">Aerolínea</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultado.solicitudes.map((s, idx) => (
                                        <tr key={idx} className="border-b hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 text-gray-600 font-medium">{idx + 1}</td>
                                            <td className="px-4 py-3 text-gray-800">{s.cliente || '-'}</td>
                                            <td className="px-4 py-3 text-gray-800 font-mono">{s.guiaMaster || '-'}</td>
                                            <td className="px-4 py-3 text-gray-800">{s.agencia || '-'}</td>
                                            <td className="px-4 py-3 text-gray-800">{s.aerolinea || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No hay registros en este rango de fechas</p>
                        </div>
                    )}

                    {/* Información del rango */}
                    <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-600">
                        <strong>Rango:</strong> {resultado.fechaInicio} a {resultado.fechaFin}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SolicitudMuiscas;
