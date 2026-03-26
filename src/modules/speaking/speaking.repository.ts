import {
  Prisma,
  publish_status,
  speaking_part_type,
  speaking_prompt_type,
} from "@prisma/client";
import { prisma } from "../../config/prisma";

const speakingSetDetailInclude = {
  speaking_set_tags: {
    orderBy: {
      tag_id: "asc" as const,
    },
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
  speaking_parts: {
    orderBy: {
      sort_order: "asc" as const,
    },
    include: {
      speaking_prompts: {
        orderBy: {
          sort_order: "asc" as const,
        },
        include: {
          speaking_prompt_items: {
            orderBy: {
              sort_order: "asc" as const,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.speaking_setsInclude;

export const speakingRepository = {
  findSpeakingSetById(id: string) {
    return prisma.speaking_sets.findUnique({
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

  findPublicSpeakingSets(params: {
    skip: number;
    take: number;
    search?: string;
    level?: number;
    tagIds?: string[];
  }) {
    return prisma.speaking_sets.findMany({
      where: {
        status: publish_status.PUBLISHED,
        ...(params.search
          ? {
              topic: {
                contains: params.search,
                mode: "insensitive",
              },
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
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
      include: {
        speaking_set_tags: {
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
            speaking_parts: true,
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

  countPublicSpeakingSets(params: {
    search?: string;
    level?: number;
    tagIds?: string[];
  }) {
    return prisma.speaking_sets.count({
      where: {
        status: publish_status.PUBLISHED,
        ...(params.search
          ? {
              topic: {
                contains: params.search,
                mode: "insensitive",
              },
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
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
    });
  },

  findPublicSpeakingSetDetail(id: string) {
    return prisma.speaking_sets.findFirst({
      where: {
        id,
        status: publish_status.PUBLISHED,
      },
      include: speakingSetDetailInclude,
    });
  },

  findAdminSpeakingSets(params: {
    skip: number;
    take: number;
    search?: string;
    level?: number;
    tagIds?: string[];
    status?: publish_status;
  }) {
    return prisma.speaking_sets.findMany({
      where: {
        ...(params.search
          ? {
              topic: {
                contains: params.search,
                mode: "insensitive",
              },
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.status ? { status: params.status } : {}),
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
      include: {
        speaking_set_tags: {
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
            speaking_parts: true,
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

  countAdminSpeakingSets(params: {
    search?: string;
    level?: number;
    tagIds?: string[];
    status?: publish_status;
  }) {
    return prisma.speaking_sets.count({
      where: {
        ...(params.search
          ? {
              topic: {
                contains: params.search,
                mode: "insensitive",
              },
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.status ? { status: params.status } : {}),
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
    });
  },

  findAdminSpeakingSetDetail(id: string) {
    return prisma.speaking_sets.findUnique({
      where: { id },
      include: speakingSetDetailInclude,
    });
  },

  async createSpeakingSet(data: {
    id: string;
    topic: string;
    level: number;
    status: publish_status;
    created_by: string;
    tagIds: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.speaking_sets.create({
        data: {
          id: data.id,
          topic: data.topic,
          level: data.level,
          status: data.status,
          created_by: data.created_by,
        },
      });

      if (data.tagIds.length > 0) {
        await tx.speaking_set_tags.createMany({
          data: data.tagIds.map((tagId) => ({
            speaking_set_id: data.id,
            tag_id: tagId,
          })),
        });
      }

      return tx.speaking_sets.findUnique({
        where: { id: data.id },
        include: speakingSetDetailInclude,
      });
    });
  },

  async updateSpeakingSet(
    id: string,
    data: {
      topic?: string | null;
      level?: number | null;
      status?: publish_status;
      tagIds?: string[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.speaking_sets.update({
        where: { id },
        data: {
          ...(data.topic !== undefined ? { topic: data.topic } : {}),
          ...(data.level !== undefined ? { level: data.level } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          updated_at: new Date(),
        },
      });

      if (data.tagIds !== undefined) {
        await tx.speaking_set_tags.deleteMany({
          where: {
            speaking_set_id: id,
          },
        });

        if (data.tagIds.length > 0) {
          await tx.speaking_set_tags.createMany({
            data: data.tagIds.map((tagId) => ({
              speaking_set_id: id,
              tag_id: tagId,
            })),
          });
        }
      }

      return tx.speaking_sets.findUnique({
        where: { id },
        include: speakingSetDetailInclude,
      });
    });
  },

  deleteSpeakingSet(id: string) {
    return prisma.speaking_sets.delete({
      where: { id },
    });
  },

  countTestSectionsUsingSpeakingSet(speakingSetId: string) {
    return prisma.test_sections.count({
      where: {
        speaking_set_id: speakingSetId,
      },
    });
  },

  findSpeakingSetStructureForPublish(id: string) {
    return prisma.speaking_sets.findUnique({
      where: { id },
      include: speakingSetDetailInclude,
    });
  },

  publishSpeakingSet(id: string) {
    return prisma.speaking_sets.update({
      where: { id },
      data: {
        status: publish_status.PUBLISHED,
        updated_at: new Date(),
      },
      include: speakingSetDetailInclude,
    });
  },

  unpublishSpeakingSet(id: string) {
    return prisma.speaking_sets.update({
      where: { id },
      data: {
        status: publish_status.DRAFT,
        updated_at: new Date(),
      },
      include: speakingSetDetailInclude,
    });
  },

  findSpeakingPartById(partId: string) {
    return prisma.speaking_parts.findUnique({
      where: { id: partId },
    });
  },

  findSpeakingPartByType(
    speakingSetId: string,
    partType: speaking_part_type,
    excludeId?: string,
  ) {
    return prisma.speaking_parts.findFirst({
      where: {
        speaking_set_id: speakingSetId,
        part_type: partType,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  findSpeakingPartBySortOrder(
    speakingSetId: string,
    sortOrder: number,
    excludeId?: string,
  ) {
    return prisma.speaking_parts.findFirst({
      where: {
        speaking_set_id: speakingSetId,
        sort_order: sortOrder,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  async createSpeakingPart(data: {
    speaking_set_id: string;
    part_type: speaking_part_type;
    title?: string | null;
    instructions?: string | null;
    recommended_sec?: number | null;
    sort_order: number;
  }) {
    const part = await prisma.speaking_parts.create({
      data,
    });

    return prisma.speaking_parts.findUnique({
      where: { id: part.id },
      include: {
        speaking_prompts: {
          orderBy: {
            sort_order: "asc",
          },
          include: {
            speaking_prompt_items: {
              orderBy: {
                sort_order: "asc",
              },
            },
          },
        },
      },
    });
  },

  async updateSpeakingPart(
    partId: string,
    data: {
      part_type?: speaking_part_type;
      title?: string | null;
      instructions?: string | null;
      recommended_sec?: number | null;
      sort_order?: number;
    },
  ) {
    await prisma.speaking_parts.update({
      where: { id: partId },
      data: {
        ...(data.part_type !== undefined ? { part_type: data.part_type } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.instructions !== undefined
          ? { instructions: data.instructions }
          : {}),
        ...(data.recommended_sec !== undefined
          ? { recommended_sec: data.recommended_sec }
          : {}),
        ...(data.sort_order !== undefined
          ? { sort_order: data.sort_order }
          : {}),
        updated_at: new Date(),
      },
    });

    return prisma.speaking_parts.findUnique({
      where: { id: partId },
      include: {
        speaking_prompts: {
          orderBy: {
            sort_order: "asc",
          },
          include: {
            speaking_prompt_items: {
              orderBy: {
                sort_order: "asc",
              },
            },
          },
        },
      },
    });
  },

  deleteSpeakingPart(partId: string) {
    return prisma.speaking_parts.delete({
      where: { id: partId },
    });
  },

  findSpeakingPromptById(promptId: string) {
    return prisma.speaking_prompts.findUnique({
      where: { id: promptId },
    });
  },

  findSpeakingPromptBySortOrder(
    speakingPartId: string,
    sortOrder: number,
    excludeId?: string,
  ) {
    return prisma.speaking_prompts.findFirst({
      where: {
        speaking_part_id: speakingPartId,
        sort_order: sortOrder,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  async createSpeakingPrompt(data: {
    speaking_part_id: string;
    prompt_type: speaking_prompt_type;
    content: string;
    notes?: string | null;
    time_suggest_sec?: number | null;
    sort_order: number;
  }) {
    const prompt = await prisma.speaking_prompts.create({
      data,
    });

    return prisma.speaking_prompts.findUnique({
      where: { id: prompt.id },
      include: {
        speaking_prompt_items: {
          orderBy: {
            sort_order: "asc",
          },
        },
      },
    });
  },

  async updateSpeakingPrompt(
    promptId: string,
    data: {
      prompt_type?: speaking_prompt_type;
      content?: string;
      notes?: string | null;
      time_suggest_sec?: number | null;
      sort_order?: number;
    },
  ) {
    await prisma.speaking_prompts.update({
      where: { id: promptId },
      data: {
        ...(data.prompt_type !== undefined
          ? { prompt_type: data.prompt_type }
          : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.time_suggest_sec !== undefined
          ? { time_suggest_sec: data.time_suggest_sec }
          : {}),
        ...(data.sort_order !== undefined
          ? { sort_order: data.sort_order }
          : {}),
        updated_at: new Date(),
      },
    });

    return prisma.speaking_prompts.findUnique({
      where: { id: promptId },
      include: {
        speaking_prompt_items: {
          orderBy: {
            sort_order: "asc",
          },
        },
      },
    });
  },

  deleteSpeakingPrompt(promptId: string) {
    return prisma.speaking_prompts.delete({
      where: { id: promptId },
    });
  },

  findSpeakingPromptItemById(itemId: string) {
    return prisma.speaking_prompt_items.findUnique({
      where: { id: itemId },
    });
  },

  findSpeakingPromptItemBySortOrder(
    speakingPromptId: string,
    sortOrder: number,
    excludeId?: string,
  ) {
    return prisma.speaking_prompt_items.findFirst({
      where: {
        speaking_prompt_id: speakingPromptId,
        sort_order: sortOrder,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  createSpeakingPromptItem(data: {
    speaking_prompt_id: string;
    item_text: string;
    sort_order: number;
  }) {
    return prisma.speaking_prompt_items.create({
      data,
    });
  },

  updateSpeakingPromptItem(
    itemId: string,
    data: {
      item_text?: string;
      sort_order?: number;
    },
  ) {
    return prisma.speaking_prompt_items.update({
      where: { id: itemId },
      data: {
        ...(data.item_text !== undefined ? { item_text: data.item_text } : {}),
        ...(data.sort_order !== undefined
          ? { sort_order: data.sort_order }
          : {}),
      },
    });
  },

  deleteSpeakingPromptItem(itemId: string) {
    return prisma.speaking_prompt_items.delete({
      where: { id: itemId },
    });
  },
};
