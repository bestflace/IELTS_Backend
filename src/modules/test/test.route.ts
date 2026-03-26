import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { testController } from "./test.controller";
import {
  addTestSectionSchema,
  adminTestListQuerySchema,
  createTestSchema,
  publicTestListQuerySchema,
  randomBuildSchema,
  replaceSectionsSchema,
  testIdParamsSchema,
  testSectionIdParamsSchema,
  updateTestSchema,
  updateTestSectionSchema,
} from "./test.validator";

const router = Router();

/**
 * @swagger
 * /tests:
 *   get:
 *     tags: [Tests]
 *     summary: Get published tests
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
  "/tests",
  validate({ query: publicTestListQuerySchema }),
  asyncHandler(testController.getPublicTests),
);
/**
 * @swagger
 * /tests/{id}:
 *   get:
 *     tags: [Tests]
 *     summary: Get published test detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: Test not found
 */
router.get(
  "/tests/:id",
  validate({ params: testIdParamsSchema }),
  asyncHandler(testController.getPublicTestDetail),
);
/**
 * @swagger
 * /admin/tests:
 *   get:
 *     tags: [Admin Tests]
 *     summary: Get tests for admin
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
  "/admin/tests",
  authenticate,
  authorize("ADMIN"),
  validate({ query: adminTestListQuerySchema }),
  asyncHandler(testController.getAdminTests),
);
/**
 * @swagger
 * /admin/tests:
 *   post:
 *     tags: [Admin Tests]
 *     summary: Create test
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
 *         description: Test created
 */
router.post(
  "/admin/tests",
  authenticate,
  authorize("ADMIN"),
  validate({ body: createTestSchema }),
  asyncHandler(testController.createTest),
);
/**
 * @swagger
 * /admin/tests/{id}:
 *   get:
 *     tags: [Admin Tests]
 *     summary: Get test detail for admin
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
  "/admin/tests/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: testIdParamsSchema }),
  asyncHandler(testController.getAdminTestDetail),
);
/**
 * @swagger
 * /admin/tests/{id}:
 *   patch:
 *     tags: [Admin Tests]
 *     summary: Update test
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
 *         description: Test updated
 */
router.patch(
  "/admin/tests/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: testIdParamsSchema, body: updateTestSchema }),
  asyncHandler(testController.updateTest),
);
/**
 * @swagger
 * /admin/tests/{id}:
 *   delete:
 *     tags: [Admin Tests]
 *     summary: Delete test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Test deleted
 */
router.delete(
  "/admin/tests/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: testIdParamsSchema }),
  asyncHandler(testController.deleteTest),
);
/**
 * @swagger
 * /admin/tests/{id}/sections:
 *   put:
 *     tags: [Admin Tests]
 *     summary: Replace test sections
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
 *         description: Test sections replaced
 */
router.put(
  "/admin/tests/:id/sections",
  authenticate,
  authorize("ADMIN"),
  validate({ params: testIdParamsSchema, body: replaceSectionsSchema }),
  asyncHandler(testController.replaceSections),
);
/**
 * @swagger
 * /admin/tests/{id}/sections:
 *   post:
 *     tags: [Admin Tests]
 *     summary: Add section to test
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
 *         description: Section added
 */
router.post(
  "/admin/tests/:id/sections",
  authenticate,
  authorize("ADMIN"),
  validate({ params: testIdParamsSchema, body: addTestSectionSchema }),
  asyncHandler(testController.addSection),
);
/**
 * @swagger
 * /admin/test-sections/{sectionId}:
 *   patch:
 *     tags: [Admin Tests]
 *     summary: Update test section
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
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
 *         description: Section updated
 */
router.patch(
  "/admin/test-sections/:sectionId",
  authenticate,
  authorize("ADMIN"),
  validate({
    params: testSectionIdParamsSchema,
    body: updateTestSectionSchema,
  }),
  asyncHandler(testController.updateSection),
);
/**
 * @swagger
 * /admin/test-sections/{sectionId}:
 *   delete:
 *     tags: [Admin Tests]
 *     summary: Delete test section
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Section deleted
 */
router.delete(
  "/admin/test-sections/:sectionId",
  authenticate,
  authorize("ADMIN"),
  validate({ params: testSectionIdParamsSchema }),
  asyncHandler(testController.deleteSection),
);
/**
 * @swagger
 * /admin/tests/{id}/publish:
 *   post:
 *     tags: [Admin Tests]
 *     summary: Publish test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Test published
 */
router.post(
  "/admin/tests/:id/publish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: testIdParamsSchema }),
  asyncHandler(testController.publishTest),
);
/**
 * @swagger
 * /admin/tests/{id}/unpublish:
 *   post:
 *     tags: [Admin Tests]
 *     summary: Unpublish test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Test unpublished
 */
router.post(
  "/admin/tests/:id/unpublish",
  authenticate,
  authorize("ADMIN"),
  validate({ params: testIdParamsSchema }),
  asyncHandler(testController.unpublishTest),
);
/**
 * @swagger
 * /admin/tests/preview-build:
 *   post:
 *     tags: [Admin Tests]
 *     summary: Preview random test build
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Preview generated
 */
router.post(
  "/admin/tests/preview-build",
  authenticate,
  authorize("ADMIN"),
  validate({ body: randomBuildSchema }),
  asyncHandler(testController.previewBuild),
);
/**
 * @swagger
 * /admin/tests/random-build:
 *   post:
 *     tags: [Admin Tests]
 *     summary: Create random test build
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Random build generated
 */
router.post(
  "/admin/tests/random-build",
  authenticate,
  authorize("ADMIN"),
  validate({ body: randomBuildSchema }),
  asyncHandler(testController.randomBuild),
);
/**
 * @swagger
 * /admin/test-sections/{sectionId}/reroll:
 *   post:
 *     tags: [Admin Tests]
 *     summary: Reroll test section
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Section rerolled
 */
router.post(
  "/admin/test-sections/:sectionId/reroll",
  authenticate,
  authorize("ADMIN"),
  validate({ params: testSectionIdParamsSchema }),
  asyncHandler(testController.rerollSection),
);

export default router;
