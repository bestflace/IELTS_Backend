import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { testService } from "./test.service";

export const testController = {
  async getPublicTests(req: Request, res: Response) {
    const result = await testService.getPublicTests(req.query as never);

    return sendSuccess(res, {
      message: MESSAGE.TEST.LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getPublicTestDetail(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await testService.getPublicTestDetail(id);

    return sendSuccess(res, {
      message: MESSAGE.TEST.DETAIL_SUCCESS,
      data: result,
    });
  },

  async getAdminTests(req: Request, res: Response) {
    const result = await testService.getAdminTests(req.query as never);

    return sendSuccess(res, {
      message: MESSAGE.TEST.ADMIN_LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getAdminTestDetail(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await testService.getAdminTestDetail(id);

    return sendSuccess(res, {
      message: MESSAGE.TEST.ADMIN_DETAIL_SUCCESS,
      data: result,
    });
  },

  async createTest(req: Request, res: Response) {
    const result = await testService.createTest(
      String(req.user!.sub),
      req.body,
    );

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.TEST.CREATE_SUCCESS,
      data: result,
    });
  },

  async updateTest(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await testService.updateTest(id, req.body);

    return sendSuccess(res, {
      message: MESSAGE.TEST.UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteTest(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await testService.deleteTest(id);

    return sendSuccess(res, {
      message: MESSAGE.TEST.DELETE_SUCCESS,
      data: result,
    });
  },

  async replaceSections(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await testService.replaceSections(id, req.body);

    return sendSuccess(res, {
      message: MESSAGE.TEST.SECTIONS_REPLACED,
      data: result,
    });
  },

  async addSection(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await testService.addSection(id, req.body);

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.TEST.SECTION_CREATE_SUCCESS,
      data: result,
    });
  },

  async updateSection(req: Request, res: Response) {
    const sectionId = String(req.params.sectionId);
    const result = await testService.updateSection(sectionId, req.body);

    return sendSuccess(res, {
      message: MESSAGE.TEST.SECTION_UPDATE_SUCCESS,
      data: result,
    });
  },

  async deleteSection(req: Request, res: Response) {
    const sectionId = String(req.params.sectionId);
    const result = await testService.deleteSection(sectionId);

    return sendSuccess(res, {
      message: MESSAGE.TEST.SECTION_DELETE_SUCCESS,
      data: result,
    });
  },

  async publishTest(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await testService.publishTest(id, String(req.user!.sub));

    return sendSuccess(res, {
      message: MESSAGE.TEST.PUBLISH_SUCCESS,
      data: result,
    });
  },

  async unpublishTest(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await testService.unpublishTest(id);

    return sendSuccess(res, {
      message: MESSAGE.TEST.UNPUBLISH_SUCCESS,
      data: result,
    });
  },

  async previewBuild(req: Request, res: Response) {
    const result = await testService.previewBuild(req.body);

    return sendSuccess(res, {
      message: MESSAGE.TEST.PREVIEW_BUILD_SUCCESS,
      data: result,
    });
  },

  async randomBuild(req: Request, res: Response) {
    const result = await testService.randomBuild(
      String(req.user!.sub),
      req.body,
    );

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.TEST.RANDOM_BUILD_SUCCESS,
      data: result,
    });
  },

  async rerollSection(req: Request, res: Response) {
    const sectionId = String(req.params.sectionId);
    const result = await testService.rerollSection(sectionId);

    return sendSuccess(res, {
      message: MESSAGE.TEST.REROLL_SUCCESS,
      data: result,
    });
  },
};
