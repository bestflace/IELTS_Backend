import {
  Prisma,
  attempt_status,
  grading_job_status,
  speaking_part_type,
  teacher_submission_status,
  test_type,
} from "@prisma/client";
import { prisma } from "../../config/prisma";

const attemptDetailInclude = {
  attempt_results: true,
  attempt_result_details: {
    orderBy: {
      q_no: "asc" as const,
    },
  },
  attempt_snapshots: true,
  attempt_question_answers: {
    orderBy: {
      q_no: "asc" as const,
    },
  },
  attempt_writing_responses: {
    orderBy: {
      writing_task_id: "asc" as const,
    },
  },
  attempt_speaking_responses: {
    orderBy: {
      speaking_part: "asc" as const,
    },
  },
  teacher_submissions: {
    include: {
      teacher_reviews: true,
    },
  },
  ai_gradings: {
    orderBy: {
      created_at: "desc" as const,
    },
  },
  asr_jobs: {
    orderBy: {
      created_at: "desc" as const,
    },
  },
  tests: true,
} satisfies Prisma.attemptsInclude;

function toJsonValue(value: unknown): any {
  return value === null || value === undefined ? Prisma.JsonNull : value;
}

const jsonNullValue = Prisma.JsonNull as any;

export const attemptRepository = {
  findPublishedTestWithContent(testId: string) {
    return prisma.tests.findFirst({
      where: {
        id: testId,
        status: "PUBLISHED",
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
        test_sections: {
          orderBy: {
            sort_order: "asc",
          },
          include: {
            reading_sets: {
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
                questions: {
                  orderBy: {
                    sort_order: "asc",
                  },
                },
              },
            },
            listening_sets: {
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
                questions: {
                  orderBy: {
                    sort_order: "asc",
                  },
                },
              },
            },
            writing_tasks: {
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
              },
            },
            speaking_sets: {
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
                speaking_parts: {
                  orderBy: {
                    sort_order: "asc",
                  },
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
                },
              },
            },
          },
        },
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

  createAttemptWithSnapshot(data: {
    id: string;
    user_id: string;
    test_id: string;
    mode: test_type;
    part_label?: string | null;
    time_limit_sec: number;
    expires_at: Date;
    snapshot: unknown;
  }) {
    return prisma.$transaction(async (tx) => {
      const attempt = await tx.attempts.create({
        data: {
          id: data.id,
          user_id: data.user_id,
          test_id: data.test_id,
          mode: data.mode,
          part_label: data.part_label ?? null,
          time_limit_sec: data.time_limit_sec,
          expires_at: data.expires_at,
          status: attempt_status.IN_PROGRESS,
        },
      });

      await tx.attempt_snapshots.create({
        data: {
          attempt_id: data.id,
          test_snapshot_json: toJsonValue(data.snapshot),
        },
      });

      return attempt;
    });
  },

  findUserAttempts(params: {
    userId: string;
    skip: number;
    take: number;
    mode?: test_type;
    status?: attempt_status;
    from?: Date;
    to?: Date;
  }) {
    return prisma.attempts.findMany({
      where: {
        user_id: params.userId,
        ...(params.mode ? { mode: params.mode } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.from || params.to
          ? {
              created_at: {
                ...(params.from ? { gte: params.from } : {}),
                ...(params.to ? { lte: params.to } : {}),
              },
            }
          : {}),
      },
      include: {
        attempt_results: true,
        teacher_submissions: true,
      },
      orderBy: {
        created_at: "desc",
      },
      skip: params.skip,
      take: params.take,
    });
  },

  countUserAttempts(params: {
    userId: string;
    mode?: test_type;
    status?: attempt_status;
    from?: Date;
    to?: Date;
  }) {
    return prisma.attempts.count({
      where: {
        user_id: params.userId,
        ...(params.mode ? { mode: params.mode } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.from || params.to
          ? {
              created_at: {
                ...(params.from ? { gte: params.from } : {}),
                ...(params.to ? { lte: params.to } : {}),
              },
            }
          : {}),
      },
    });
  },

  findUserAttemptById(attemptId: string, userId: string) {
    return prisma.attempts.findFirst({
      where: {
        id: attemptId,
        user_id: userId,
      },
      include: attemptDetailInclude,
    });
  },

  findAttemptById(attemptId: string) {
    return prisma.attempts.findUnique({
      where: {
        id: attemptId,
      },
      include: attemptDetailInclude,
    });
  },

  updateAttemptStatus(
    attemptId: string,
    data: {
      status?: attempt_status;
      submitted_at?: Date | null;
      graded_at?: Date | null;
      expires_at?: Date | null;
    },
  ) {
    return prisma.attempts.update({
      where: {
        id: attemptId,
      },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.submitted_at !== undefined
          ? { submitted_at: data.submitted_at }
          : {}),
        ...(data.graded_at !== undefined ? { graded_at: data.graded_at } : {}),
        ...(data.expires_at !== undefined
          ? { expires_at: data.expires_at }
          : {}),
        updated_at: new Date(),
      },
    });
  },

  upsertQuestionAnswers(
    attemptId: string,
    answers: Array<{
      questionId: string;
      qNo?: number;
      answerJson: unknown;
      isFlagged?: boolean;
      isFinal?: boolean;
    }>,
  ) {
    return prisma.$transaction(async (tx) => {
      const results = [];

      for (const answer of answers) {
        const existing = await tx.attempt_question_answers.findFirst({
          where: {
            attempt_id: attemptId,
            question_id: answer.questionId,
          },
        });

        if (existing) {
          const updated = await tx.attempt_question_answers.update({
            where: {
              id: existing.id,
            },
            data: {
              ...(answer.qNo !== undefined ? { q_no: answer.qNo } : {}),
              answer_json: toJsonValue(answer.answerJson),
              ...(answer.isFlagged !== undefined
                ? { is_flagged: answer.isFlagged }
                : {}),
              ...(answer.isFinal !== undefined
                ? { is_final: answer.isFinal }
                : {}),
              saved_at: new Date(),
            },
          });

          results.push(updated);
        } else {
          const created = await tx.attempt_question_answers.create({
            data: {
              attempt_id: attemptId,
              question_id: answer.questionId,
              q_no: answer.qNo ?? null,
              answer_json: toJsonValue(answer.answerJson),
              is_flagged: answer.isFlagged ?? false,
              is_final: answer.isFinal ?? false,
            },
          });

          results.push(created);
        }
      }

      return results;
    });
  },

  upsertWritingResponses(
    attemptId: string,
    responses: Array<{
      writingTaskId: string;
      responseText: string;
      wordCount: number;
    }>,
  ) {
    return prisma.$transaction(async (tx) => {
      const results = [];

      for (const response of responses) {
        const existing = await tx.attempt_writing_responses.findFirst({
          where: {
            attempt_id: attemptId,
            writing_task_id: response.writingTaskId,
          },
        });

        if (existing) {
          const updated = await tx.attempt_writing_responses.update({
            where: {
              id: existing.id,
            },
            data: {
              response_text: response.responseText,
              word_count: response.wordCount,
              updated_at: new Date(),
              saved_at: new Date(),
            },
          });

          results.push(updated);
        } else {
          const created = await tx.attempt_writing_responses.create({
            data: {
              attempt_id: attemptId,
              writing_task_id: response.writingTaskId,
              response_text: response.responseText,
              word_count: response.wordCount,
            },
          });

          results.push(created);
        }
      }

      return results;
    });
  },

  upsertSpeakingResponses(
    attemptId: string,
    responses: Array<{
      speakingPart: speaking_part_type;
      promptId?: string | null;
      audioUrl: string;
      durationSec?: number | null;
    }>,
  ) {
    return prisma.$transaction(async (tx) => {
      const results = [];

      for (const response of responses) {
        const existing = await tx.attempt_speaking_responses.findFirst({
          where: {
            attempt_id: attemptId,
            speaking_part: response.speakingPart,
          },
        });

        if (existing) {
          const updated = await tx.attempt_speaking_responses.update({
            where: {
              id: existing.id,
            },
            data: {
              prompt_id: response.promptId ?? null,
              audio_url: response.audioUrl,
              duration_sec: response.durationSec ?? null,
            },
          });

          results.push(updated);
        } else {
          const created = await tx.attempt_speaking_responses.create({
            data: {
              attempt_id: attemptId,
              speaking_part: response.speakingPart,
              prompt_id: response.promptId ?? null,
              audio_url: response.audioUrl,
              duration_sec: response.durationSec ?? null,
            },
          });

          results.push(created);
        }
      }

      return results;
    });
  },

  updateSpeakingResponseByPart(
    attemptId: string,
    speakingPart: speaking_part_type,
    data: {
      prompt_id?: string | null;
      audio_url?: string | null;
      duration_sec?: number | null;
      transcript?: string | null;
    },
  ) {
    const updateData: Prisma.attempt_speaking_responsesUncheckedUpdateManyInput =
      {};

    if (data.prompt_id !== undefined) {
      updateData.prompt_id = data.prompt_id;
    }

    if (data.audio_url !== undefined && data.audio_url !== null) {
      updateData.audio_url = data.audio_url;
    }

    if (data.duration_sec !== undefined) {
      updateData.duration_sec = data.duration_sec;
    }

    if (data.transcript !== undefined) {
      updateData.transcript = data.transcript;
    }

    return prisma.attempt_speaking_responses.updateMany({
      where: {
        attempt_id: attemptId,
        speaking_part: speakingPart,
      },
      data: updateData,
    });
  },

  findSpeakingResponseByPart(
    attemptId: string,
    speakingPart: speaking_part_type,
  ) {
    return prisma.attempt_speaking_responses.findFirst({
      where: {
        attempt_id: attemptId,
        speaking_part: speakingPart,
      },
    });
  },

  replaceAttemptResults(
    attemptId: string,
    result: {
      correct_count: number | null;
      total_count: number | null;
      raw_score: number | null;
      band_estimate: number | null;
      summary_json: unknown | null;
    },
    details: Array<{
      question_id?: string | null;
      q_no?: number | null;
      user_answer_json?: unknown | null;
      correct_json?: unknown | null;
      is_correct?: boolean | null;
      points_awarded?: number | null;
      explanation?: string | null;
    }>,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.attempt_results.upsert({
        where: {
          attempt_id: attemptId,
        },
        update: {
          correct_count: result.correct_count,
          total_count: result.total_count,
          raw_score: result.raw_score,
          band_estimate: result.band_estimate,
          summary_json: toJsonValue(result.summary_json),
          updated_at: new Date(),
        },
        create: {
          attempt_id: attemptId,
          correct_count: result.correct_count,
          total_count: result.total_count,
          raw_score: result.raw_score,
          band_estimate: result.band_estimate,
          summary_json: toJsonValue(result.summary_json),
        },
      });

      await tx.attempt_result_details.deleteMany({
        where: {
          attempt_id: attemptId,
        },
      });

      if (details.length > 0) {
        await tx.attempt_result_details.createMany({
          data: details.map((detail) => ({
            attempt_id: attemptId,
            question_id: detail.question_id ?? null,
            q_no: detail.q_no ?? null,
            user_answer_json: detail.user_answer_json ?? jsonNullValue,
            correct_json: detail.correct_json ?? jsonNullValue,
            is_correct: detail.is_correct ?? null,
            points_awarded: detail.points_awarded ?? null,
            explanation: detail.explanation ?? null,
          })),
        });
      }
    });
  },

  createTeacherSubmissions(attemptId: string, skills: test_type[]) {
    if (skills.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return prisma.teacher_submissions.createMany({
      data: skills.map((skill) => ({
        attempt_id: attemptId,
        skill,
        status: teacher_submission_status.PENDING,
      })),
      skipDuplicates: true,
    });
  },

  createPendingWritingAiGrading(attemptId: string) {
    return prisma.ai_gradings.create({
      data: {
        attempt_id: attemptId,
        skill: test_type.WRITING,
        status: grading_job_status.PENDING,
      },
    });
  },

  createPendingSpeakingAiGrading(attemptId: string) {
    return prisma.ai_gradings.create({
      data: {
        attempt_id: attemptId,
        skill: test_type.SPEAKING,
        status: grading_job_status.PENDING,
      },
    });
  },

  createPendingSpeakingAsrJob(attemptId: string) {
    return prisma.asr_jobs.create({
      data: {
        attempt_id: attemptId,
        status: grading_job_status.PENDING,
      },
    });
  },

  countPendingTeacherSubmissions(attemptId: string) {
    return prisma.teacher_submissions.count({
      where: {
        attempt_id: attemptId,
        status: {
          not: "REVIEWED",
        },
      },
    });
  },

  createNotification(data: {
    userId: string;
    title: string;
    message: string;
    dataJson?: unknown | null;
  }) {
    return prisma.notifications.create({
      data: {
        user_id: data.userId,
        type: "TEACHER_REVIEW_DONE",
        title: data.title,
        message: data.message,
        data_json: toJsonValue(data.dataJson),
      },
    });
  },
};
