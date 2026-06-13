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

  async uploadCloudinary(req: Request, res: Response) {
    const result = await uploadService.uploadToCloudinary(
      String(req.user!.sub),
      String(req.user!.role),
      req.body,
      req.file,
    );

    return sendSuccess(res, {
      message: "Upload file to Cloudinary successfully",
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

  async getUploads(req: Request, res: Response) {
    const result = await uploadService.getUploads(req.query as never);

    return sendSuccess(res, {
      message: "Lấy danh sách file upload thành công.",
      data: result.items,
      meta: result.meta,
    });
  },

  async getUploadById(req: Request, res: Response) {
    const result = await uploadService.getUploadById(
      String(req.params.id),
      String(req.user!.sub),
      String(req.user!.role),
    );

    return sendSuccess(res, {
      message: "Lấy chi tiết file upload thành công.",
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
