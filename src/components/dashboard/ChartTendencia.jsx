// src/components/dashboard/ChartTendencia.jsx
import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const ChartTendencia = ({ data, color }) => {
    // Formatear datos
    const datosGrafico = data.map(item => ({
        fecha: item.fecha,
        fechaCorta: new Date(item.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        }),
        cantidad: item.cantidad,
        valor: Math.round(item.valor),
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
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800 mb-2">
                        {new Date(data.fecha).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                    
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <div 
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: color }}
                            ></div>
                            <div>
                                <p className="text-sm font-medium">Valor Total</p>
                                <p className="text-lg font-bold" style={{ color: color }}>
                                    {data.valorFormateado}
                                </p>
                            </div>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                                Transacciones: <span className="font-medium">{data.cantidad}</span>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Formatear eje Y
    const formatearEjeY = (value) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(0)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value}`;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={datosGrafico}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
                <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                    </linearGradient>
                </defs>
                
                <CartesianGrid 
                    strokeDasharray="2 2" 
                    stroke="#f0f0f0" 
                    horizontal={true}
                    vertical={false}
                    strokeWidth={0.5}
                />
                
                <XAxis
                    dataKey="fechaCorta"
                    tick={{ fontSize: 11 }}
                    tickMargin={5}
                    axisLine={false}
                    tickLine={false}
                />
                
                <YAxis
                    tickFormatter={formatearEjeY}
                    tick={{ fontSize: 11 }}
                    width={45}
                    axisLine={false}
                    tickLine={false}
                />
                
                <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                
                <Area
                    type="monotone"
                    dataKey="valor"
                    name="Valor Total"
                    stroke={color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValor)"
                    activeDot={{ 
                        r: 4, 
                        stroke: color, 
                        strokeWidth: 2, 
                        fill: 'white' 
                    }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default ChartTendencia;