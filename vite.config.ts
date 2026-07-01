import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  build: {
    outDir: "dist/desktop",
    emptyOutDir: true,
    sourcemap: false
  }
});
