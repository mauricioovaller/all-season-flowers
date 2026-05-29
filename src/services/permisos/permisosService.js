// src/services/permisos/permisosService.js
import { apiUrl } from '../../config/api.js';

const API_URL = apiUrl('permisos');

/**
 * Obtiene los permisos de menú del usuario autenticado.
 * El IdUsuario se lee de $_SESSION['idUsuario'] del lado del servidor.
 * @returns {Promise<string[]>} Lista de rutas permitidas (ej: ['/clientes', '/pedidos'])
 */
export async function getPermisos() {
  try {
    const res = await fetch(`${API_URL}/ApiGetPermisos.php`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    if (data.success && Array.isArray(data.permisos)) {
      return data.permisos.map((p) => p.ruta);
    }

    return [];
  } catch (err) {
    console.error('Error al obtener permisos:', err);
    return [];
  }
}
