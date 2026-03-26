import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { readingController } from "./reading.controller";
import {
  adminReadingSetListQuerySchema,
  createReadingQuestionSchema,
  createReadingSetSchema,
  publicReadingSetListQuerySchema,
  readingQuestionIdParamsSchema,
  readingSetIdParamsSchema,
  updateReadingQuestionSchema,
  updateReadingSetSchema,
} from "./reading.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Reading
 *     description: Public reading bank APIs
 *   - name: Admin Reading
 *     description: Admin reading management APIs
 */
/**
 * @swagger
 * /reading-sets:
 *   get:
 *     tags: [Reading]
 *     summary: Get published reading sets
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get(
  "/reading-sets",
  validate({ query: publicReadingSetListQuerySchema }),
  asyncHandler(readingController.getPublicReadingSets),
);
/**
 * @swagger
 * /reading-sets/{id}:
 *   get:
 *     tags: [Reading]
 *     summary: Get published reading set detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: Reading set not found
 */
router.get(
  "/reading-sets/:id",
  validate({ params: readingSetIdParamsSchema }),
  asyncHandler(readingController.getPublicReadingSetDetail),
);
/**
 * @swagger
 * /admin/reading-sets:
 *   get:
 *     tags: [Admin Reading]
 *     summary: Get reading sets for admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get(
  "/admin/reading-sets",
  authenticate,
  authorize("ADMIN"),
  validate({ query: adminReadingSetListQuerySchema }),
  asyncHandler(readingController.getAdminReadingSets),
);
/**
 * @swagger
 * /admin/reading-sets:
 *   post:
 *     tags: [Admin Reading]
 *     summary: Create reading set
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Reading set created
 */
router.post(
  "/admin/reading-sets",
  authenticate,
  authorize("ADMIN"),
  validate({ body: createReadingSetSchema }),
  asyncHandler(readingController.createReadingSet),
);
/**
 * @swagger
 * /admin/reading-sets/{id}:
 *   get:
 *     tags: [Admin Reading]
 *     summary: Get reading set detail for admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get(
  "/admin/reading-sets/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: readingSetIdParamsSchema }),
  asyncHandler(readingController.getAdminReadingSetDetail),
);
/**
 * @swagger
 * /admin/reading-sets/{id}:
 *   patch:
 *     tags: [Admin Reading]
 *     summary: Update reading set
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Reading set updated
 */
router.patch(
  "/admin/reading-sets/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: readingSetIdParamsSchema, body: updateReadingSetSchema }),
  asyncHandler(readingController.updateReadingSet),
);
/**
 * @swagger
 * /admin/reading-sets/{id}:
 *   delete:
 *     tags: [Admin Reading]
 *     summary: Delete reading set
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Reading set deleted
 */
router.delete(
  "/admin/reading-sets/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: readingSetIdParamsSchema }),
  asyncHandler(readingController.deleteReadingSet),
);
/**
 * @swagger
 * /admin/reading-sets/{id}/publish:
 *   post:
 *     tags: [Admin Reading]
 *     summary: Publish reading set
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Reading set published
 */
router.post(
  "/admin/reading-sets/:id/publish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: readingSetIdParamsSchema }),
  asyncHandler(readingController.publishReadingSet),
);
/**
 * @swagger
 * /admin/reading-sets/{id}/questions:
 *   post:
 *     tags: [Admin Reading]
 *     summary: Create reading question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Reading question created
 */
router.post(
  "/admin/reading-sets/:id/unpublish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: readingSetIdParamsSchema }),
  asyncHandler(readingController.unpublishReadingSet),
);
/**
 * @swagger
 * /admin/reading-questions/{questionId}:
 *   patch:
 *     tags: [Admin Reading]
 *     summary: Update reading question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Reading question updated
 */
router.post(
  "/admin/reading-sets/:id/questions",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: readingSetIdParamsSchema,
    body: createReadingQuestionSchema,
  }),
  asyncHandler(readingController.createReadingQuestion),
);
/**
 * @swagger
 * /admin/reading-questions/{questionId}:
 *   patch:
 *     tags: [Admin Reading]
 *     summary: Update reading question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Reading question updated
 */
router.patch(
  "/admin/reading-questions/:questionId",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: readingQuestionIdParamsSchema,
    body: updateReadingQuestionSchema,
  }),
  asyncHandler(readingController.updateReadingQuestion),
);
/**
 * @swagger
 * /admin/reading-questions/{questionId}:
 *   delete:
 *     tags: [Admin Reading]
 *     summary: Delete reading question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Reading question deleted
 */
router.delete(
  "/admin/reading-questions/:questionId",
  authenticate,
  authorize("ADMIN"),
  validate({ params: readingQuestionIdParamsSchema }),
  asyncHandler(readingController.deleteReadingQuestion),
);

export default router;
