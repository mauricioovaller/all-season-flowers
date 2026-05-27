//src/services/dashboard/dashboardService.js
import { apiUrl } from '../../config/api.js';
const API_BASE = apiUrl('dashboard');

export const fetchDashboardData = async (app, fechaInicio, fechaFin) => {
    try {
        const response = await fetch(`${API_BASE}/datos.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                app: app,
                fechaInicio: fechaInicio,
                fechaFin: fechaFin
            })
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error en los datos recibidos');
        }

        return data;
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
};

// Para otras apps (las prepararemos después)
export const APPS_CONFIG = {
    allseason: {
        nombre: 'All Season Flowers',
        colorCompras: '#10B981', // verde
        colorVentas: '#3B82F6',  // azul
    },
    naturalpack: {
        nombre: 'NaturalPack',
        colorCompras: '#8B5CF6', // violeta
        colorVentas: '#EC4899',  // rosa
    },
    dibufala: {
        nombre: 'Dibufala',
        colorCompras: '#F59E0B', // amber
        colorVentas: '#EF4444',  // rojo
    }
};