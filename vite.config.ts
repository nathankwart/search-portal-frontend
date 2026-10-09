import path from "node:path";
import { existsSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";

function resolveSharedTsExtensions(): Plugin {
  return {
    name: "resolve-shared-ts-extensions",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer || !source.endsWith(".js") || source.includes("node_modules")) return null;
      if (!importer.includes(`${path.sep}backend${path.sep}src${path.sep}shared${path.sep}`)) return null;
      const candidate = path.resolve(path.dirname(importer), source.replace(/\.js$/, ".ts"));
      return existsSync(candidate) ? candidate : null;
    },
  };
}

export default defineConfig({
  plugins: [react(), resolveSharedTsExtensions()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../backend/src/shared/index.ts"),
    },
    dedupe: ["zod", "react", "react-dom"],
  },
  server: {
    port: 5174,
    strictPort: true,
    fs: { allow: [path.resolve(__dirname, "..")] },
  },
  preview: { port: 5174, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@supabase")) return "auth";
          if (id.includes("@tanstack")) return "query";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: false,
  },
});
