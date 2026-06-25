// src/validators/triage.validator.js
'use strict';

const { z } = require('zod');
const ApiError = require('../utils/apiError');

// ---------- Schemas ----------

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const startTriageSchema = z.object({
  body: z.object({
    symptoms: z
      .string({ required_error: 'symptoms is required' })
      .trim()
      .min(5, 'symptoms must be at least 5 characters')
      .max(4000, 'symptoms must be at most 4000 characters'),
    age: z.number().int().min(0).max(130).optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

const sessionIdParamSchema = z.object({
  params: z.object({
    sessionId: z.string().regex(uuidRegex, 'sessionId must be a valid UUID'),
  }),
});

const answerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().trim().min(1, 'answer must not be empty').max(2000),
});

const submitFollowupSchema = z.object({
  params: z.object({
    sessionId: z.string().regex(uuidRegex, 'sessionId must be a valid UUID'),
  }),
  body: z.object({
    answers: z
      .array(answerSchema)
      .min(1, 'At least one answer is required')
      .max(20, 'Too many answers submitted'),
  }),
});

// ---------- Validate middleware factory ----------

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    const firstField = Object.keys(details)[0];
    const firstMsg = details[firstField]?.[0] || 'Validation failed';
    return next(new ApiError(400, firstMsg, details));
  }

  // Attach parsed & sanitized data
  req.validated = result.data;
  next();
};

module.exports = {
  startTriageSchema,
  sessionIdParamSchema,
  submitFollowupSchema,
  validate,
};
