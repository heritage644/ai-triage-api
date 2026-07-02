// src/validators/triage.validator.ts

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import ApiError from "../utils/apierror";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const startTriageSchema = z.object({
  body: z.object({
    symptoms: z
      .string({ required_error: "symptoms is required" })
      .trim()
      .min(5)
      .max(4000),

    age: z.number().int().min(0).max(130).optional(),

    gender: z
      .enum(["male", "female", "other", "prefer_not_to_say"])
      .optional(),

    metadata: z.record(z.unknown()).optional(),
  }),
});

export const sessionIdParamSchema = z.object({
  params: z.object({
    sessionId: z.string().regex(uuidRegex),
  }),
});

const answerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().trim().min(1).max(2000),
});

export const submitFollowupSchema = z.object({
  params: z.object({
    sessionId: z.string().regex(uuidRegex),
  }),

  body: z.object({
    answers: z.array(answerSchema).min(1).max(20),
  }),
});

export function validate(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const details = result.error.flatten().fieldErrors;

      const firstKey = Object.keys(details)[0] as keyof typeof details;

      const firstMsg =
        details[firstKey]?.[0] ?? "Validation failed";

      return next(new ApiError(400, firstMsg, details));
    }

    (req as any).validated = result.data;

    next();
  };
}