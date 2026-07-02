// src/routes/triage.routes.ts

import { Router } from "express";

import {
  startTriage,
  getSession,
  submitFollowup,
  getResult,
} from "../controllers/symptomsInputController";

import {
  validate,
  startTriageSchema,
  sessionIdParamSchema,
  submitFollowupSchema,
} from "../validators/triage.validatios";

const router = Router();

// POST /api/triage/start
router.post(
  "/start",
  validate(startTriageSchema),
  startTriage
);

// GET /api/triage/:sessionId
router.get(
  "/:sessionId",
  validate(sessionIdParamSchema),
  getSession
);

// POST /api/triage/:sessionId/followup
router.post(
  "/:sessionId/followup",
  validate(submitFollowupSchema),
  submitFollowup
);

// GET /api/triage/:sessionId/result
router.get(
  "/:sessionId/result",
  validate(sessionIdParamSchema),
  getResult
);

export default router;