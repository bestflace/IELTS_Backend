import {
  Prisma,
  audio_source_type,
  publish_status,
  question_type,
} from "@prisma/client";
import { prisma } from "../../config/prisma";

const publicDetailSelect = {
  id: true,
  title: true,
  level: true,
  status: true,
  created_at: true,
  updated_at: true,
  listening_set_tags: {
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
      questions: true,
    },
  },
  test_sections: {
    orderBy: {
      sort_order: "asc" as const,
    },
    select: {
      id: true,
      test_id: true,
      part_label: true,
      sort_order: true,
      time_limit_sec: true,
      tests: {
        select: {
          id: true,
          type: true,
          title: true,
          level: true,
          status: true,
          description: true,
          published_at: true,
        },
      },
    },
  },
} satisfies Prisma.listening_setsSelect;

const adminDetailInclude = {
  listening_set_tags: {
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
  questions: {
    orderBy: {
      sort_order: "asc" as const,
    },
  },
} satisfies Prisma.listening_setsInclude;

export const listeningRepository = {
  findListeningSetById(id: string) {
    return prisma.listening_sets.findUnique({
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

  findPublicListeningSets(params: {
    skip: number;
    take: number;
    search?: string;
    level?: number;
    tagIds?: string[];
  }) {
    return prisma.listening_sets.findMany({
      where: {
        status: publish_status.PUBLISHED,
        ...(params.search
          ? {
              title: {
                contains: params.search,
                mode: "insensitive",
              },
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
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
      include: {
        listening_set_tags: {
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
            questions: true,
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

  countPublicListeningSets(params: {
    search?: string;
    level?: number;
    tagIds?: string[];
  }) {
    return prisma.listening_sets.count({
      where: {
        status: publish_status.PUBLISHED,
        ...(params.search
          ? {
              title: {
                contains: params.search,
                mode: "insensitive",
              },
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
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
    });
  },

  findPublicListeningSetDetail(id: string) {
    return prisma.listening_sets.findFirst({
      where: {
        id,
        status: publish_status.PUBLISHED,
      },
      select: publicDetailSelect,
    });
  },

  findAdminListeningSets(params: {
    skip: number;
    take: number;
    search?: string;
    level?: number;
    tagIds?: string[];
    status?: publish_status;
  }) {
    return prisma.listening_sets.findMany({
      where: {
        ...(params.search
          ? {
              title: {
                contains: params.search,
                mode: "insensitive",
              },
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.status ? { status: params.status } : {}),
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
      include: {
        listening_set_tags: {
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
            questions: true,
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

  countAdminListeningSets(params: {
    search?: string;
    level?: number;
    tagIds?: string[];
    status?: publish_status;
  }) {
    return prisma.listening_sets.count({
      where: {
        ...(params.search
          ? {
              title: {
                contains: params.search,
                mode: "insensitive",
              },
            }
          : {}),
        ...(params.level !== undefined ? { level: params.level } : {}),
        ...(params.status ? { status: params.status } : {}),
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
    });
  },

  findAdminListeningSetDetail(id: string) {
    return prisma.listening_sets.findUnique({
      where: { id },
      include: adminDetailInclude,
    });
  },

  async createListeningSet(data: {
    id: string;
    title: string;
    transcript_text?: string | null;
    audio_url?: string | null;
    audio_source?: audio_source_type | null;
    level: number;
    status: publish_status;
    created_by: string;
    tagIds: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.listening_sets.create({
        data: {
          id: data.id,
          title: data.title,
          transcript_text: data.transcript_text ?? null,
          audio_url: data.audio_url ?? null,
          audio_source: data.audio_source ?? null,
          level: data.level,
          status: data.status,
          created_by: data.created_by,
        },
      });

      if (data.tagIds.length > 0) {
        await tx.listening_set_tags.createMany({
          data: data.tagIds.map((tagId) => ({
            listening_set_id: data.id,
            tag_id: tagId,
          })),
        });
      }

      return tx.listening_sets.findUnique({
        where: { id: data.id },
        include: adminDetailInclude,
      });
    });
  },

  async updateListeningSet(
    id: string,
    data: {
      title?: string;
      transcript_text?: string | null;
      audio_url?: string | null;
      audio_source?: audio_source_type | null;
      level?: number | null;
      status?: publish_status;
      tagIds?: string[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.listening_sets.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.transcript_text !== undefined
            ? { transcript_text: data.transcript_text }
            : {}),
          ...(data.audio_url !== undefined
            ? { audio_url: data.audio_url }
            : {}),
          ...(data.audio_source !== undefined
            ? { audio_source: data.audio_source }
            : {}),
          ...(data.level !== undefined ? { level: data.level } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          updated_at: new Date(),
        },
      });

      if (data.tagIds !== undefined) {
        await tx.listening_set_tags.deleteMany({
          where: {
            listening_set_id: id,
          },
        });

        if (data.tagIds.length > 0) {
          await tx.listening_set_tags.createMany({
            data: data.tagIds.map((tagId) => ({
              listening_set_id: id,
              tag_id: tagId,
            })),
          });
        }
      }

      return tx.listening_sets.findUnique({
        where: { id },
        include: adminDetailInclude,
      });
    });
  },

  deleteListeningSet(id: string) {
    return prisma.listening_sets.delete({
      where: { id },
    });
  },

  countTestSectionsUsingListeningSet(listeningSetId: string) {
    return prisma.test_sections.count({
      where: {
        listening_set_id: listeningSetId,
      },
    });
  },

  async countAttemptUsageByListeningSet(listeningSetId: string) {
    const [answerCount, resultDetailCount] = await prisma.$transaction([
      prisma.attempt_question_answers.count({
        where: {
          questions: {
            is: {
              listening_set_id: listeningSetId,
            },
          },
        },
      }),
      prisma.attempt_result_details.count({
        where: {
          questions: {
            is: {
              listening_set_id: listeningSetId,
            },
          },
        },
      }),
    ]);

    return {
      answerCount,
      resultDetailCount,
      total: answerCount + resultDetailCount,
    };
  },

  findListeningSetStructureForPublish(id: string) {
    return prisma.listening_sets.findUnique({
      where: { id },
      include: adminDetailInclude,
    });
  },

  publishListeningSet(id: string) {
    return prisma.listening_sets.update({
      where: { id },
      data: {
        status: publish_status.PUBLISHED,
        updated_at: new Date(),
      },
      include: adminDetailInclude,
    });
  },

  unpublishListeningSet(id: string) {
    return prisma.listening_sets.update({
      where: { id },
      data: {
        status: publish_status.DRAFT,
        updated_at: new Date(),
      },
      include: adminDetailInclude,
    });
  },

  findListeningQuestionById(questionId: string) {
    return prisma.questions.findUnique({
      where: { id: questionId },
    });
  },

  findListeningQuestionByQNo(
    listeningSetId: string,
    qNo: number,
    excludeId?: string,
  ) {
    return prisma.questions.findFirst({
      where: {
        listening_set_id: listeningSetId,
        q_no: qNo,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  findListeningQuestionBySortOrder(
    listeningSetId: string,
    sortOrder: number,
    excludeId?: string,
  ) {
    return prisma.questions.findFirst({
      where: {
        listening_set_id: listeningSetId,
        sort_order: sortOrder,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  createListeningQuestion(data: {
    listening_set_id: string;
    section_label?: string | null;
    q_no: number;
    question_type: question_type;
    prompt_text: string;
    instruction_text?: string | null;
    options_json?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
    correct_answer_json: Prisma.InputJsonValue;
    explanation?: string | null;
    points?: number;
    sort_order: number;
  }) {
    return prisma.questions.create({
      data: {
        listening_set_id: data.listening_set_id,
        section_label: data.section_label ?? null,
        q_no: data.q_no,
        question_type: data.question_type,
        prompt_text: data.prompt_text,
        instruction_text: data.instruction_text ?? null,
        options_json: data.options_json,
        correct_answer_json: data.correct_answer_json,
        explanation: data.explanation ?? null,
        points: data.points ?? 1,
        sort_order: data.sort_order,
      },
    });
  },

  updateListeningQuestion(
    questionId: string,
    data: {
      section_label?: string | null;
      q_no?: number;
      question_type?: question_type;
      prompt_text?: string;
      instruction_text?: string | null;
      options_json?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
      correct_answer_json?: Prisma.InputJsonValue;
      explanation?: string | null;
      points?: number;
      sort_order?: number;
    },
  ) {
    return prisma.questions.update({
      where: { id: questionId },
      data: {
        ...(data.section_label !== undefined
          ? { section_label: data.section_label }
          : {}),
        ...(data.q_no !== undefined ? { q_no: data.q_no } : {}),
        ...(data.question_type !== undefined
          ? { question_type: data.question_type }
          : {}),
        ...(data.prompt_text !== undefined
          ? { prompt_text: data.prompt_text }
          : {}),
        ...(data.instruction_text !== undefined
          ? { instruction_text: data.instruction_text }
          : {}),
        ...(data.options_json !== undefined
          ? {
              options_json:
                data.options_json === null
                  ? Prisma.JsonNull
                  : data.options_json,
            }
          : {}),
        ...(data.correct_answer_json !== undefined
          ? { correct_answer_json: data.correct_answer_json }
          : {}),
        ...(data.explanation !== undefined
          ? { explanation: data.explanation }
          : {}),
        ...(data.points !== undefined ? { points: data.points } : {}),
        ...(data.sort_order !== undefined
          ? { sort_order: data.sort_order }
          : {}),
        updated_at: new Date(),
      },
    });
  },

  deleteListeningQuestion(questionId: string) {
    return prisma.questions.delete({
      where: { id: questionId },
    });
  },

  async countAttemptUsageByQuestion(questionId: string) {
    const [answerCount, resultDetailCount] = await prisma.$transaction([
      prisma.attempt_question_answers.count({
        where: {
          question_id: questionId,
        },
      }),
      prisma.attempt_result_details.count({
        where: {
          question_id: questionId,
        },
      }),
    ]);

    return {
      answerCount,
      resultDetailCount,
      total: answerCount + resultDetailCount,
    };
  },
};
