import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRouter()
  ],
  build: {
    outDir: 'build/client',
    emptyOutDir: true,
    manifest: true
  }
});

