// web\frontend\backOffice\config\vite.config.js
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../../../shared"),
      "axios": path.resolve(__dirname, "../node_modules/axios"),
    },
  },
  server: {
    port: 3001,
  },
});
