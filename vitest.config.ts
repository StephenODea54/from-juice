import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
  ],
  test: {
    include: ["**/*.test.ts"],
    globalSetup: "./vitest.setup.ts",
  },
});
