import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { listeningService } from "./listening.service";

export const listeningController = {
  async getPublicListeningSets(req: Request, res: Response) {
    const result = await listeningService.getPublicListeningSets(
      req.query as never,
    );

    return sendSuccess(res, {
      message: MESSAGE.LISTENING.LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getPublicListeningSetDetail(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await listeningService.getPublicListeningSetDetail(id);

    return sendSuccess(res, {
      message: MESSAGE.LISTENING.DETAIL_SUCCESS,
      data: result,
    });
  },

  async getAdminListeningSets(req: Request, res: Response) {
    const result = await listeningService.getAdminListeningSets(
      req.query as never,
    );

    return sendSuccess(res, {
      message: MESSAGE.LISTENING.ADMIN_LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getAdminListeningSetDetail(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await listeningService.getAdminListeningSetDetail(id);

    return sendSuccess(res, {
      message: MESSAGE.LISTENING.ADMIN_DETAIL_SUCCESS,
      data: result,
    });
  },

  async createListeningSet(req: Request, res: Response) {
    const result = await listeningService.createListeningSet(
      String(req.user!.sub),
      req.body,
    );

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.LISTENING.CREATE_SUCCESS,
      data: result,
    });
  },

  async updateListeningSet(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await listeningService.updateListeningSet(id, req.body);

    return sendSuccess(res, {
      message: MESSAGE.LISTENING.UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteListeningSet(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await listeningService.deleteListeningSet(id);

    return sendSuccess(res, {
      message: MESSAGE.LISTENING.DELETE_SUCCESS,
      data: result,
    });
  },

  async publishListeningSet(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await listeningService.publishListeningSet(id);

    return sendSuccess(res, {
      message: MESSAGE.LISTENING.PUBLISH_SUCCESS,
      data: result,
    });
  },

  async unpublishListeningSet(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await listeningService.unpublishListeningSet(id);

    return sendSuccess(res, {
      message: MESSAGE.LISTENING.UNPUBLISH_SUCCESS,
      data: result,
    });
  },

  async createListeningQuestion(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await listeningService.createListeningQuestion(id, req.body);

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.LISTENING.QUESTION_CREATE_SUCCESS,
      data: result,
    });
  },

  async updateListeningQuestion(req: Request, res: Response) {
    const questionId = String(req.params.questionId);
    const result = await listeningService.updateListeningQuestion(
      questionId,
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.LISTENING.QUESTION_UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteListeningQuestion(req: Request, res: Response) {
    const questionId = String(req.params.questionId);
    const result = await listeningService.deleteListeningQuestion(questionId);

    return sendSuccess(res, {
      message: MESSAGE.LISTENING.QUESTION_DELETE_SUCCESS,
      data: result,
    });
  },
};
