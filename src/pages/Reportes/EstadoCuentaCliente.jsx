// src/pages/Reportes/EstadoCuentaCliente.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, RefreshCw, User, Calendar } from 'lucide-react';
import { getEstadoCuentaCliente } from '../../services/reportes/reportesService';
import { getClientes } from '../../services/clientes/clientesService';
import { CLIENTE } from '../../config/cliente';

const EstadoCuentaCliente = () => {
    const [clientes, setClientes] = useState([]);
    const [idCliente, setIdCliente] = useState('');
    const [moneda, setMoneda] = useState('USD');
    const [fechaInicio, setFechaInicio] = useState(() => {
        const hoy = new Date();
        return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    });
    const [fechaFin, setFechaFin] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingClientes, setLoadingClientes] = useState(true);
    const [error, setError] = useState('');

    // Cargar lista de clientes al montar
    useEffect(() => {
        const cargar = async () => {
            setLoadingClientes(true);
            const data = await getClientes({ estado: 'activos' });
            if (data.success && data.clientes) {
                setClientes(data.clientes);
            }
            setLoadingClientes(false);
        };
        cargar();
    }, []);

    const consultar = async () => {
        if (!idCliente) { setError('Seleccione un cliente'); return; }
        if (!fechaInicio || !fechaFin) { setError('Ingrese el rango de fechas'); return; }
        if (fechaInicio > fechaFin) { setError('La fecha inicial no puede ser mayor a la fecha final'); return; }

        setError('');
        setLoading(true);
        setResultado(null);

        const data = await getEstadoCuentaCliente({ idCliente: parseInt(idCliente), fechaInicio, fechaFin });
        if (!data.success) {
            setError(data.message || 'Error al consultar el estado de cuenta');
        } else {
            setResultado(data);
        }
        setLoading(false);
    };

    const limpiar = () => {
        setResultado(null);
        setIdCliente('');
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
        } catch { /* sin logo si falla la carga */ }

        // Nombre empresa (centrado)
        doc.setFontSize(17);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52);   // green-800
        doc.text(CLIENTE.nombreLargo, anchoTotal / 2, y + 8, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text('Estado de Cuenta — Cliente', anchoTotal / 2, y + 15, { align: 'center' });

        // Fecha de generación (derecha)
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, anchoTotal - mg, y + 4, { align: 'right' });

        // Línea separadora verde
        y += 24;
        doc.setDrawColor(22, 101, 52);
        doc.setLineWidth(0.7);
        doc.line(mg, y, anchoTotal - mg, y);
        y += 5;

        // Datos de filtro
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(`Cliente: ${resultado.cliente.nombre}`, mg, y);
        doc.text(`Período: ${fechaInicio}  al  ${fechaFin}`, anchoTotal - mg, y, { align: 'right' });
        y += 9;

        // ── TABLA ─────────────────────────────────────────────────────────────
        // Columnas según moneda seleccionada
        const esUSD = moneda === 'USD';
        const dec = esUSD ? 3 : 2;
        const cols = esUSD ? [
            { label: '#Invoice', w: 26, num: true },
            { label: 'Fecha', w: 28, num: false },
            { label: 'Moneda', w: 16, num: false },
            { label: 'Valor (USD)', w: 44, num: true },
            { label: 'Dev. (USD)', w: 40, num: true },
            { label: 'Pag. (USD)', w: 40, num: true },
            { label: 'Saldo (USD)', w: 44, num: true },
        ] : [
            { label: '#Invoice', w: 26, num: true },
            { label: 'Fecha', w: 28, num: false },
            { label: 'Moneda', w: 16, num: false },
            { label: 'Valor (COP)', w: 44, num: true },
            { label: 'Dev. (COP)', w: 40, num: true },
            { label: 'Pag. (COP)', w: 40, num: true },
            { label: 'Saldo (COP)', w: 44, num: true },
        ];
        let xAcc = mg;
        cols.forEach(c => { c.x = xAcc; xAcc += c.w; });

        const rowH = 6;
        const hdrH = 7;

        const dibujarCabecera = (yPos) => {
            doc.setFillColor(22, 101, 52);
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
                doc.setFillColor(240, 253, 244);  // green-50
                doc.rect(mg, y, anchoUtil, rowH, 'F');
            }
            fillRow = !fillRow;

            const vals = esUSD ? [
                String(m.factura),
                m.fechaEntrega,
                moneda,
                formatNum(m.valorUSD, dec),
                formatNum(m.devolucionUSD, dec),
                formatNum(m.pagadoUSD, dec),
                formatNum(m.saldoUSD, dec),
            ] : [
                String(m.factura),
                m.fechaEntrega,
                moneda,
                formatNum(m.valorCOP, dec),
                formatNum(m.devolucionCOP, dec),
                formatNum(m.pagadoCOP, dec),
                formatNum(m.saldoCOP, dec),
            ];
            cols.forEach((c, i) => {
                const tx = c.num ? c.x + c.w - 1 : c.x + 1;
                doc.text(vals[i], tx, y + 4.5, { align: c.num ? 'right' : 'left' });
            });
            y += rowH;
        });

        // Fila totales
        y += 2;
        doc.setDrawColor(22, 101, 52);
        doc.setLineWidth(0.4);
        doc.line(mg, y, anchoTotal - mg, y);
        y += 1;
        doc.setFillColor(22, 101, 52);
        doc.setTextColor(255, 255, 255);
        doc.rect(mg, y, anchoUtil, rowH + 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        const t = resultado.totales;
        const totVals = esUSD ? [
            null, null, null,
            formatNum(t.valorUSD, dec),
            formatNum(t.devolucionUSD, dec),
            formatNum(t.pagadoUSD, dec),
            formatNum(t.saldoUSD, dec),
        ] : [
            null, null, null,
            formatNum(t.valorCOP, dec),
            formatNum(t.devolucionCOP, dec),
            formatNum(t.pagadoCOP, dec),
            formatNum(t.saldoCOP, dec),
        ];
        doc.text('TOTALES', cols[0].x + 1, y + 4.5);
        cols.forEach((c, i) => {
            if (totVals[i]) {
                doc.text(totVals[i], c.x + c.w - 1, y + 4.5, { align: 'right' });
            }
        });

        doc.save(`EstadoCuenta_Cliente_${resultado.cliente.id}_${fechaInicio}_${fechaFin}.pdf`);
    };

    const movimientos = resultado?.movimientos || [];
    const totales = resultado?.totales;
    const esUSD = moneda === 'USD';
    const dec = esUSD ? 3 : 2;

    return (
        <div className="space-y-4">
            {/* Título */}
            <div className="flex items-center gap-3">
                <div className="bg-green-600 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Estado de Cuenta — Cliente</h1>
                    <p className="text-sm text-gray-500">Movimientos de invoices, devoluciones y pagos por cliente</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Selector de cliente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <User className="w-4 h-4 inline mr-1" />Cliente
                        </label>
                        <select
                            value={idCliente}
                            onChange={e => setIdCliente(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={loadingClientes}
                        >
                            <option value="">{loadingClientes ? 'Cargando clientes...' : '-- Seleccione un cliente --'}</option>
                            {clientes.map(c => (
                                <option key={c.IdCliente} value={c.IdCliente}>{c.NOMBRE}</option>
                            ))}
                        </select>
                    </div>

                    {/* Selector de moneda */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FileText className="w-4 h-4 inline mr-1" />Moneda
                        </label>
                        <select
                            value={moneda}
                            onChange={e => setMoneda(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="USD">USD</option>
                            <option value="COP">COP</option>
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
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={consultar}
                        disabled={loading}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
                                <Download className="w-4 h-4" />Exportar PDF ({moneda})
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
                    <div className="bg-green-50 border-b border-green-200 px-5 py-3 flex flex-wrap justify-between items-center gap-2">
                        <div>
                            <span className="font-semibold text-green-800 text-sm">{resultado.cliente.nombre}</span>
                            <span className="text-gray-500 text-xs ml-3">Período: {fechaInicio} — {fechaFin}</span>
                            <span className="text-gray-500 text-xs ml-2">Moneda: {moneda}</span>
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
                                            <th className="px-3 py-3 text-left whitespace-nowrap">#Invoice</th>
                                            <th className="px-3 py-3 text-left whitespace-nowrap">Fecha Entrega</th>
                                            <th className="px-3 py-3 text-left whitespace-nowrap">Moneda</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Valor ({moneda})</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Dev. ({moneda})</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Pag. ({moneda})</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Saldo ({moneda})</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movimientos.map((m, i) => (
                                            <tr key={m.factura} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-3 py-2 font-medium text-green-700">{m.factura}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{m.fechaEntrega}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{moneda}</td>
                                                <td className={`px-3 py-2 text-right font-medium`}>{formatNum(m[`valor${moneda}`], dec)}</td>
                                                <td className="px-3 py-2 text-right text-orange-600">{formatNum(m[`devolucion${moneda}`], dec)}</td>
                                                <td className="px-3 py-2 text-right text-blue-600">{formatNum(m[`pagado${moneda}`], dec)}</td>
                                                <td className={`px-3 py-2 text-right font-semibold ${m[`saldo${moneda}`] > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatNum(m[`saldo${moneda}`], dec)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* Fila totales */}
                                    {totales && (
                                        <tfoot>
                                            <tr className="bg-green-700 text-white font-bold text-xs">
                                                <td colSpan={3} className="px-3 py-3">TOTALES</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales[`valor${moneda}`], dec)}</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales[`devolucion${moneda}`], dec)}</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales[`pagado${moneda}`], dec)}</td>
                                                <td className="px-3 py-3 text-right">{formatNum(totales[`saldo${moneda}`], dec)}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>

                            {/* ── TARJETAS — pantallas < md ───────────────────────── */}
                            <div className="block md:hidden divide-y divide-gray-100">
                                {movimientos.map((m, i) => (
                                    <div key={m.factura} className={`p-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-green-700 text-base">{m.factura}</span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{moneda}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-3">{m.fechaEntrega}</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-gray-500">Valor ({moneda})</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-gray-800">{formatNum(m[`valor${moneda}`], dec)}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-gray-500">Dev. ({moneda})</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-orange-600">{formatNum(m[`devolucion${moneda}`], dec)}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-gray-500">Pag. ({moneda})</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-blue-600">{formatNum(m[`pagado${moneda}`], dec)}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-gray-200 pt-2">
                                                <span className="text-xs font-semibold text-gray-700">Saldo ({moneda})</span>
                                                <div className="text-right">
                                                    <div className={`text-sm font-bold ${m[`saldo${moneda}`] > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatNum(m[`saldo${moneda}`], dec)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {totales && (
                                    <div className="bg-green-700 text-white p-4">
                                        <p className="font-bold text-sm mb-3">TOTALES</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-green-200">Valor ({moneda})</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">{formatNum(totales[`valor${moneda}`], dec)}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-green-200">Dev. ({moneda})</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">{formatNum(totales[`devolucion${moneda}`], dec)}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-green-200">Pag. ({moneda})</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">{formatNum(totales[`pagado${moneda}`], dec)}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-green-500 pt-2">
                                                <span className="text-xs font-bold">Saldo ({moneda})</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold">{formatNum(totales[`saldo${moneda}`], dec)}</div>
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

export default EstadoCuentaCliente;
