import { Prisma, publish_status, question_type } from "@prisma/client";
import { prisma } from "../../config/prisma";

const publicDetailSelect = {
  id: true,
  title: true,
  level: true,
  status: true,
  created_at: true,
  updated_at: true,
  reading_set_tags: {
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
} satisfies Prisma.reading_setsSelect;

const adminDetailInclude = {
  reading_set_tags: {
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
} satisfies Prisma.reading_setsInclude;

export const readingRepository = {
  findReadingSetById(id: string) {
    return prisma.reading_sets.findUnique({
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

  findPublicReadingSets(params: {
    skip: number;
    take: number;
    search?: string;
    level?: number;
    tagIds?: string[];
  }) {
    return prisma.reading_sets.findMany({
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
      include: {
        reading_set_tags: {
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

  countPublicReadingSets(params: {
    search?: string;
    level?: number;
    tagIds?: string[];
  }) {
    return prisma.reading_sets.count({
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
    });
  },

  findPublicReadingSetDetail(id: string) {
    return prisma.reading_sets.findFirst({
      where: {
        id,
        status: publish_status.PUBLISHED,
      },
      select: publicDetailSelect,
    });
  },

  findAdminReadingSets(params: {
    skip: number;
    take: number;
    search?: string;
    level?: number;
    tagIds?: string[];
    status?: publish_status;
  }) {
    return prisma.reading_sets.findMany({
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
      include: {
        reading_set_tags: {
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

  countAdminReadingSets(params: {
    search?: string;
    level?: number;
    tagIds?: string[];
    status?: publish_status;
  }) {
    return prisma.reading_sets.count({
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
    });
  },

  findAdminReadingSetDetail(id: string) {
    return prisma.reading_sets.findUnique({
      where: { id },
      include: adminDetailInclude,
    });
  },

  async createReadingSet(data: {
    id: string;
    title: string;
    passage_html?: string | null;
    passage_text?: string | null;
    level: number;
    status: publish_status;
    created_by: string;
    tagIds: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.reading_sets.create({
        data: {
          id: data.id,
          title: data.title,
          passage_html: data.passage_html ?? null,
          passage_text: data.passage_text ?? null,
          level: data.level,
          status: data.status,
          created_by: data.created_by,
        },
      });

      if (data.tagIds.length > 0) {
        await tx.reading_set_tags.createMany({
          data: data.tagIds.map((tagId) => ({
            reading_set_id: data.id,
            tag_id: tagId,
          })),
        });
      }

      return tx.reading_sets.findUnique({
        where: { id: data.id },
        include: adminDetailInclude,
      });
    });
  },

  async updateReadingSet(
    id: string,
    data: {
      title?: string;
      passage_html?: string | null;
      passage_text?: string | null;
      level?: number | null;
      status?: publish_status;
      tagIds?: string[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.reading_sets.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.passage_html !== undefined
            ? { passage_html: data.passage_html }
            : {}),
          ...(data.passage_text !== undefined
            ? { passage_text: data.passage_text }
            : {}),
          ...(data.level !== undefined ? { level: data.level } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          updated_at: new Date(),
        },
      });

      if (data.tagIds !== undefined) {
        await tx.reading_set_tags.deleteMany({
          where: {
            reading_set_id: id,
          },
        });

        if (data.tagIds.length > 0) {
          await tx.reading_set_tags.createMany({
            data: data.tagIds.map((tagId) => ({
              reading_set_id: id,
              tag_id: tagId,
            })),
          });
        }
      }

      return tx.reading_sets.findUnique({
        where: { id },
        include: adminDetailInclude,
      });
    });
  },

  deleteReadingSet(id: string) {
    return prisma.reading_sets.delete({
      where: { id },
    });
  },

  countTestSectionsUsingReadingSet(readingSetId: string) {
    return prisma.test_sections.count({
      where: {
        reading_set_id: readingSetId,
      },
    });
  },

  async countAttemptUsageByReadingSet(readingSetId: string) {
    const [answerCount, resultDetailCount] = await prisma.$transaction([
      prisma.attempt_question_answers.count({
        where: {
          questions: {
            is: {
              reading_set_id: readingSetId,
            },
          },
        },
      }),
      prisma.attempt_result_details.count({
        where: {
          questions: {
            is: {
              reading_set_id: readingSetId,
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

  findReadingSetStructureForPublish(id: string) {
    return prisma.reading_sets.findUnique({
      where: { id },
      include: adminDetailInclude,
    });
  },

  publishReadingSet(id: string) {
    return prisma.reading_sets.update({
      where: { id },
      data: {
        status: publish_status.PUBLISHED,
        updated_at: new Date(),
      },
      include: adminDetailInclude,
    });
  },

  unpublishReadingSet(id: string) {
    return prisma.reading_sets.update({
      where: { id },
      data: {
        status: publish_status.DRAFT,
        updated_at: new Date(),
      },
      include: adminDetailInclude,
    });
  },

  findReadingQuestionById(questionId: string) {
    return prisma.questions.findUnique({
      where: { id: questionId },
    });
  },

  findReadingQuestionByQNo(
    readingSetId: string,
    qNo: number,
    excludeId?: string,
  ) {
    return prisma.questions.findFirst({
      where: {
        reading_set_id: readingSetId,
        q_no: qNo,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  findReadingQuestionBySortOrder(
    readingSetId: string,
    sortOrder: number,
    excludeId?: string,
  ) {
    return prisma.questions.findFirst({
      where: {
        reading_set_id: readingSetId,
        sort_order: sortOrder,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  createReadingQuestion(data: {
    reading_set_id: string;
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
        reading_set_id: data.reading_set_id,
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

  updateReadingQuestion(
    questionId: string,
    data: {
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

  deleteReadingQuestion(questionId: string) {
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
