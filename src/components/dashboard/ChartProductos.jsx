// src/components/dashboard/ChartProductos.jsx
import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

const ChartProductos = ({ data, color, tipo = 'compras' }) => {
    // Ordenar por valor descendente
    const datosGrafico = data.map(item => ({
        producto: item.producto,
        productoCorto: item.producto.length > 30 ? item.producto.substring(0, 30) + '...' : item.producto,
        valor: Math.round(item.valor),
        tallos: item.tallos || 0,
        porcentaje: item.porcentaje || 0,
        valorFormateado: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(item.valor)
    }));

    // Tooltip personalizado
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[200px] max-w-xs">
                    <p className="font-semibold text-gray-800 mb-2 break-words">{data.producto}</p>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Valor:</span>
                            <span className="font-medium" style={{ color: color }}>
                                {data.valorFormateado}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Porcentaje:</span>
                            <span className="font-medium">{data.porcentaje}%</span>
                        </div>
                        
                        {data.tallos > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Tallos:</span>
                                <span className="font-medium">
                                    {data.tallos.toLocaleString('es-CO')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Formatear eje X
    const formatearEjeX = (value) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(0)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value}`;
    };

    // Crear gradiente de color
    const getColorGradient = (index, total) => {
        const hue = tipo === 'compras' ? 142 : 217;
        const saturation = 70;
        const lightness = 60 - (index * 15 / total);
        
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    // Calcular dinámicamente el margen izquierdo basado en la longitud del texto más largo
    const calcularMargenIzquierdo = () => {
        if (datosGrafico.length === 0) return 80;
        
        // Encontrar la etiqueta más larga
        const maxLength = Math.max(...datosGrafico.map(item => item.productoCorto.length));
        
        // Calcular margen basado en longitud (entre 60 y 150 píxeles)
        const calculatedMargin = Math.min(150, Math.max(60, maxLength * 4.5));
        return calculatedMargin;
    };

    const leftMargin = calcularMargenIzquierdo();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={datosGrafico}
                layout="vertical"
                margin={{ top: 5, right: 10, left: leftMargin, bottom: 5 }}
                barSize={16}
            >
                <CartesianGrid 
                    strokeDasharray="2 2" 
                    stroke="#f0f0f0" 
                    horizontal={true}
                    vertical={false}
                    strokeWidth={0.5}
                />
                
                <XAxis
                    type="number"
                    tickFormatter={formatearEjeX}
                    tick={{ fontSize: 11, fill: '#4B5563' }}
                    axisLine={false}
                    tickLine={false}
                    padding={{ left: 10, right: 10 }}
                />
                
                <YAxis
                    type="category"
                    dataKey="productoCorto"
                    tick={{ fontSize: 11, fill: '#4B5563' }}
                    width={leftMargin}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                />
                
                <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                
                <Bar
                    dataKey="valor"
                    name="Valor"
                    radius={[0, 4, 4, 0]}
                >
                    {datosGrafico.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={getColorGradient(index, datosGrafico.length)}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default ChartProductos;