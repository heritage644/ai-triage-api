// src/controllers/triage.controller.ts

import type { Request, Response } from "express";

import * as triageService from "../services/triage.service";
import * as sessionService from "../services/session.services";
import asyncHandler from "../utils/asynchandler";

interface ValidatedRequest extends Request {
  validated: {
    body: any;
    params: any;
  };
}

export const startTriage = asyncHandler(
  async (req: ValidatedRequest, res: Response) => {
    const { symptoms, age, gender, metadata } = req.validated.body;

    const result = await triageService.startTriage({
      symptoms,
      age,
      gender,
      metadata,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  }
);

export const getSession = asyncHandler(
  async (req: ValidatedRequest, res: Response) => {
    const { sessionId } = req.validated.params;

    const status = await sessionService.getSessionStatus(sessionId);

    let followUp = null;

    const session = await sessionService.findSessionById(sessionId);

    if (session.followUp) {
      followUp = session.followUp.questions;
    }

    return res.json({
      success: true,
      data: {
        ...status,
        followUp,
      },
    });
  }
);

export const submitFollowup = asyncHandler(
  async (req: ValidatedRequest, res: Response) => {
    const { sessionId } = req.validated.params;
    const { answers } = req.validated.body;

    const result = await triageService.submitFollowupAnswers(
      sessionId,
      answers
    );

    return res.json({
      success: true,
      data: result,
    });
  }
);

export const getResult = asyncHandler(
  async (req: ValidatedRequest, res: Response) => {
    const { sessionId } = req.validated.params;

    const result = await triageService.getAssessmentResult(sessionId);

    return res.json({
      success: true,
      data: result,
    });
  }
);