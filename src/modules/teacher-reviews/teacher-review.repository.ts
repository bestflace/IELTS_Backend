import {
  Prisma,
  attempt_status,
  teacher_submission_status,
  test_type,
} from "@prisma/client";
import { prisma } from "../../config/prisma";

const teacherSubmissionInclude = {
  users: {
    select: {
      id: true,
      full_name: true,
      email: true,
      avatar_url: true,
    },
  },
  teacher_reviews: true,
  attempts: {
    include: {
      users: {
        select: {
          id: true,
          full_name: true,
          email: true,
          avatar_url: true,
        },
      },
      tests: {
        select: {
          id: true,
          title: true,
          type: true,
          level: true,
        },
      },
      attempt_snapshots: true,
      attempt_question_answers: {
        orderBy: {
          q_no: "asc" as const,
        },
      },
      attempt_writing_responses: true,
      attempt_speaking_responses: true,
      attempt_results: true,
      attempt_result_details: {
        orderBy: {
          q_no: "asc" as const,
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
      teacher_submissions: {
        include: {
          teacher_reviews: true,
        },
      },
    },
  },
} satisfies Prisma.teacher_submissionsInclude;

export const teacherReviewRepository = {
  findTeacherSubmissions(params: {
    teacherId: string;
    skip: number;
    take: number;
    skill?: test_type;
    status?: teacher_submission_status;
    mine?: boolean;
  }) {
    return prisma.teacher_submissions.findMany({
      where: {
        ...(params.skill ? { skill: params.skill } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.mine ? { claimed_by: params.teacherId } : {}),
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
          },
        },
        teacher_reviews: true,
        attempts: {
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                email: true,
                avatar_url: true,
              },
            },
            tests: {
              select: {
                id: true,
                title: true,
                type: true,
                level: true,
              },
            },
            attempt_results: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { created_at: "desc" }],
      skip: params.skip,
      take: params.take,
    });
  },

  countTeacherSubmissions(params: {
    teacherId: string;
    skill?: test_type;
    status?: teacher_submission_status;
    mine?: boolean;
  }) {
    return prisma.teacher_submissions.count({
      where: {
        ...(params.skill ? { skill: params.skill } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.mine ? { claimed_by: params.teacherId } : {}),
      },
    });
  },

  findTeacherSubmissionById(submissionId: string) {
    return prisma.teacher_submissions.findUnique({
      where: {
        id: submissionId,
      },
      include: teacherSubmissionInclude,
    });
  },

  claimSubmission(submissionId: string, teacherId: string) {
    return prisma.teacher_submissions.update({
      where: {
        id: submissionId,
      },
      data: {
        status: teacher_submission_status.CLAIMED,
        claimed_by: teacherId,
        claimed_at: new Date(),
        updated_at: new Date(),
      },
      include: teacherSubmissionInclude,
    });
  },

  releaseSubmission(submissionId: string) {
    return prisma.teacher_submissions.update({
      where: {
        id: submissionId,
      },
      data: {
        status: teacher_submission_status.PENDING,
        claimed_by: null,
        claimed_at: null,
        updated_at: new Date(),
      },
      include: teacherSubmissionInclude,
    });
  },

  upsertTeacherReview(data: {
    submissionId: string;
    attemptId: string;
    teacherId: string;
    overallBand: number;
    criteriaJson: Prisma.InputJsonValue;
    summary: string;
    actionItemsJson: Prisma.InputJsonValue;
  }) {
    return prisma.teacher_reviews.upsert({
      where: {
        submission_id: data.submissionId,
      },
      update: {
        teacher_id: data.teacherId,
        overall_band: data.overallBand,
        criteria_json: data.criteriaJson,
        summary: data.summary,
        action_items_json: data.actionItemsJson,
        updated_at: new Date(),
      },
      create: {
        submission_id: data.submissionId,
        attempt_id: data.attemptId,
        teacher_id: data.teacherId,
        overall_band: data.overallBand,
        criteria_json: data.criteriaJson,
        summary: data.summary,
        action_items_json: data.actionItemsJson,
      },
    });
  },

  markSubmissionReviewed(submissionId: string, teacherId: string) {
    return prisma.teacher_submissions.update({
      where: {
        id: submissionId,
      },
      data: {
        status: teacher_submission_status.REVIEWED,
        claimed_by: teacherId,
        reviewed_at: new Date(),
        updated_at: new Date(),
      },
      include: teacherSubmissionInclude,
    });
  },

  countRemainingPendingReviews(attemptId: string) {
    return prisma.teacher_submissions.count({
      where: {
        attempt_id: attemptId,
        status: {
          not: teacher_submission_status.REVIEWED,
        },
      },
    });
  },

  updateAttemptGraded(attemptId: string, graded: boolean) {
    return prisma.attempts.update({
      where: {
        id: attemptId,
      },
      data: {
        status: graded ? attempt_status.GRADED : attempt_status.GRADING,
        graded_at: graded ? new Date() : null,
        updated_at: new Date(),
      },
    });
  },

  createReviewNotification(data: {
    userId: string;
    attemptId: string;
    submissionId: string;
    skill: test_type;
  }) {
    return prisma.notifications.create({
      data: {
        user_id: data.userId,
        type: "TEACHER_REVIEW_DONE",
        title: "Teacher review completed",
        message:
          data.skill === test_type.WRITING
            ? "Your writing submission has been reviewed by a teacher."
            : "Your speaking submission has been reviewed by a teacher.",
        data_json: {
          attemptId: data.attemptId,
          submissionId: data.submissionId,
          skill: data.skill,
        } as Prisma.InputJsonValue,
      },
    });
  },

  countDashboardStats(teacherId: string) {
    return Promise.all([
      prisma.teacher_submissions.count({
        where: {
          status: teacher_submission_status.PENDING,
        },
      }),
      prisma.teacher_submissions.count({
        where: {
          status: teacher_submission_status.CLAIMED,
          claimed_by: teacherId,
        },
      }),
      prisma.teacher_submissions.count({
        where: {
          status: teacher_submission_status.REVIEWED,
          claimed_by: teacherId,
        },
      }),
      prisma.teacher_submissions.findMany({
        where: {
          status: teacher_submission_status.REVIEWED,
          claimed_by: teacherId,
          claimed_at: {
            not: null,
          },
          reviewed_at: {
            not: null,
          },
        },
        select: {
          id: true,
          claimed_at: true,
          reviewed_at: true,
          skill: true,
        },
        take: 200,
        orderBy: {
          reviewed_at: "desc",
        },
      }),
    ]);
  },
};
