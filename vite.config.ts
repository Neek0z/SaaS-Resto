import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor")) {
            return "vendor-charts";
          }
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("react-router")) return "vendor-router";
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/")
          ) {
            return "vendor-react";
          }
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("jszip")) return "vendor-jszip";
          if (id.includes("qrcode")) return "vendor-qrcode";
          return undefined;
        },
      },
    },
  },
});
