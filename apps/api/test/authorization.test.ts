import { randomUUID } from "node:crypto";

import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createAccessToken } from "../src/lib/tokens.js";
import { authenticate } from "../src/middlewares/authenticate.js";
import { authorize } from "../src/middlewares/authorize.js";
import { errorHandler } from "../src/middlewares/error-handler.js";

const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
  }),
});

const createProtectedApp = () => {
  const protectedApp = express();

  protectedApp.get(
    "/admin",
    authenticate,
    authorize("ADMIN"),
    (_request, response) => {
      response.status(204).send();
    },
  );
  protectedApp.use(errorHandler);

  return protectedApp;
};

describe("role authorization", () => {
  it("allows an authorized role", async () => {
    const token = await createAccessToken({
      userId: randomUUID(),
      organizationId: randomUUID(),
      role: "ADMIN",
    });

    await request(createProtectedApp())
      .get("/admin")
      .set("Authorization", `Bearer ${token}`)
      .expect(204);
  });

  it("rejects a role without permission", async () => {
    const token = await createAccessToken({
      userId: randomUUID(),
      organizationId: randomUUID(),
      role: "USER",
    });

    const response = await request(createProtectedApp())
      .get("/admin")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(errorResponseSchema.parse(response.body).error.code).toBe(
      "insufficient_permission",
    );
  });
});
