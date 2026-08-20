import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { authRouter } from "./routes/auth.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  rateLimit({
    limit: 100,
    windowMs: 60_000,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use(notFoundHandler);
app.use(errorHandler);
