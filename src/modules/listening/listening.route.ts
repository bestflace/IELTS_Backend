import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { listeningController } from "./listening.controller";
import {
  adminListeningSetListQuerySchema,
  createListeningQuestionSchema,
  createListeningSetSchema,
  listeningQuestionIdParamsSchema,
  listeningSetIdParamsSchema,
  publicListeningSetListQuerySchema,
  updateListeningQuestionSchema,
  updateListeningSetSchema,
} from "./listening.validator";

const router = Router();
/**
 * @swagger
 * /listening-sets:
 *   get:
 *     tags: [Listening]
 *     summary: Get published listening sets
 *     description: Returns published listening sets for public users.
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
  "/listening-sets",
  validate({ query: publicListeningSetListQuerySchema }),
  asyncHandler(listeningController.getPublicListeningSets),
);
/**
 * @swagger
 * /listening-sets/{id}:
 *   get:
 *     tags: [Listening]
 *     summary: Get published listening set detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: Listening set not found
 */
router.get(
  "/listening-sets/:id",
  validate({ params: listeningSetIdParamsSchema }),
  asyncHandler(listeningController.getPublicListeningSetDetail),
);
/**
 * @swagger
 * /admin/listening-sets:
 *   get:
 *     tags: [Admin Listening]
 *     summary: Get listening sets for admin
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/admin/listening-sets",
  authenticate,
  authorize("ADMIN"),
  validate({ query: adminListeningSetListQuerySchema }),
  asyncHandler(listeningController.getAdminListeningSets),
);
/**
 * @swagger
 * /admin/listening-sets:
 *   post:
 *     tags: [Admin Listening]
 *     summary: Create listening set
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
 *         description: Listening set created
 *       400:
 *         description: Invalid request body
 */
router.post(
  "/admin/listening-sets",
  authenticate,
  authorize("ADMIN"),
  validate({ body: createListeningSetSchema }),
  asyncHandler(listeningController.createListeningSet),
);
/**
 * @swagger
 * /admin/listening-sets/{id}:
 *   get:
 *     tags: [Admin Listening]
 *     summary: Get listening set detail for admin
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
 *       404:
 *         description: Listening set not found
 */
router.get(
  "/admin/listening-sets/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: listeningSetIdParamsSchema }),
  asyncHandler(listeningController.getAdminListeningSetDetail),
);
/**
 * @swagger
 * /admin/listening-sets/{id}:
 *   patch:
 *     tags: [Admin Listening]
 *     summary: Update listening set
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
 *         description: Listening set updated
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Listening set not found
 */
router.patch(
  "/admin/listening-sets/:id",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: listeningSetIdParamsSchema,
    body: updateListeningSetSchema,
  }),
  asyncHandler(listeningController.updateListeningSet),
);

/**
 * @swagger
 * /admin/listening-sets/{id}:
 *   delete:
 *     tags: [Admin Listening]
 *     summary: Delete listening set
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Listening set deleted
 *       404:
 *         description: Listening set not found
 */
router.delete(
  "/admin/listening-sets/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: listeningSetIdParamsSchema }),
  asyncHandler(listeningController.deleteListeningSet),
);
/**
 * @swagger
 * /admin/listening-sets/{id}/publish:
 *   post:
 *     tags: [Admin Listening]
 *     summary: Publish listening set
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Listening set published
 */
router.post(
  "/admin/listening-sets/:id/publish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: listeningSetIdParamsSchema }),
  asyncHandler(listeningController.publishListeningSet),
);
/**
 * @swagger
 * /admin/listening-sets/{id}/unpublish:
 *   post:
 *     tags: [Admin Listening]
 *     summary: Unpublish listening set
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Listening set unpublished
 */
router.post(
  "/admin/listening-sets/:id/unpublish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: listeningSetIdParamsSchema }),
  asyncHandler(listeningController.unpublishListeningSet),
);
/**
 * @swagger
 * /admin/listening-sets/{id}/questions:
 *   post:
 *     tags: [Admin Listening]
 *     summary: Create listening question
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
 *         description: Listening question created
 */
router.post(
  "/admin/listening-sets/:id/questions",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: listeningSetIdParamsSchema,
    body: createListeningQuestionSchema,
  }),
  asyncHandler(listeningController.createListeningQuestion),
);
/**
 * @swagger
 * /admin/listening-questions/{questionId}:
 *   patch:
 *     tags: [Admin Listening]
 *     summary: Update listening question
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
 *         description: Listening question updated
 */
router.patch(
  "/admin/listening-questions/:questionId",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: listeningQuestionIdParamsSchema,
    body: updateListeningQuestionSchema,
  }),
  asyncHandler(listeningController.updateListeningQuestion),
);
/**
 * @swagger
 * /admin/listening-questions/{questionId}:
 *   delete:
 *     tags: [Admin Listening]
 *     summary: Delete listening question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Listening question deleted
 */
router.delete(
  "/admin/listening-questions/:questionId",
  authenticate,
  authorize("ADMIN"),
  validate({ params: listeningQuestionIdParamsSchema }),
  asyncHandler(listeningController.deleteListeningQuestion),
);

export default router;
