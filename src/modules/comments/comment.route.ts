import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { commentController } from "./comment.controller";
import {
  attemptIdParamsSchema,
  commentIdParamsSchema,
  createCommentSchema,
  updateCommentSchema,
} from "./comment.validator";

const router = Router();

router.get(
  "/attempts/:id/comments",
  authenticate,
  validate({ params: attemptIdParamsSchema }),
  asyncHandler(commentController.getAttemptComments),
);

router.post(
  "/attempts/:id/comments",
  authenticate,
  validate({ params: attemptIdParamsSchema, body: createCommentSchema }),
  asyncHandler(commentController.createComment),
);

router.patch(
  "/comments/:commentId",
  authenticate,
  validate({ params: commentIdParamsSchema, body: updateCommentSchema }),
  asyncHandler(commentController.updateComment),
);

router.delete(
  "/comments/:commentId",
  authenticate,
  validate({ params: commentIdParamsSchema }),
  asyncHandler(commentController.deleteComment),
);

router.post(
  "/admin/comments/:commentId/hide",
  authenticate,
  authorize("ADMIN"),
  validate({ params: commentIdParamsSchema }),
  asyncHandler(commentController.hideComment),
);

router.post(
  "/admin/comments/:commentId/unhide",
  authenticate,
  authorize("ADMIN"),
  validate({ params: commentIdParamsSchema }),
  asyncHandler(commentController.unhideComment),
);

export default router;
