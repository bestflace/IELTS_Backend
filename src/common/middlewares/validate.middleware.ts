import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { BadRequestError } from "../errors/bad-request.error";
import { MESSAGE } from "../constants/message.constant";

type ValidateSchemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);
        Object.assign(req.query, parsedQuery);
      }

      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params);
        Object.assign(req.params, parsedParams);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new BadRequestError(
            MESSAGE.COMMON.VALIDATION_ERROR,
            "VALIDATION_ERROR",
            error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          ),
        );
      }

      next(error);
    }
  };
}
