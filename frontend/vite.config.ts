import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from "node:path";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";


const version = readFileSync(resolve(__dirname, "../VERSION"), "utf-8").trim();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {     
      "@": path.resolve(__dirname, "./src"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@services": path.resolve(__dirname, "./src/services"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})
