import { StatusCodes } from "http-status-codes";
import { AppError } from "./app-error";

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code?: string, details?: unknown) {
    super(StatusCodes.FORBIDDEN, message, code, details);
  }
}
