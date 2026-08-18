import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      DATABASE_URL:
        "postgresql://opsdesk:opsdesk@localhost:5432/opsdesk?schema=public",
    },
  },
});
