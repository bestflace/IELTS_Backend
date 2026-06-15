import { notification_type, user_role, user_status } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

function buildVisibleNotificationWhere(
  userId: string,
  unreadOnly = false,
): Prisma.notificationsWhereInput {
  const where: Prisma.notificationsWhereInput = {
    user_id: userId,

    OR: [
      {
        type: {
          not: notification_type.TEST_PUBLISHED,
        },
      },
      {
        type: notification_type.TEST_PUBLISHED,

        // TEST_PUBLISHED chỉ được hiển thị nếu chủ notification
        // hiện tại có role USER.
        users: {
          is: {
            role: user_role.USER,
          },
        },
      },
    ],
  };

  if (unreadOnly) {
    where.is_read = false;
  }

  return where;
}

export const notificationRepository = {
  findUserNotifications(params: {
    userId: string;
    skip: number;
    take: number;
    unreadOnly?: boolean;
  }) {
    return prisma.notifications.findMany({
      where: buildVisibleNotificationWhere(
        params.userId,
        params.unreadOnly === true,
      ),
      orderBy: {
        created_at: "desc",
      },
      skip: params.skip,
      take: params.take,
    });
  },

  countUserNotifications(params: { userId: string; unreadOnly?: boolean }) {
    return prisma.notifications.count({
      where: buildVisibleNotificationWhere(
        params.userId,
        params.unreadOnly === true,
      ),
    });
  },

  countUnread(userId: string) {
    return prisma.notifications.count({
      where: buildVisibleNotificationWhere(userId, true),
    });
  },

  findUserNotificationById(notificationId: string, userId: string) {
    return prisma.notifications.findFirst({
      where: {
        id: notificationId,
        ...buildVisibleNotificationWhere(userId),
      },
    });
  },

  markRead(notificationId: string) {
    return prisma.notifications.update({
      where: {
        id: notificationId,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  },

  markAllRead(userId: string) {
    return prisma.notifications.updateMany({
      // Chỉ đánh dấu những notification mà user được phép nhìn thấy.
      where: buildVisibleNotificationWhere(userId, true),
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  },

  /**
   * Chỉ lấy học viên đang hoạt động.
   *
   * Không lấy TEACHER và ADMIN vì TEST_PUBLISHED là thông báo
   * dành riêng cho người học.
   */
  findActiveLearners() {
    return prisma.users.findMany({
      where: {
        role: user_role.USER,
        status: user_status.ACTIVE,
      },
      select: {
        id: true,
      },
    });
  },

  findTestById(testId: string) {
    return prisma.tests.findUnique({
      where: {
        id: testId,
      },
    });
  },

  findAttemptById(attemptId: string) {
    return prisma.attempts.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        users: true,
        tests: true,
        teacher_submissions: {
          orderBy: {
            created_at: "asc",
          },
        },
      },
    });
  },

  findFirstSubmissionByAttemptId(attemptId: string) {
    return prisma.teacher_submissions.findFirst({
      where: {
        attempt_id: attemptId,
      },
      select: {
        id: true,
        skill: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });
  },

  createManyNotifications(
    userIds: string[],
    type: notification_type,
    title: string,
    message: string,
    dataJson?: Prisma.InputJsonValue,
  ) {
    if (userIds.length === 0) {
      return Promise.resolve({
        count: 0,
      });
    }

    const notifications: Prisma.notificationsCreateManyInput[] = userIds.map(
      (userId) => ({
        user_id: userId,
        type,
        title,
        message,

        // Nếu không truyền dataJson thì bỏ qua field data_json.
        // Vì data_json là Json? nên PostgreSQL sẽ lưu SQL NULL.
        ...(dataJson === undefined
          ? {}
          : {
              data_json: dataJson,
            }),
      }),
    );

    return prisma.notifications.createMany({
      data: notifications,
    });
  },
};
