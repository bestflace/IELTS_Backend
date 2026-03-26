import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { writingService } from "./writing.service";

export const writingController = {
  async getPublicWritingTasks(req: Request, res: Response) {
    const result = await writingService.getPublicWritingTasks(
      req.query as never,
    );

    return sendSuccess(res, {
      message: MESSAGE.WRITING.LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getPublicWritingTaskDetail(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await writingService.getPublicWritingTaskDetail(id);

    return sendSuccess(res, {
      message: MESSAGE.WRITING.DETAIL_SUCCESS,
      data: result,
    });
  },

  async getAdminWritingTasks(req: Request, res: Response) {
    const result = await writingService.getAdminWritingTasks(
      req.query as never,
    );

    return sendSuccess(res, {
      message: MESSAGE.WRITING.ADMIN_LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getAdminWritingTaskDetail(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await writingService.getAdminWritingTaskDetail(id);

    return sendSuccess(res, {
      message: MESSAGE.WRITING.ADMIN_DETAIL_SUCCESS,
      data: result,
    });
  },

  async createWritingTask(req: Request, res: Response) {
    const result = await writingService.createWritingTask(
      String(req.user!.sub),
      req.body,
    );

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.WRITING.CREATE_SUCCESS,
      data: result,
    });
  },

  async updateWritingTask(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await writingService.updateWritingTask(id, req.body);

    return sendSuccess(res, {
      message: MESSAGE.WRITING.UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteWritingTask(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await writingService.deleteWritingTask(id);

    return sendSuccess(res, {
      message: MESSAGE.WRITING.DELETE_SUCCESS,
      data: result,
    });
  },

  async publishWritingTask(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await writingService.publishWritingTask(id);

    return sendSuccess(res, {
      message: MESSAGE.WRITING.PUBLISH_SUCCESS,
      data: result,
    });
  },

  async unpublishWritingTask(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await writingService.unpublishWritingTask(id);

    return sendSuccess(res, {
      message: MESSAGE.WRITING.UNPUBLISH_SUCCESS,
      data: result,
    });
  },
};
