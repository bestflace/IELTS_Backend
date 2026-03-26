import { Prisma, publish_status } from "@prisma/client";
import { prisma } from "../../config/prisma";

const publicDetailInclude = {
  writing_task_tags: {
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
} satisfies Prisma.writing_tasksInclude;

const adminDetailInclude = {
  writing_task_tags: {
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
      attempt_writing_responses: true,
      test_sections: true,
    },
  },
} satisfies Prisma.writing_tasksInclude;

export const writingRepository = {
  findWritingTaskById(id: string) {
    return prisma.writing_tasks.findUnique({
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

  findPublicWritingTasks(params: {
    skip: number;
    take: number;
    search?: string;
    level?: number;
    taskNo?: number;
    tagIds?: string[];
  }) {
    return prisma.writing_tasks.findMany({
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
                  prompt_text: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.taskNo !== undefined ? { task_no: params.taskNo } : {}),
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
      include: {
        writing_task_tags: {
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
            attempt_writing_responses: true,
            test_sections: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip: params.skip,
      take: params.take,
    });
  },

  countPublicWritingTasks(params: {
    search?: string;
    level?: number;
    taskNo?: number;
    tagIds?: string[];
  }) {
    return prisma.writing_tasks.count({
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
                  prompt_text: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.taskNo !== undefined ? { task_no: params.taskNo } : {}),
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
    });
  },

  findPublicWritingTaskDetail(id: string) {
    return prisma.writing_tasks.findFirst({
      where: {
        id,
        status: publish_status.PUBLISHED,
      },
      include: publicDetailInclude,
    });
  },

  findAdminWritingTasks(params: {
    skip: number;
    take: number;
    search?: string;
    level?: number;
    taskNo?: number;
    tagIds?: string[];
    status?: publish_status;
  }) {
    return prisma.writing_tasks.findMany({
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
                  prompt_text: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.taskNo !== undefined ? { task_no: params.taskNo } : {}),
        ...(params.status ? { status: params.status } : {}),
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
      include: {
        writing_task_tags: {
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
            attempt_writing_responses: true,
            test_sections: true,
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

  countAdminWritingTasks(params: {
    search?: string;
    level?: number;
    taskNo?: number;
    tagIds?: string[];
    status?: publish_status;
  }) {
    return prisma.writing_tasks.count({
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
                  prompt_text: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.taskNo !== undefined ? { task_no: params.taskNo } : {}),
        ...(params.status ? { status: params.status } : {}),
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
    });
  },

  findAdminWritingTaskDetail(id: string) {
    return prisma.writing_tasks.findUnique({
      where: { id },
      include: adminDetailInclude,
    });
  },

  async createWritingTask(data: {
    id: string;
    task_no?: number | null;
    title: string;
    prompt_text: string;
    chart_url?: string | null;
    image_url?: string | null;
    level?: number | null;
    status: publish_status;
    created_by: string;
    tagIds: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.writing_tasks.create({
        data: {
          id: data.id,
          task_no: data.task_no ?? null,
          title: data.title,
          prompt_text: data.prompt_text,
          chart_url: data.chart_url ?? null,
          image_url: data.image_url ?? null,
          level: data.level ?? null,
          status: data.status,
          created_by: data.created_by,
        },
      });

      if (data.tagIds.length > 0) {
        await tx.writing_task_tags.createMany({
          data: data.tagIds.map((tagId) => ({
            writing_task_id: data.id,
            tag_id: tagId,
          })),
        });
      }

      return tx.writing_tasks.findUnique({
        where: { id: data.id },
        include: adminDetailInclude,
      });
    });
  },

  async updateWritingTask(
    id: string,
    data: {
      task_no?: number | null;
      title?: string;
      prompt_text?: string;
      chart_url?: string | null;
      image_url?: string | null;
      level?: number | null;
      status?: publish_status;
      tagIds?: string[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.writing_tasks.update({
        where: { id },
        data: {
          ...(data.task_no !== undefined ? { task_no: data.task_no } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.prompt_text !== undefined
            ? { prompt_text: data.prompt_text }
            : {}),
          ...(data.chart_url !== undefined
            ? { chart_url: data.chart_url }
            : {}),
          ...(data.image_url !== undefined
            ? { image_url: data.image_url }
            : {}),
          ...(data.level !== undefined ? { level: data.level } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          updated_at: new Date(),
        },
      });

      if (data.tagIds !== undefined) {
        await tx.writing_task_tags.deleteMany({
          where: {
            writing_task_id: id,
          },
        });

        if (data.tagIds.length > 0) {
          await tx.writing_task_tags.createMany({
            data: data.tagIds.map((tagId) => ({
              writing_task_id: id,
              tag_id: tagId,
            })),
          });
        }
      }

      return tx.writing_tasks.findUnique({
        where: { id },
        include: adminDetailInclude,
      });
    });
  },

  deleteWritingTask(id: string) {
    return prisma.writing_tasks.delete({
      where: { id },
    });
  },

  countTestSectionsUsingWritingTask(writingTaskId: string) {
    return prisma.test_sections.count({
      where: {
        writing_task_id: writingTaskId,
      },
    });
  },

  countAttemptUsageByWritingTask(writingTaskId: string) {
    return prisma.attempt_writing_responses.count({
      where: {
        writing_task_id: writingTaskId,
      },
    });
  },

  findWritingTaskStructureForPublish(id: string) {
    return prisma.writing_tasks.findUnique({
      where: { id },
      include: adminDetailInclude,
    });
  },

  publishWritingTask(id: string) {
    return prisma.writing_tasks.update({
      where: { id },
      data: {
        status: publish_status.PUBLISHED,
        updated_at: new Date(),
      },
      include: adminDetailInclude,
    });
  },

  unpublishWritingTask(id: string) {
    return prisma.writing_tasks.update({
      where: { id },
      data: {
        status: publish_status.DRAFT,
        updated_at: new Date(),
      },
      include: adminDetailInclude,
    });
  },
};
