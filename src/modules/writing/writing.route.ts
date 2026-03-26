import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { writingController } from "./writing.controller";
import {
  adminWritingTaskListQuerySchema,
  createWritingTaskSchema,
  publicWritingTaskListQuerySchema,
  updateWritingTaskSchema,
  writingTaskIdParamsSchema,
} from "./writing.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Writing
 *     description: Public writing bank APIs
 *   - name: Admin Writing
 *     description: Admin writing management APIs
 */
/**
 * @swagger
 * /writing-tasks:
 *   get:
 *     tags: [Writing]
 *     summary: Get published writing tasks
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
  "/writing-tasks",
  validate({ query: publicWritingTaskListQuerySchema }),
  asyncHandler(writingController.getPublicWritingTasks),
);
/**
 * @swagger
 * /writing-tasks/{id}:
 *   get:
 *     tags: [Writing]
 *     summary: Get published writing task detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: Writing task not found
 */
router.get(
  "/writing-tasks/:id",
  validate({ params: writingTaskIdParamsSchema }),
  asyncHandler(writingController.getPublicWritingTaskDetail),
);
/**
 * @swagger
 * /admin/writing-tasks:
 *   get:
 *     tags: [Admin Writing]
 *     summary: Get writing tasks for admin
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
  "/admin/writing-tasks",
  authenticate,
  authorize("ADMIN"),
  validate({ query: adminWritingTaskListQuerySchema }),
  asyncHandler(writingController.getAdminWritingTasks),
);
/**
 * @swagger
 * /admin/writing-tasks:
 *   post:
 *     tags: [Admin Writing]
 *     summary: Create writing task
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
 *         description: Writing task created
 */
router.post(
  "/admin/writing-tasks",
  authenticate,
  authorize("ADMIN"),
  validate({ body: createWritingTaskSchema }),
  asyncHandler(writingController.createWritingTask),
);
/**
 * @swagger
 * /admin/writing-tasks/{id}:
 *   get:
 *     tags: [Admin Writing]
 *     summary: Get writing task detail for admin
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
  "/admin/writing-tasks/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: writingTaskIdParamsSchema }),
  asyncHandler(writingController.getAdminWritingTaskDetail),
);
/**
 * @swagger
 * /admin/writing-tasks/{id}:
 *   patch:
 *     tags: [Admin Writing]
 *     summary: Update writing task
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
 *         description: Writing task updated
 */
router.patch(
  "/admin/writing-tasks/:id",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: writingTaskIdParamsSchema,
    body: updateWritingTaskSchema,
  }),
  asyncHandler(writingController.updateWritingTask),
);
/**
 * @swagger
 * /admin/writing-tasks/{id}:
 *   delete:
 *     tags: [Admin Writing]
 *     summary: Delete writing task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Writing task deleted
 */
router.delete(
  "/admin/writing-tasks/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: writingTaskIdParamsSchema }),
  asyncHandler(writingController.deleteWritingTask),
);
/**
 * @swagger
 * /admin/writing-tasks/{id}/publish:
 *   post:
 *     tags: [Admin Writing]
 *     summary: Publish writing task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Writing task published
 */
router.post(
  "/admin/writing-tasks/:id/publish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: writingTaskIdParamsSchema }),
  asyncHandler(writingController.publishWritingTask),
);
/**
 * @swagger
 * /admin/writing-tasks/{id}/unpublish:
 *   post:
 *     tags: [Admin Writing]
 *     summary: Unpublish writing task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Writing task unpublished
 */
router.post(
  "/admin/writing-tasks/:id/unpublish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: writingTaskIdParamsSchema }),
  asyncHandler(writingController.unpublishWritingTask),
);

export default router;
