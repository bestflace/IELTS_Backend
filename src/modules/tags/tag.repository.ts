import { prisma } from "../../config/prisma";

export const tagRepository = {
  findMany(search?: string) {
    return prisma.tags.findMany({
      where: search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                slug: {
                  contains: search.toLowerCase(),
                },
              },
            ],
          }
        : undefined,
      orderBy: {
        name: "asc",
      },
    });
  },

  findById(id: string) {
    return prisma.tags.findUnique({
      where: { id },
    });
  },

  findByName(name: string, excludeId?: string) {
    return prisma.tags.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        ...(excludeId
          ? {
              id: {
                not: excludeId,
              },
            }
          : {}),
      },
    });
  },

  findBySlug(slug: string, excludeId?: string) {
    return prisma.tags.findFirst({
      where: {
        slug,
        ...(excludeId
          ? {
              id: {
                not: excludeId,
              },
            }
          : {}),
      },
    });
  },

  create(data: { name: string; slug: string }) {
    return prisma.tags.create({
      data,
    });
  },

  update(id: string, data: { name?: string; slug?: string }) {
    return prisma.tags.update({
      where: { id },
      data,
    });
  },

  delete(id: string) {
    return prisma.tags.delete({
      where: { id },
    });
  },

  async getUsageStats(tagId: string) {
    const [
      blogCount,
      readingSetCount,
      listeningSetCount,
      speakingSetCount,
      testCount,
      writingTaskCount,
    ] = await prisma.$transaction([
      prisma.blog_tags.count({
        where: { tag_id: tagId },
      }),
      prisma.reading_set_tags.count({
        where: { tag_id: tagId },
      }),
      prisma.listening_set_tags.count({
        where: { tag_id: tagId },
      }),
      prisma.speaking_set_tags.count({
        where: { tag_id: tagId },
      }),
      prisma.test_tags.count({
        where: { tag_id: tagId },
      }),
      prisma.writing_task_tags.count({
        where: { tag_id: tagId },
      }),
    ]);

    return {
      blogCount,
      readingSetCount,
      listeningSetCount,
      speakingSetCount,
      testCount,
      writingTaskCount,
      total:
        blogCount +
        readingSetCount +
        listeningSetCount +
        speakingSetCount +
        testCount +
        writingTaskCount,
    };
  },
};
