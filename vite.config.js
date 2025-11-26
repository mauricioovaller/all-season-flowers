// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/DatenBankenApp/AllSeasonFlowers/', // ajusta esta ruta a la carpeta real donde montaste la app
  plugins: [react()],
});


