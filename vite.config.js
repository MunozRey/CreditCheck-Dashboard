import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    // M-03: Security headers for the development server.
    // These must also be configured on the production web server / CDN
    // (Nginx, Cloudflare, Vercel, etc.) — Vite does not control prod headers.
    headers: {
      "X-Content-Type-Options":  "nosniff",
      "X-Frame-Options":         "DENY",
      "Referrer-Policy":         "no-referrer",
      "Permissions-Policy":      "camera=(), microphone=(), geolocation=()",
      // HSTS is only meaningful over HTTPS; Vite dev uses HTTP, so this is
      // a reminder for production rather than an active control in dev.
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    },
  },

  build: {
    outDir: "dist",
    // L-04: Disable source maps in production so minified bundle cannot be
    // trivially reconstructed by an attacker who reads the deployed files.
    // Set to "hidden" to retain server-side source maps for error tracking
    // without exposing them publicly.
    sourcemap: false,
    rollupOptions: {
      input: "index.html",
    },
  },
});
