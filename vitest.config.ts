// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      // Unit and component tests (jsdom).
      {
        plugins: [react()],
        test: {
          name: "unit",
          globals: true,
          environment: "jsdom",
          setupFiles: ["./src/admin/test/setup.ts"],
          include: ["src/**/*.test.{ts,tsx}"],
          css: false,
        },
        resolve: {
          alias: {
            "@": path.resolve(root, "./src"),
          },
        },
      },
      // Every story rendered in a real browser, with the a11y addon's checks.
      {
        plugins: [
          storybookTest({ configDir: path.join(root, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
