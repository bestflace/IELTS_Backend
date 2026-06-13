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
    query: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    },
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

    return {
      unreadCount: count,
    };
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

    return {
      success: true,
    };
  },

  /**
   * Gửi thông báo đề thi mới.
   *
   * Nghiệp vụ:
   * - Chỉ học viên USER đang ACTIVE được nhận.
   * - TEACHER và ADMIN không nhận.
   */
  async sendTestPublishedNotifications(testId: string) {
    const test = await notificationRepository.findTestById(testId);

    if (!test) {
      throw new NotFoundError(MESSAGE.NOTIFICATION.TEST_NOT_FOUND);
    }

    const learners = await notificationRepository.findActiveLearners();

    const result = await notificationRepository.createManyNotifications(
      learners.map((learner) => learner.id),
      "TEST_PUBLISHED",
      "Đề thi mới đã được xuất bản",
      `Đề thi "${test.title}" hiện đã sẵn sàng để luyện tập.`,
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

  /**
   * Gửi thông báo cho học viên sau khi giáo viên chấm bài.
   */
  async sendSubmissionReviewedNotification(attemptId: string) {
    const attempt = await notificationRepository.findAttemptById(attemptId);

    if (!attempt) {
      throw new NotFoundError(MESSAGE.NOTIFICATION.ATTEMPT_NOT_FOUND);
    }

    const result = await notificationRepository.createManyNotifications(
      [attempt.user_id],
      "TEACHER_REVIEW_DONE",
      "Bài làm của bạn đã được giáo viên chấm",
      `Bài làm cho đề "${attempt.tests.title}" đã được giáo viên nhận xét.`,
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
