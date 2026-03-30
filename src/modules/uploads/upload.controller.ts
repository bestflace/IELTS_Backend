import { Request, Response } from "express";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { uploadService } from "./upload.service";

export const uploadController = {
  async createPresignedUpload(req: Request, res: Response) {
    const result = await uploadService.createPresignedUpload(
      String(req.user!.sub),
      String(req.user!.role),
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.UPLOAD.PRESIGN_SUCCESS,
      data: result,
    });
  },

  async completeUpload(req: Request, res: Response) {
    const result = await uploadService.completeUpload(
      String(req.user!.sub),
      String(req.user!.role),
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.UPLOAD.COMPLETE_SUCCESS,
      data: result,
    });
  },

  async deleteUpload(req: Request, res: Response) {
    const result = await uploadService.deleteUpload(
      String(req.user!.sub),
      String(req.user!.role),
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.UPLOAD.DELETE_SUCCESS,
      data: result,
    });
  },
};
