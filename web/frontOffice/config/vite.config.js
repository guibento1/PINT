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
      "@shared": path.resolve(__dirname, "../../shared"), 
    },
    dedupe: ['react', 'react-dom','axios','react-router-dom']
  },
  server: {
    port: 3001,
  },
  
  // Producao

  // server: {
  //   host: '0.0.0.0', 
  //   port: 8001, 
  //   allowedHosts: ["thesoftskills.xyz"], 
  //   hmr: {
  //     protocol: 'wss', 
  //     host: 'thesoftskills.xyz', 
  //   },
  // },
});
