import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/pre/",
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    allowedHosts: ["lab.drflo.de", "privacy-guardrail.medien.ifi.lmu.de", "immimed-prjsv22.medien.ifi.lmu.de"]
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
