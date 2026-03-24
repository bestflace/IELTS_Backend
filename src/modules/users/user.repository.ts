import { prisma } from "../../config/prisma";

export const userRepository = {
  findById(userId: string) {
    return prisma.users.findUnique({
      where: { id: userId },
    });
  },

  updateProfile(
    userId: string,
    data: { full_name?: string; avatar_url?: string | null },
  ) {
    return prisma.users.update({
      where: { id: userId },
      data,
    });
  },

  updatePassword(userId: string, passwordHash: string) {
    return prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: passwordHash,
      },
    });
  },
};
