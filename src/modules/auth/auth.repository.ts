import { token_type } from "@prisma/client";
import { prisma } from "../../config/prisma";

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.users.findUnique({
      where: { email },
    });
  },

  findUserById(id: string) {
    return prisma.users.findUnique({
      where: { id },
    });
  },

  createUser(data: {
    full_name: string;
    email: string;
    password_hash: string;
  }) {
    return prisma.users.create({
      data,
    });
  },

  updateLastLogin(userId: string) {
    return prisma.users.update({
      where: { id: userId },
      data: {
        last_login_at: new Date(),
      },
    });
  },

  createAuthToken(data: {
    user_id: string;
    token_type: token_type;
    token_hash: string;
    expires_at: Date;
  }) {
    return prisma.auth_tokens.create({
      data,
    });
  },

  findValidRefreshToken(tokenHash: string) {
    return prisma.auth_tokens.findFirst({
      where: {
        token_hash: tokenHash,
        token_type: token_type.REFRESH,
        revoked_at: null,
        used_at: null,
        expires_at: {
          gt: new Date(),
        },
      },
      include: {
        users: true,
      },
    });
  },

  revokeTokenByHash(tokenHash: string) {
    return prisma.auth_tokens.updateMany({
      where: {
        token_hash: tokenHash,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });
  },

  revokeAllRefreshTokensByUserId(userId: string) {
    return prisma.auth_tokens.updateMany({
      where: {
        user_id: userId,
        token_type: token_type.REFRESH,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });
  },

  createResetPasswordToken(data: {
    user_id: string;
    token_hash: string;
    expires_at: Date;
  }) {
    return prisma.auth_tokens.create({
      data: {
        user_id: data.user_id,
        token_type: token_type.RESET_PASSWORD,
        token_hash: data.token_hash,
        expires_at: data.expires_at,
      },
    });
  },

  findValidResetPasswordToken(tokenHash: string) {
    return prisma.auth_tokens.findFirst({
      where: {
        token_hash: tokenHash,
        token_type: token_type.RESET_PASSWORD,
        revoked_at: null,
        used_at: null,
        expires_at: {
          gt: new Date(),
        },
      },
      include: {
        users: true,
      },
    });
  },

  markTokenUsed(id: string) {
    return prisma.auth_tokens.update({
      where: { id },
      data: {
        used_at: new Date(),
      },
    });
  },

  updateUserPassword(userId: string, passwordHash: string) {
    return prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: passwordHash,
      },
    });
  },
};
