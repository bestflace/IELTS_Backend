import { Response } from "express";

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message = "Error",
  statusCode = 500,
  error?: unknown,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};
