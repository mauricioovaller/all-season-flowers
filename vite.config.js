// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // La ruta base se lee de VITE_BASE_PATH en el .env de cada cliente.
  // Si no existe la variable, usa el valor de All Season Flowers como fallback.
  base: process.env.VITE_BASE_PATH || "/DatenBankenApp/AllSeasonFlowers/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    // En Windows los forks paralelos pueden agotar tiempo — un solo proceso es más estable
    singleFork: true,
    // Aumentar timeout para evitar que workers no alcancen a iniciar en Windows
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
