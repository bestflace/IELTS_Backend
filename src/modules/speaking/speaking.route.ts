import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { speakingController } from "./speaking.controller";
import {
  adminSpeakingSetListQuerySchema,
  createSpeakingPartSchema,
  createSpeakingPromptItemSchema,
  createSpeakingPromptSchema,
  createSpeakingSetSchema,
  publicSpeakingSetListQuerySchema,
  speakingPartIdParamsSchema,
  speakingPromptIdParamsSchema,
  speakingPromptItemIdParamsSchema,
  speakingSetIdParamsSchema,
  updateSpeakingPartSchema,
  updateSpeakingPromptItemSchema,
  updateSpeakingPromptSchema,
  updateSpeakingSetSchema,
} from "./speaking.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Speaking
 *     description: Public speaking bank APIs
 *   - name: Admin Speaking
 *     description: Admin speaking management APIs
 */

/**
 * @swagger
 * /speaking-sets:
 *   get:
 *     summary: Get published speaking sets
 *     tags: [Speaking]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: number
 *       - in: query
 *         name: tagIds
 *         schema:
 *           type: string
 *         description: Comma-separated tag ids
 *     responses:
 *       200:
 *         description: Get speaking sets successfully
 */
router.get(
  "/speaking-sets",
  validate({ query: publicSpeakingSetListQuerySchema }),
  asyncHandler(speakingController.getPublicSpeakingSets),
);

/**
 * @swagger
 * /speaking-sets/{id}:
 *   get:
 *     summary: Get published speaking set detail
 *     tags: [Speaking]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get speaking set detail successfully
 */
router.get(
  "/speaking-sets/:id",
  validate({ params: speakingSetIdParamsSchema }),
  asyncHandler(speakingController.getPublicSpeakingSetDetail),
);

/**
 * @swagger
 * /admin/speaking-sets:
 *   get:
 *     summary: Get speaking sets for admin
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get speaking sets successfully
 */
router.get(
  "/admin/speaking-sets",
  authenticate,
  authorize("ADMIN"),
  validate({ query: adminSpeakingSetListQuerySchema }),
  asyncHandler(speakingController.getAdminSpeakingSets),
);

/**
 * @swagger
 * /admin/speaking-sets:
 *   post:
 *     summary: Create speaking set
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Create speaking set successfully
 */
router.post(
  "/admin/speaking-sets",
  authenticate,
  authorize("ADMIN"),
  validate({ body: createSpeakingSetSchema }),
  asyncHandler(speakingController.createSpeakingSet),
);

/**
 * @swagger
 * /admin/speaking-sets/{id}:
 *   get:
 *     summary: Get speaking set detail for admin
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get speaking set successfully
 */
router.get(
  "/admin/speaking-sets/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: speakingSetIdParamsSchema }),
  asyncHandler(speakingController.getAdminSpeakingSetDetail),
);

/**
 * @swagger
 * /admin/speaking-sets/{id}:
 *   patch:
 *     summary: Update speaking set
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Update speaking set successfully
 */
router.patch(
  "/admin/speaking-sets/:id",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: speakingSetIdParamsSchema,
    body: updateSpeakingSetSchema,
  }),
  asyncHandler(speakingController.updateSpeakingSet),
);

/**
 * @swagger
 * /admin/speaking-sets/{id}:
 *   delete:
 *     summary: Delete speaking set
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delete speaking set successfully
 */
router.delete(
  "/admin/speaking-sets/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: speakingSetIdParamsSchema }),
  asyncHandler(speakingController.deleteSpeakingSet),
);

/**
 * @swagger
 * /admin/speaking-sets/{id}/publish:
 *   post:
 *     summary: Publish speaking set
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Publish speaking set successfully
 */
router.post(
  "/admin/speaking-sets/:id/publish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: speakingSetIdParamsSchema }),
  asyncHandler(speakingController.publishSpeakingSet),
);

/**
 * @swagger
 * /admin/speaking-sets/{id}/unpublish:
 *   post:
 *     summary: Unpublish speaking set
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unpublish speaking set successfully
 */
