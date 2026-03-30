import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { attemptService } from "./attempt.service";

export const attemptController = {
  async createAttempt(req: Request, res: Response) {
    const result = await attemptService.createAttempt(
      String(req.user!.sub),
      req.body,
    );

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.ATTEMPT.CREATE_SUCCESS,
      data: result,
    });
  },

  async getAttempts(req: Request, res: Response) {
    const result = await attemptService.getAttempts(
      String(req.user!.sub),
      req.query as never,
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getAttemptDetail(req: Request, res: Response) {
    const result = await attemptService.getAttemptDetail(
      String(req.user!.sub),
      String(req.params.id),
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.DETAIL_SUCCESS,
      data: result,
    });
  },

  async getAttemptSession(req: Request, res: Response) {
    const result = await attemptService.getAttemptSession(
      String(req.user!.sub),
      String(req.params.id),
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.SESSION_SUCCESS,
      data: result,
    });
  },

  async saveQuestionAnswers(req: Request, res: Response) {
    const result = await attemptService.saveQuestionAnswers(
      String(req.user!.sub),
      String(req.params.id),
      req.body.answers,
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.QUESTION_ANSWERS_SAVED,
      data: result,
    });
  },

  async patchQuestionAnswer(req: Request, res: Response) {
    const result = await attemptService.patchQuestionAnswer(
      String(req.user!.sub),
      String(req.params.id),
      String(req.params.questionId),
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.QUESTION_ANSWER_UPDATED,
      data: result,
    });
  },

  async saveWritingResponses(req: Request, res: Response) {
    const result = await attemptService.saveWritingResponses(
      String(req.user!.sub),
      String(req.params.id),
      req.body.responses,
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.WRITING_RESPONSES_SAVED,
      data: result,
    });
  },

  async saveSpeakingResponses(req: Request, res: Response) {
    const result = await attemptService.saveSpeakingResponses(
      String(req.user!.sub),
      String(req.params.id),
      req.body.responses,
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.SPEAKING_RESPONSES_SAVED,
      data: result,
    });
  },

  async patchSpeakingResponse(req: Request, res: Response) {
    const result = await attemptService.patchSpeakingResponse(
      String(req.user!.sub),
      String(req.params.id),
      String(req.params.speakingPart) as never,
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.SPEAKING_RESPONSE_UPDATED,
      data: result,
    });
  },

  async submitAttempt(req: Request, res: Response) {
    const result = await attemptService.submitAttempt(
      String(req.user!.sub),
      String(req.params.id),
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.SUBMIT_SUCCESS,
      data: result,
    });
  },

  async getAttemptResult(req: Request, res: Response) {
    const result = await attemptService.getAttemptResult(
      String(req.user!.sub),
      String(req.params.id),
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.RESULT_SUCCESS,
      data: result,
    });
  },

  async getAttemptReview(req: Request, res: Response) {
    const result = await attemptService.getAttemptReview(
      String(req.user!.sub),
      String(req.params.id),
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.REVIEW_SUCCESS,
      data: result,
    });
  },

  async expireAttempt(req: Request, res: Response) {
    const result = await attemptService.expireAttempt(String(req.params.id));

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.EXPIRE_SUCCESS,
      data: result,
    });
  },
  async getAttemptGradingStatus(req: Request, res: Response) {
    const result = await attemptService.getAttemptGradingStatus(
      String(req.user!.sub),
      String(req.user!.role),
      String(req.params.id),
    );

    return sendSuccess(res, {
      message: MESSAGE.ATTEMPT.GRADING_STATUS_SUCCESS,
      data: result,
    });
  },
};
