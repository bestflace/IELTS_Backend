import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { readingService } from "./reading.service";

export const readingController = {
  async getPublicReadingSets(req: Request, res: Response) {
    const result = await readingService.getPublicReadingSets(
      req.query as never,
    );

    return sendSuccess(res, {
      message: MESSAGE.READING.LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getPublicReadingSetDetail(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await readingService.getPublicReadingSetDetail(id);

    return sendSuccess(res, {
      message: MESSAGE.READING.DETAIL_SUCCESS,
      data: result,
    });
  },

  async getAdminReadingSets(req: Request, res: Response) {
    const result = await readingService.getAdminReadingSets(req.query as never);

    return sendSuccess(res, {
      message: MESSAGE.READING.ADMIN_LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getAdminReadingSetDetail(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await readingService.getAdminReadingSetDetail(id);

    return sendSuccess(res, {
      message: MESSAGE.READING.ADMIN_DETAIL_SUCCESS,
      data: result,
    });
  },

  async createReadingSet(req: Request, res: Response) {
    const result = await readingService.createReadingSet(
      String(req.user!.sub),
      req.body,
    );

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.READING.CREATE_SUCCESS,
      data: result,
    });
  },

  async updateReadingSet(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await readingService.updateReadingSet(id, req.body);

    return sendSuccess(res, {
      message: MESSAGE.READING.UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteReadingSet(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await readingService.deleteReadingSet(id);

    return sendSuccess(res, {
      message: MESSAGE.READING.DELETE_SUCCESS,
      data: result,
    });
  },

  async publishReadingSet(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await readingService.publishReadingSet(id);

    return sendSuccess(res, {
      message: MESSAGE.READING.PUBLISH_SUCCESS,
      data: result,
    });
  },

  async unpublishReadingSet(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await readingService.unpublishReadingSet(id);

    return sendSuccess(res, {
      message: MESSAGE.READING.UNPUBLISH_SUCCESS,
      data: result,
    });
  },

  async createReadingQuestion(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await readingService.createReadingQuestion(id, req.body);

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.READING.QUESTION_CREATE_SUCCESS,
      data: result,
    });
  },

  async updateReadingQuestion(req: Request, res: Response) {
    const questionId = String(req.params.questionId);
    const result = await readingService.updateReadingQuestion(
      questionId,
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.READING.QUESTION_UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteReadingQuestion(req: Request, res: Response) {
    const questionId = String(req.params.questionId);
    const result = await readingService.deleteReadingQuestion(questionId);

    return sendSuccess(res, {
      message: MESSAGE.READING.QUESTION_DELETE_SUCCESS,
      data: result,
    });
  },
};
