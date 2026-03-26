import { Request, Response } from "express";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { systemConfigService } from "./system-config.service";

export const systemConfigController = {
  async getPublicConfig(_req: Request, res: Response) {
    const config = await systemConfigService.getPublicConfig();

    return sendSuccess(res, {
      message: MESSAGE.SYSTEM_CONFIG.PUBLIC_SUCCESS,
      data: config,
    });
  },

  async getAdminConfig(_req: Request, res: Response) {
    const config = await systemConfigService.getAdminConfig();

    return sendSuccess(res, {
      message: MESSAGE.SYSTEM_CONFIG.ADMIN_SUCCESS,
      data: config,
    });
  },

  async updateConfig(req: Request, res: Response) {
    const config = await systemConfigService.updateConfig(
      req.user!.sub,
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.SYSTEM_CONFIG.UPDATE_SUCCESS,
      data: config,
    });
  },
};
