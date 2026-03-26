import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { systemConfigController } from "./system-config.controller";
import { patchSystemConfigSchema } from "./system-config.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: System Config
 *     description: System configuration APIs
 */

/**
 * @swagger
 * /system-config/public:
 *   get:
 *     summary: Get public system config
 *     tags: [System Config]
 *     responses:
 *       200:
 *         description: Get public system config successfully
 */
router.get(
  "/system-config/public",
  asyncHandler(systemConfigController.getPublicConfig),
);

/**
 * @swagger
 * /admin/system-config:
 *   get:
 *     summary: Get system config for admin
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get system config successfully
 */
router.get(
  "/admin/system-config",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(systemConfigController.getAdminConfig),
);

/**
 * @swagger
 * /admin/system-config:
 *   patch:
 *     summary: Update system config
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               readingDefaultSec:
 *                 type: integer
 *                 example: 3600
 *               listeningDefaultSec:
 *                 type: integer
 *                 example: 1800
 *               writingDefaultSec:
 *                 type: integer
 *                 example: 3600
 *               speakingDefaultSec:
 *                 type: integer
 *                 example: 900
 *               fullTestDefaultSec:
 *                 type: integer
 *                 example: 9900
 *               readingCustomMinSec:
 *                 type: integer
 *                 example: 600
 *               readingCustomMaxSec:
 *                 type: integer
 *                 example: 5400
 *               featureFlags:
 *                 type: object
 *                 properties:
 *                   enableBlog:
 *                     type: boolean
 *                   enableTeacherReview:
 *                     type: boolean
 *                   enableWritingAI:
 *                     type: boolean
 *                   enableSpeakingASR:
 *                     type: boolean
 *                   enableSpeakingAI:
 *                     type: boolean
 *                   enableImports:
 *                     type: boolean
 *                   enableNotifications:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Update system config successfully
 */
router.patch(
  "/admin/system-config",
  authenticate,
  authorize("ADMIN"),
  validate({ body: patchSystemConfigSchema }),
  asyncHandler(systemConfigController.updateConfig),
);

export default router;
