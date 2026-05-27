// src/config/cliente.js
// Configuración dinámica del cliente, inyectada via VITE_* en el build.
// Cada variable tiene un valor por defecto (All Season Flowers) como fallback.

export const CLIENTE = {
  nombre:        import.meta.env.VITE_EMPRESA_NOMBRE    || 'All Season Flowers',
  nombreLargo:   import.meta.env.VITE_EMPRESA_NOMBRE_LARGO || 'ALL SEASON FLOWERS S.A.S',
  nombreCorto:   import.meta.env.VITE_EMPRESA_NOMBRE_CORTO || 'ALL SEASON FLOWERS',
  titulo:        import.meta.env.VITE_EMPRESA_TITLE     || 'All Season Flowers',
  lema:          import.meta.env.VITE_EMPRESA_LEMA      || 'Flowers & Ornamentals',
  iniciales:     import.meta.env.VITE_EMPRESA_INICIALES || 'AS',
  logoPath:      import.meta.env.VITE_EMPRESA_LOGO      || '/DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg',
};
