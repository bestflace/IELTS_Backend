import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { importService } from "./import.service";

export const importController = {
  async createImportJob(req: Request, res: Response) {
    const result = await importService.createImportJob(
      String(req.user!.sub),
      req.body,
    );

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.IMPORT.CREATE_SUCCESS,
      data: result,
    });
  },

  async getImportJobs(req: Request, res: Response) {
    const result = await importService.getImportJobs(req.query as never);

    return sendSuccess(res, {
      message: MESSAGE.IMPORT.LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async getImportJobById(req: Request, res: Response) {
    const result = await importService.getImportJobById(String(req.params.id));

    return sendSuccess(res, {
      message: MESSAGE.IMPORT.DETAIL_SUCCESS,
      data: result,
    });
  },

  async getImportErrors(req: Request, res: Response) {
    const result = await importService.getImportErrors(String(req.params.id));

    return sendSuccess(res, {
      message: MESSAGE.IMPORT.ERRORS_SUCCESS,
      data: result,
    });
  },

  async retryImportJob(req: Request, res: Response) {
    const result = await importService.retryImportJob(String(req.params.id));

    return sendSuccess(res, {
      message: MESSAGE.IMPORT.RETRY_SUCCESS,
      data: result,
    });
  },
  async deleteImportJob(req: Request, res: Response) {
    const result = await importService.deleteImportJob(String(req.params.id));

    return sendSuccess(res, {
      message: "Xoá import job thành công.",
      data: result,
    });
  },
};
