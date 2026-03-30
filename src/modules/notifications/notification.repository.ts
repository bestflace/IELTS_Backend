import { notification_type } from "@prisma/client";
import { prisma } from "../../config/prisma";

export const notificationRepository = {
  findUserNotifications(params: {
    userId: string;
    skip: number;
    take: number;
    unreadOnly?: boolean;
  }) {
    return prisma.notifications.findMany({
      where: {
        user_id: params.userId,
        ...(params.unreadOnly ? { is_read: false } : {}),
      },
      orderBy: {
        created_at: "desc",
      },
      skip: params.skip,
      take: params.take,
    });
  },

  countUserNotifications(params: { userId: string; unreadOnly?: boolean }) {
    return prisma.notifications.count({
      where: {
        user_id: params.userId,
        ...(params.unreadOnly ? { is_read: false } : {}),
      },
    });
  },

  countUnread(userId: string) {
    return prisma.notifications.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  },

  findUserNotificationById(notificationId: string, userId: string) {
    return prisma.notifications.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });
  },

  markRead(notificationId: string) {
    return prisma.notifications.update({
      where: { id: notificationId },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  },

  markAllRead(userId: string) {
    return prisma.notifications.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  },

  findActiveUsers() {
    return prisma.users.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
  },

  findTestById(testId: string) {
    return prisma.tests.findUnique({
      where: { id: testId },
    });
  },

  findAttemptById(attemptId: string) {
    return prisma.attempts.findUnique({
      where: { id: attemptId },
      include: {
        users: true,
        tests: true,
      },
    });
  },

  createManyNotifications(
    userIds: string[],
    type: notification_type,
    title: string,
    message: string,
    dataJson?: unknown,
  ) {
    if (userIds.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return prisma.notifications.createMany({
      data: userIds.map((userId) => ({
        user_id: userId,
        type,
        title,
        message,
        data_json: (dataJson ?? null) as any,
      })),
    });
  },
};
