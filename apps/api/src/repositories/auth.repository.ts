import { prisma } from "../database/prisma.js";

type RefreshTokenInput = {
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
};

type RegisterInput = {
  organizationName: string;
  organizationSlug: string;
  adminName: string;
  email: string;
  passwordHash: string;
  refreshToken: RefreshTokenInput;
};

export class AuthRepository {
  register(input: RegisterInput) {
    return prisma.$transaction(async (transaction) => {
      const organization = await transaction.organization.create({
        data: {
          name: input.organizationName,
          slug: input.organizationSlug,
        },
      });
      const user = await transaction.user.create({
        data: {
          organizationId: organization.id,
          name: input.adminName,
          email: input.email,
          passwordHash: input.passwordHash,
          role: "ADMIN",
        },
        include: { organization: true },
      });

      await transaction.refreshToken.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          ...input.refreshToken,
        },
      });

      return user;
    });
  }

  findUserForLogin(organizationSlug: string, email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        organization: { slug: organizationSlug },
      },
      include: { organization: true },
    });
  }

  findUserById(userId: string, organizationId: string) {
    return prisma.user.findUnique({
      where: {
        id_organizationId: {
          id: userId,
          organizationId,
        },
      },
      include: { organization: true },
    });
  }

  createLoginSession(
    userId: string,
    organizationId: string,
    refreshToken: RefreshTokenInput,
  ) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          userId,
          organizationId,
          ...refreshToken,
        },
      }),
    ]);
  }

  findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { organization: true },
        },
      },
    });
  }

  rotateRefreshToken(
    tokenId: string,
    userId: string,
    organizationId: string,
    refreshToken: RefreshTokenInput,
  ) {
    return prisma.$transaction(async (transaction) => {
      const revokedToken = await transaction.refreshToken.updateMany({
        where: {
          id: tokenId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      if (revokedToken.count !== 1) {
        return false;
      }

      await transaction.refreshToken.create({
        data: {
          userId,
          organizationId,
          ...refreshToken,
        },
      });

      return true;
    });
  }

  revokeRefreshTokenFamily(familyId: string) {
    return prisma.refreshToken.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
}
