import { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../errors/not-found.error";

export function notFoundMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(new NotFoundError("Route not found"));
}
