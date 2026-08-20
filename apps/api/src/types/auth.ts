import type { UserRole } from "../generated/prisma/enums.js";

export type AuthContext = {
  userId: string;
  organizationId: string;
  role: UserRole;
};

export type AuthenticatedUser = AuthContext & {
  name: string;
  email: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};
