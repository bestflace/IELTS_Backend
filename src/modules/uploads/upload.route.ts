import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { uploadController } from "./upload.controller";
import {
  cloudinaryUploadSchema,
  completeUploadSchema,
  deleteUploadSchema,
  presignUploadSchema,
} from "./upload.validator";
import multer from "multer";

const router = Router();
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});
/**
 * @swagger
 * tags:
 *   - name: Uploads
 *     description: Upload and media APIs
 */

/**
 * @swagger
 * /uploads/presign:
 *   post:
 *     summary: Create presigned upload URL
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Create upload presigned URL successfully
 */
router.post(
  "/uploads/presign",
  authenticate,
  validate({ body: presignUploadSchema }),
  asyncHandler(uploadController.createPresignedUpload),
);

/**
 * @swagger
 * /uploads/complete:
 *   post:
 *     summary: Complete upload and verify object existence
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete upload successfully
 */
router.post(
  "/uploads/complete",
  authenticate,
  validate({ body: completeUploadSchema }),
  asyncHandler(uploadController.completeUpload),
);

router.post(
  "/uploads/cloudinary",
  authenticate,
  memoryUpload.single("file"),
  validate({ body: cloudinaryUploadSchema }),
  asyncHandler(uploadController.uploadCloudinary),
);
/**
 * @swagger
 * /uploads:
 *   delete:
 *     summary: Delete uploaded file
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delete uploaded file successfully
 */
router.delete(
  "/uploads",
  authenticate,
  validate({ body: deleteUploadSchema }),
  asyncHandler(uploadController.deleteUpload),
);

export default router;
