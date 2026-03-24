import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env, isProduction } from "../../config/env";
import { MESSAGE } from "../../common/constants/message.constant";
import { sendSuccess } from "../../common/utils/response";
import { authService } from "./auth.service";

const REFRESH_COOKIE_NAME = "refreshToken";

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.cookieSecure || isProduction,
    sameSite: "lax",
    domain: env.cookieDomain,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.cookieSecure || isProduction,
    sameSite: "lax",
    domain: env.cookieDomain,
    path: "/",
  });
}

export const authController = {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body);

    return sendSuccess(res, {
      statusCode: StatusCodes.CREATED,
      message: MESSAGE.AUTH.REGISTER_SUCCESS,
      data: user,
    });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);

    setRefreshTokenCookie(res, result.refreshToken);

    return sendSuccess(res, {
      message: MESSAGE.AUTH.LOGIN_SUCCESS,
      data: result,
    });
  },

  async refresh(req: Request, res: Response) {
    const result = await authService.refresh(
      req.body,
      req.cookies?.[REFRESH_COOKIE_NAME],
    );

    setRefreshTokenCookie(res, result.refreshToken);

    return sendSuccess(res, {
      message: MESSAGE.AUTH.REFRESH_SUCCESS,
      data: result,
    });
  },

  async logout(req: Request, res: Response) {
    const refreshToken =
      req.body?.refreshToken || req.cookies?.[REFRESH_COOKIE_NAME];

    await authService.logout(refreshToken);
    clearRefreshTokenCookie(res);

    return sendSuccess(res, {
      message: MESSAGE.AUTH.LOGOUT_SUCCESS,
      data: null,
    });
  },

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body);

    return sendSuccess(res, {
      message: MESSAGE.AUTH.PASSWORD_RESET_CODE_SENT,
      data: result,
    });
  },

  async verifyResetPasswordCode(req: Request, res: Response) {
    const result = await authService.verifyResetPasswordCode(req.body);

    return sendSuccess(res, {
      message: MESSAGE.AUTH.PASSWORD_RESET_CODE_VERIFIED,
      data: result,
    });
  },

  async resetPassword(req: Request, res: Response) {
    const result = await authService.resetPassword(req.body);

    return sendSuccess(res, {
      message: MESSAGE.AUTH.PASSWORD_RESET_SUCCESS,
      data: result,
    });
  },

  async me(req: Request, res: Response) {
    const user = await authService.getMe(req.user!.sub);

    return sendSuccess(res, {
      message: MESSAGE.AUTH.ME_SUCCESS,
      data: user,
    });
  },
};
