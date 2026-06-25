// src/services/triage.service.js
'use strict';

const prisma = require('../database/prisma');
const ApiError = require('../utils/apiError');
const sessionService = require('./session.service');
const { addFollowupJob } = require('../queues/followup.queue');
const { addAssessmentJob } = require('../queues/assessment.queue');

/**
 * Create a new triage session, persist the initial symptoms, and enqueue
 * the followup-generation job.
 */
const startTriage = async ({ symptoms, age, gender, metadata }) => {
  const session = await sessionService.createSession();

  await prisma.symptomSubmission.create({
    data: {
      sessionId: session.id,
      symptoms,
      age: age ?? null,
      gender: gender ?? null,
      metadata: metadata ?? undefined,
    },
  });

  await sessionService.updateSessionStatus(session.id, 'AWAITING_FOLLOWUP');

  await addFollowupJob(session.id);

  return {
    sessionId: session.id,
    status: 'AWAITING_FOLLOWUP',
    message: 'Triage session created. Follow-up questions will be generated shortly.',
  };
};

/**
 * Store the patient's answers to the follow-up questions and enqueue the
 * risk-assessment job.
 */
const submitFollowupAnswers = async (sessionId, answers) => {
  const session = await sessionService.findSessionById(sessionId);

  if (session.status !== 'AWAITING_ANSWERS' && session.status !== 'AWAITING_FOLLOWUP') {
    throw new ApiError(
      409,
      `Session is not accepting answers (current status: ${session.status})`
    );
  }

  if (!session.followUp) {
    throw new ApiError(409, 'Follow-up questions have not been generated yet');
  }

  await prisma.followUpResponse.update({
    where: { sessionId },
    data: { answers },
  });

  await sessionService.updateSessionStatus(sessionId, 'AWAITING_ASSESSMENT');
  await addAssessmentJob(sessionId);

  return {
    sessionId,
    status: 'AWAITING_ASSESSMENT',
    message: 'Answers received. Risk assessment is being generated.',
  };
};

const getAssessmentResult = async (sessionId) => {
  const session = await sessionService.findSessionById(sessionId);

  if (session.status !== 'COMPLETED' || !session.assessment) {
    return {
      sessionId,
      status: session.status,
      ready: false,
      assessment: null,
    };
  }

  return {
    sessionId,
    status: session.status,
    ready: true,
    assessment: {
      riskLevel: session.assessment.riskLevel,
      possibleConditions: session.assessment.possibleConditions,
      recommendations: session.assessment.recommendations,
      explanation: session.assessment.explanation,
      createdAt: session.assessment.createdAt,
    },
  };
};

module.exports = {
  startTriage,
  submitFollowupAnswers,
  getAssessmentResult,
};
