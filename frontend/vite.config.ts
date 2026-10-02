import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from "node:path";


// https://vite.dev/config/
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
})
