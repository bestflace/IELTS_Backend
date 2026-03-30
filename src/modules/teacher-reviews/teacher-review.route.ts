import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { teacherReviewController } from "./teacher-review.controller";
import {
  speakingReviewSchema,
  teacherSubmissionIdParamsSchema,
  teacherSubmissionListQuerySchema,
  writingReviewSchema,
} from "./teacher-review.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Teacher Reviews
 *     description: Teacher grading queue APIs
 */

router.get(
  "/teacher/submissions",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validate({ query: teacherSubmissionListQuerySchema }),
  asyncHandler(teacherReviewController.getTeacherSubmissions),
);

router.get(
  "/teacher/submissions/:id",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validate({ params: teacherSubmissionIdParamsSchema }),
  asyncHandler(teacherReviewController.getTeacherSubmissionDetail),
);

router.post(
  "/teacher/submissions/:id/claim",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validate({ params: teacherSubmissionIdParamsSchema }),
  asyncHandler(teacherReviewController.claimSubmission),
);

router.post(
  "/teacher/submissions/:id/release",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validate({ params: teacherSubmissionIdParamsSchema }),
  asyncHandler(teacherReviewController.releaseSubmission),
);

router.post(
  "/teacher/submissions/:id/writing-review",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validate({
    params: teacherSubmissionIdParamsSchema,
    body: writingReviewSchema,
  }),
  asyncHandler(teacherReviewController.submitWritingReview),
);

router.post(
  "/teacher/submissions/:id/speaking-review",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  validate({
    params: teacherSubmissionIdParamsSchema,
    body: speakingReviewSchema,
  }),
  asyncHandler(teacherReviewController.submitSpeakingReview),
);

router.get(
  "/teacher/dashboard",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(teacherReviewController.getTeacherDashboard),
);

export default router;
