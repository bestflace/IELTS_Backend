import { Request, Response } from "express";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { reportService } from "./report.service";

export const reportController = {
  async getMyOverview(req: Request, res: Response) {
    const result = await reportService.getMyOverview(String(req.user!.sub));

    return sendSuccess(res, {
      message: MESSAGE.REPORT.USER_OVERVIEW_SUCCESS,
      data: result,
    });
  },

  async getMySkills(req: Request, res: Response) {
    const result = await reportService.getMySkills(String(req.user!.sub));

    return sendSuccess(res, {
      message: MESSAGE.REPORT.USER_SKILLS_SUCCESS,
      data: result,
    });
  },

  async getMyTimeline(req: Request, res: Response) {
    const result = await reportService.getMyTimeline(
      String(req.user!.sub),
      req.query.from as string | undefined,
      req.query.to as string | undefined,
    );

    return sendSuccess(res, {
      message: MESSAGE.REPORT.USER_TIMELINE_SUCCESS,
      data: result,
    });
  },

  async getTeacherOverview(req: Request, res: Response) {
    const result = await reportService.getTeacherOverview(
      String(req.user!.sub),
    );

    return sendSuccess(res, {
      message: MESSAGE.REPORT.TEACHER_OVERVIEW_SUCCESS,
      data: result,
    });
  },

  async getTeacherPerformance(req: Request, res: Response) {
    const result = await reportService.getTeacherPerformance(
      String(req.user!.sub),
    );

    return sendSuccess(res, {
      message: MESSAGE.REPORT.TEACHER_PERFORMANCE_SUCCESS,
      data: result,
    });
  },

  async getAdminOverview(req: Request, res: Response) {
    const result = await reportService.getAdminOverview();

    return sendSuccess(res, {
      message: MESSAGE.REPORT.ADMIN_OVERVIEW_SUCCESS,
      data: result,
    });
  },

  async getAdminAttempts(req: Request, res: Response) {
    const result = await reportService.getAdminAttempts();

    return sendSuccess(res, {
      message: MESSAGE.REPORT.ADMIN_ATTEMPTS_SUCCESS,
      data: result,
    });
  },

  async getAdminTests(req: Request, res: Response) {
    const result = await reportService.getAdminTests();

    return sendSuccess(res, {
      message: MESSAGE.REPORT.ADMIN_TESTS_SUCCESS,
      data: result,
    });
  },

  async getAdminUsers(req: Request, res: Response) {
    const result = await reportService.getAdminUsers();

    return sendSuccess(res, {
      message: MESSAGE.REPORT.ADMIN_USERS_SUCCESS,
      data: result,
    });
  },

  async getAdminTeacherGrading(req: Request, res: Response) {
    const result = await reportService.getAdminTeacherGrading();

    return sendSuccess(res, {
      message: MESSAGE.REPORT.ADMIN_TEACHER_GRADING_SUCCESS,
      data: result,
    });
  },

  async getAdminBandsDistribution(req: Request, res: Response) {
    const result = await reportService.getAdminBandsDistribution();

    return sendSuccess(res, {
      message: MESSAGE.REPORT.ADMIN_BANDS_SUCCESS,
      data: result,
    });
  },
};
