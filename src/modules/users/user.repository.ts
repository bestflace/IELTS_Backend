import { Prisma, user_role, user_status } from "@prisma/client";
import { prisma } from "../../config/prisma";

export const userRepository = {
  findById(userId: string) {
    return prisma.users.findUnique({
      where: { id: userId },
    });
  },

  findMany(params: {
    skip: number;
    take: number;
    search?: string;
    role?: user_role;
    status?: user_status;
  }) {
    const where: Prisma.usersWhereInput = {
      ...(params.search
        ? {
            OR: [
              {
                full_name: {
                  contains: params.search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: params.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(params.role ? { role: params.role } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    return prisma.users.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
      skip: params.skip,
      take: params.take,
    });
  },

  countMany(params: {
    search?: string;
    role?: user_role;
    status?: user_status;
  }) {
    const where: Prisma.usersWhereInput = {
      ...(params.search
        ? {
            OR: [
              {
                full_name: {
                  contains: params.search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: params.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(params.role ? { role: params.role } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    return prisma.users.count({ where });
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

  updateAdminUser(
    userId: string,
    data: {
      full_name?: string;
      role?: user_role;
      status?: user_status;
    },
  ) {
    return prisma.users.update({
      where: { id: userId },
      data,
    });
  },
};
