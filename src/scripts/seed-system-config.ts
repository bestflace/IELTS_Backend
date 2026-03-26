import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { DEFAULT_SYSTEM_CONFIG } from "../common/constants/system-config.constant";

async function main() {
  const entries = Object.entries(DEFAULT_SYSTEM_CONFIG).map(([key, value]) => ({
    key,
    value: value as Prisma.InputJsonValue,
  }));

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.system_configs.upsert({
        where: {
          key: entry.key,
        },
        update: {
          value_json: entry.value,
          updated_at: new Date(),
        },
        create: {
          key: entry.key,
          value_json: entry.value,
        },
      }),
    ),
  );

  console.log("Seed system config successfully");
}

main()
  .catch((error) => {
    console.error("Seed system config failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
