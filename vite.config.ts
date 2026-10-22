import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ["/wrangler.json", "/wrangler.jsonc"],
      output: {
        manualChunks: {
          'framer-motion': ['framer-motion'],
          'react-router-dom': ['react-router-dom'],
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
          ],
          'emailjs': ['@emailjs/browser'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});