import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { authController } from "./auth.controller";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyResetCodeSchema,
} from "./auth.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication APIs
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyen Chi Vi
 *               email:
 *                 type: string
 *                 example: abc@gmail.com
 *               password:
 *                 type: string
 *                 example: 12345678
 *               confirmPassword:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       201:
 *         description: Register successfully
 */
router.post(
  "/register",
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: abc@gmail.com
 *               password:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       200:
 *         description: Login successfully
 */
router.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: your_refresh_token
 *     responses:
 *       200:
 *         description: Refresh token successfully
 */
router.post(
  "/refresh",
  validate({ body: refreshSchema }),
  asyncHandler(authController.refresh),
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successfully
 */
router.post("/logout", asyncHandler(authController.logout));

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send reset password code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: abc@gmail.com
 *     responses:
 *       200:
 *         description: Reset password code sent successfully
 */
router.post(
  "/forgot-password",
  validate({ body: forgotPasswordSchema }),
  asyncHandler(authController.forgotPassword),
);

/**
 * @swagger
 * /auth/reset-password/verify-code:
 *   post:
 *     summary: Verify reset password code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 example: abc@gmail.com
 *               code:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Reset code verified successfully
 */
router.post(
  "/reset-password/verify-code",
  validate({ body: verifyResetCodeSchema }),
  asyncHandler(authController.verifyResetPasswordCode),
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: abc@gmail.com
 *               code:
 *                 type: string
 *                 example: 123456
 *               newPassword:
 *                 type: string
 *                 example: newpass123
 *               confirmPassword:
 *                 type: string
 *                 example: newpass123
 *     responses:
 *       200:
 *         description: Reset password successfully
 */
router.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  asyncHandler(authController.resetPassword),
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get current user successfully
 */
router.get("/me", authenticate, asyncHandler(authController.me));

export default router;
