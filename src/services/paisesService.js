import { apiUrl } from '../config/api.js';

const API_URL = apiUrl('paises');

export async function getPaises() {
  try {
    const res = await fetch(`${API_URL}/ApiGetPaises.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();
    if (data.success) return data.paises || [];
    return [];
  } catch (err) {
    console.error('Error al obtener paises:', err);
    return [];
  }
}
