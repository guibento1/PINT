import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr"; // adicionado

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), svgr()], // svgr ativo para usar *.svg?react
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../../shared"),
    },
    dedupe: ["react", "react-dom", "axios", "react-router-dom"],
  },
  optimizeDeps: {
    include: ["firebase/app", "firebase/messaging"], // evita erro de resolução
  },
  server: {
    port: 3002, // mantém porta do backOffice
  },

  // Producao
  // server: {
  //   host: '0.0.0.0',
  //   port: 8002,
  //   allowedHosts: ["thesoftskills.xyz"],
  //   hmr: {
  //     protocol: 'wss',
  //     host: 'thesoftskills.xyz',
  //   },
  // },
});