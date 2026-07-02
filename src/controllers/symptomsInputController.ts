// src/controllers/triage.controller.js

'use strict';
import type { Request, Response } from "express";

const triageService = require('../services/triage.service');
const sessionService = require('../services/session.service');
const asyncHandler = require('../utils/asyncHandler');

const startTriage = asyncHandler(async (req :Request, res:Response) => {
  const { symptoms, age, gender, metadata } = req.validated.body;

  const result = await triageService.startTriage({
    symptoms,
    age,
    gender,
    metadata,
  });

  return res.status(201).json({ success: true, data: result });
});

const getSession = asyncHandler(async (req:Request, res:Response) => {
  const { sessionId } = req.validated.params;

  const status = await sessionService.getSessionStatus(sessionId);

  // If follow-up questions are ready, include them
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
});

const submitFollowup = asyncHandler(async (req:Request, res:Response) => {
  const { sessionId } = req.validated.params;
  const { answers } = req.validated.body;

  const result = await triageService.submitFollowupAnswers(sessionId, answers);
  return res.json({ success: true, data: result });
});

const getResult = asyncHandler(async (req:Request, res:Response) => {
  const { sessionId } = req.validated.params;
  const result = await triageService.getAssessmentResult(sessionId);
  return res.json({ success: true, data: result });
});

module.exports = {
  startTriage,
  getSession,
  submitFollowup,
  getResult,
};
