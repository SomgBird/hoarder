import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const version = readFileSync(resolve(import.meta.dirname, "../VERSION"), "utf-8").trim();

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      treeshake: {
        // Each icon module only defines its component and sets its displayName.
        // Let unused icons drop out of the package's re-exported catalog.
        moduleSideEffects: [{ test: /\/@react95\/icons\/esm\/react\/[^/]+\.js$/, sideEffects: false }],
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
      "@pages": resolve(import.meta.dirname, "./src/pages"),
      "@components": resolve(import.meta.dirname, "./src/components"),
      "@config": resolve(import.meta.dirname, "./src/config"),
      "@services": resolve(import.meta.dirname, "./src/services"),
      "@types": resolve(import.meta.dirname, "./src/types"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})
