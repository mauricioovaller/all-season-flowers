// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/DatenBankenApp/AllSeasonFlowers/", // ajusta esta ruta a la carpeta real donde montaste la app
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    // En Windows los forks paralelos pueden agotar tiempo — un solo proceso es más estable
    singleFork: true,
  },
});
