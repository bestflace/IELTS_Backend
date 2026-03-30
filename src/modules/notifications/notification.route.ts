import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { notificationController } from "./notification.controller";
import {
  internalSubmissionReviewedSchema,
  internalTestPublishedSchema,
  notificationIdParamsSchema,
  notificationListQuerySchema,
} from "./notification.validator";

const router = Router();

router.get(
  "/notifications",
  authenticate,
  validate({ query: notificationListQuerySchema }),
  asyncHandler(notificationController.getMyNotifications),
);

router.get(
  "/notifications/unread-count",
  authenticate,
  asyncHandler(notificationController.getUnreadCount),
);

router.post(
  "/notifications/:id/read",
  authenticate,
  validate({ params: notificationIdParamsSchema }),
  asyncHandler(notificationController.markRead),
);

router.post(
  "/notifications/read-all",
  authenticate,
  asyncHandler(notificationController.markAllRead),
);

router.post(
  "/internal/notifications/test-published",
  authenticate,
  authorize("ADMIN"),
  validate({ body: internalTestPublishedSchema }),
  asyncHandler(notificationController.internalTestPublished),
);

router.post(
  "/internal/notifications/submission-reviewed",
  authenticate,
  authorize("ADMIN"),
  validate({ body: internalSubmissionReviewedSchema }),
  asyncHandler(notificationController.internalSubmissionReviewed),
);

export default router;
