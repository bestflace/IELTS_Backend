import { Request, Response } from "express";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { userService } from "./user.service";

export const userController = {
  async getMyProfile(req: Request, res: Response) {
    const profile = await userService.getMyProfile(req.user!.sub);

    return sendSuccess(res, {
      message: MESSAGE.USER.PROFILE_SUCCESS,
      data: profile,
    });
  },

  async updateMyProfile(req: Request, res: Response) {
    const profile = await userService.updateMyProfile(req.user!.sub, req.body);

    return sendSuccess(res, {
      message: MESSAGE.USER.PROFILE_UPDATED,
      data: profile,
    });
  },

  async changeMyPassword(req: Request, res: Response) {
    const result = await userService.changeMyPassword(req.user!.sub, req.body);

    return sendSuccess(res, {
      message: MESSAGE.USER.PASSWORD_CHANGED,
      data: result,
    });
  },
};
