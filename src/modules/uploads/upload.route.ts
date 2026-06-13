import { Router } from "express";
import multer from "multer";

import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { uploadController } from "./upload.controller";
import {
  cloudinaryUploadSchema,
  completeUploadSchema,
  deleteUploadSchema,
  presignUploadSchema,
  uploadIdParamsSchema,
  uploadListQuerySchema,
} from "./upload.validator";

const router = Router();

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

/**
 * @swagger
 * tags:
 *   - name: Uploads
 *     description: Upload and media APIs
 */

router.get(
  "/admin/uploads",
  authenticate,
  authorize("ADMIN"),
  validate({ query: uploadListQuerySchema }),
  asyncHandler(uploadController.getUploads),
);

router.get(
  "/admin/uploads/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: uploadIdParamsSchema }),
  asyncHandler(uploadController.getUploadById),
);

router.post(
  "/uploads/presign",
  authenticate,
  validate({ body: presignUploadSchema }),
  asyncHandler(uploadController.createPresignedUpload),
);

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

router.delete(
  "/uploads",
  authenticate,
  validate({ body: deleteUploadSchema }),
  asyncHandler(uploadController.deleteUpload),
);

export default router;
