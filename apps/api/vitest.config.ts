import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      DATABASE_URL:
        "postgresql://opsdesk:opsdesk@localhost:5432/opsdesk?schema=public",
      JWT_SECRET: "integration_test_secret_with_at_least_32_characters",
      JWT_ISSUER: "opsdesk-api",
      JWT_AUDIENCE: "opsdesk-web",
      ACCESS_TOKEN_TTL_MINUTES: "15",
      REFRESH_TOKEN_TTL_DAYS: "30",
      REFRESH_COOKIE_NAME: "opsdesk_refresh_token",
    },
  },
});
