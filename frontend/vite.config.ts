import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: {
      host: "localhost",
      port: 3000,
    },
  },
  build: {
    target: "es2022",
    cssMinify: true,
    minify: "esbuild",
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("@mui") || id.includes("@emotion")) {
              return "mui-vendor";
            }
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "react-vendor";
            }
            if (id.includes("dayjs")) {
              return "date-vendor";
            }
          }
        },
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
});
