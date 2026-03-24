import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { userController } from "./user.controller";
import { changePasswordSchema, updateProfileSchema } from "./user.validator";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User profile APIs
 */

/**
 * @swagger
 * /users/me/profile:
 *   get:
 *     summary: Get my profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get profile successfully
 */
router.get("/me/profile", asyncHandler(userController.getMyProfile));

/**
 * @swagger
 * /users/me/profile:
 *   patch:
 *     summary: Update my profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: New Name
 *               avatarUrl:
 *                 type: string
 *                 example: https://example.com/avatar.png
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch(
  "/me/profile",
  validate({ body: updateProfileSchema }),
  asyncHandler(userController.updateMyProfile),
);

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     summary: Change my password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: 12345678
 *               newPassword:
 *                 type: string
 *                 example: newpass123
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.patch(
  "/me/password",
  validate({ body: changePasswordSchema }),
  asyncHandler(userController.changeMyPassword),
);

export default router;
