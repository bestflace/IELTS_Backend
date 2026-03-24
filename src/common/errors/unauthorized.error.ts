import { StatusCodes } from "http-status-codes";
import { AppError } from "./app-error";

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code?: string, details?: unknown) {
    super(StatusCodes.UNAUTHORIZED, message, code, details);
  }
}
