import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type RequestTarget = "body" | "params" | "query";

export function validate(schema: ZodSchema, target: RequestTarget = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      res.status(400).json({
        error: "Validation error",
        details: result.error.issues,
      });
      return;
    }

    req[target] = result.data;
    next();
  };
}
