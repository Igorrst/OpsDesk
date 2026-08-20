import { createHash, randomBytes, randomUUID } from "node:crypto";

import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import type { AuthContext } from "../types/auth.js";

const accessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  organizationId: z.uuid(),
  role: z.enum(["ADMIN", "MANAGER", "ANALYST", "USER"]),
});

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

export const createAccessToken = (auth: AuthContext) =>
  new SignJWT({
    organizationId: auth.organizationId,
    role: auth.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(auth.userId)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_MINUTES}m`)
    .sign(jwtSecret);

export const verifyAccessToken = async (
  token: string,
): Promise<AuthContext> => {
  try {
    const { payload } = await jwtVerify(token, jwtSecret, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithms: ["HS256"],
    });
    const parsedPayload = accessTokenPayloadSchema.parse(payload);

    return {
      userId: parsedPayload.sub,
      organizationId: parsedPayload.organizationId,
      role: parsedPayload.role,
    };
  } catch {
    throw new AppError(401, "invalid_access_token", "Invalid access token");
  }
};

export const createRefreshTokenValue = () =>
  randomBytes(48).toString("base64url");

export const createRefreshTokenFamily = () => randomUUID();

export const hashRefreshToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
