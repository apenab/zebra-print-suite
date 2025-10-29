import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // SDK: no DOM
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    globals: true,
  },
});
