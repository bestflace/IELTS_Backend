import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/unauthorized.error";
import { verifyAccessToken } from "../utils/jwt";
import { MESSAGE } from "../constants/message.constant";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError(MESSAGE.COMMON.UNAUTHORIZED));
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new UnauthorizedError(MESSAGE.COMMON.UNAUTHORIZED));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError(MESSAGE.COMMON.UNAUTHORIZED));
  }
}
