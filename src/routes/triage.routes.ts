// src/routes/triage.routes.ts

import { Router, Request, Response, NextFunction } from "express";

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

// Middleware to disable HTTP caching for polling endpoints
const noCache = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
};

// POST /api/triage/start
router.post(
  "/start",
  validate(startTriageSchema),
  startTriage
);

// GET /api/triage/:sessionId
router.get(
  "/:sessionId",
  noCache,
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
  noCache,
  validate(sessionIdParamSchema),
  getResult
);

export default router;