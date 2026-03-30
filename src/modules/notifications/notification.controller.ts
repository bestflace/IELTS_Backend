import { Request, Response } from "express";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { notificationService } from "./notification.service";

export const notificationController = {
  async getMyNotifications(req: Request, res: Response) {
    const result = await notificationService.getMyNotifications(
      String(req.user!.sub),
      req.query as never,
    );

    return sendSuccess(res, {
      message: MESSAGE.NOTIFICATION.LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getUnreadCount(req: Request, res: Response) {
    const result = await notificationService.getUnreadCount(
      String(req.user!.sub),
    );

    return sendSuccess(res, {
      message: MESSAGE.NOTIFICATION.UNREAD_COUNT_SUCCESS,
      data: result,
    });
  },

  async markRead(req: Request, res: Response) {
    const result = await notificationService.markRead(
      String(req.user!.sub),
      String(req.params.id),
    );

    return sendSuccess(res, {
      message: MESSAGE.NOTIFICATION.READ_SUCCESS,
      data: result,
    });
  },

  async markAllRead(req: Request, res: Response) {
    const result = await notificationService.markAllRead(String(req.user!.sub));

    return sendSuccess(res, {
      message: MESSAGE.NOTIFICATION.READ_ALL_SUCCESS,
      data: result,
    });
  },

  async internalTestPublished(req: Request, res: Response) {
    const result = await notificationService.sendTestPublishedNotifications(
      req.body.testId,
    );

    return sendSuccess(res, {
      message: MESSAGE.NOTIFICATION.INTERNAL_TEST_PUBLISHED_SUCCESS,
      data: result,
    });
  },

  async internalSubmissionReviewed(req: Request, res: Response) {
    const result = await notificationService.sendSubmissionReviewedNotification(
      req.body.attemptId,
    );

    return sendSuccess(res, {
      message: MESSAGE.NOTIFICATION.INTERNAL_SUBMISSION_REVIEWED_SUCCESS,
      data: result,
    });
  },
};
