import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { app } from "../src/app.js";
import { prisma } from "../src/database/prisma.js";

const testSlugs = ["auth-alpha", "auth-beta"];
const password = "StrongPassword@123";

const sessionResponseSchema = z.object({
  data: z.object({
    accessToken: z.string().min(1),
    expiresInSeconds: z.number().positive(),
    user: z.object({
      userId: z.uuid(),
      organizationId: z.uuid(),
      name: z.string(),
      email: z.email(),
      role: z.enum(["ADMIN", "MANAGER", "ANALYST", "USER"]),
      organization: z.object({
        id: z.uuid(),
        name: z.string(),
        slug: z.string(),
      }),
    }),
  }),
});

const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
  }),
});

const registerPayload = (organizationSlug: string) => ({
  organizationName: `Organization ${organizationSlug}`,
  organizationSlug,
  adminName: "Admin User",
  email: "admin@example.com",
  password,
});

const getRefreshCookie = (headers: Record<string, unknown>) => {
  const setCookie = headers["set-cookie"];

  if (!Array.isArray(setCookie) || typeof setCookie[0] !== "string") {
    throw new Error("Refresh cookie was not set");
  }

  const cookie = setCookie[0].split(";", 1)[0];

  if (!cookie) {
    throw new Error("Refresh cookie is invalid");
  }

  return cookie;
};

const cleanTestOrganizations = () =>
  prisma.organization.deleteMany({
    where: { slug: { in: testSlugs } },
  });

describe("authentication", () => {
  beforeEach(async () => {
    await cleanTestOrganizations();
  });

  afterAll(async () => {
    await cleanTestOrganizations();
    await prisma.$disconnect();
  });

  it("registers an organization administrator and accesses the current user", async () => {
    const registration = await request(app)
      .post("/auth/register")
      .send(registerPayload("auth-alpha"))
      .expect(201);
    const session = sessionResponseSchema.parse(registration.body);

    expect(session.data.user.role).toBe("ADMIN");
    expect(session.data.user.organization.slug).toBe("auth-alpha");
    expect(getRefreshCookie(registration.headers)).toContain(
      "opsdesk_refresh_token=",
    );

    const currentUser = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${session.data.accessToken}`)
      .expect(200);

    expect(currentUser.body).toEqual({ data: session.data.user });
  });

  it("rejects a duplicated organization slug", async () => {
    await request(app)
      .post("/auth/register")
      .send(registerPayload("auth-alpha"))
      .expect(201);

    const response = await request(app)
      .post("/auth/register")
      .send({
        ...registerPayload("auth-alpha"),
        email: "another@example.com",
      })
      .expect(409);

    expect(response.body).toEqual({
      error: {
        code: "organization_slug_unavailable",
        message: "Organization slug is unavailable",
      },
    });
  });

  it("allows the same email in different organizations", async () => {
    const firstRegistration = await request(app)
      .post("/auth/register")
      .send(registerPayload("auth-alpha"))
      .expect(201);
    const secondRegistration = await request(app)
      .post("/auth/register")
      .send(registerPayload("auth-beta"))
      .expect(201);
    const firstSession = sessionResponseSchema.parse(firstRegistration.body);
    const secondSession = sessionResponseSchema.parse(secondRegistration.body);

    expect(firstSession.data.user.organizationId).not.toBe(
      secondSession.data.user.organizationId,
    );

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        organizationSlug: "auth-beta",
        email: "admin@example.com",
        password,
      })
      .expect(200);
    const loginSession = sessionResponseSchema.parse(loginResponse.body);

    expect(loginSession.data.user.organization.slug).toBe("auth-beta");
  });

  it("rejects invalid credentials without identifying the invalid field", async () => {
    await request(app)
      .post("/auth/register")
      .send(registerPayload("auth-alpha"))
      .expect(201);

    const response = await request(app)
      .post("/auth/login")
      .send({
        organizationSlug: "auth-alpha",
        email: "admin@example.com",
        password: "WrongPassword@123",
      })
      .expect(401);

    expect(errorResponseSchema.parse(response.body).error.code).toBe(
      "invalid_credentials",
    );
  });

  it("rotates refresh tokens and detects reuse", async () => {
    const registration = await request(app)
      .post("/auth/register")
      .send(registerPayload("auth-alpha"))
      .expect(201);
    const originalCookie = getRefreshCookie(registration.headers);

    const refreshResponse = await request(app)
      .post("/auth/refresh")
      .set("Cookie", originalCookie)
      .expect(200);
    const rotatedCookie = getRefreshCookie(refreshResponse.headers);

    expect(rotatedCookie).not.toBe(originalCookie);

    const reusedTokenResponse = await request(app)
      .post("/auth/refresh")
      .set("Cookie", originalCookie)
      .expect(401);

    expect(errorResponseSchema.parse(reusedTokenResponse.body).error.code).toBe(
      "refresh_token_reused",
    );

    await request(app)
      .post("/auth/refresh")
      .set("Cookie", rotatedCookie)
      .expect(401);
  });

  it("revokes the session during logout", async () => {
    const registration = await request(app)
      .post("/auth/register")
      .send(registerPayload("auth-alpha"))
      .expect(201);
    const refreshCookie = getRefreshCookie(registration.headers);

    await request(app)
      .post("/auth/logout")
      .set("Cookie", refreshCookie)
      .expect(204);

    await request(app)
      .post("/auth/refresh")
      .set("Cookie", refreshCookie)
      .expect(401);
  });

  it("rejects requests from an untrusted browser origin", async () => {
    const response = await request(app)
      .post("/auth/login")
      .set("Origin", "https://untrusted.example.com")
      .send({
        organizationSlug: "auth-alpha",
        email: "admin@example.com",
        password,
      })
      .expect(403);

    expect(errorResponseSchema.parse(response.body).error.code).toBe(
      "untrusted_origin",
    );
  });
});
