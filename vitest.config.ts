import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    globalSetup: "./vitest.setup.ts",
  },
  plugins: [tsConfigPaths({
    projects: ["./tsconfig.json"],
  })],
});
