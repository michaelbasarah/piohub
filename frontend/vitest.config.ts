import path from "path";
import { defineConfig } from "vitest/config";

// Kept apart from vite.config.ts so the production build doesn't depend on test tooling.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { environment: "jsdom", include: ["src/**/*.test.{ts,tsx}"] },
});
