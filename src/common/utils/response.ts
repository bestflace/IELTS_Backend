import { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  options: {
    statusCode?: number;
    message: string;
    data: T;
    meta?: Record<string, unknown>;
  },
) {
  return res.status(options.statusCode ?? 200).json({
    success: true,
    message: options.message,
    data: options.data,
    ...(options.meta ? { meta: options.meta } : {}),
  });
}
