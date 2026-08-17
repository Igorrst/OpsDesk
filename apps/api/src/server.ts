import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "API started");
});

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, "Shutting down API");
  server.close((error) => {
    if (error) {
      logger.error(error, "Failed to close HTTP server");
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
