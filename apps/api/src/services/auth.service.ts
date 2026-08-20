import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  createAccessToken,
  createRefreshTokenFamily,
  createRefreshTokenValue,
  hashRefreshToken,
} from "../lib/tokens.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schemas.js";
import type { AuthenticatedUser } from "../types/auth.js";

const invalidCredentialsError = () =>
  new AppError(401, "invalid_credentials", "Invalid credentials");

const fallbackPasswordHash = hashPassword("InvalidPassword@123");

const isUniqueConstraintError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "P2002";

type UserWithOrganization = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "ANALYST" | "USER";
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

const serializeUser = (user: UserWithOrganization): AuthenticatedUser => ({
  userId: user.id,
  organizationId: user.organizationId,
  name: user.name,
  email: user.email,
  role: user.role,
  organization: {
    id: user.organization.id,
    name: user.organization.name,
    slug: user.organization.slug,
  },
});

export class AuthService {
  constructor(private readonly repository = new AuthRepository()) {}

  async register(input: RegisterInput) {
    const refreshToken = this.createRefreshToken();

    try {
      const user = await this.repository.register({
        organizationName: input.organizationName,
        organizationSlug: input.organizationSlug,
        adminName: input.adminName,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        refreshToken: refreshToken.persistence,
      });

      return this.createSessionResponse(user, refreshToken.value);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new AppError(
          409,
          "organization_slug_unavailable",
          "Organization slug is unavailable",
        );
      }

      throw error;
    }
  }

  async login(input: LoginInput) {
    const user = await this.repository.findUserForLogin(
      input.organizationSlug,
      input.email,
    );
    const passwordHash = user?.passwordHash ?? (await fallbackPasswordHash);
    const passwordMatches = await verifyPassword(passwordHash, input.password);

    if (!user || !passwordMatches) {
      throw invalidCredentialsError();
    }

    if (user.status !== "ACTIVE") {
      throw new AppError(403, "account_inactive", "Account is not active");
    }

    const refreshToken = this.createRefreshToken();
    await this.repository.createLoginSession(
      user.id,
      user.organizationId,
      refreshToken.persistence,
    );

    return this.createSessionResponse(user, refreshToken.value);
  }

  async refresh(token: string) {
    const storedToken = await this.repository.findRefreshToken(
      hashRefreshToken(token),
    );

    if (!storedToken) {
      throw new AppError(401, "invalid_refresh_token", "Invalid refresh token");
    }

    if (storedToken.revokedAt) {
      await this.repository.revokeRefreshTokenFamily(storedToken.familyId);
      throw new AppError(
        401,
        "refresh_token_reused",
        "Refresh token was reused",
      );
    }

    if (storedToken.expiresAt <= new Date()) {
      await this.repository.revokeRefreshTokenFamily(storedToken.familyId);
      throw new AppError(401, "refresh_token_expired", "Refresh token expired");
    }

    if (storedToken.user.status !== "ACTIVE") {
      await this.repository.revokeRefreshTokenFamily(storedToken.familyId);
      throw new AppError(403, "account_inactive", "Account is not active");
    }

    const rotatedToken = this.createRefreshToken(storedToken.familyId);
    const rotated = await this.repository.rotateRefreshToken(
      storedToken.id,
      storedToken.userId,
      storedToken.organizationId,
      rotatedToken.persistence,
    );

    if (!rotated) {
      await this.repository.revokeRefreshTokenFamily(storedToken.familyId);
      throw new AppError(
        401,
        "refresh_token_reused",
        "Refresh token was reused",
      );
    }

    return this.createSessionResponse(storedToken.user, rotatedToken.value);
  }

  async logout(token: string | undefined) {
    if (!token) {
      return;
    }

    const storedToken = await this.repository.findRefreshToken(
      hashRefreshToken(token),
    );

    if (storedToken) {
      await this.repository.revokeRefreshTokenFamily(storedToken.familyId);
    }
  }

  async getCurrentUser(userId: string, organizationId: string) {
    const user = await this.repository.findUserById(userId, organizationId);

    if (!user || user.status !== "ACTIVE") {
      throw new AppError(401, "invalid_session", "Invalid session");
    }

    return serializeUser(user);
  }

  private createRefreshToken(familyId: string = createRefreshTokenFamily()) {
    const value = createRefreshTokenValue();

    return {
      value,
      persistence: {
        tokenHash: hashRefreshToken(value),
        familyId,
        expiresAt: new Date(
          Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1_000,
        ),
      },
    };
  }

  private async createSessionResponse(
    user: UserWithOrganization,
    refreshToken: string,
  ) {
    const serializedUser = serializeUser(user);

    return {
      accessToken: await createAccessToken(serializedUser),
      expiresInSeconds: env.ACCESS_TOKEN_TTL_MINUTES * 60,
      refreshToken,
      user: serializedUser,
    };
  }
}
