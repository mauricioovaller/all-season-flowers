// src/pages/Reportes/EstadoCuentaProveedor.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, RefreshCw, Truck, Calendar } from 'lucide-react';
import { getEstadoCuentaProveedor } from '../../services/reportes/reportesService';
import { getProveedores } from '../../services/proveedores/proveedoresService';

const EstadoCuentaProveedor = () => {
    const [proveedores, setProveedores] = useState([]);
    const [idProveedor, setIdProveedor] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingProveedores, setLoadingProveedores] = useState(true);
    const [error, setError] = useState('');

    // Cargar lista de proveedores al montar
    useEffect(() => {
        const cargar = async () => {
            setLoadingProveedores(true);
            const data = await getProveedores({ estado: 'activos' });
            if (data.success && data.proveedores) {
                setProveedores(data.proveedores);
            }
            setLoadingProveedores(false);
        };
        cargar();

        // Fecha por defecto: primer día del mes actual hasta hoy
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        setFechaFin(hoy.toISOString().split('T')[0]);
        setFechaInicio(primerDia.toISOString().split('T')[0]);
    }, []);

    const consultar = async () => {
        if (!idProveedor) { setError('Seleccione un proveedor'); return; }
        if (!fechaInicio || !fechaFin) { setError('Ingrese el rango de fechas'); return; }
        if (fechaInicio > fechaFin) { setError('La fecha inicial no puede ser mayor a la fecha final'); return; }

        setError('');
        setLoading(true);
        setResultado(null);

        const data = await getEstadoCuentaProveedor({ idProveedor: parseInt(idProveedor), fechaInicio, fechaFin });
        if (!data.success) {
            setError(data.message || 'Error al consultar el estado de cuenta');
        } else {
            setResultado(data);
        }
        setLoading(false);
    };

    const limpiar = () => {
        setResultado(null);
        setIdProveedor('');
        setError('');
    };

    const formatNum = (n, decimales = 2) =>
        new Intl.NumberFormat('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(n);

    const exportarPDF = async () => {
        if (!resultado) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

        const mg = 7;
        const anchoTotal = doc.internal.pageSize.getWidth();   // ~279.4 mm
        const altoPag = doc.internal.pageSize.getHeight();   // ~215.9 mm
        const anchoUtil = anchoTotal - mg * 2;                  // ~263.4 mm
        let y = mg;

        // ── ENCABEZADO PROFESIONAL ────────────────────────────────────────────
        // Logo empresa
        try {
            const logoUrl = `${import.meta.env.BASE_URL}assets/logos/LogoAllSeason.jpg`;
            const imgData = await fetch(logoUrl)
                .then(r => r.blob())
                .then(blob => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }));
            doc.addImage(imgData, 'JPEG', mg, y, 38, 20);
        } catch (_) { /* sin logo si falla la carga */ }

        // Nombre empresa (centrado)
        doc.setFontSize(17);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 48, 163);   // indigo-800
        doc.text('ALL SEASON FLOWERS S.A.S', anchoTotal / 2, y + 8, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text('Estado de Cuenta — Proveedor', anchoTotal / 2, y + 15, { align: 'center' });

        // Fecha de generación (derecha)
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, anchoTotal - mg, y + 4, { align: 'right' });

        // Línea separadora indigo
        y += 24;
        doc.setDrawColor(55, 48, 163);
        doc.setLineWidth(0.7);
        doc.line(mg, y, anchoTotal - mg, y);
        y += 5;

        // Datos de filtro
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(`Proveedor: ${resultado.proveedor.nombre}`, mg, y);
        doc.text(`Período: ${fechaInicio}  al  ${fechaFin}`, anchoTotal - mg, y, { align: 'right' });
        y += 9;

        // ── TABLA ─────────────────────────────────────────────────────────────
        // 11 columnas · suma anchos = 265 mm = anchoUtil (mg=7)
        const cols = [
            { label: '#Compra', w: 24, num: false },
            { label: 'Fecha', w: 22, num: false },
            { label: 'Moneda', w: 12, num: false },
            { label: 'Valor', w: 28, num: true },
            { label: 'Valor COP', w: 34, num: true },
            { label: 'Devoluc.', w: 22, num: true },
            { label: 'Dev.COP', w: 28, num: true },
            { label: 'Pagado', w: 22, num: true },
            { label: 'Pag.COP', w: 28, num: true },
            { label: 'Saldo', w: 22, num: true },
            { label: 'Saldo COP', w: 23, num: true },
        ];
        let xAcc = mg;
        cols.forEach(c => { c.x = xAcc; xAcc += c.w; });

        const rowH = 6;
        const hdrH = 7;

        const dibujarCabecera = (yPos) => {
            doc.setFillColor(55, 48, 163);
            doc.setTextColor(255, 255, 255);
            doc.rect(mg, yPos, anchoUtil, hdrH, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            cols.forEach(c => {
                const tx = c.num ? c.x + c.w - 1 : c.x + 1;
                doc.text(c.label, tx, yPos + 5, { align: c.num ? 'right' : 'left' });
            });
            doc.setTextColor(0, 0, 0);
        };

        dibujarCabecera(y);
        y += hdrH;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        let fillRow = false;

        resultado.movimientos.forEach(m => {
            if (y > altoPag - 18) {
                doc.addPage();
                y = mg;
                dibujarCabecera(y);
                y += hdrH;
                doc.setFont('helvetica', 'normal');
            }
            if (fillRow) {
                doc.setFillColor(238, 242, 255);  // indigo-50
                doc.rect(mg, y, anchoUtil, rowH, 'F');
            }
            fillRow = !fillRow;

            const vals = [
                m.numeroCompra,
                m.fechaEntrega,
                m.moneda.split(' ')[0],
                formatNum(m.valorBase),
                formatNum(m.valorBaseCOP),
                formatNum(m.valorDevolucion),
                formatNum(m.valorDevolucionCOP),
                formatNum(m.valorPagado),
                formatNum(m.valorPagadoCOP),
                formatNum(m.saldo),
                formatNum(m.saldoCOP),
            ];
            cols.forEach((c, i) => {
                const tx = c.num ? c.x + c.w - 1 : c.x + 1;
                doc.text(vals[i], tx, y + 4.5, { align: c.num ? 'right' : 'left' });
            });
            y += rowH;
        });

        // Fila totales
        y += 2;
        doc.setDrawColor(55, 48, 163);
        doc.setLineWidth(0.4);
        doc.line(mg, y, anchoTotal - mg, y);
        y += 1;
        doc.setFillColor(55, 48, 163);
        doc.setTextColor(255, 255, 255);
        doc.rect(mg, y, anchoUtil, rowH + 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        const t = resultado.totales;
        doc.text('TOTALES', cols[0].x + 1, y + 4.5);
        const totVals = [null, null, null,
            formatNum(t.valorBase),
            formatNum(t.valorBaseCOP),
            formatNum(t.valorDevolucion),
            formatNum(t.valorDevolucionCOP),
            formatNum(t.valorPagado),
            formatNum(t.valorPagadoCOP),
            formatNum(t.saldo),
            formatNum(t.saldoCOP),
        ];
        cols.forEach((c, i) => {
            if (totVals[i]) {
                doc.text(totVals[i], c.x + c.w - 1, y + 4.5, { align: 'right' });
            }
        });

        doc.save(`EstadoCuenta_Proveedor_${resultado.proveedor.id}_${fechaInicio}_${fechaFin}.pdf`);
    };

    const movimientos = resultado?.movimientos || [];
    const totales = resultado?.totales;

    return (
        <div className="space-y-4">
            {/* Título */}
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Estado de Cuenta — Proveedor</h1>
                    <p className="text-sm text-gray-500">Movimientos de compras, devoluciones y pagos por proveedor</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Selector de proveedor */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Truck className="w-4 h-4 inline mr-1" />Proveedor
                        </label>
                        <select
                            value={idProveedor}
                            onChange={e => setIdProveedor(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={loadingProveedores}
                        >
                            <option value="">{loadingProveedores ? 'Cargando proveedores...' : '-- Seleccione un proveedor --'}</option>
                            {proveedores.map(p => (
                                <option key={p.IdProveedor} value={p.IdProveedor}>{p.Proveedor}</option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha inicio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />Fecha inicio
                        </label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={e => setFechaInicio(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Fecha fin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />Fecha fin
                        </label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={e => setFechaFin(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={consultar}
                        disabled={loading}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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

                {error && (
                    <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
                )}
            </div>

            {/* Resultado */}
            {resultado && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Sub-encabezado */}
                    <div className="bg-indigo-50 border-b border-indigo-200 px-5 py-3 flex flex-wrap justify-between items-center gap-2">
                        <div>
                            <span className="font-semibold text-indigo-800 text-sm">{resultado.proveedor.nombre}</span>
                            <span className="text-gray-500 text-xs ml-3">Período: {fechaInicio} — {fechaFin}</span>
                        </div>
                        <span className="text-sm text-gray-600">{movimientos.length} registro(s)</span>
                    </div>

                    {movimientos.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm">
                            No hay movimientos para el período seleccionado.
                        </div>
                    ) : (
                        <>
                            {/* ── TABLA — pantallas md+ ───────────────────────────── */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                        <tr>
                                            <th className="px-3 py-3 text-left whitespace-nowrap">#Compra</th>
                                            <th className="px-3 py-3 text-left whitespace-nowrap">Fecha Entrega</th>
                                            <th className="px-3 py-3 text-left whitespace-nowrap">Moneda</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Valor Compra</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Valor COP</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Devolución</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Devol. COP</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Pagado</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Pagado COP</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Saldo</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Saldo COP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movimientos.map((m, i) => (
                                            <tr key={m.idCompra} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-3 py-2 font-medium text-indigo-700">{m.numeroCompra}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{m.fechaEntrega}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{m.moneda}</td>
                                                <td className="px-3 py-2 text-right font-medium">{formatNum(m.valorBase)}</td>
                                                <td className="px-3 py-2 text-right text-gray-600">{formatNum(m.valorBaseCOP)}</td>
                                                <td className="px-3 py-2 text-right text-orange-600">{formatNum(m.valorDevolucion)}</td>
                                                <td className="px-3 py-2 text-right text-orange-500">{formatNum(m.valorDevolucionCOP)}</td>
                                                <td className="px-3 py-2 text-right text-blue-600">{formatNum(m.valorPagado)}</td>
                                                <td className="px-3 py-2 text-right text-blue-500">{formatNum(m.valorPagadoCOP)}</td>
                                                <td className={`px-3 py-2 text-right font-semibold ${m.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatNum(m.saldo)}
                                                </td>
                                                <td className={`px-3 py-2 text-right font-semibold ${m.saldoCOP > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {formatNum(m.saldoCOP)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* Fila totales */}
                                    {totales && (
                                        <tfoot>
                                            <tr className="bg-indigo-700 text-white font-bold text-xs">
                                                <td colSpan={3} className="px-3 py-3">TOTALES</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales.valorBase)}</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales.valorBaseCOP)}</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales.valorDevolucion)}</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales.valorDevolucionCOP)}</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales.valorPagado)}</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales.valorPagadoCOP)}</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales.saldo)}</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales.saldoCOP)}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>

                            {/* ── TARJETAS — pantallas < md ───────────────────────── */}
                            <div className="block md:hidden divide-y divide-gray-100">
                                {movimientos.map((m, i) => (
                                    <div key={m.idCompra} className={`p-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-indigo-700 text-base">{m.numeroCompra}</span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{m.moneda.split(' ')[0]}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-3">{m.fechaEntrega}</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-gray-500">Valor</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-gray-800">{formatNum(m.valorBase)}</div>
                                                    <div className="text-xs text-gray-500">{formatNum(m.valorBaseCOP)} COP</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-gray-500">Devolución</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-orange-600">{formatNum(m.valorDevolucion)}</div>
                                                    <div className="text-xs text-orange-500">{formatNum(m.valorDevolucionCOP)} COP</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-gray-500">Pagado</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-blue-600">{formatNum(m.valorPagado)}</div>
                                                    <div className="text-xs text-blue-500">{formatNum(m.valorPagadoCOP)} COP</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-gray-200 pt-2">
                                                <span className="text-xs font-semibold text-gray-700">Saldo</span>
                                                <div className="text-right">
                                                    <div className={`text-sm font-bold ${m.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatNum(m.saldo)}</div>
                                                    <div className={`text-xs font-semibold ${m.saldoCOP > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatNum(m.saldoCOP)} COP</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {totales && (
                                    <div className="bg-indigo-700 text-white p-4">
                                        <p className="font-bold text-sm mb-3">TOTALES</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-indigo-200">Valor</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">{formatNum(totales.valorBase)}</div>
                                                    <div className="text-xs text-indigo-200">{formatNum(totales.valorBaseCOP)} COP</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-indigo-200">Devolución</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">{formatNum(totales.valorDevolucion)}</div>
                                                    <div className="text-xs text-indigo-200">{formatNum(totales.valorDevolucionCOP)} COP</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-indigo-200">Pagado</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">{formatNum(totales.valorPagado)}</div>
                                                    <div className="text-xs text-indigo-200">{formatNum(totales.valorPagadoCOP)} COP</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-indigo-500 pt-2">
                                                <span className="text-xs font-bold">Saldo</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold">{formatNum(totales.saldo)}</div>
                                                    <div className="text-xs text-indigo-200 font-semibold">{formatNum(totales.saldoCOP)} COP</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default EstadoCuentaProveedor;
