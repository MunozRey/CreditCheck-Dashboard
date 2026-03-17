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
    // Warn when any chunk exceeds 600 KB (xlsx alone is ~1 MB — split it out)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: "index.html",
      output: {
        // Content-hashed filenames enable max-age=1year caching on CDN/edge.
        // The hash changes only when the file content changes, so the browser
        // automatically busts the cache on deploy without any manual versioning.
        entryFileNames:  "assets/[name]-[hash].js",
        chunkFileNames:  "assets/[name]-[hash].js",
        assetFileNames:  "assets/[name]-[hash][extname]",
        manualChunks: {
          // Isolate heavy vendor chunks so app code updates don't bust their cache.
          // react + react-dom: ~140 KB — changes rarely
          "vendor-react":    ["react", "react-dom"],
          // recharts: ~300 KB — changes rarely; isolated so chart updates don't
          //           bust the React chunk cache
          "vendor-recharts": ["recharts"],
          // xlsx: ~1 MB — largest dependency; rarely updated
          "vendor-xlsx":     ["xlsx"],
        },
      },
    },
  },
});
