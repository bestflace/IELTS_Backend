import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { tagController } from "./tag.controller";
import {
  createTagSchema,
  deleteTagParamsSchema,
  listTagsQuerySchema,
  updateTagParamsSchema,
  updateTagSchema,
} from "./tag.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Tags
 *     description: Tag APIs
 */

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Get tags
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by tag name or slug
 *     responses:
 *       200:
 *         description: Get tags successfully
 */
router.get(
  "/tags",
  validate({ query: listTagsQuerySchema }),
  asyncHandler(tagController.getTags),
);

/**
 * @swagger
 * /admin/tags:
 *   post:
 *     summary: Create tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Writing Task 2
 *               slug:
 *                 type: string
 *                 example: writing-task-2
 *     responses:
 *       201:
 *         description: Create tag successfully
 */
router.post(
  "/admin/tags",
  authenticate,
  authorize("ADMIN"),
  validate({ body: createTagSchema }),
  asyncHandler(tagController.createTag),
);

/**
 * @swagger
 * /admin/tags/{id}:
 *   patch:
 *     summary: Update tag
 *     tags: [Tags]
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
 *               name:
 *                 type: string
 *                 example: Speaking Part 1
 *               slug:
 *                 type: string
 *                 example: speaking-part-1
 *     responses:
 *       200:
 *         description: Update tag successfully
 */
router.patch(
  "/admin/tags/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: updateTagParamsSchema, body: updateTagSchema }),
  asyncHandler(tagController.updateTag),
);

/**
 * @swagger
 * /admin/tags/{id}:
 *   delete:
 *     summary: Delete tag
 *     tags: [Tags]
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
 *         description: Delete tag successfully
 */
router.delete(
  "/admin/tags/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: deleteTagParamsSchema }),
  asyncHandler(tagController.deleteTag),
);

export default router;
