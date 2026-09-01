// src/pages/Reportes/PlanillaDespacho.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plane, Search, Download, RefreshCw, Calendar } from 'lucide-react';
import { getPlanillaDespacho } from '../../services/reportes/reportesService';
import { CLIENTE } from '../../config/cliente';

const PlanillaDespacho = () => {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        setFechaFin(hoy.toISOString().split('T')[0]);
        setFechaInicio(primerDia.toISOString().split('T')[0]);
    }, []);

    const consultar = async () => {
        if (!fechaInicio || !fechaFin) { setError('Ingrese el rango de fechas'); return; }
        if (fechaInicio > fechaFin) { setError('La fecha inicial no puede ser mayor a la fecha final'); return; }

        setError('');
        setLoading(true);
        setResultado(null);

        const data = await getPlanillaDespacho({ fechaInicio, fechaFin });
        if (!data.success) {
            setError(data.message || 'Error al consultar la planilla de despacho');
        } else {
            setResultado(data);
        }
        setLoading(false);
    };

    const limpiar = () => {
        setResultado(null);
        setError('');
    };

    const formatNum = (n) =>
        new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

    // Agrupar despachos por aerolinea para mostrar subtotales
    const grupos = useMemo(() => {
        if (!resultado || !resultado.despachos) return [];
        const map = new Map();
        resultado.despachos.forEach((d) => {
            const key = d.aerolinea || '(Sin aerolínea)';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(d);
        });
        return Array.from(map.entries()).map(([aerolinea, filas]) => ({
            aerolinea,
            filas,
            subtotal: {
                fb: filas.reduce((s, r) => s + r.fb, 0),
                hb: filas.reduce((s, r) => s + r.hb, 0),
                qb: filas.reduce((s, r) => s + r.qb, 0),
                eb: filas.reduce((s, r) => s + r.eb, 0),
                fulles: filas.reduce((s, r) => s + r.fulles, 0),
            },
        }));
    }, [resultado]);

    // ── PDF ───────────────────────────────────────────────────────────────────
    const exportarPDF = async () => {
        if (!resultado) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

        const mg = 7;
        const anchoTotal = doc.internal.pageSize.getWidth();   // ~279.4 mm
        const altoPag = doc.internal.pageSize.getHeight();  // ~215.9 mm
        const anchoUtil = anchoTotal - mg * 2;
        let y = mg;

        // ── LOGO ─────────────────────────────────────────────────────────────
        try {
            const logoFileName = CLIENTE.logoPath.split('/').pop();
            const logoUrl = `${import.meta.env.BASE_URL}assets/logos/${logoFileName}`;
            const imgData = await fetch(logoUrl)
                .then(r => r.blob())
                .then(blob => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }));
            doc.addImage(imgData, 'JPEG', mg, y, 38, 20);
        } catch (_) { /* continúa sin logo */ }

        // ── TÍTULO ───────────────────────────────────────────────────────────
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52);
        doc.text(CLIENTE.nombreLargo, anchoTotal / 2, y + 6, { align: 'center' });

        doc.setFontSize(14);
        doc.text('PLANILLA  ENTREGA DESPACHOS AEROPUERTO', anchoTotal / 2, y + 14, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, anchoTotal - mg, y + 4, { align: 'right' });

        // ── LÍNEA VERDE ───────────────────────────────────────────────────────
        y += 23;
        doc.setDrawColor(22, 101, 52);
        doc.setLineWidth(0.6);
        doc.line(mg, y, anchoTotal - mg, y);
        y += 4;

        // ── RANGO DE FECHAS ───────────────────────────────────────────────────
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(`DE:  ${fechaInicio}`, mg + 48, y + 1);
        doc.text(`A:   ${fechaFin}`, mg + 100, y + 1);
        y += 8;

        // ── CABECERA TABLA ─────────────────────────────────────────────────────
        // Anchos deben sumar exactamente anchoUtil = 279.4 - 7*2 = 265.4 mm
        // 46 + 35 + 33 + 33 + 56 + 10 + 10 + 10 + 10 + 13 = 266 → ok dentro del margen
        const cols = [
            { label: 'Aerolinea', w: 46, num: false },
            { label: 'Agencia', w: 35, num: false },
            { label: 'Guia Master', w: 33, num: false },
            { label: 'Guia Hija', w: 33, num: false },
            { label: 'Cliente', w: 56, num: false },
            { label: 'FB', w: 10, num: true },
            { label: 'HB', w: 10, num: true },
            { label: 'QB', w: 10, num: true },
            { label: 'EB', w: 10, num: true },
            { label: 'Fulles', w: 13, num: true },
        ];
        let xAcc = mg;
        cols.forEach(c => { c.x = xAcc; xAcc += c.w; });

        const rowH = 5.5;
        const hdrH = 7;

        // Trunca texto con "…" si excede el ancho disponible en mm
        const dibujarCabecera = (yPos) => {
            doc.setFillColor(22, 101, 52);
            doc.setTextColor(255, 255, 255);
            doc.rect(mg, yPos, anchoUtil, hdrH, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            cols.forEach(c => {
                const tx = c.num ? c.x + c.w - 1 : c.x + 1;
                doc.text(c.label, tx, yPos + 4.8, { align: c.num ? 'right' : 'left' });
            });
            doc.setTextColor(0, 0, 0);
        };

        dibujarCabecera(y);
        y += hdrH;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        let fillRow = false;

        // ── FILAS POR GRUPO ────────────────────────────────────────────────────
        const interlinea = 3.2;
        grupos.forEach((grupo) => {
            grupo.filas.forEach((d, idx) => {
                // Dividir texto de columnas de texto en líneas que quepan en su ancho
                const celdasTexto = [
                    idx === 0 ? (d.aerolinea || '') : '',
                    d.agencia || '',
                    d.guiaMaster || '',
                    d.guiaHija || '',
                    d.cliente || '',
                ];
                const lineasPorCol = celdasTexto.map((txt, ci) =>
                    txt ? doc.splitTextToSize(txt, cols[ci].w - 2) : ['']
                );
                const maxLineas = Math.max(1, ...lineasPorCol.map(l => l.length));
                const altoFila = maxLineas * interlinea + 2;

                if (y + altoFila > altoPag - 18) {
                    doc.addPage();
                    y = mg;
                    dibujarCabecera(y);
                    y += hdrH;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                }
                if (fillRow) {
                    doc.setFillColor(240, 253, 244);
                    doc.rect(mg, y, anchoUtil, altoFila, 'F');
                }
                fillRow = !fillRow;

                const vals = [
                    lineasPorCol[0],
                    lineasPorCol[1],
                    lineasPorCol[2],
                    lineasPorCol[3],
                    lineasPorCol[4],
                    String(d.fb),
                    String(d.hb),
                    String(d.qb),
                    String(d.eb),
                    formatNum(d.fulles),
                ];
                cols.forEach((c, i) => {
                    const lineas = vals[i];
                    const lineasArr = Array.isArray(lineas) ? lineas : [lineas];
                    lineasArr.forEach((linea, li) => {
                        const ty = y + 2.5 + li * interlinea;
                        const tx = c.num ? c.x + c.w - 1 : c.x + 1;
                        doc.text(linea, tx, ty, { align: c.num ? 'right' : 'left' });
                    });
                });
                y += altoFila;
            });

            // Fila subtotal por grupo
            if (y > altoPag - 22) {
                doc.addPage();
                y = mg;
                dibujarCabecera(y);
                y += hdrH;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
            }
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(220, 252, 231); // green-100
            doc.rect(mg, y, anchoUtil, rowH, 'F');
            const subVals = ['', '', '', '', '',
                String(grupo.subtotal.fb), String(grupo.subtotal.hb),
                String(grupo.subtotal.qb), String(grupo.subtotal.eb),
                formatNum(grupo.subtotal.fulles),
            ];
            cols.forEach((c, i) => {
                const tx = c.num ? c.x + c.w - 1 : c.x + 1;
                doc.text(subVals[i], tx, y + 4, { align: c.num ? 'right' : 'left' });
            });
            y += rowH;
            doc.setFont('helvetica', 'normal');
            fillRow = false;
        });

        // ── TOTAL GENERAL ──────────────────────────────────────────────────────
        if (y > altoPag - 20) {
            doc.addPage();
            y = mg;
            dibujarCabecera(y);
            y += hdrH;
        }
        y += 2;
        doc.setDrawColor(22, 101, 52);
        doc.setLineWidth(0.5);
        doc.line(mg, y, anchoTotal - mg, y);
        y += 1;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setFillColor(22, 101, 52);
        doc.setTextColor(255, 255, 255);
        doc.rect(mg, y, anchoUtil, 7, 'F');
        const totLabel = 'Total General:';
        doc.text(totLabel, cols[4].x + cols[4].w - 1, y + 5, { align: 'right' });
        const tot = resultado.totales;
        [String(tot.fb), String(tot.hb), String(tot.qb), String(tot.eb), formatNum(tot.fulles)]
            .forEach((v, i) => {
                const c = cols[5 + i];
                doc.text(v, c.x + c.w - 1, y + 5, { align: 'right' });
            });
        doc.setTextColor(0, 0, 0);
        y += 10;

        // ── FIRMAS ────────────────────────────────────────────────────────────
        if (y > altoPag - 25) {
            doc.addPage();
            y = mg;
        }
        y = altoPag - 20;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        const firmaW = 60;
        const xFirma1 = mg + 20;
        const xFirma2 = anchoTotal - mg - 20 - firmaW;
        doc.line(xFirma1, y, xFirma1 + firmaW, y);
        doc.line(xFirma2, y, xFirma2 + firmaW, y);
        doc.setFont('helvetica', 'bold');
        doc.text('Entregado Por:', xFirma1 + firmaW / 2, y + 5, { align: 'center' });
        doc.text('Recibido Por:', xFirma2 + firmaW / 2, y + 5, { align: 'center' });

        // Número de página
        const totalPags = doc.getNumberOfPages();
        for (let p = 1; p <= totalPags; p++) {
            doc.setPage(p);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(120, 120, 120);
            doc.text(`Página ${p} de ${totalPags}`, anchoTotal - mg, mg + 2, { align: 'right' });
        }

        doc.save(`Planilla_Despacho_${fechaInicio}_${fechaFin}.pdf`);
    };

    // ── RENDER ─────────────────────────────────────────────────────────────────
    return (
        <div className="p-4 md:p-6 space-y-5">
            {/* Encabezado */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                    <Plane className="w-6 h-6 text-green-700" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Planilla Entrega Despachos Aeropuerto</h1>
                    <p className="text-sm text-gray-500">Despachos activos con factura asignada en el rango de fechas</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex flex-wrap gap-4 items-end">
                    {/* Fecha inicio */}
                    <div className="flex flex-col gap-1 min-w-[160px]">
                        <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Fecha inicio
                        </label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Fecha fin */}
                    <div className="flex flex-col gap-1 min-w-[160px]">
                        <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Fecha fin
                        </label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={consultar}
                            disabled={loading}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            {loading
                                ? <RefreshCw className="w-4 h-4 animate-spin" />
                                : <Search className="w-4 h-4" />}
                            {loading ? 'Consultando...' : 'Consultar'}
                        </button>

                        {resultado && (
                            <>
                                <button
                                    onClick={exportarPDF}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Download className="w-4 h-4" />Exportar PDF
                                </button>
                                <button
                                    onClick={limpiar}
                                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />Nueva consulta
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {error && (
                    <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
                )}
            </div>

            {/* Resultado */}
            {resultado && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Sub-encabezado */}
                    <div className="bg-green-50 border-b border-green-200 px-5 py-3 flex flex-wrap justify-between items-center gap-2">
                        <span className="text-sm font-semibold text-green-800">
                            Período: {fechaInicio} — {fechaFin}
                        </span>
                        <span className="text-sm text-gray-600">{resultado.despachos.length} registro(s)</span>
                    </div>

                    {resultado.despachos.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm">
                            No hay despachos con factura asignada en el período seleccionado.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[900px]">
                                <thead className="bg-green-700 text-white text-xs uppercase">
                                    <tr>
                                        <th className="px-3 py-3 text-left whitespace-nowrap">Aerolínea</th>
                                        <th className="px-3 py-3 text-left whitespace-nowrap">Agencia</th>
                                        <th className="px-3 py-3 text-left whitespace-nowrap">Guía Master</th>
                                        <th className="px-3 py-3 text-left whitespace-nowrap">Guía Hija</th>
                                        <th className="px-3 py-3 text-left whitespace-nowrap">Cliente</th>
                                        <th className="px-3 py-3 text-right whitespace-nowrap">FB</th>
                                        <th className="px-3 py-3 text-right whitespace-nowrap">HB</th>
                                        <th className="px-3 py-3 text-right whitespace-nowrap">QB</th>
                                        <th className="px-3 py-3 text-right whitespace-nowrap">EB</th>
                                        <th className="px-3 py-3 text-right whitespace-nowrap">Fulles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grupos.map((grupo) => (
                                        <React.Fragment key={grupo.aerolinea}>
                                            {grupo.filas.map((d, idx) => (
                                                <tr
                                                    key={`${grupo.aerolinea}-${idx}`}
                                                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                                >
                                                    <td className="px-3 py-2 font-medium text-green-700 whitespace-nowrap">
                                                        {idx === 0 ? d.aerolinea || '—' : ''}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">{d.agencia}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap font-mono">{d.guiaMaster}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap font-mono">{d.guiaHija}</td>
                                                    <td className="px-3 py-2">{d.cliente}</td>
                                                    <td className="px-3 py-2 text-right">{d.fb}</td>
                                                    <td className="px-3 py-2 text-right">{d.hb}</td>
                                                    <td className="px-3 py-2 text-right">{d.qb}</td>
                                                    <td className="px-3 py-2 text-right">{d.eb}</td>
                                                    <td className="px-3 py-2 text-right font-semibold">{formatNum(d.fulles)}</td>
                                                </tr>
                                            ))}
                                            {/* Fila subtotal por aerolínea */}
                                            <tr className="bg-green-50 border-t border-green-200 font-bold text-green-800">
                                                <td colSpan={5} className="px-3 py-1.5 text-right text-xs text-gray-500 italic pr-4">
                                                    Subtotal {grupo.aerolinea || '—'}
                                                </td>
                                                <td className="px-3 py-1.5 text-right">{grupo.subtotal.fb}</td>
                                                <td className="px-3 py-1.5 text-right">{grupo.subtotal.hb}</td>
                                                <td className="px-3 py-1.5 text-right">{grupo.subtotal.qb}</td>
                                                <td className="px-3 py-1.5 text-right">{grupo.subtotal.eb}</td>
                                                <td className="px-3 py-1.5 text-right">{formatNum(grupo.subtotal.fulles)}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}

                                    {/* Total General */}
                                    <tr className="bg-green-700 text-white font-bold">
                                        <td colSpan={5} className="px-3 py-2 text-right">Total General:</td>
                                        <td className="px-3 py-2 text-right">{resultado.totales.fb}</td>
                                        <td className="px-3 py-2 text-right">{resultado.totales.hb}</td>
                                        <td className="px-3 py-2 text-right">{resultado.totales.qb}</td>
                                        <td className="px-3 py-2 text-right">{resultado.totales.eb}</td>
                                        <td className="px-3 py-2 text-right">{formatNum(resultado.totales.fulles)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlanillaDespacho;
