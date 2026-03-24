import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { MESSAGE } from "../constants/message.constant";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      errors: error.details ?? null,
    });
  }

  if (error instanceof Error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || MESSAGE.COMMON.INTERNAL_SERVER_ERROR,
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: MESSAGE.COMMON.INTERNAL_SERVER_ERROR,
  });
}
