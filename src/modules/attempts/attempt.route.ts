import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { attemptController } from "./attempt.controller";
import { gradingStatusParamsSchema } from "./attempt.validator";
import {
  attemptIdParamsSchema,
  attemptListQuerySchema,
  createAttemptSchema,
  patchQuestionAnswerSchema,
  patchSpeakingResponseSchema,
  questionIdParamsSchema,
  saveQuestionAnswersSchema,
  saveSpeakingResponsesSchema,
  saveWritingResponsesSchema,
  speakingPartParamsSchema,
  submitAttemptSchema,
} from "./attempt.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Attempts
 *     description: Attempt APIs
 */

router.post(
  "/attempts",
  authenticate,
  validate({ body: createAttemptSchema }),
  asyncHandler(attemptController.createAttempt),
);

router.get(
  "/attempts",
  authenticate,
  validate({ query: attemptListQuerySchema }),
  asyncHandler(attemptController.getAttempts),
);

router.get(
  "/attempts/:id",
  authenticate,
  validate({ params: attemptIdParamsSchema }),
  asyncHandler(attemptController.getAttemptDetail),
);

router.get(
  "/attempts/:id/session",
  authenticate,
  validate({ params: attemptIdParamsSchema }),
  asyncHandler(attemptController.getAttemptSession),
);

router.put(
  "/attempts/:id/question-answers",
  authenticate,
  validate({ params: attemptIdParamsSchema, body: saveQuestionAnswersSchema }),
  asyncHandler(attemptController.saveQuestionAnswers),
);

router.patch(
  "/attempts/:id/question-answers/:questionId",
  authenticate,
  validate({ params: questionIdParamsSchema, body: patchQuestionAnswerSchema }),
  asyncHandler(attemptController.patchQuestionAnswer),
);

router.put(
  "/attempts/:id/writing-responses",
  authenticate,
  validate({ params: attemptIdParamsSchema, body: saveWritingResponsesSchema }),
  asyncHandler(attemptController.saveWritingResponses),
);

router.put(
  "/attempts/:id/speaking-responses",
  authenticate,
  validate({
    params: attemptIdParamsSchema,
    body: saveSpeakingResponsesSchema,
  }),
  asyncHandler(attemptController.saveSpeakingResponses),
);

router.patch(
  "/attempts/:id/speaking-responses/:speakingPart",
  authenticate,
  validate({
    params: speakingPartParamsSchema,
    body: patchSpeakingResponseSchema,
  }),
  asyncHandler(attemptController.patchSpeakingResponse),
);

router.post(
  "/attempts/:id/submit",
  authenticate,
  validate({ params: attemptIdParamsSchema, body: submitAttemptSchema }),
  asyncHandler(attemptController.submitAttempt),
);

router.get(
  "/attempts/:id/result",
  authenticate,
  validate({ params: attemptIdParamsSchema }),
  asyncHandler(attemptController.getAttemptResult),
);

router.get(
  "/attempts/:id/review",
  authenticate,
  validate({ params: attemptIdParamsSchema }),
  asyncHandler(attemptController.getAttemptReview),
);

router.post(
  "/attempts/:id/expire",
  authenticate,
  authorize("ADMIN"),
  validate({ params: attemptIdParamsSchema }),
  asyncHandler(attemptController.expireAttempt),
);
router.get(
  "/attempts/:id/grading-status",
  authenticate,
  validate({ params: gradingStatusParamsSchema }),
  asyncHandler(attemptController.getAttemptGradingStatus),
);
export default router;
