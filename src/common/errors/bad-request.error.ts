import { StatusCodes } from "http-status-codes";
import { AppError } from "./app-error";

export class BadRequestError extends AppError {
  constructor(message = "Bad request", code?: string, details?: unknown) {
    super(StatusCodes.BAD_REQUEST, message, code, details);
  }
}
