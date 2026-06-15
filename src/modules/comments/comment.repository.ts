import {
  Prisma,
  comment_status,
  teacher_submission_status,
  test_type,
  user_role,
} from "@prisma/client";
import { prisma } from "../../config/prisma";

export const commentRepository = {
  findAttemptById(attemptId: string) {
    return prisma.attempts.findUnique({
      where: { id: attemptId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
        tests: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        attempt_snapshots: {
          select: {
            test_snapshot_json: true,
          },
        },
        teacher_submissions: {
          select: {
            id: true,
            skill: true,
            status: true,
            claimed_by: true,
          },
        },
      },
    });
  },

  findCommentsByAttemptId(attemptId: string) {
    return prisma.attempt_comments.findMany({
      where: {
        attempt_id: attemptId,
        status: {
          not: comment_status.DELETED,
        },
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
      },
      orderBy: [{ created_at: "asc" }],
    });
  },

  findCommentById(commentId: string) {
    return prisma.attempt_comments.findUnique({
      where: { id: commentId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
        attempts: true,
      },
    });
  },

  createComment(data: {
    attempt_id: string;
    user_id: string;
    parent_id?: string | null;
    content: string;
  }) {
    return prisma.attempt_comments.create({
      data: {
        attempt_id: data.attempt_id,
        user_id: data.user_id,
        parent_id: data.parent_id ?? null,
        content: data.content,
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
        attempts: {
          select: {
            id: true,
            test_id: true,
            tests: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
            teacher_submissions: {
              select: {
                id: true,
                skill: true,
                status: true,
              },
              orderBy: {
                created_at: "asc",
              },
            },
          },
        },
      },
    });
  },

  updateComment(commentId: string, content: string) {
    return prisma.attempt_comments.update({
      where: { id: commentId },
      data: {
        content,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    });
  },

  softDeleteComment(commentId: string) {
    return prisma.attempt_comments.update({
      where: { id: commentId },
      data: {
        status: comment_status.DELETED,
        content: "[deleted]",
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  hideComment(commentId: string) {
    return prisma.attempt_comments.update({
      where: { id: commentId },
      data: {
        status: comment_status.HIDDEN,
        updated_at: new Date(),
      },
    });
  },

  unhideComment(commentId: string) {
    return prisma.attempt_comments.update({
      where: { id: commentId },
      data: {
        status: comment_status.ACTIVE,
        updated_at: new Date(),
      },
    });
  },

  findTeacherRecipientsForAttempt(attemptId: string) {
    return prisma.teacher_submissions.findMany({
      where: {
        attempt_id: attemptId,
        claimed_by: {
          not: null,
        },
      },
      select: {
        id: true,
        attempt_id: true,
        skill: true,
        claimed_by: true,
      },
    });
  },

  findAdmins() {
    return prisma.users.findMany({
      where: {
        role: user_role.ADMIN,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
  },

  findAttemptOwner(attemptId: string) {
    return prisma.attempts.findUnique({
      where: {
        id: attemptId,
      },
      select: {
        id: true,
        user_id: true,
        test_id: true,
        mode: true,
        part_label: true,
        tests: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        attempt_snapshots: {
          select: {
            test_snapshot_json: true,
          },
        },
        teacher_submissions: {
          select: {
            id: true,
            skill: true,
            status: true,
            claimed_by: true,
          },
          orderBy: {
            created_at: "asc",
          },
        },
      },
    });
  },

  createCommentNotification(data: {
    userId: string;
    title: string;
    message: string;
    dataJson: Prisma.InputJsonValue;
  }) {
    return prisma.notifications.create({
      data: {
        user_id: data.userId,
        type: "SYSTEM",
        title: data.title,
        message: data.message,
        data_json: data.dataJson,
      },
    });
  },

  createManyCommentNotifications(
    items: Array<{
      userId: string;
      title: string;
      message: string;
      dataJson: Prisma.InputJsonValue;
    }>,
  ) {
    if (!items.length) {
      return Promise.resolve({ count: 0 });
    }

    return prisma.notifications.createMany({
      data: items.map((item) => ({
        user_id: item.userId,
        type: "SYSTEM",
        title: item.title,
        message: item.message,
        data_json: item.dataJson,
      })),
    });
  },

  findAdminComments(params: {
    skip: number;
    take: number;
    status?: comment_status;
    search?: string;
  }) {
    return prisma.attempt_comments.findMany({
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.search
          ? {
              OR: [
                {
                  content: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
                {
                  users: {
                    full_name: {
                      contains: params.search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  users: {
                    email: {
                      contains: params.search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  attempt_id: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        status: params.status ?? {
          not: comment_status.DELETED,
        },
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
        attempts: {
          select: {
            id: true,
            test_id: true,
            tests: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
            attempt_snapshots: {
              select: {
                test_snapshot_json: true,
              },
            },
            teacher_submissions: {
              select: {
                id: true,
                skill: true,
                status: true,
              },
              orderBy: {
                created_at: "asc",
              },
            },
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

  countAdminComments(params: { status?: comment_status; search?: string }) {
    return prisma.attempt_comments.count({
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.search
          ? {
              OR: [
                {
                  content: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
                {
                  users: {
                    full_name: {
                      contains: params.search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  users: {
                    email: {
                      contains: params.search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  attempt_id: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        status: params.status ?? {
          not: comment_status.DELETED,
        },
      },
    });
  },
  findTeachersForAttemptComment(attemptId: string) {
    return prisma.teacher_submissions.findMany({
      where: {
        attempt_id: attemptId,
      },
      select: {
        id: true,
        attempt_id: true,
        skill: true,
        claimed_by: true,
        teacher_reviews: {
          select: {
            teacher_id: true,
          },
        },
      },
    });
  },

  ensureTeacherSubmissionsForAttempt(attemptId: string, skills: test_type[]) {
    const uniqueSkills = Array.from(new Set(skills));

    if (uniqueSkills.length === 0) {
      return Promise.resolve({
        count: 0,
      });
    }

    return prisma.teacher_submissions.createMany({
      data: uniqueSkills.map((skill) => ({
        attempt_id: attemptId,
        skill,
        status: teacher_submission_status.PENDING,
      })),
      skipDuplicates: true,
    });
  },

  findActiveTeachers() {
    return prisma.users.findMany({
      where: {
        role: "TEACHER",
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
  },
};
