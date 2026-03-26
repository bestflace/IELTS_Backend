import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { tagService } from "./tag.service";

export const tagController = {
  async getTags(req: Request, res: Response) {
    const tags = await tagService.getTags(req.query as { search?: string });

    return sendSuccess(res, {
      message: MESSAGE.TAG.LIST_SUCCESS,
      data: tags,
    });
  },

  async createTag(req: Request, res: Response) {
    const tag = await tagService.createTag(req.body);

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.TAG.CREATE_SUCCESS,
      data: tag,
    });
  },

  async updateTag(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const tag = await tagService.updateTag(id, req.body);

    return sendSuccess(res, {
      message: MESSAGE.TAG.UPDATE_SUCCESS,
      data: tag,
    });
  },

  async deleteTag(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await tagService.deleteTag(id);

    return sendSuccess(res, {
      message: MESSAGE.TAG.DELETE_SUCCESS,
      data: result,
    });
  },
};
