import { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../errors/forbidden.error";
import { UnauthorizedError } from "../errors/unauthorized.error";
import { MESSAGE } from "../constants/message.constant";

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError(MESSAGE.COMMON.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(MESSAGE.COMMON.FORBIDDEN));
    }

    next();
  };
}
