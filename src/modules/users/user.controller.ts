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

  async adminListUsers(req: Request, res: Response) {
    const result = await userService.adminListUsers(req.query as never);

    return sendSuccess(res, {
      message: MESSAGE.ADMIN_USER.LIST_SUCCESS,
      data: result.items,
      meta: result.meta,
    });
  },

  async adminGetUserById(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await userService.adminGetUserById(id);

    return sendSuccess(res, {
      message: MESSAGE.ADMIN_USER.DETAIL_SUCCESS,
      data: user,
    });
  },

  async adminUpdateUser(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await userService.adminUpdateUser(req.user!.sub, id, req.body);

    return sendSuccess(res, {
      message: MESSAGE.ADMIN_USER.UPDATE_SUCCESS,
      data: user,
    });
  },

  async adminUpdateUserRole(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await userService.adminUpdateUserRole(
      req.user!.sub,
      id,
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.ADMIN_USER.ROLE_UPDATED,
      data: user,
    });
  },

  async adminUpdateUserStatus(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await userService.adminUpdateUserStatus(
      req.user!.sub,
      id,
      req.body,
    );

    return sendSuccess(res, {
      message: MESSAGE.ADMIN_USER.STATUS_UPDATED,
      data: user,
    });
  },
};
