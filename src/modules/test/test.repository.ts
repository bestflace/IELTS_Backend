import {
  Prisma,
  publish_status,
  test_section_type,
  test_type,
} from "@prisma/client";
import { prisma } from "../../config/prisma";

const testDetailInclude = {
  test_tags: {
    include: {
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  test_sections: {
    orderBy: {
      sort_order: "asc" as const,
    },
    include: {
      reading_sets: {
        select: {
          id: true,
          title: true,
          level: true,
          status: true,
        },
      },
      listening_sets: {
        select: {
          id: true,
          title: true,
          level: true,
          status: true,
        },
      },
      writing_tasks: {
        select: {
          id: true,
          task_no: true,
          title: true,
          level: true,
          status: true,
        },
      },
      speaking_sets: {
        select: {
          id: true,
          topic: true,
          level: true,
          status: true,
        },
      },
    },
  },
  _count: {
    select: {
      attempts: true,
    },
  },
} satisfies Prisma.testsInclude;

export const testRepository = {
  findTestById(id: string) {
    return prisma.tests.findUnique({
      where: { id },
    });
  },

  countTagsByIds(tagIds: string[]) {
    return prisma.tags.count({
      where: {
        id: {
          in: tagIds,
        },
      },
    });
  },

  findPublicTests(params: {
    skip: number;
    take: number;
    search?: string;
    type?: test_type;
    level?: number;
    tagIds?: string[];
  }) {
    return prisma.tests.findMany({
      where: {
        status: publish_status.PUBLISHED,
        ...(params.search
          ? {
              OR: [
                {
                  title: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.type ? { type: params.type } : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.tagIds?.length
          ? {
              test_tags: {
                some: {
                  tag_id: {
                    in: params.tagIds,
                  },
                },
              },
            }
          : {}),
      },
      include: {
        test_tags: {
          include: {
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            test_sections: true,
            attempts: true,
          },
        },
      },
      orderBy: {
        published_at: "desc",
      },
      skip: params.skip,
      take: params.take,
    });
  },

  countPublicTests(params: {
    search?: string;
    type?: test_type;
    level?: number;
    tagIds?: string[];
  }) {
    return prisma.tests.count({
      where: {
        status: publish_status.PUBLISHED,
        ...(params.search
          ? {
              OR: [
                {
                  title: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.type ? { type: params.type } : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.tagIds?.length
          ? {
              test_tags: {
                some: {
                  tag_id: {
                    in: params.tagIds,
                  },
                },
              },
            }
          : {}),
      },
    });
  },

  findPublicTestDetail(id: string) {
    return prisma.tests.findFirst({
      where: {
        id,
        status: publish_status.PUBLISHED,
      },
      include: testDetailInclude,
    });
  },

  findAdminTests(params: {
    skip: number;
    take: number;
    search?: string;
    type?: test_type;
    level?: number;
    tagIds?: string[];
    status?: publish_status;
  }) {
    return prisma.tests.findMany({
      where: {
        ...(params.search
          ? {
              OR: [
                {
                  title: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.type ? { type: params.type } : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.tagIds?.length
          ? {
              test_tags: {
                some: {
                  tag_id: {
                    in: params.tagIds,
                  },
                },
              },
            }
          : {}),
      },
      include: {
        test_tags: {
          include: {
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            test_sections: true,
            attempts: true,
          },
        },
      },
      orderBy: {
        updated_at: "desc",
      },
      skip: params.skip,
      take: params.take,
    });
  },

  countAdminTests(params: {
    search?: string;
    type?: test_type;
    level?: number;
    tagIds?: string[];
    status?: publish_status;
  }) {
    return prisma.tests.count({
      where: {
        ...(params.search
          ? {
              OR: [
                {
                  title: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.type ? { type: params.type } : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.tagIds?.length
          ? {
              test_tags: {
                some: {
                  tag_id: {
                    in: params.tagIds,
                  },
                },
              },
            }
          : {}),
      },
    });
  },

  findAdminTestDetail(id: string) {
    return prisma.tests.findUnique({
      where: { id },
      include: testDetailInclude,
    });
  },

  async createTest(data: {
    id: string;
    type: test_type;
    title: string;
    level?: number | null;
    description?: string | null;
    created_by: string;
    tagIds: string[];
    sections: Array<{
      section_type: test_section_type;
      reading_set_id?: string | null;
      listening_set_id?: string | null;
      writing_task_id?: string | null;
      speaking_set_id?: string | null;
      part_label?: string | null;
      sort_order: number;
      time_limit_sec?: number | null;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.tests.create({
        data: {
          id: data.id,
          type: data.type,
          title: data.title,
          level: data.level ?? null,
          description: data.description ?? null,
          created_by: data.created_by,
          status: publish_status.DRAFT,
        },
      });

      if (data.tagIds.length > 0) {
        await tx.test_tags.createMany({
          data: data.tagIds.map((tagId) => ({
            test_id: data.id,
            tag_id: tagId,
          })),
        });
      }

      if (data.sections.length > 0) {
        await tx.test_sections.createMany({
          data: data.sections.map((section) => ({
            test_id: data.id,
            section_type: section.section_type,
            reading_set_id: section.reading_set_id ?? null,
            listening_set_id: section.listening_set_id ?? null,
            writing_task_id: section.writing_task_id ?? null,
            speaking_set_id: section.speaking_set_id ?? null,
            part_label: section.part_label ?? null,
            sort_order: section.sort_order,
            time_limit_sec: section.time_limit_sec ?? null,
          })),
        });
      }

      return tx.tests.findUnique({
        where: { id: data.id },
        include: testDetailInclude,
      });
    });
  },

  async updateTestMeta(
    id: string,
    data: {
      title?: string;
      level?: number | null;
      description?: string | null;
      tagIds?: string[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.tests.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.level !== undefined ? { level: data.level } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
          updated_at: new Date(),
        },
      });

      if (data.tagIds !== undefined) {
        await tx.test_tags.deleteMany({
          where: {
            test_id: id,
          },
        });

        if (data.tagIds.length > 0) {
          await tx.test_tags.createMany({
            data: data.tagIds.map((tagId) => ({
              test_id: id,
              tag_id: tagId,
            })),
          });
        }
      }

      return tx.tests.findUnique({
        where: { id },
        include: testDetailInclude,
      });
    });
  },

  deleteTest(id: string) {
    return prisma.tests.delete({
      where: { id },
    });
  },

  countAttemptsByTest(testId: string) {
    return prisma.attempts.count({
      where: {
        test_id: testId,
      },
    });
  },

  async replaceSections(
    testId: string,
    sections: Array<{
      section_type: test_section_type;
      reading_set_id?: string | null;
      listening_set_id?: string | null;
      writing_task_id?: string | null;
      speaking_set_id?: string | null;
      part_label?: string | null;
      sort_order: number;
      time_limit_sec?: number | null;
    }>,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.test_sections.deleteMany({
        where: {
          test_id: testId,
        },
      });

      if (sections.length > 0) {
        await tx.test_sections.createMany({
          data: sections.map((section) => ({
            test_id: testId,
            section_type: section.section_type,
            reading_set_id: section.reading_set_id ?? null,
            listening_set_id: section.listening_set_id ?? null,
            writing_task_id: section.writing_task_id ?? null,
            speaking_set_id: section.speaking_set_id ?? null,
            part_label: section.part_label ?? null,
            sort_order: section.sort_order,
            time_limit_sec: section.time_limit_sec ?? null,
          })),
        });
      }

      return tx.tests.findUnique({
        where: { id: testId },
        include: testDetailInclude,
      });
    });
  },

  addSection(data: {
    test_id: string;
    section_type: test_section_type;
    reading_set_id?: string | null;
    listening_set_id?: string | null;
    writing_task_id?: string | null;
    speaking_set_id?: string | null;
    part_label?: string | null;
    sort_order: number;
    time_limit_sec?: number | null;
  }) {
    return prisma.test_sections.create({
      data: {
        test_id: data.test_id,
        section_type: data.section_type,
        reading_set_id: data.reading_set_id ?? null,
        listening_set_id: data.listening_set_id ?? null,
        writing_task_id: data.writing_task_id ?? null,
        speaking_set_id: data.speaking_set_id ?? null,
        part_label: data.part_label ?? null,
        sort_order: data.sort_order,
        time_limit_sec: data.time_limit_sec ?? null,
      },
      include: {
        reading_sets: {
          select: {
            id: true,
            title: true,
            level: true,
            status: true,
          },
        },
        listening_sets: {
          select: {
            id: true,
            title: true,
            level: true,
            status: true,
          },
        },
        writing_tasks: {
          select: {
            id: true,
            task_no: true,
            title: true,
            level: true,
            status: true,
          },
        },
        speaking_sets: {
          select: {
            id: true,
            topic: true,
            level: true,
            status: true,
          },
        },
      },
    });
  },

  findSectionById(sectionId: string) {
    return prisma.test_sections.findUnique({
      where: { id: sectionId },
      include: {
        tests: true,
        reading_sets: {
          select: {
            id: true,
            title: true,
            level: true,
            status: true,
          },
        },
        listening_sets: {
          select: {
            id: true,
            title: true,
            level: true,
            status: true,
          },
        },
        writing_tasks: {
          select: {
            id: true,
            task_no: true,
            title: true,
            level: true,
            status: true,
          },
        },
        speaking_sets: {
          select: {
            id: true,
            topic: true,
            level: true,
            status: true,
          },
        },
      },
    });
  },

  findSectionsByTestId(testId: string) {
    return prisma.test_sections.findMany({
      where: {
        test_id: testId,
      },
      orderBy: {
        sort_order: "asc",
      },
      include: {
        reading_sets: {
          select: {
            id: true,
            title: true,
            level: true,
            status: true,
          },
        },
        listening_sets: {
          select: {
            id: true,
            title: true,
            level: true,
            status: true,
          },
        },
        writing_tasks: {
          select: {
            id: true,
            task_no: true,
            title: true,
            level: true,
            status: true,
          },
        },
        speaking_sets: {
          select: {
            id: true,
            topic: true,
            level: true,
            status: true,
          },
        },
      },
    });
  },

  findSectionBySortOrder(
    testId: string,
    sortOrder: number,
    excludeId?: string,
  ) {
    return prisma.test_sections.findFirst({
      where: {
        test_id: testId,
        sort_order: sortOrder,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  updateSection(
    sectionId: string,
    data: {
      section_type?: test_section_type;
      reading_set_id?: string | null;
      listening_set_id?: string | null;
      writing_task_id?: string | null;
      speaking_set_id?: string | null;
      part_label?: string | null;
      sort_order?: number;
      time_limit_sec?: number | null;
    },
  ) {
    return prisma.test_sections.update({
      where: { id: sectionId },
      data: {
        ...(data.section_type !== undefined
          ? { section_type: data.section_type }
          : {}),
        ...(data.reading_set_id !== undefined
          ? { reading_set_id: data.reading_set_id }
          : {}),
        ...(data.listening_set_id !== undefined
          ? { listening_set_id: data.listening_set_id }
          : {}),
        ...(data.writing_task_id !== undefined
          ? { writing_task_id: data.writing_task_id }
          : {}),
        ...(data.speaking_set_id !== undefined
          ? { speaking_set_id: data.speaking_set_id }
          : {}),
        ...(data.part_label !== undefined
          ? { part_label: data.part_label }
          : {}),
        ...(data.sort_order !== undefined
          ? { sort_order: data.sort_order }
          : {}),
        ...(data.time_limit_sec !== undefined
          ? { time_limit_sec: data.time_limit_sec }
          : {}),
      },
      include: {
        reading_sets: {
          select: {
            id: true,
            title: true,
            level: true,
            status: true,
          },
        },
        listening_sets: {
          select: {
            id: true,
            title: true,
            level: true,
            status: true,
          },
        },
        writing_tasks: {
          select: {
            id: true,
            task_no: true,
            title: true,
            level: true,
            status: true,
          },
        },
        speaking_sets: {
          select: {
            id: true,
            topic: true,
            level: true,
            status: true,
          },
        },
      },
    });
  },

  deleteSection(sectionId: string) {
    return prisma.test_sections.delete({
      where: { id: sectionId },
    });
  },

  publishTest(testId: string, publishedBy: string) {
    return prisma.$transaction(async (tx) => {
      await tx.tests.update({
        where: { id: testId },
        data: {
          status: publish_status.PUBLISHED,
          published_at: new Date(),
          updated_at: new Date(),
        },
      });

      await tx.test_publish_events.create({
        data: {
          test_id: testId,
          published_by: publishedBy,
        },
      });

      return tx.tests.findUnique({
        where: { id: testId },
        include: testDetailInclude,
      });
    });
  },

  unpublishTest(testId: string) {
    return prisma.tests.update({
      where: { id: testId },
      data: {
        status: publish_status.DRAFT,
        published_at: null,
        updated_at: new Date(),
      },
      include: testDetailInclude,
    });
  },

  findReadingSource(id: string) {
    return prisma.reading_sets.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        level: true,
        status: true,
      },
    });
  },

  findListeningSource(id: string) {
    return prisma.listening_sets.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        level: true,
        status: true,
      },
    });
  },

  findWritingSource(id: string) {
    return prisma.writing_tasks.findUnique({
      where: { id },
      select: {
        id: true,
        task_no: true,
        title: true,
        level: true,
        status: true,
      },
    });
  },

  findSpeakingSource(id: string) {
    return prisma.speaking_sets.findUnique({
      where: { id },
      select: {
        id: true,
        topic: true,
        level: true,
        status: true,
      },
    });
  },

  findSystemConfigRows(keys: string[]) {
    return prisma.system_configs.findMany({
      where: {
        key: {
          in: keys,
        },
      },
    });
  },

  findPublishedReadingCandidates(params: {
    levelMin?: number;
    levelMax?: number;
    tagIds?: string[];
    excludeIds?: string[];
  }) {
    return prisma.reading_sets.findMany({
      where: {
        status: publish_status.PUBLISHED,
        ...(params.levelMin !== undefined || params.levelMax !== undefined
          ? {
              level: {
                ...(params.levelMin !== undefined
                  ? { gte: params.levelMin }
                  : {}),
                ...(params.levelMax !== undefined
                  ? { lte: params.levelMax }
                  : {}),
              },
            }
          : {}),
        ...(params.excludeIds?.length
          ? {
              id: {
                notIn: params.excludeIds,
              },
            }
          : {}),
        ...(params.tagIds?.length
          ? {
              reading_set_tags: {
                some: {
                  tag_id: {
                    in: params.tagIds,
                  },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        level: true,
        status: true,
      },
      take: 50,
    });
  },

  findPublishedListeningCandidates(params: {
    levelMin?: number;
    levelMax?: number;
    tagIds?: string[];
    excludeIds?: string[];
  }) {
    return prisma.listening_sets.findMany({
      where: {
        status: publish_status.PUBLISHED,
        ...(params.levelMin !== undefined || params.levelMax !== undefined
          ? {
              level: {
                ...(params.levelMin !== undefined
                  ? { gte: params.levelMin }
                  : {}),
                ...(params.levelMax !== undefined
                  ? { lte: params.levelMax }
                  : {}),
              },
            }
          : {}),
        ...(params.excludeIds?.length
          ? {
              id: {
                notIn: params.excludeIds,
              },
            }
          : {}),
        ...(params.tagIds?.length
          ? {
              listening_set_tags: {
                some: {
                  tag_id: {
                    in: params.tagIds,
                  },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        level: true,
        status: true,
      },
      take: 50,
    });
  },

  findPublishedWritingCandidates(params: {
    levelMin?: number;
    levelMax?: number;
    tagIds?: string[];
    excludeIds?: string[];
  }) {
    return prisma.writing_tasks.findMany({
      where: {
        status: publish_status.PUBLISHED,
        ...(params.levelMin !== undefined || params.levelMax !== undefined
          ? {
              level: {
                ...(params.levelMin !== undefined
                  ? { gte: params.levelMin }
                  : {}),
                ...(params.levelMax !== undefined
                  ? { lte: params.levelMax }
                  : {}),
              },
            }
          : {}),
        ...(params.excludeIds?.length
          ? {
              id: {
                notIn: params.excludeIds,
              },
            }
          : {}),
        ...(params.tagIds?.length
          ? {
              writing_task_tags: {
                some: {
                  tag_id: {
                    in: params.tagIds,
                  },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        task_no: true,
        title: true,
        level: true,
        status: true,
      },
      take: 50,
    });
  },

  findPublishedSpeakingCandidates(params: {
    levelMin?: number;
    levelMax?: number;
    tagIds?: string[];
    excludeIds?: string[];
  }) {
    return prisma.speaking_sets.findMany({
      where: {
        status: publish_status.PUBLISHED,
        ...(params.levelMin !== undefined || params.levelMax !== undefined
          ? {
              level: {
                ...(params.levelMin !== undefined
                  ? { gte: params.levelMin }
                  : {}),
                ...(params.levelMax !== undefined
                  ? { lte: params.levelMax }
                  : {}),
              },
            }
          : {}),
        ...(params.excludeIds?.length
          ? {
              id: {
                notIn: params.excludeIds,
              },
            }
          : {}),
        ...(params.tagIds?.length
          ? {
              speaking_set_tags: {
                some: {
                  tag_id: {
                    in: params.tagIds,
                  },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        topic: true,
        level: true,
        status: true,
      },
      take: 50,
    });
  },
};
