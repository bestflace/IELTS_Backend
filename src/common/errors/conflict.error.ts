import { StatusCodes } from "http-status-codes";
import { AppError } from "./app-error";

export class ConflictError extends AppError {
  constructor(message = "Conflict", code?: string, details?: unknown) {
    super(StatusCodes.CONFLICT, message, code, details);
  }
}
