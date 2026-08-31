import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración mínima: el proyecto no necesita alias ni variables de entorno.
export default defineConfig({
  plugins: [react()],
});
