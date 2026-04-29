import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { userController } from "../users/user.controller";
import {
  adminListUsersQuerySchema,
  adminUpdateUserRoleSchema,
  adminUpdateUserSchema,
  adminUpdateUserStatusSchema,
  userIdParamsSchema,
} from "../users/user.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Admin Users
 *     description: Admin user management APIs
 */

router.use(authenticate);
router.use(authorize("ADMIN"));

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get users for admin
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: chi vi
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, TEACHER, ADMIN]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, BLOCKED, PENDING]
 *     responses:
 *       200:
 *         description: Get users successfully
 */
router.get(
  "/",
  validate({ query: adminListUsersQuerySchema }),
  asyncHandler(userController.adminListUsers),
);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user detail for admin
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Get user successfully
 */
router.get(
  "/:id",
  validate({ params: userIdParamsSchema }),
  asyncHandler(userController.adminGetUserById),
);

/**
 * @swagger
 * /admin/users/{id}:
 *   patch:
 *     summary: Update user for admin
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyen Chi Vi
 *               role:
 *                 type: string
 *                 enum: [USER, TEACHER, ADMIN]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, BLOCKED, PENDING]
 *     responses:
 *       200:
 *         description: Update user successfully
 */
router.patch(
  "/:id",
  validate({ params: userIdParamsSchema, body: adminUpdateUserSchema }),
  asyncHandler(userController.adminUpdateUser),
);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update user role for admin
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, TEACHER, ADMIN]
 *     responses:
 *       200:
 *         description: Update user role successfully
 */
router.patch(
  "/:id/role",
  validate({ params: userIdParamsSchema, body: adminUpdateUserRoleSchema }),
  asyncHandler(userController.adminUpdateUserRole),
);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Update user status for admin
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, BLOCKED, PENDING]
 *     responses:
 *       200:
 *         description: Update user status successfully
 */
router.patch(
  "/:id/status",
  validate({ params: userIdParamsSchema, body: adminUpdateUserStatusSchema }),
  asyncHandler(userController.adminUpdateUserStatus),
);

export default router;
