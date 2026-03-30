import { Router } from "express";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { authorize } from "../../common/middlewares/role.middleware";
import { asyncHandler } from "../../common/utils/async-handler";
import { reportController } from "./report.controller";

const router = Router();

router.get(
  "/reports/me/overview",
  authenticate,
  asyncHandler(reportController.getMyOverview),
);

router.get(
  "/reports/me/skills",
  authenticate,
  asyncHandler(reportController.getMySkills),
);

router.get(
  "/reports/me/timeline",
  authenticate,
  asyncHandler(reportController.getMyTimeline),
);

router.get(
  "/reports/teacher/overview",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(reportController.getTeacherOverview),
);

router.get(
  "/reports/teacher/performance",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  asyncHandler(reportController.getTeacherPerformance),
);

router.get(
  "/admin/reports/overview",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(reportController.getAdminOverview),
);

router.get(
  "/admin/reports/attempts",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(reportController.getAdminAttempts),
);

router.get(
  "/admin/reports/tests",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(reportController.getAdminTests),
);

router.get(
  "/admin/reports/users",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(reportController.getAdminUsers),
);

router.get(
  "/admin/reports/teacher-grading",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(reportController.getAdminTeacherGrading),
);

router.get(
  "/admin/reports/bands-distribution",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(reportController.getAdminBandsDistribution),
);

export default router;
