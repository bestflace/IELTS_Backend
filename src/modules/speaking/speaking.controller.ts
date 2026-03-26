import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { speakingService } from "./speaking.service";

export const speakingController = {
  async getPublicSpeakingSets(req: Request, res: Response) {
    const result = await speakingService.getPublicSpeakingSets(
      req.query as never,
    );

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getPublicSpeakingSetDetail(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await speakingService.getPublicSpeakingSetDetail(id);

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.DETAIL_SUCCESS,
      data: result,
    });
  },

  async getAdminSpeakingSets(req: Request, res: Response) {
    const result = await speakingService.getAdminSpeakingSets(
      req.query as never,
    );

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.ADMIN_LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getAdminSpeakingSetDetail(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await speakingService.getAdminSpeakingSetDetail(id);

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.ADMIN_DETAIL_SUCCESS,
      data: result,
    });
  },

  async createSpeakingSet(req: Request, res: Response) {
    const result = await speakingService.createSpeakingSet(
      req.user!.sub,
      req.body,
    );

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.SPEAKING.CREATE_SUCCESS,
      data: result,
    });
  },

  async updateSpeakingSet(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await speakingService.updateSpeakingSet(id, req.body);

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteSpeakingSet(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await speakingService.deleteSpeakingSet(id);

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.DELETE_SUCCESS,
      data: result,
    });
  },

  async publishSpeakingSet(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await speakingService.publishSpeakingSet(id);

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.PUBLISH_SUCCESS,
      data: result,
    });
  },

  async unpublishSpeakingSet(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await speakingService.unpublishSpeakingSet(id);

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.UNPUBLISH_SUCCESS,
      data: result,
    });
  },

  async createSpeakingPart(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await speakingService.createSpeakingPart(id, req.body);

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.SPEAKING.PART_CREATE_SUCCESS,
      data: result,
    });
  },

  async updateSpeakingPart(req: Request, res: Response) {
    const partId = Array.isArray(req.params.partId)
      ? req.params.partId[0]
      : req.params.partId;
    const result = await speakingService.updateSpeakingPart(partId, req.body);

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.PART_UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteSpeakingPart(req: Request, res: Response) {
    const partId = Array.isArray(req.params.partId)
      ? req.params.partId[0]
      : req.params.partId;
    const result = await speakingService.deleteSpeakingPart(partId);

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.PART_DELETE_SUCCESS,
      data: result,
    });
  },

  async createSpeakingPrompt(req: Request, res: Response) {
    const partId = Array.isArray(req.params.partId)
      ? req.params.partId[0]
      : req.params.partId;
    const result = await speakingService.createSpeakingPrompt(partId, req.body);

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.SPEAKING.PROMPT_CREATE_SUCCESS,
      data: result,
    });
  },

  async updateSpeakingPrompt(req: Request, res: Response) {
    const promptId = Array.isArray(req.params.promptId)
      ? req.params.promptId[0]
      : req.params.promptId;
    const result = await speakingService.updateSpeakingPrompt(
      promptId,
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.PROMPT_UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteSpeakingPrompt(req: Request, res: Response) {
    const promptId = Array.isArray(req.params.promptId)
      ? req.params.promptId[0]
      : req.params.promptId;
    const result = await speakingService.deleteSpeakingPrompt(promptId);

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.PROMPT_DELETE_SUCCESS,
      data: result,
    });
  },

  async createSpeakingPromptItem(req: Request, res: Response) {
    const promptId = Array.isArray(req.params.promptId)
      ? req.params.promptId[0]
      : req.params.promptId;
    const result = await speakingService.createSpeakingPromptItem(
      promptId,
      req.body,
    );

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.SPEAKING.ITEM_CREATE_SUCCESS,
      data: result,
    });
  },

  async updateSpeakingPromptItem(req: Request, res: Response) {
    const itemId = Array.isArray(req.params.itemId)
      ? req.params.itemId[0]
      : req.params.itemId;
    const result = await speakingService.updateSpeakingPromptItem(
      itemId,
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.ITEM_UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteSpeakingPromptItem(req: Request, res: Response) {
    const itemId = Array.isArray(req.params.itemId)
      ? req.params.itemId[0]
      : req.params.itemId;
    const result = await speakingService.deleteSpeakingPromptItem(itemId);

    return sendSuccess(res, {
      message: MESSAGE.SPEAKING.ITEM_DELETE_SUCCESS,
      data: result,
    });
  },
};