router.post(
  "/admin/speaking-sets/:id/unpublish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: speakingSetIdParamsSchema }),
  asyncHandler(speakingController.unpublishSpeakingSet),
);

/**
 * @swagger
 * /admin/speaking-sets/{id}/parts:
 *   post:
 *     summary: Create speaking part
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Create speaking part successfully
 */
router.post(
  "/admin/speaking-sets/:id/parts",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: speakingSetIdParamsSchema,
    body: createSpeakingPartSchema,
  }),
  asyncHandler(speakingController.createSpeakingPart),
);

/**
 * @swagger
 * /admin/speaking-parts/{partId}:
 *   patch:
 *     summary: Update speaking part
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Update speaking part successfully
 */
router.patch(
  "/admin/speaking-parts/:partId",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: speakingPartIdParamsSchema,
    body: updateSpeakingPartSchema,
  }),
  asyncHandler(speakingController.updateSpeakingPart),
);

/**
 * @swagger
 * /admin/speaking-parts/{partId}:
 *   delete:
 *     summary: Delete speaking part
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delete speaking part successfully
 */
router.delete(
  "/admin/speaking-parts/:partId",
  authenticate,
  authorize("ADMIN"),
  validate({ params: speakingPartIdParamsSchema }),
  asyncHandler(speakingController.deleteSpeakingPart),
);

/**
 * @swagger
 * /admin/speaking-parts/{partId}/prompts:
 *   post:
 *     summary: Create speaking prompt
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Create speaking prompt successfully
 */
router.post(
  "/admin/speaking-parts/:partId/prompts",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: speakingPartIdParamsSchema,
    body: createSpeakingPromptSchema,
  }),
  asyncHandler(speakingController.createSpeakingPrompt),
);

/**
 * @swagger
 * /admin/speaking-prompts/{promptId}:
 *   patch:
 *     summary: Update speaking prompt
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Update speaking prompt successfully
 */
router.patch(
  "/admin/speaking-prompts/:promptId",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: speakingPromptIdParamsSchema,
    body: updateSpeakingPromptSchema,
  }),
  asyncHandler(speakingController.updateSpeakingPrompt),
);

/**
 * @swagger
 * /admin/speaking-prompts/{promptId}:
 *   delete:
 *     summary: Delete speaking prompt
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delete speaking prompt successfully
 */
router.delete(
  "/admin/speaking-prompts/:promptId",
  authenticate,
  authorize("ADMIN"),
  validate({ params: speakingPromptIdParamsSchema }),
  asyncHandler(speakingController.deleteSpeakingPrompt),
);

/**
 * @swagger
 * /admin/speaking-prompts/{promptId}/items:
 *   post:
 *     summary: Create speaking prompt item
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Create speaking prompt item successfully
 */
router.post(
  "/admin/speaking-prompts/:promptId/items",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: speakingPromptIdParamsSchema,
    body: createSpeakingPromptItemSchema,
  }),
  asyncHandler(speakingController.createSpeakingPromptItem),
);

/**
 * @swagger
 * /admin/speaking-prompt-items/{itemId}:
 *   patch:
 *     summary: Update speaking prompt item
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Update speaking prompt item successfully
 */
router.patch(
  "/admin/speaking-prompt-items/:itemId",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: speakingPromptItemIdParamsSchema,
    body: updateSpeakingPromptItemSchema,
  }),
  asyncHandler(speakingController.updateSpeakingPromptItem),
);

/**
 * @swagger
 * /admin/speaking-prompt-items/{itemId}:
 *   delete:
 *     summary: Delete speaking prompt item
 *     tags: [Admin Speaking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delete speaking prompt item successfully
 */
router.delete(
  "/admin/speaking-prompt-items/:itemId",
  authenticate,
  authorize("ADMIN"),
  validate({ params: speakingPromptItemIdParamsSchema }),
  asyncHandler(speakingController.deleteSpeakingPromptItem),
);

export default router;
