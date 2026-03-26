import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export const systemConfigRepository = {
  findMany(keys?: string[]) {
    return prisma.system_configs.findMany({
      where: keys
        ? {
            key: {
              in: keys,
            },
          }
        : undefined,
      orderBy: {
        key: "asc",
      },
    });
  },

  async upsertMany(
    entries: Array<{ key: string; value: Prisma.InputJsonValue }>,
    updatedBy?: string,
  ) {
    return prisma.$transaction(
      entries.map((entry) =>
        prisma.system_configs.upsert({
          where: {
            key: entry.key,
          },
          update: {
            value_json: entry.value,
            updated_by: updatedBy ?? null,
            updated_at: new Date(),
          },
          create: {
            key: entry.key,
            value_json: entry.value,
            updated_by: updatedBy ?? null,
          },
        }),
      ),
    );
  },
};
