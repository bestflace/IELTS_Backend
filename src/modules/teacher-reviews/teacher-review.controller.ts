import { Request, Response } from "express";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { teacherReviewService } from "./teacher-review.service";

export const teacherReviewController = {
  async getTeacherSubmissions(req: Request, res: Response) {
    const result = await teacherReviewService.getTeacherSubmissions(
      String(req.user!.sub),
      req.query as never,
    );

    return sendSuccess(res, {
      message: MESSAGE.TEACHER_REVIEW.LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getTeacherSubmissionDetail(req: Request, res: Response) {
    const result = await teacherReviewService.getTeacherSubmissionDetail(
      String(req.params.id),
    );

    return sendSuccess(res, {
      message: MESSAGE.TEACHER_REVIEW.DETAIL_SUCCESS,
      data: result,
    });
  },

  async claimSubmission(req: Request, res: Response) {
    const result = await teacherReviewService.claimSubmission(
      String(req.user!.sub),
      String(req.params.id),
    );

    return sendSuccess(res, {
      message: MESSAGE.TEACHER_REVIEW.CLAIM_SUCCESS,
      data: result,
    });
  },

  async releaseSubmission(req: Request, res: Response) {
    const result = await teacherReviewService.releaseSubmission(
      String(req.user!.sub),
      String(req.params.id),
    );

    return sendSuccess(res, {
      message: MESSAGE.TEACHER_REVIEW.RELEASE_SUCCESS,
      data: result,
    });
  },

  async submitWritingReview(req: Request, res: Response) {
    const result = await teacherReviewService.submitWritingReview(
      String(req.user!.sub),
      String(req.params.id),
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.TEACHER_REVIEW.WRITING_REVIEW_SUCCESS,
      data: result,
    });
  },

  async submitSpeakingReview(req: Request, res: Response) {
    const result = await teacherReviewService.submitSpeakingReview(
      String(req.user!.sub),
      String(req.params.id),
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.TEACHER_REVIEW.SPEAKING_REVIEW_SUCCESS,
      data: result,
    });
  },

  async getTeacherDashboard(req: Request, res: Response) {
    const result = await teacherReviewService.getTeacherDashboard(
      String(req.user!.sub),
    );

    return sendSuccess(res, {
      message: MESSAGE.TEACHER_REVIEW.DASHBOARD_SUCCESS,
      data: result,
    });
  },
};
