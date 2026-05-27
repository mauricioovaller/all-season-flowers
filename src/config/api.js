// src/config/api.js
// URL base del servidor de APIs.
// Para cambiar de cliente, sólo hay que definir VITE_API_BASE en el archivo .env
// correspondiente antes de hacer el build.
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api";

/**
 * Devuelve la URL completa del módulo indicado.
 * @param {string} module  p.ej. 'clientes', 'pedidos', 'compras'
 * @returns {string}
 */
export const apiUrl = (module) => `${API_BASE}/${module}`;

export default API_BASE;
