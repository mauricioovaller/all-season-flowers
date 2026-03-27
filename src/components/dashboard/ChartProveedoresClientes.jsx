// src/components/dashboard/ChartProveedoresClientes.jsx
import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const ChartProveedoresClientes = ({ data, color, tipo = 'proveedores' }) => {
    // Función para obtener iniciales de un nombre
    const obtenerIniciales = (nombre) => {
        if (!nombre) return '';
        
        // Tomar las primeras letras de cada palabra (máximo 3)
        const palabras = nombre.trim().split(/\s+/);
        let iniciales = '';
        
        for (let i = 0; i < Math.min(3, palabras.length); i++) {
            if (palabras[i].length > 0) {
                iniciales += palabras[i][0].toUpperCase();
            }
        }
        
        return iniciales || nombre.substring(0, 2).toUpperCase();
    };

    // Función para obtener etiqueta corta (alternativa a iniciales)
    const obtenerEtiquetaCorta = (nombre, index) => {
        // Si el nombre es muy corto, usarlo completo
        if (nombre.length <= 8) return nombre;
        
        // Si tiene siglas o formato específico, intentar extraerlas
        const match = nombre.match(/[A-Z]{2,}/);
        if (match) {
            return match[0];
        }
        
        // Usar iniciales como fallback
        return obtenerIniciales(nombre);
    };

    // Formatear datos
    const datosGrafico = data.map((item, index) => ({
        id: index,
        nombre: item.nombre,
        etiqueta: obtenerEtiquetaCorta(item.nombre, index),
        valor: Math.round(item.valor),
        cantidad: item.cantidad,
        valorFormateado: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(item.valor)
    })).slice(0, 10);

    // Tooltip personalizado
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const originalName = payload[0].payload.nombre;
            const etiqueta = payload[0].payload.etiqueta;
            
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs z-50">
                    <p className="font-semibold text-gray-800 mb-1">{originalName}</p>
                    {etiqueta !== originalName && (
                        <p className="text-xs text-gray-500 mb-2">Etiqueta: {etiqueta}</p>
                    )}
                    <p className="text-sm">
                        <span className="font-medium" style={{ color: color }}>
                            {payload[0].payload.valorFormateado}
                        </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        {tipo === 'proveedores' ? 'Compras' : 'Ventas'}: {payload[0].payload.cantidad}
                    </p>
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
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={datosGrafico}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    barSize={28}
                    barGap={4}
                >
                    <CartesianGrid 
                        strokeDasharray="2 2" 
                        stroke="#f0f0f0" 
                        vertical={false}
                        strokeWidth={0.5}
                    />
                    
                    <XAxis
                        dataKey="etiqueta"
                        height={40}
                        tick={{ fontSize: 11, fill: '#4B5563' }}
                        interval={0}
                        tickMargin={5}
                        angle={0}
                        textAnchor="middle"
                        minTickGap={1}
                    />
                    
                    <YAxis
                        tickFormatter={formatearEjeY}
                        tick={{ fontSize: 11, fill: '#4B5563' }}
                        width={45}
                        axisLine={false}
                        tickLine={false}
                        tickCount={5}
                    />
                    
                    <Tooltip 
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    
                    <Bar
                        dataKey="valor"
                        name="Valor"
                        fill={color}
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
            
            {/* Nota informativa */}
            <p className="text-xs text-gray-500 text-center mt-2">
                Pasa el cursor sobre las barras para ver nombres completos
            </p>
        </div>
    );
};

export default ChartProveedoresClientes;