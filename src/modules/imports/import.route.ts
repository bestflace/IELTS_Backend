import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { validate } from "../../common/middlewares/validate.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { importController } from "./import.controller";
import {
  createImportSchema,
  importIdParamsSchema,
  importListQuerySchema,
} from "./import.validator";

const router = Router();

router.post(
  "/admin/imports",
  authenticate,
  authorize("ADMIN"),
  validate({ body: createImportSchema }),
  asyncHandler(importController.createImportJob),
);

router.get(
  "/admin/imports",
  authenticate,
  authorize("ADMIN"),
  validate({ query: importListQuerySchema }),
  asyncHandler(importController.getImportJobs),
);

router.get(
  "/admin/imports/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: importIdParamsSchema }),
  asyncHandler(importController.getImportJobById),
);

router.get(
  "/admin/imports/:id/errors",
  authenticate,
  authorize("ADMIN"),
  validate({ params: importIdParamsSchema }),
  asyncHandler(importController.getImportErrors),
);

router.post(
  "/admin/imports/:id/retry",
  authenticate,
  authorize("ADMIN"),
  validate({ params: importIdParamsSchema }),
  asyncHandler(importController.retryImportJob),
);
router.delete(
  "/admin/imports/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: importIdParamsSchema }),
  asyncHandler(importController.deleteImportJob),
);
export default router;
