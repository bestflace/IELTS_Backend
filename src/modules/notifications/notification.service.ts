import { MESSAGE } from "../../common/constants/message.constant";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import { notificationRepository } from "./notification.repository";

function mapNotification(item: any) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    message: item.message,
    dataJson: item.data_json,
    isRead: item.is_read,
    createdAt: item.created_at,
    readAt: item.read_at,
  };
}

export const notificationService = {
  async getMyNotifications(
    userId: string,
    query: { page?: number; limit?: number; unreadOnly?: boolean },
  ) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      notificationRepository.findUserNotifications({
        userId,
        skip: pagination.skip,
        take: pagination.limit,
        unreadOnly: query.unreadOnly,
      }),
      notificationRepository.countUserNotifications({
        userId,
        unreadOnly: query.unreadOnly,
      }),
    ]);

    return {
      items: items.map(mapNotification),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getUnreadCount(userId: string) {
    const count = await notificationRepository.countUnread(userId);
    return { unreadCount: count };
  },

  async markRead(userId: string, notificationId: string) {
    const existing = await notificationRepository.findUserNotificationById(
      notificationId,
      userId,
    );

    if (!existing) {
      throw new NotFoundError(MESSAGE.NOTIFICATION.NOT_FOUND);
    }

    const updated = existing.is_read
      ? existing
      : await notificationRepository.markRead(notificationId);

    return mapNotification(updated);
  },

  async markAllRead(userId: string) {
    await notificationRepository.markAllRead(userId);
    return { success: true };
  },

  async sendTestPublishedNotifications(testId: string) {
    const test = await notificationRepository.findTestById(testId);

    if (!test) {
      throw new NotFoundError(MESSAGE.NOTIFICATION.TEST_NOT_FOUND);
    }

    const users = await notificationRepository.findActiveUsers();

    const result = await notificationRepository.createManyNotifications(
      users.map((user) => user.id),
      "TEST_PUBLISHED",
      "A new test has been published",
      `New test available: ${test.title}`,
      {
        testId: test.id,
        title: test.title,
        type: test.type,
      },
    );

    return {
      success: true,
      sentCount: result.count,
    };
  },

  async sendSubmissionReviewedNotification(attemptId: string) {
    const attempt = await notificationRepository.findAttemptById(attemptId);

    if (!attempt) {
      throw new NotFoundError(MESSAGE.NOTIFICATION.ATTEMPT_NOT_FOUND);
    }

    const result = await notificationRepository.createManyNotifications(
      [attempt.user_id],
      "TEACHER_REVIEW_DONE",
      "Your submission has been reviewed",
      `Your submission for test "${attempt.tests.title}" has been reviewed.`,
      {
        attemptId: attempt.id,
        testId: attempt.test_id,
      },
    );

    return {
      success: true,
      sentCount: result.count,
    };
  },
};
